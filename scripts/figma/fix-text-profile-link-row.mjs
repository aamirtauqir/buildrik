/**
 * Delete the LINK row from the TEXT profile board, and park a stray button.
 *
 * `807:8342 Inspector · profile · TEXT` draws TWELVE section headers and its
 * footer now reads "2 of 11". The footer is right about the CODE — TEXT_PROFILE
 * has 13 entries, `link` is gated to link/button/cta and `all-css` to devMode,
 * leaving 11 that render for text. The board is what is wrong, and it has been
 * wrong in a NEW way since this arc corrected the footer alone: before, it was
 * 12 rows over "of 12" — wrong against the code but internally consistent. A
 * paired edit was specified and only half of it was applied.
 *
 * The same extra row is why the board overruns its own bottom by 36px.
 *
 * Deleting a row the product never renders is not deleting a design; it is
 * removing a row that documents a state the code cannot produce. The MEDIA
 * sibling already does it correctly — its LINK row exists with visible:false.
 *
 * Separately, `156:2` carries a `btn/Revoke link` 34px below an 812px board. It
 * is a spare control parked off-board, which the file does by convention — but
 * not under that name, so every geometric check reads it as a defect. Renamed to
 * the parked convention rather than moved or deleted.
 *
 * Usage: node scripts/figma/fix-text-profile-link-row.mjs [--apply]
 */
import { connect, rpc } from "../baseline/figma-mcp.mjs";
const APPLY = process.argv.includes("--apply");
await connect();
const code = `
const CONT=new Set(["FRAME","COMPONENT","COMPONENT_SET","INSTANCE","GROUP"]);
const pg=figma.root.children.find(p=>p.id==="1:3");
await figma.setCurrentPageAsync(pg);
const out=[];

/* 1 — the LINK row the code never renders for text */
{
  const b=await figma.getNodeByIdAsync("807:8342");
  if(!b) out.push("MISSING\\t807:8342");
  else {
    let link=null;
    const st=[b];
    while(st.length){ const n=st.pop();
      if(n.type==="TEXT" && String(n.characters).trim()==="LINK"){ link=n; break; }
      if(CONT.has(n.type)&&n.children) for(const c of n.children) st.push(c); }
    if(!link) out.push("REFUSED\\t807:8342\\tno LINK header found — not deleting anything on a guess");
    else {
      let row=link; while(row && row.parent && row.parent.id!==b.id) row=row.parent;
      const h=Math.round(row.height), y=Math.round(row.y);
      const below=(b.children||[]).filter(c=>c!==row && Math.round(c.y)>y && String(c.name).indexOf("hotspot/")!==0);
      out.push((${APPLY}?"DELETE\\t":"WOULD\\t")+"807:8342\\tLINK row "+row.id+" h"+h+" at y"+y+", pulling "+below.length+" rows up "+h);
      ${APPLY ? 'for(const c of below) c.y=Math.round(c.y)-h; row.remove();' : ''}
    }
  }
}

/* 2 — the stray parked button */
{
  const n=await figma.getNodeByIdAsync("1753:8437");
  if(!n) out.push("MISSING\\t1753:8437");
  else if(String(n.name).indexOf("hotspot/")===0) out.push("ALREADY\\t1753:8437");
  else {
    const want="hotspot/spare · "+String(n.name);
    out.push((${APPLY}?"RENAME\\t":"WOULD\\t")+"1753:8437\\t"+String(n.name)+" -> "+want);
    ${APPLY ? 'n.name=want;' : ''}
  }
}
return out.join(String.fromCharCode(10));
`;
const r = await rpc("tools/call", { name: "use_figma",
  arguments: { fileKey: "g4GzQFqzNYz5sosz1QtZXC", code,
    description: (APPLY ? "delete" : "dry-run deleting") + " the TEXT profile's LINK row and park a stray button", skillNames: "figma-use" } }, 1);
console.log(r?.result?.content?.[0]?.text ?? JSON.stringify(r).slice(0, 400));
