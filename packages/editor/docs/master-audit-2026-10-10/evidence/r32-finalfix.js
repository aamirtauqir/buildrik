await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));figma.skipInvisibleInstanceChildren=false;
const mutated=[];const get=id=>figma.getNodeByIdAsync(id);
async function txt(n,s){for(const f of n.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);n.characters=s;mutated.push(n.id);}
for(const[id,v]of [['8731:13444','VariableID:8731:13434'],['8738:13444','VariableID:8746:13446'],['8738:13447','VariableID:8746:13450']]){
 const n=await get(id);for(const t of n.findAllWithCriteria({types:['TEXT']})){for(const f of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);t.setBoundVariable('characters',await figma.variables.getVariableByIdAsync(v));mutated.push(t.id);}
}
for(const n of figma.currentPage.findAll(n=>n.name==='Navigate / Spacing')){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:'8748:13434',navigation:'SWAP',transition:null,resetVideoPosition:false}]}]);mutated.push(n.id);}
const h=await get('8724:13335');
await txt(await get('8724:13337'),'Compare the saved checkpoint with the current page metadata.');
await txt(await get('8724:13338'),'Checkpoint: About · /about · inherited SEO title.\nCurrent page name:');
await txt(await get('8731:13487'),'Current SEO title override (blank inherits the site title):');
await txt(await get('8724:13339'),'This preview restores the page name and saved SEO title. Full document restoration includes draft pages, document styles and saved settings; CMS, Media, published content and server settings are excluded.');
for(const id of ['8724:13336','8724:13337','8724:13338','8731:13486','8731:13487','8731:13488','8724:13339','8724:13340','8724:13343']){const n=await get(id);if(n.type==='TEXT')for(const f of n.getStyledTextSegments(['fontName']))await figma.loadFontAsync(f.fontName);h.appendChild(n);mutated.push(n.id);}
mutated.push(h.id);await h.screenshot({scale:1});
return {createdNodeIds:[],mutatedNodeIds:mutated,bindings:await Promise.all(['8731:13444','8738:13444','8738:13447'].map(async id=>{const n=await get(id);return{id,texts:n.findAllWithCriteria({types:['TEXT']}).map(t=>({id:t.id,bound:t.boundVariables.characters}))}}))};
