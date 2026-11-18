// Read-only source analysis. Does not execute application modules.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../../../../..');
const manifest = JSON.parse(fs.readFileSync(path.join(out, 'repository-manifest.json'), 'utf8'));
const configs = new Map();
function optionsFor(file) {
  const scope = file.startsWith('packages/editor/') ? 'packages/editor' : file.startsWith('packages/dashboard/') ? 'packages/dashboard' : '';
  if (!configs.has(scope)) {
    const configPath = path.join(root, scope, 'tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    configs.set(scope, ts.parseJsonConfigFileContent(config.config ?? {}, ts.sys, path.dirname(configPath)).options);
  }
  return configs.get(scope);
}
const edges = [], computedImports = [];
for (const file of manifest.sourceFiles.filter(p => /\.(tsx?|m?js)$/.test(p))) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  const source = ts.createSourceFile(full, fs.readFileSync(full,'utf8'), ts.ScriptTarget.Latest, true);
  function record(node, specifier, kind) {
    const resolution = ts.resolveModuleName(specifier, full, optionsFor(file), ts.sys).resolvedModule;
    const resolved = resolution?.resolvedFileName;
    const target = resolved && !resolved.includes('/node_modules/') ? path.relative(root, resolved) : null;
    edges.push({from:file,line:source.getLineAndCharacterOfPosition(node.getStart()).line+1,kind,specifier,to:target,resolution:target?'local':resolution?'package':'unresolved'});
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node)||ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) record(node,node.moduleSpecifier.text,ts.isImportDeclaration(node)?'import':'re-export');
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg=node.arguments[0];
      if(arg && ts.isStringLiteral(arg)) record(node,arg.text,'dynamic-import');
      else computedImports.push({file,line:source.getLineAndCharacterOfPosition(node.getStart()).line+1});
    }
    ts.forEachChild(node,visit);
  }
  visit(source);
}
fs.writeFileSync(path.join(out,'import-graph.json'),JSON.stringify({method:'TypeScript AST static imports, re-exports and literal dynamic imports; no runtime/event/registry reachability inference; unresolved imports are evidence gaps, not unused code.',edges,computedImports},null,2)+'\n');
const summary={sourceFiles:manifest.sourceFiles.length,edges:edges.length,localEdges:edges.filter(e=>e.to).length,literalDynamicImports:edges.filter(e=>e.kind==='dynamic-import').length,computedImports:computedImports.length};
console.log(JSON.stringify(summary));
