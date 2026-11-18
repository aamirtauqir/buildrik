// Final root-only placement correction; run on page3:7.
const p=await figma.getNodeByIdAsync('3:7');
await figma.setCurrentPageAsync(p);
for(const [id,x,y]of [
 ['277:107093',20000,24460],
 ['277:107302',21560,24460],
 ['277:107511',23120,24460],
 ['277:107722',24680,24460],
 ['277:107940',20000,25520]
]){
 const r=await figma.getNodeByIdAsync(id);r.x=x;r.y=y;
}
const board=await figma.getNodeByIdAsync('277:46436');
board.x=28000;board.y=80;
return {moved:6};
