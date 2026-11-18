// Prepend continuation + inspector helpers and const DATA=<canonical generated data>.
const atlas=[];
let board;
for(let i=0;i<DATA.blocks.length;i++){
 if(i%6===0){board=frame(page,'B4-B69 / '+String(Math.floor(i/6)+1).padStart(2,'0')+' · Individual block Inspector contexts',2080,null);board.x=80;board.y=batchY+Math.floor(i/6)*1200;pad(board,24);board.itemSpacing=24;roots.push(board);text(board,'Block editing · '+DATA.blocks.slice(i,i+6).map(b=>b.label).join(' / '),2032,'Area');text(board,'Content ownership and actual native structure · each block keeps the existing Style / Behavior / Effects routes',2032,'Body','ink-soft');const row=frame(board,'Six distinct 300px inspectors',2032,null,'HORIZONTAL',null);row.itemSpacing=32;board=row;}
 const b=DATA.blocks[i];const panel=frame(board,b.record+' · '+b.label,300,960);panel.strokes=[paint('border')];panel.strokeWeight=1;panel.itemSpacing=0;
 const head=frame(panel,'Persistent target and scope',300,null);pad(head,12);head.itemSpacing=8;text(head,b.label,276,'Panel');text(head,b.selected_tag?'Native <'+b.selected_tag+'> · '+b.selected_type:b.architecture,276,'Meta','ink-soft');text(head,'Content · All breakpoints',276,'Meta','ink-soft');
 const tabs=frame(panel,'Inspector tabs',300,40,'HORIZONTAL');tabs.paddingLeft=12;tabs.itemSpacing=4;for(const tab of ['Content','Style','Behavior','Effects']){const bt=button(tabs,tab,'ghost',66);if(tab==='Content')bt.fills=[paint('accent-subtle')];}
 const body=frame(panel,'One scrolling body',300,800-head.height);body.clipsContent=true;body.overflowDirection='VERTICAL';
 let sec=section(body,b.label+' controls');for(const [label,value]of b.fields){text(sec,label,276,'Meta','ink-soft');if(/Edit |Exact |Actual |Open |Choose|Inspect|Review|Move |Explicit |Blank |Canonical|Temporary|Behavior|Only |Cannot|No |Not |Preserved|Unverified/.test(value)){const bt=button(sec,value.length>33?value.slice(0,31)+'…':value,'secondary',276);bt.name=label+' / '+value;}else input(sec,value,276);}
 sec=section(body,'Native structure');const root=b.tree?.[0];const children=root?.children||[];note(sec,children.length?children.length+' direct children · stable existing IDs':'No generated child list');for(const child of children.slice(0,4))note(sec,'‹'+(child.tag||child.type||'node')+'› '+(child.content?String(child.content).replace(/<[^>]*>/g,'').slice(0,45):child.type||'Native child'));
 sec=section(body,'Safe editing');note(sec,/product|cart/.test(b.id)?'Static presentation stays editable. No verified checkout or payment setup is implied.':'Selection does not write defaults. Exact-child editing returns to this block. Undo restores the original node identities.');text(sec,b.record,276,'Micro','ink-muted');
 atlas.push({record:b.record,id:panel.id,board:panel.parent.parent.id,fields:b.fields.map(f=>f[0]),nativeTag:b.selected_tag,scope:'Block-specific Content entry and controls; flow examples separate'});
}
const familyFields={
 N01:[['Native tag','time'],['Text','21 October 2026'],['datetime','2026-10-21'],['lang','en'],['Inline marks','Preserved']],
 N02:[['Native tag','h2'],['Level','H2'],['Text','Our approach'],['ID','our-approach']],
 N03:[['Native tag','figure'],['Children','img + figcaption'],['Caption','Edit exact figcaption'],['Landmark','Actual native tag']],
 N04:[['Native tag','dl'],['Term','dt · Project'],['Description','dd · Fieldwork'],['Structure','Keep dt/dd association']],
 N05:[['Native tag','fieldset'],['Legend','Project details'],['Disabled','Off'],['Owner form','Contact form'],['Output/datalist','Native route retained']],
 N06:[['Native tag','track'],['Media owner','studio-video'],['Kind','Captions'],['Language','en'],['Source','captions-en.vtt'],['Default','On']],
 N07:[['Native tag','th'],['Scope','col'],['Headers','service-heading'],['Colspan','1 · implicit'],['Rowspan','1 · implicit']],
 N08:[['Native tag','details'],['Initial open','Off'],['Summary','First summary child'],['Native dialog','No assumed Modal link']],
 N09:[['Native tag','meter'],['Value','0.7'],['Min','0'],['Max','1'],['Low','0.2'],['High','0.8'],['Optimum','1']],
 N10:[['Native tag','wbr'],['Inline break','Existing position'],['Text/children','Unavailable for void tag']],
 N11:[['Native tag','path · SVG namespace'],['d','M4 12h16'],['Stroke','currentColor'],['Fill','none'],['Fragment refs','Preserve #icon-shape']],
 N12:[['Native tag','a'],['Text','Explore our work'],['Destination','Page: Work'],['Target','Same tab'],['Rel','Not set']]
};
const nativeMap=[];const familyRows=[];
for(const contract of Object.keys(familyFields)){const entries=DATA.native.filter(n=>n.contract===contract);familyRows.push({contract,entries});}
let natRow;
for(let i=0;i<familyRows.length;i++){
 if(i%3===0){const wrap=frame(page,'B4-Native / '+(Math.floor(i/3)+1)+' · Semantic support routes',1080,null);wrap.x=2320;wrap.y=batchY+Math.floor(i/3)*1500;pad(wrap,24);wrap.itemSpacing=24;roots.push(wrap);text(wrap,'Native semantics · support boundaries',1032,'Area');natRow=frame(wrap,'Three distinct semantic inspectors',1032,null,'HORIZONTAL',null);natRow.itemSpacing=44;}
 const {contract,entries}=familyRows[i];const panel=frame(natRow,contract+' · '+entries[0].family,300,null);panel.strokes=[paint('border')];panel.strokeWeight=1;let sec=section(panel,entries[0].family);note(sec,'Content · All breakpoints');for(const [label,value]of familyFields[contract]){text(sec,label,276,'Meta','ink-soft');input(sec,value,276);}
 sec=section(panel,'Covered native tags');note(sec,entries.map(n=>n.tag).join(' · '));sec=section(panel,'Supported editing boundary');note(sec,entries[0].route);note(sec,'Support route specified. Runtime, output and native behavior have not been tested by this design pass.');
 for(const r of entries)nativeMap.push({tag:r.tag,contract,id:panel.id,status:'Family-specific native route illustrated; not one tested workflow per tag'});
}
const result=await finish();result.blockPanels=atlas;result.nativeRoutes=nativeMap;return result;
