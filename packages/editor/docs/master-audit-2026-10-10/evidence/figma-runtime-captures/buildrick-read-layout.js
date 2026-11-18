(() => {
  const W=innerWidth,H=innerHeight,items=[];
  const rect=r=>({x:Math.round(r.x*100)/100,y:Math.round(r.y*100)/100,w:Math.round(r.width*100)/100,h:Math.round(r.height*100)/100});
  function visible(e,r,s){return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<W&&r.top<H&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0;}
  function clipped(e,r){if(getComputedStyle(e).position==='fixed')return false;let p=e.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p);if(s.overflowX==='hidden'||s.overflowY==='hidden'||s.overflowY==='auto'||s.overflowY==='scroll'){const q=p.getBoundingClientRect();if(r.bottom<=q.top||r.top>=q.bottom||r.right<=q.left||r.left>=q.right)return true;}if(s.position==='fixed')break;p=p.parentElement;}return false;}
  function clipFor(e){let q={x:0,y:0,right:W,bottom:H};if(getComputedStyle(e).position==='fixed')return q;let p=e.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p),r=p.getBoundingClientRect();if(['hidden','auto','scroll','clip'].includes(s.overflowX)){q.x=Math.max(q.x,r.x);q.right=Math.min(q.right,r.right);}if(['hidden','auto','scroll','clip'].includes(s.overflowY)){q.y=Math.max(q.y,r.y);q.bottom=Math.min(q.bottom,r.bottom);}if(s.position==='fixed')break;p=p.parentElement;}return q;}
  function layer(e){let n=e,z=0;while(n&&n!==document.body){const s=getComputedStyle(n);if(s.position==='fixed'&&s.zIndex!=='auto')z=Math.max(z,Number(s.zIndex)||0);n=n.parentElement;}return z;}
  const walk=e=>{
    if(['SCRIPT','STYLE','NOSCRIPT','NEXTJS-PORTAL'].includes(e.tagName))return;
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0||s.clip==='rect(0px, 0px, 0px, 0px)'||s.clipPath==='inset(50%)')return;
    const ok=visible(e,r,s)&&!clipped(e,r),clip=clipFor(e),paintLayer=layer(e);
    if(ok){
      const name=e.getAttribute('aria-label')||e.getAttribute('data-testid')||e.id||e.tagName.toLowerCase();
      if(e.tagName.toLowerCase()==='svg'){
        const c=e.cloneNode(true);c.setAttribute('xmlns','http://www.w3.org/2000/svg');c.setAttribute('width',String(r.width));c.setAttribute('height',String(r.height));
        const originals=[e,...e.querySelectorAll('*')],copies=[c,...c.querySelectorAll('*')];
        originals.forEach((o,i)=>{const st=getComputedStyle(o);for(const k of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','opacity'])copies[i].setAttribute(k,st.getPropertyValue(k));});
        items.push({paintLayer,clip,kind:'svg',name,...rect(r),svg:c.outerHTML});return;
      }
      if(s.backgroundColor!=='rgba(0, 0, 0, 0)'||parseFloat(s.borderTopWidth)||parseFloat(s.borderBottomWidth)||parseFloat(s.borderLeftWidth)||parseFloat(s.borderRightWidth))items.push({paintLayer,clip,kind:'box',name,...rect(r),fill:s.backgroundColor,radius:parseFloat(s.borderTopLeftRadius)||0,borders:['Top','Right','Bottom','Left'].map(k=>({width:parseFloat(s['border'+k+'Width'])||0,color:s['border'+k+'Color']})),opacity:Number(s.opacity),shadow:s.boxShadow});
      if(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement||e instanceof HTMLSelectElement){const val=e instanceof HTMLSelectElement?e.selectedOptions[0]?.textContent:e.value||e.placeholder;if(val&&e.type!=='checkbox'&&e.type!=='radio'&&e.type!=='file'){items.push({paintLayer,clip,kind:'text',name:'Value / '+name,x:r.x+parseFloat(s.paddingLeft),y:r.y+(r.height-parseFloat(s.fontSize)*1.3)/2,w:Math.max(1,r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)),h:parseFloat(s.fontSize)*1.3,text:val,size:parseFloat(s.fontSize),weight:s.fontWeight,color:(!e.value&&e.placeholder)?getComputedStyle(e,'::placeholder').color:s.color,font:s.fontFamily,lineHeight:s.lineHeight,align:s.textAlign});}}
      for(const n of e.childNodes){if(n.nodeType===3&&n.textContent.trim()){const range=document.createRange();range.selectNodeContents(n);const tr=range.getBoundingClientRect();if(visible(e,tr,s)&&!clipped(e,tr))items.push({paintLayer,clip,kind:'text',name:n.textContent.trim().slice(0,70),...rect(tr),text:s.textTransform==='uppercase'?n.textContent.replace(/\s+/g,' ').toUpperCase():s.textTransform==='lowercase'?n.textContent.replace(/\s+/g,' ').toLowerCase():n.textContent.replace(/\s+/g,' '),letterSpacing:s.letterSpacing,size:parseFloat(s.fontSize),weight:s.fontWeight,color:(!e.value&&e.placeholder)?getComputedStyle(e,'::placeholder').color:s.color,font:s.fontFamily,lineHeight:s.lineHeight,align:s.textAlign});}}
    }
    for(const child of e.children)walk(child);
  };
  walk(document.body);items.sort((a,b)=>a.paintLayer-b.paintLayer);
  return JSON.stringify({url:location.pathname,viewport:{width:W,height:H},capturedAt:new Date().toISOString(),items});
})()
