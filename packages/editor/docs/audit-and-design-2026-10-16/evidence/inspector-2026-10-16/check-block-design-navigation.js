(()=>{
 const $=s=>document.querySelector(s),results=[],assert=(name,v)=>{results.push({name,pass:!!v});if(!v)throw new Error(name)};
 const api=window.blockCoverage;
 assert('69 unique HTML records',api.ids.length===69&&new Set(api.ids).size===69);
 for(const id of api.ids){api.choose(id);assert('render '+id,api.getState().block===id&&$('#center h1').textContent.length>0&&document.querySelectorAll('[data-node]').length>0);for(const tab of ['Content','Style','Behaviour','Effects']){api.setTab(tab);assert(id+' '+tab,$('#panel').getAttribute('aria-labelledby')==='tab-'+tab&&$('[role=tab][aria-selected=true]').textContent===tab)}}
 $('#search').value='modal';$('#search').dispatchEvent(new Event('input'));assert('search exact modal',document.querySelectorAll('[data-block]').length===1&&$('[data-block]').dataset.block==='modal');
 $('#search').value='no-such-block-92873';$('#search').dispatchEvent(new Event('input'));assert('no matches distinct',document.querySelectorAll('[data-block]').length===0&&$('#list').textContent.includes('No matching blocks'));
 $('#search').value='';$('#search').dispatchEvent(new Event('input'));assert('clear search restores 69',document.querySelectorAll('[data-block]').length===69);
 $('[data-block=table]').click();assert('catalog click restores focus',document.activeElement.dataset.block==='table');api.setTab('Content',true);
 $('#tab-Content').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert('tab ArrowRight and focus',api.getState().tab==='Style'&&document.activeElement.id==='tab-Style');
 $('#tab-Style').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));assert('tab End and focus',api.getState().tab==='Effects'&&document.activeElement.id==='tab-Effects');
 $('#tab-Effects').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert('tab Home and focus',api.getState().tab==='Content'&&document.activeElement.id==='tab-Content');
 const data=JSON.parse($('#data').textContent),table=data.find(b=>b.id==='table');const child=[...document.querySelectorAll('[data-node]')].find(b=>b.dataset.node!==table.returned);child.click();assert('native node selection',api.getState().node===child.dataset.node&&!!$('#back'));$('#back').click();assert('Back restores exact returned block focus',api.getState().node===null&&document.activeElement.dataset.node===table.returned);
 window.b69qa={status:'PASS',checks:results.length,records:69,tabs:276,results};return window.b69qa;
})()
