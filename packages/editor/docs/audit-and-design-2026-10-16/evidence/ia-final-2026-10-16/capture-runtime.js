(()=>{
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert]');
 const controls=[...document.querySelectorAll('button,[role=tab],input,select,textarea')].filter(visible).map(e=>({role:e.getAttribute('role')||e.tagName.toLowerCase(),name:e.getAttribute('aria-label')||e.innerText||e.getAttribute('placeholder')||'',disabled:e.disabled||e.getAttribute('aria-disabled')==='true',selected:e.getAttribute('aria-selected')})).filter(x=>x.name).slice(0,180);
 window.iaCapture={date:'2026-10-16',url:location.href,viewport:[innerWidth,innerHeight],scope:'Standalone empty demo; navigation only. Service writes, roles and saved-project state not tested.',text:document.body.innerText.split('Pause animations')[0].slice(0,16000),controls};
 return {captured:controls.length,url:location.href};
})()
