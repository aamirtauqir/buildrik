import{j as b,a as n,B as ue,r as i,e as ge,F as he,f as ne,h as ie,I as pe,i as be,k as fe,l as ye,u as me,E as ve,m as R}from"./index-1n7NZoI6.js";import{P as se}from"./PanelHeader-8iZw5pWP.js";const xe={sm:{padding:"24px 16px",iconSize:32,titleSize:13,descSize:12,gap:8},md:{padding:"40px 24px",iconSize:48,titleSize:15,descSize:13,gap:12},lg:{padding:"60px 32px",iconSize:64,titleSize:18,descSize:14,gap:16}},qe=({icon:e,title:u,description:c,action:h,secondaryAction:y,size:a="md",variant:f="default",className:w=""})=>{const p=xe[a],E={display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:p.padding,borderRadius:"var(--aqb-radius-lg, 12px)",transition:"all var(--aqb-transition-normal, 250ms ease)"},C={default:{background:"rgba(255, 255, 255, 0.02)",border:"1px solid rgba(255, 255, 255, 0.06)"},dashed:{background:"transparent",border:"1px dashed var(--aqb-border, #334155)"},minimal:{background:"transparent",border:"none"}};return b("div",{className:`aqb-empty-state aqb-empty-state-${a} aqb-empty-state-${f} ${w}`,style:{...E,...C[f]},role:"status","aria-label":u,children:[e&&n("div",{className:"aqb-empty-state-icon",style:{fontSize:p.iconSize,marginBottom:p.gap,opacity:.5,lineHeight:1},"aria-hidden":"true",children:e}),n("h3",{className:"aqb-empty-state-title",style:{fontSize:p.titleSize,fontWeight:600,color:"var(--aqb-text-primary, #f8fafc)",marginBottom:c?p.gap/2:0,margin:0},children:u}),c&&n("p",{className:"aqb-empty-state-desc",style:{fontSize:p.descSize,color:"var(--aqb-text-muted, #64748b)",maxWidth:300,lineHeight:1.5,margin:0,marginBottom:h?p.gap:0},children:c}),(h||y)&&b("div",{className:"aqb-empty-state-actions",style:{display:"flex",alignItems:"center",gap:12,marginTop:p.gap},children:[h&&n(ue,{variant:h.variant||"primary",size:a==="lg"?"md":"sm",icon:h.icon,onClick:h.onClick,children:h.label}),y&&n("button",{onClick:y.onClick,style:{background:"transparent",border:"none",color:"var(--aqb-text-secondary, #94a3b8)",fontSize:a==="sm"?12:13,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:2},children:y.label})]})]})},Se="aqb-layers";function X(e,u){return`${Se}-${e}-${u}`}function ae(e,u){try{const c=localStorage.getItem(X(e,u));if(c){const h=JSON.parse(c);if(Array.isArray(h))return new Set(h)}}catch{}return new Set}function ke(e){try{const u=localStorage.getItem(X(e,"names"));if(u){const c=JSON.parse(u);if(typeof c=="object"&&c!==null)return new Map(Object.entries(c))}}catch{}return new Map}function re(e,u,c){try{localStorage.setItem(X(e,u),JSON.stringify([...c]))}catch{}}function we(e,u){try{localStorage.setItem(X(e,"names"),JSON.stringify(Object.fromEntries(u)))}catch{}}function Ce(e,u){e.forEach(c=>{const h=document.querySelector(`[data-aqb-id="${c}"]`);h&&h.setAttribute("data-hidden","true")}),u.forEach(c=>{const h=document.querySelector(`[data-aqb-id="${c}"]`);h&&h.setAttribute("data-locked","true")})}function Ie({composer:e,canvasHoveredId:u}){const[c,h]=i.useState([]),[y,a]=i.useState(""),[f,w]=i.useState(new Set(["root"])),[p,E]=i.useState({draggedId:null,targetId:null,position:null}),[C,z]=i.useState(null),[$,M]=i.useState(null),[O,F]=i.useState(""),[B,H]=i.useState(new Set),[V,P]=i.useState(new Set),[s,g]=i.useState(new Map),[d,x]=i.useState(null),m=i.useRef(!1),N=i.useRef(!1),S=i.useRef(null),W=i.useRef(null),k=i.useRef(new Map),I=i.useRef(null),T=i.useCallback(t=>{m.current=!1;const o=ae(t,"hidden"),l=ae(t,"locked"),r=ae(t,"expanded"),q=ke(t);H(o),P(l),g(q),r.size>0?w(r):w(new Set(["root"])),setTimeout(()=>Ce(o,l),100),m.current=!0},[]);i.useEffect(()=>{if(!e)return;const t=()=>{const l=e.elements.getActivePage()?.id;l&&l!==d&&(x(l),T(l))};return t(),e.on("page:changed",t),e.on("project:loaded",t),e.on("project:imported",t),()=>{e.off("page:changed",t),e.off("project:loaded",t),e.off("project:imported",t)}},[e,d,T]),i.useEffect(()=>{!d||!m.current||re(d,"hidden",B)},[B,d]),i.useEffect(()=>{!d||!m.current||re(d,"locked",V)},[V,d]),i.useEffect(()=>{!d||!m.current||we(d,s)},[s,d]),i.useEffect(()=>{!d||!m.current||re(d,"expanded",f)},[f,d]),i.useEffect(()=>{const t=S.current,o=I.current;if(o&&t&&k.current.set(o,t.scrollTop),I.current=d,d&&t){const l=k.current.get(d);l!==void 0&&requestAnimationFrame(()=>{t.scrollTop=l})}},[d]),i.useEffect(()=>{const t=S.current;if(!t||!d)return;const o=()=>{k.current.set(d,t.scrollTop)};return t.addEventListener("scroll",o,{passive:!0}),()=>t.removeEventListener("scroll",o)},[d]);const v=i.useCallback(()=>{if(!e){h([]);return}const t=e.elements.getActivePage();if(!t){h([]);return}const o=e.elements.getElement(t.root.id);if(!o){h([]);return}const l=(q,A=0)=>{const ee=q.getId(),te=q.getType()||"element",_=q.getTagName()||"div",de=q.getChildren().map(ce=>l(ce,A+1));return{id:ee,type:te,tagName:_.toLowerCase(),depth:A,children:de}},r=l(o,0);h([r])},[e]);i.useEffect(()=>{if(e){v();const t=["project:imported","project:loaded","page:created","page:deleted","page:changed","element:created","element:deleted","element:moved","element:duplicated","element:updated"],o=()=>v();return t.forEach(l=>e.on(l,o)),()=>{t.forEach(l=>e.off(l,o))}}},[e,v]),i.useEffect(()=>{!N.current&&c.length>0&&!m.current&&(N.current=!0,w(new Set([c[0].id])))},[c]),i.useEffect(()=>{if(!u||!e)return;const t=[];let o=e.elements.getElement(u);for(;o;){const l=o.getParent?.();l&&t.push(l.getId()),o=l??void 0}t.length>0&&w(l=>{const r=new Set(l);return t.forEach(q=>r.add(q)),r})},[u,e]);const U=i.useCallback(t=>{w(o=>{const l=new Set(o);return l.has(t)?l.delete(t):l.add(t),l})},[]),K=i.useCallback((t,o)=>{o.stopPropagation(),H(l=>{const r=new Set(l),q=!r.has(t);q?r.add(t):r.delete(t);const A=document.querySelector(`[data-aqb-id="${t}"]`);return A&&A.setAttribute("data-hidden",String(q)),r})},[]),j=i.useCallback((t,o)=>{o.stopPropagation(),P(l=>{const r=new Set(l),q=!r.has(t);q?r.add(t):r.delete(t);const A=document.querySelector(`[data-aqb-id="${t}"]`);return A&&A.setAttribute("data-locked",String(q)),r})},[]),L=i.useCallback((t,o,l)=>{l.stopPropagation(),M(t),F(s.get(t)||o),setTimeout(()=>W.current?.focus(),0)},[s]),D=i.useCallback(()=>{$&&O.trim()&&g(t=>{const o=new Map(t);return o.set($,O.trim()),o}),M(null),F("")},[$,O]),Q=i.useCallback(t=>{z(t);const o=document.querySelector(`[data-aqb-id="${t}"]`);o&&o.classList.add("aqb-layer-hover-highlight")},[]),G=i.useCallback(()=>{if(C){const t=document.querySelector(`[data-aqb-id="${C}"]`);t&&t.classList.remove("aqb-layer-hover-highlight")}z(null)},[C]),Z=i.useCallback(()=>{const t=[],o=l=>{l.forEach(r=>{t.push(r.id),f.has(r.id)&&r.children.length>0&&o(r.children)})};return o(c),t},[f,c]),Y=i.useCallback(t=>{if(!y.trim())return!0;const o=y.toLowerCase();return t.type.toLowerCase().includes(o)||t.tagName.toLowerCase().includes(o)||t.id.toLowerCase().includes(o)},[y]),J=i.useCallback(t=>{if(!y.trim())return t;const o=[];for(const l of t){const r=J(l.children);(Y(l)||r.length>0)&&o.push({...l,children:r})}return o},[Y,y]);return{layers:c,search:y,setSearch:a,expandedIds:f,dragState:p,setDragState:E,editingId:$,editingName:O,setEditingName:F,hiddenIds:B,lockedIds:V,customNames:s,hoveredLayerId:C,treeContainerRef:S,editInputRef:W,toggleExpand:U,toggleVisibility:K,toggleLock:j,startEditing:L,saveEditedName:D,handleLayerMouseEnter:Q,handleLayerMouseLeave:G,getVisibleLayerIds:Z,filterTree:J}}const le=({layer:e,composer:u,selectedElementId:c,expandedIds:h,dragState:y,hiddenIds:a,lockedIds:f,customNames:w,canvasHoveredId:p,hoveredLayerId:E,editingId:C,editingName:z,editInputRef:$,onToggleExpand:M,onToggleVisibility:O,onToggleLock:F,onStartEditing:B,onSaveEditedName:H,onEditingNameChange:V,onMouseEnter:P,onMouseLeave:s,onDragStart:g,onDragEnd:d,onDragOver:x,onDragLeave:m,onDrop:N,onSelect:S,getVisibleLayerIds:W})=>{const k=c===e.id,I=h.has(e.id),T=e.children.length>0,v=ge(e.type),U=y.draggedId===e.id,K=y.targetId===e.id,j=K?y.position:null,L=a.has(e.id),D=f.has(e.id),Q=C===e.id,G=w.get(e.id)||e.type,Z=p===e.id,Y=E===e.id,J=!!(u&&e.depth>0&&!D),t={"--layer-depth":e.depth,paddingLeft:`${8+e.depth*16}px`,opacity:U||L?.5:1},o=["aqb-layer-row",T?"has-children":"",k?"is-selected":"",U?"is-dragging":"",K?"is-drop-target":"",j?`drop-${j}`:"",L?"is-hidden":"",D?"is-locked":"",Z?"is-canvas-hovered":"",Y?"is-layer-hovered":""].filter(Boolean).join(" "),l=r=>{if(r.key==="Enter"||r.key===" ")r.preventDefault(),S(e.id);else if(r.key==="F2")r.preventDefault(),D||B(e.id,G,r);else if(r.key==="ArrowRight"&&T&&!I)r.preventDefault(),M(e.id);else if(r.key==="ArrowLeft"&&T&&I)r.preventDefault(),M(e.id);else if(r.key==="ArrowDown"||r.key==="ArrowUp"){r.preventDefault();const q=W(),A=q.indexOf(e.id);if(A===-1)return;const ee=r.key==="ArrowDown"?1:-1,te=(A+ee+q.length)%q.length,_=q[te];_&&S(_)}};return b("div",{className:"aqb-layer-node",children:[b("div",{className:o,role:"treeitem",tabIndex:0,draggable:J,"aria-pressed":k,"aria-selected":k,"aria-expanded":T?I:void 0,"aria-label":`${G}, ${e.type} element${L?", hidden":""}${D?", locked":""}`,"aria-level":e.depth+1,title:`${G}${L?" (Hidden)":""}${D?" (Locked)":""}`,style:t,onMouseEnter:()=>P(e.id),onMouseLeave:s,onDragStart:J?r=>g(r,e.id,e.type):void 0,onDragEnd:d,onDragOver:r=>x(r,e.id,e.type),onDragLeave:m,onDrop:r=>N(r,e.id),onClick:()=>S(e.id),onDoubleClick:r=>{D||B(e.id,G,r)},onKeyDown:l,children:[j==="before"&&n("div",{className:"aqb-drop-indicator aqb-drop-before"}),j==="after"&&n("div",{className:"aqb-drop-indicator aqb-drop-after"}),j==="inside"&&n("div",{className:"aqb-drop-indicator aqb-drop-inside"}),T?n("button",{type:"button",className:`aqb-layer-toggle ${I?"":"collapsed"}`,"aria-label":I?"Collapse children":"Expand children",onClick:r=>{r.stopPropagation(),M(e.id)},children:n("svg",{width:"10",height:"10",viewBox:"0 0 10 10",fill:"currentColor",children:n("path",{d:"M3 2l4 3-4 3V2z"})})}):n("span",{className:"aqb-layer-toggle-placeholder","aria-hidden":!0,children:"•"}),n("div",{className:"aqb-layer-icon","aria-hidden":!0,children:n(v,{size:"sm"})}),n("div",{className:"aqb-layer-meta",children:Q?n("input",{ref:$,type:"text",className:"aqb-layer-name-input",value:z,onChange:r=>V(r.target.value),onBlur:H,onKeyDown:r=>{(r.key==="Enter"||r.key==="Escape")&&H(),r.stopPropagation()},onClick:r=>r.stopPropagation()}):b(he,{children:[n("span",{className:"aqb-layer-name",children:G}),n("span",{className:"aqb-layer-type",children:e.tagName}),e.isComponent&&n("span",{className:"aqb-component-badge",title:"Component instance",children:"⚡"})]})}),b("div",{className:"aqb-layer-actions",children:[n("button",{type:"button",className:`aqb-layer-action-btn ${L?"is-active":""}`,title:L?"Show element":"Hide element",onClick:r=>O(e.id,r),"aria-label":L?"Show element":"Hide element",children:L?n(Ne,{}):n(Ee,{})}),n("button",{type:"button",className:`aqb-layer-action-btn ${D?"is-active":""}`,title:D?"Unlock element":"Lock element",onClick:r=>F(e.id,r),"aria-label":D?"Unlock element":"Lock element",children:D?n(Le,{}):n(Te,{})})]})]}),I&&e.children.length>0&&n("div",{className:"aqb-layer-children",role:"group",children:e.children.map(r=>n(le,{layer:r,composer:u,selectedElementId:c,expandedIds:h,dragState:y,hiddenIds:a,lockedIds:f,customNames:w,canvasHoveredId:p,hoveredLayerId:E,editingId:C,editingName:z,editInputRef:$,onToggleExpand:M,onToggleVisibility:O,onToggleLock:F,onStartEditing:B,onSaveEditedName:H,onEditingNameChange:V,onMouseEnter:P,onMouseLeave:s,onDragStart:g,onDragEnd:d,onDragOver:x,onDragLeave:m,onDrop:N,onSelect:S,getVisibleLayerIds:W},r.id))})]})},Ee=()=>b("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[n("path",{d:"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}),n("circle",{cx:"12",cy:"12",r:"3"})]}),Ne=()=>b("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[n("path",{d:"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"}),n("line",{x1:"1",y1:"1",x2:"23",y2:"23"})]}),Le=()=>b("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[n("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),n("path",{d:"M7 11V7a5 5 0 0 1 10 0v4"})]}),Te=()=>b("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[n("rect",{x:"3",y:"11",width:"18",height:"11",rx:"2",ry:"2"}),n("path",{d:"M7 11V7a5 5 0 0 1 9.9-1"})]}),De=`
  /* ═══════════════════════════════════════════════════════════════════════════
     LAYER ROW BASE STYLES
     Uses CSS variables from .aqb-layers-panel parent
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .aqb-layer-row.is-dragging {
    opacity: 0.5;
  }
  .aqb-layer-row.is-drop-target {
    position: relative;
  }

  /* Tree depth lines - uses CSS variable */
  .aqb-layer-tree-lines {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
  }
  .aqb-tree-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.2));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     DROP INDICATORS - Green success colors via CSS vars
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-drop-indicator {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 10;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .aqb-drop-before {
    top: -2px;
    height: 4px;
    background: var(--layer-success, #22c55e);
    box-shadow: 0 0 10px var(--layer-success-alpha, rgba(34, 197, 94, 0.6));
    border-radius: 2px;
  }
  .aqb-drop-after {
    bottom: -2px;
    height: 4px;
    background: var(--layer-success, #22c55e);
    box-shadow: 0 0 10px var(--layer-success-alpha, rgba(34, 197, 94, 0.6));
    border-radius: 2px;
  }
  .aqb-drop-inside {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    border: 2px solid var(--layer-success, #22c55e);
    background: var(--layer-success-alpha, rgba(34, 197, 94, 0.15));
    border-radius: 4px;
    box-shadow: inset 0 0 8px var(--layer-success-alpha, rgba(34, 197, 94, 0.3));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTION BUTTONS - Uses accent color CSS vars
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-actions {
    display: flex;
    gap: 2px;
    margin-left: auto;
    opacity: 0;
    transition: opacity 0.15s ease;
  }
  .aqb-layer-row:hover .aqb-layer-actions,
  .aqb-layer-row.is-selected .aqb-layer-actions {
    opacity: 1;
  }
  .aqb-layer-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--layer-accent-muted, rgba(59, 130, 246, 0.6));
    transition: all 0.15s ease;
  }
  .aqb-layer-action-btn:hover {
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.15));
    color: var(--layer-accent, #3b82f6);
  }

  /* Name input for editing */
  .aqb-layer-name-input {
    width: 100%;
    padding: 2px 6px;
    border: 1px solid var(--layer-accent, #3b82f6);
    border-radius: 4px;
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.1));
    color: inherit;
    font-size: 12px;
    outline: none;
  }
  .aqb-layer-name-input:focus {
    border-color: var(--layer-success, #22c55e);
    box-shadow: 0 0 0 2px var(--layer-success-alpha, rgba(34, 197, 94, 0.2));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HIDDEN STATE - Warning color (amber/orange) via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-hidden {
    opacity: 0.5;
  }
  .aqb-layer-row.is-hidden .aqb-layer-name {
    color: var(--aqb-text-tertiary, rgba(148, 163, 184, 0.5));
  }
  .aqb-layer-row.is-hidden .aqb-layer-id {
    opacity: 0.5;
  }
  .aqb-layer-row.is-hidden .aqb-layer-icon {
    opacity: 0.6;
  }
  /* Warning color for hidden action button */
  .aqb-layer-row.is-hidden .aqb-layer-action-btn:first-child {
    color: var(--layer-warning, #f59e0b);
    opacity: 1;
  }
  .aqb-layer-row.is-hidden .aqb-layer-action-btn:first-child:hover {
    background: var(--layer-warning-alpha, rgba(245, 158, 11, 0.15));
    color: var(--layer-warning, #f59e0b);
  }
  /* Keep visibility button always visible when hidden */
  .aqb-layer-row.is-hidden .aqb-layer-actions {
    opacity: 1;
  }
  .aqb-layer-row.is-hidden .aqb-layer-actions .aqb-layer-action-btn:first-child {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     LOCKED STATE - Muted color (slate gray) via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-locked {
    cursor: not-allowed;
  }
  .aqb-layer-row.is-locked .aqb-layer-icon {
    opacity: 0.6;
  }
  /* Muted color for locked action button */
  .aqb-layer-row.is-locked .aqb-layer-action-btn:last-child {
    color: var(--layer-muted, #64748b);
    opacity: 1;
  }
  .aqb-layer-row.is-locked .aqb-layer-action-btn:last-child:hover {
    background: var(--layer-muted-alpha, rgba(100, 116, 139, 0.15));
    color: var(--layer-muted-light, #94a3b8);
  }
  /* Keep lock button always visible when locked */
  .aqb-layer-row.is-locked .aqb-layer-actions {
    opacity: 1;
  }
  .aqb-layer-row.is-locked .aqb-layer-actions .aqb-layer-action-btn:last-child {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     COMBINED: Both hidden AND locked
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-hidden.is-locked .aqb-layer-actions {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BIDIRECTIONAL HOVER HIGHLIGHTING - Accent color via CSS var
     ═══════════════════════════════════════════════════════════════════════════ */
  .aqb-layer-row.is-canvas-hovered,
  .aqb-layer-row.is-layer-hovered {
    background: var(--layer-accent-alpha, rgba(59, 130, 246, 0.15)) !important;
    outline: 1px solid var(--layer-accent-border, rgba(59, 130, 246, 0.4));
    outline-offset: -1px;
  }
  .aqb-layer-row.is-canvas-hovered::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--layer-accent, #3b82f6);
    border-radius: 0 2px 2px 0;
  }
`,Re=({composer:e,selectedElement:u,onLayerHover:c,canvasHoveredId:h,onAddBlockClick:y})=>{const a=Ie({composer:e,canvasHoveredId:h}),[f,w]=i.useState(null);i.useEffect(()=>{if(f){const s=setTimeout(()=>w(null),3e3);return()=>clearTimeout(s)}},[f]);const p=i.useCallback(s=>{w({message:s,type:"error"})},[]),E=i.useCallback((s,g,d)=>{if(!e||!s||s===g)return;const x=e.elements,m=x.getElement(s),N=x.getElement(g);if(!m||!N)return;const S=x.getActivePage();if(S&&S.root.id===s||m.getDescendants().some(v=>v.getId()===g))return;const k=m.getType();let I=null,T;if(d==="inside"){if(a.lockedIds.has(g)){p("Cannot drop inside a locked container");return}I=N;const v=I.getType();if(!ne(v)){p(`${v} cannot contain children`);return}if(!ie(k,v)){p(`${k} cannot be nested inside ${v}`);return}T=I.getChildCount()}else{const v=N.getParent();if(!v)return;if(a.lockedIds.has(v.getId())){p("Cannot drop next to elements in a locked container");return}const U=v.getType();if(!ie(k,U)){p(`${k} cannot be placed in ${U}`);return}const K=v.getChildIndex(N),j=d==="before"?K:K+1,L=m.getParent();L&&L.getId()===v.getId()&&v.getChildIndex(m),I=v,T=j}I&&(e.beginTransaction("move-layer"),x.moveElement(m.getId(),I.getId(),T),e.endTransaction(),setTimeout(()=>e.selection.reselect(),0))},[e,a.lockedIds,p]),C=i.useCallback(()=>{if(!a.treeContainerRef.current)return;const s=a.treeContainerRef.current.querySelector('.aqb-layer-row[aria-selected="true"]');s&&s.scrollIntoView({behavior:"smooth",block:"center"})},[a.treeContainerRef]);i.useEffect(()=>{if(!u?.id||!a.treeContainerRef.current||!e)return;const s=[];let g=e.elements.getElement(u.id);for(;g;){const x=g.getParent?.();x&&s.unshift(x.getId()),g=x??void 0}s.length>0&&a.expandedIds.forEach(()=>{});const d=setTimeout(C,50);return()=>clearTimeout(d)},[u?.id,e,a.expandedIds,a.treeContainerRef,C]),i.useEffect(()=>{if(!e)return;const s=()=>{setTimeout(C,50)};return e.on("layers:scroll-to-selection",s),()=>{e.off("layers:scroll-to-selection",s)}},[e,C]);const z=i.useCallback((s,g,d)=>{s.dataTransfer.effectAllowed="move",s.dataTransfer.setData("layer-id",g),s.dataTransfer.setData("layer-type",d),a.setDragState({draggedId:g,targetId:null,position:null}),s.target.classList.add("is-dragging")},[a]),$=i.useCallback(s=>{s.target.classList.remove("is-dragging"),a.setDragState({draggedId:null,targetId:null,position:null})},[a]),M=i.useCallback((s,g,d)=>{if(s.preventDefault(),s.stopPropagation(),!a.dragState.draggedId||a.dragState.draggedId===g)return;const x=s.currentTarget.getBoundingClientRect(),m=s.clientY-x.top,N=x.height;let S;const W=ne(d);m<N*.3?S="before":m>N*.7?S="after":W?S="inside":S=m<N*.5?"before":"after",a.setDragState(k=>k.targetId===g&&k.position===S?k:{...k,targetId:g,position:S})},[a]),O=i.useCallback(s=>{const g=s.relatedTarget;(!g||!s.currentTarget.contains(g))&&a.setDragState(d=>({...d,targetId:null,position:null}))},[a]),F=i.useCallback((s,g)=>{s.preventDefault(),s.stopPropagation();const d=s.dataTransfer.getData("layer-id"),{position:x}=a.dragState;d&&g&&x&&E(d,g,x),a.setDragState({draggedId:null,targetId:null,position:null})},[a,E]),B=i.useCallback(s=>{if(!e)return;const g=e.elements.getElement(s);g&&e.selection.select(g)},[e]),H=i.useCallback(s=>{a.handleLayerMouseEnter(s),c?.(s)},[a,c]),V=i.useCallback(()=>{a.handleLayerMouseLeave(),c?.(null)},[a,c]),P=a.filterTree(a.layers);return b("div",{className:"aqb-layers-panel aqb-layers-minimal",children:[b("div",{className:"aqb-layers-search-row",children:[b("div",{className:"aqb-search-container",children:[n("span",{className:"aqb-search-icon","aria-hidden":!0,children:n(pe,{size:"sm"})}),n("input",{type:"text",placeholder:"Search layers...",value:a.search,onChange:s=>a.setSearch(s.target.value),"aria-label":"Search layers","aria-controls":"aqb-layers-tree",className:"aqb-search-input"}),a.search&&n("button",{className:"aqb-search-clear",onClick:()=>a.setSearch(""),"aria-label":"Clear search",children:"×"})]}),n("button",{className:"aqb-layers-settings-btn",title:"Layer settings","aria-label":"Layer settings",children:n(be,{size:"sm"})})]}),n("div",{"aria-live":"polite","aria-atomic":"true",className:"aqb-sr-only",style:{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",border:0},children:a.search&&P.length>0?`${P.length} layer${P.length===1?"":"s"} found`:a.search&&P.length===0?"No layers match your search":""}),f&&b("div",{role:"alert","aria-live":"assertive",style:{padding:"8px 12px",margin:"0 8px 8px",fontSize:"var(--aqb-text-xs, 12px)",borderRadius:"var(--aqb-radius-sm, 4px)",background:f.type==="error"?"var(--aqb-error-bg, rgba(239, 68, 68, 0.1))":"var(--aqb-info-bg, rgba(59, 130, 246, 0.1))",color:f.type==="error"?"var(--aqb-error, #ef4444)":"var(--aqb-info, #3b82f6)",border:`1px solid ${f.type==="error"?"var(--aqb-error, #ef4444)":"var(--aqb-info, #3b82f6)"}`,display:"flex",alignItems:"center",gap:"6px"},children:[n("span",{"aria-hidden":!0,children:f.type==="error"?"⚠️":"ℹ️"}),f.message]}),b("div",{ref:a.treeContainerRef,id:"aqb-layers-tree",className:"aqb-layers-tree aqb-layers-tree-minimal",role:"tree","aria-label":"Page structure",children:[a.layers.length===0&&n(qe,{icon:n(ye,{size:"md"}),title:"No layers yet",description:"Add blocks to start building your page",action:{label:"Add Block",onClick:y||(()=>{}),icon:n(fe,{size:"sm"})},size:"sm",className:"aqb-layers-empty-state"}),P.map(s=>n(le,{layer:s,composer:e,selectedElementId:u?.id??null,expandedIds:a.expandedIds,dragState:a.dragState,hiddenIds:a.hiddenIds,lockedIds:a.lockedIds,customNames:a.customNames,canvasHoveredId:h??null,hoveredLayerId:a.hoveredLayerId,editingId:a.editingId,editingName:a.editingName,editInputRef:a.editInputRef,onToggleExpand:a.toggleExpand,onToggleVisibility:a.toggleVisibility,onToggleLock:a.toggleLock,onStartEditing:a.startEditing,onSaveEditedName:a.saveEditedName,onEditingNameChange:a.setEditingName,onMouseEnter:H,onMouseLeave:V,onDragStart:z,onDragEnd:$,onDragOver:M,onDragLeave:O,onDrop:F,onSelect:B,getVisibleLayerIds:a.getVisibleLayerIds},s.id))]}),n("style",{children:De})]})},Me=({composer:e,onElementSelect:u,canvasHoveredId:c,onAddBlockClick:h,isPinned:y,onPinToggle:a,onHelpClick:f,onClose:w})=>{const{selectedElement:p,selectedId:E}=me({composer:e}),C=i.useMemo(()=>p?{id:E||"",type:p.getType?.()||"element",tagName:p.getTagName?.()||"div"}:null,[p,E]);i.useEffect(()=>{E&&u?.(E)},[E,u]);const z=i.useCallback($=>{e&&e.emit(ve.LAYER_HOVER,{id:$})},[e]);return e?b("div",{style:oe,children:[n(se,{title:"Layers",isPinned:y,onPinToggle:a,onHelpClick:f,onClose:w}),n("div",{style:$e,children:n(Re,{composer:e,selectedElement:C,onLayerHover:z,canvasHoveredId:c,onAddBlockClick:h})})]}):b("div",{style:oe,children:[n(se,{title:"Layers",isPinned:y,onPinToggle:a,onHelpClick:f,onClose:w}),b("div",{style:Pe,children:[b("div",{style:{display:"flex",alignItems:"center",gap:8},children:[n(R,{width:14,height:14,radius:"sm"}),n(R,{width:"60%",height:12,radius:"sm"})]}),b("div",{style:{display:"flex",alignItems:"center",gap:8,paddingLeft:22},children:[n(R,{width:14,height:14,radius:"sm"}),n(R,{width:"50%",height:12,radius:"sm"})]}),b("div",{style:{display:"flex",alignItems:"center",gap:8,paddingLeft:44},children:[n(R,{width:14,height:14,radius:"sm"}),n(R,{width:"40%",height:12,radius:"sm"})]}),b("div",{style:{display:"flex",alignItems:"center",gap:8,paddingLeft:44},children:[n(R,{width:14,height:14,radius:"sm"}),n(R,{width:"55%",height:12,radius:"sm"})]}),b("div",{style:{display:"flex",alignItems:"center",gap:8,paddingLeft:22},children:[n(R,{width:14,height:14,radius:"sm"}),n(R,{width:"45%",height:12,radius:"sm"})]}),b("div",{style:{display:"flex",alignItems:"center",gap:8},children:[n(R,{width:14,height:14,radius:"sm"}),n(R,{width:"50%",height:12,radius:"sm"})]})]})]})},oe={display:"flex",flexDirection:"column",height:"100%",background:"var(--aqb-surface-2)"},$e={flex:1,overflow:"hidden",display:"flex",flexDirection:"column"},Pe={display:"flex",flexDirection:"column",gap:10,padding:"16px 12px"};export{Me as LayersTab,Me as default};
