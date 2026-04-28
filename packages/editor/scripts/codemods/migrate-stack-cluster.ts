import { Project, SyntaxKind, Node, ObjectLiteralExpression } from "ts-morph";

const STACK_TOKEN: Record<number, string> = { 4: "xs", 8: "sm", 12: "md", 16: "lg", 24: "xl" };
const DEFAULT_GAP = 12;
const ALLOWED_PROPS = new Set(["display", "flexDirection", "flexWrap", "gap", "alignItems"]);

interface StyleAnalysis {
  isStack: boolean;
  isCluster: boolean;
  gap: number | null;
  extraProps: boolean;
  computed: boolean;
}

function analyzeStyleObject(obj: ObjectLiteralExpression): StyleAnalysis {
  const result: StyleAnalysis = { isStack: false, isCluster: false, gap: null, extraProps: false, computed: false };
  let isFlex = false;
  let isColumn = false;
  let isWrap = false;

  for (const p of obj.getProperties()) {
    if (!Node.isPropertyAssignment(p)) {
      result.extraProps = true;
      continue;
    }
    const name = p.getName();
    const init = p.getInitializer();
    if (!init) continue;

    if (!ALLOWED_PROPS.has(name)) {
      result.extraProps = true;
      continue;
    }

    if (init.getKind() === SyntaxKind.StringLiteral) {
      const v = init.getText().slice(1, -1);
      if (name === "display" && v === "flex") isFlex = true;
      if (name === "flexDirection" && v === "column") isColumn = true;
      if (name === "flexWrap" && v === "wrap") isWrap = true;
    } else if (init.getKind() === SyntaxKind.NumericLiteral && name === "gap") {
      result.gap = Number(init.getText());
    } else if (name === "gap") {
      result.computed = true;
    }
  }

  if (!isFlex || result.extraProps || result.computed) return result;
  if (isColumn) result.isStack = true;
  else if (isWrap) result.isCluster = true;
  return result;
}

function gapToToken(gap: number | null): string | null {
  if (gap === null) return null;
  if (gap === DEFAULT_GAP) return null;
  return STACK_TOKEN[gap] ?? "OFF_GRID";
}

export function transform(source: string): string {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile("input.tsx", source);
  let needsStack = false;
  let needsCluster = false;

  // Process bottom-up (deepest first). getDescendantsOfKind is pre-order
  // (parent before child); reversing means children process first. Required
  // for nested stack/cluster cases — modifying a parent forgets all child
  // node references and subsequent operations on those children throw.
  const jsxElements = [
    ...sf.getDescendantsOfKind(SyntaxKind.JsxElement),
    ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ].reverse();

  for (const jsx of jsxElements) {
    const opening = Node.isJsxElement(jsx) ? jsx.getOpeningElement() : jsx;
    const tagName = opening.getTagNameNode().getText();
    if (tagName !== "div") continue;

    const styleAttr = opening.getAttribute("style");
    if (!styleAttr || !Node.isJsxAttribute(styleAttr)) continue;

    const init = styleAttr.getInitializer();
    if (!init || !Node.isJsxExpression(init)) continue;
    const expr = init.getExpression();
    if (!expr || !Node.isObjectLiteralExpression(expr)) continue;

    const analysis = analyzeStyleObject(expr);
    if (!analysis.isStack && !analysis.isCluster) continue;
    const token = gapToToken(analysis.gap);
    if (token === "OFF_GRID") continue;

    const wrapper = analysis.isStack ? "Stack" : "Cluster";
    if (analysis.isStack) needsStack = true;
    if (analysis.isCluster) needsCluster = true;

    // Rename closing tag BEFORE opening tag. If the opening is renamed first,
    // ts-morph re-validates the AST mid-operation and rejects the transient
    // <Stack>...</div> mismatch with "syntax error" — most visible on nested
    // stacks (T3 sidebar batch). Renaming closing first keeps the tree valid.
    if (Node.isJsxElement(jsx)) jsx.getClosingElement().getTagNameNode().replaceWithText(wrapper);
    opening.getTagNameNode().replaceWithText(wrapper);
    styleAttr.remove();
    if (token) {
      opening.addAttribute({ name: "gap", initializer: `"${token}"` });
    }
  }

  if (needsStack || needsCluster) {
    const imports: string[] = [];
    if (needsStack) imports.push("Stack");
    if (needsCluster) imports.push("Cluster");
    sf.addImportDeclaration({ moduleSpecifier: "@/editor/shared/vibcoder", namedImports: imports });
  }

  return sf.getFullText();
}
