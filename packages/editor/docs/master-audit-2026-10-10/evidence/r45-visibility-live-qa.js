// R45 read-only native-action QA. Inject the final JSON at the manifest placeholder below.
// All interpreted writes affect a local Map only. No node/variable mutation APIs.
const manifest = {"variables":{"active":"VariableID:9064:17499","display-eligible":"VariableID:9064:17500","extras":"VariableID:9064:17501","origin":"VariableID:9064:17502","result":"VariableID:9064:17503","undo":"VariableID:9064:17504","reason":"VariableID:9064:17505","allowed":"VariableID:9064:17506","changed":"VariableID:9064:17507","captured-caller":"VariableID:9064:17508","captured-device":"VariableID:9064:17509","captured-generation":"VariableID:9064:17510","captured-revision":"VariableID:9064:17511"},"nodes":{"style":"8841:14864","chooser":"8844:264650","field":"8841:14889","chooseBlock":"8844:264653","chooseFlex":"8844:264656","chooseGrid":"8844:264659","chooseNone":"8844:264662","flagDesktop":"8841:15289","flagTablet":"8841:15294","flagMobile":"8841:15299","resetDisplay":"9064:17591","undo":"9064:17599","resetFlagDesktop":"9064:17621","resetFlagTablet":"9064:17627","resetFlagMobile":"9064:17631","blocked":"9064:17601","blockedBack":"9064:17611","displaySection":"9064:17586","extras":"9064:17593","resultSection":"9064:17596","cancel":"8844:264665","headingFixtureclean":"9064:20068","headingFixturetabletNone":"9064:20071","headingFixturecombined":"9064:20074","headingFixturelocked":"9064:20077","headingFixturemixed":"9064:20080","headingFixturemissing":"9064:20083","imageFixtureclean":"9064:20124","imageFixturetabletNone":"9064:20127","imageFixturecombined":"9064:20130","imageFixturelocked":"9064:20133","imageFixturemixed":"9064:20136","imageFixturemissing":"9064:20139"},"targets":{"heading":{"root":"8843:16808","entry":"8843:17016","desktop":"8843:16842","mobile":"8843:16843","tablet":"9064:20045","layer":"8843:16833","layers":"8843:16824","count":"8843:16837","reset":"8843:17097","selected":"8843:17107","qa":"9064:20058","footer":"8843:16900","v":{"device":"VariableID:9064:17512","generation":"VariableID:9064:17513","locked":"VariableID:9064:17514","mixed":"VariableID:9064:17515","exists":"VariableID:9064:17516","visible":"VariableID:9064:17517","hidden":"VariableID:9064:17518","normal":"VariableID:9064:17519","tablet":"VariableID:9064:17520","effective":"VariableID:9064:17521","origin":"VariableID:9064:17522","result":"VariableID:9064:17523","layer":"VariableID:9064:17524","undo":"VariableID:9064:17525","before-key":"VariableID:9064:17526","before-present":"VariableID:9064:17527","before-raw":"VariableID:9064:17528","before-generation":"VariableID:9064:17529","undo-revision":"VariableID:9064:17530","display-Desktop-present":"VariableID:9064:17531","display-Desktop-raw":"VariableID:9064:17532","display-Desktop-revision":"VariableID:9064:17533","flag-Desktop-present":"VariableID:9064:17534","flag-Desktop-raw":"VariableID:9064:17535","flag-Desktop-revision":"VariableID:9064:17536","display-Tablet-present":"VariableID:9064:17537","display-Tablet-raw":"VariableID:9064:17538","display-Tablet-revision":"VariableID:9064:17539","flag-Tablet-present":"VariableID:9064:17540","flag-Tablet-raw":"VariableID:9064:17541","flag-Tablet-revision":"VariableID:9064:17542","display-Mobile-present":"VariableID:9064:17543","display-Mobile-raw":"VariableID:9064:17544","display-Mobile-revision":"VariableID:9064:17545","flag-Mobile-present":"VariableID:9064:17546","flag-Mobile-raw":"VariableID:9064:17547","flag-Mobile-revision":"VariableID:9064:17548"}},"image":{"root":"8843:20467","entry":"8843:20675","desktop":"8843:20501","mobile":"8843:20502","tablet":"9064:20101","layer":"8843:20492","layers":"8843:20483","count":"8843:20496","reset":"8843:20768","selected":"8843:20778","qa":"9064:20114","v":{"device":"VariableID:9064:17549","generation":"VariableID:9064:17550","locked":"VariableID:9064:17551","mixed":"VariableID:9064:17552","exists":"VariableID:9064:17553","visible":"VariableID:9064:17554","hidden":"VariableID:9064:17555","normal":"VariableID:9064:17556","tablet":"VariableID:9064:17557","effective":"VariableID:9064:17558","origin":"VariableID:9064:17559","result":"VariableID:9064:17560","layer":"VariableID:9064:17561","undo":"VariableID:9064:17562","before-key":"VariableID:9064:17563","before-present":"VariableID:9064:17564","before-raw":"VariableID:9064:17565","before-generation":"VariableID:9064:17566","undo-revision":"VariableID:9064:17567","display-Desktop-present":"VariableID:9064:17568","display-Desktop-raw":"VariableID:9064:17569","display-Desktop-revision":"VariableID:9064:17570","flag-Desktop-present":"VariableID:9064:17571","flag-Desktop-raw":"VariableID:9064:17572","flag-Desktop-revision":"VariableID:9064:17573","display-Tablet-present":"VariableID:9064:17574","display-Tablet-raw":"VariableID:9064:17575","display-Tablet-revision":"VariableID:9064:17576","flag-Tablet-present":"VariableID:9064:17577","flag-Tablet-raw":"VariableID:9064:17578","flag-Tablet-revision":"VariableID:9064:17579","display-Mobile-present":"VariableID:9064:17580","display-Mobile-raw":"VariableID:9064:17581","display-Mobile-revision":"VariableID:9064:17582","flag-Mobile-present":"VariableID:9064:17583","flag-Mobile-raw":"VariableID:9064:17584","flag-Mobile-revision":"VariableID:9064:17585"}}},"externalVariables":{"caller":"VariableID:8841:14860","display":"VariableID:8841:14887","showDesktop":"VariableID:8841:15287","showTablet":"VariableID:8841:15292","showMobile":"VariableID:8841:15297","context":"VariableID:8905:17347","layout":"VariableID:8841:14862"}};
const R45_DEVICES = ['desktop', 'tablet', 'mobile'];
const R45_TARGETS = ['heading', 'image'];
const R45_DISPLAY_STATES = [
  { present: false, raw: '' },
  { present: true, raw: 'block' },
  { present: true, raw: 'none' },
];
const R45_FLAG_STATES = [
  { present: false, raw: '' },
  { present: true, raw: 'true' },
];
const copy = value => JSON.parse(JSON.stringify(value));
function assertDevice(device) {
  if (!R45_DEVICES.includes(device)) throw Error('Unsupported preview device: ' + device);
}
// This oracle does not read labels, result variables, actions or Figma defaults.
// Missing Display resolves to Block for these two finite fixtures only.
function visibilityOracle(document, device) {
  assertDevice(device);
  let effectiveDisplay = 'block', displayOrigin = 'default';
  const scopes = device === 'desktop' ? ['desktop'] : device === 'tablet'
    ? ['desktop', 'tablet'] : ['desktop', 'tablet', 'mobile'];
  for (const scope of scopes) {
    const declaration = document.display[scope];
    if (!declaration || typeof declaration.present !== 'boolean') throw Error('Missing Display presence at ' + scope);
    if (declaration.present) {
      if (!['block', 'none'].includes(declaration.raw)) throw Error('Outside finite Display oracle: ' + declaration.raw);
      effectiveDisplay = declaration.raw;
      displayOrigin = scope;
    }
  }
  const flag = document.flags[device];
  if (!flag || typeof flag.present !== 'boolean') throw Error('Missing named flag at ' + device);
  const hiddenByFlag = flag.present && flag.raw === 'true';
  const hiddenByDisplay = effectiveDisplay === 'none';
  return {
    target: document.target, device, effectiveDisplay, displayOrigin,
    hasDisplayOverride: document.display[device].present,
    inherited: displayOrigin !== 'default' && displayOrigin !== device,
    shownByDeviceFlag: !hiddenByFlag,
    hiddenByFlag, hiddenByDisplay,
    causes: [hiddenByDisplay ? 'display:' + displayOrigin : null, hiddenByFlag ? 'flag:' + device : null].filter(Boolean),
    visible: !hiddenByDisplay && !hiddenByFlag,
  };
}
// Independent expectation: search nearest declared scope from current to base,
// rather than reuse oracle's forward cascade or result fields.
function expectedFromMatrix(displayCodes, flagMask, deviceIndex) {
  const picked = Array.from({ length: deviceIndex + 1 }, (_, n) => deviceIndex - n)
    .find(index => displayCodes[index] !== 0);
  const code = picked === undefined ? 1 : displayCodes[picked];
  const hiddenByFlag = Boolean(flagMask & (1 << deviceIndex));
  return {
    effectiveDisplay: code === 2 ? 'none' : 'block',
    displayOrigin: picked === undefined ? 'default' : R45_DEVICES[picked],
    hasDisplayOverride: displayCodes[deviceIndex] !== 0,
    inherited: picked !== undefined && picked !== deviceIndex,
    shownByDeviceFlag: !hiddenByFlag,
    hiddenByFlag, hiddenByDisplay: code === 2,
    causes: [code === 2 ? 'display:' + R45_DEVICES[picked] : null, hiddenByFlag ? 'flag:' + R45_DEVICES[deviceIndex] : null].filter(Boolean),
    visible: code !== 2 && !hiddenByFlag,
  };
}
function makeDocument(target, codes, flagMask) {
  return {
    target,
    display: Object.fromEntries(R45_DEVICES.map((device, i) => [device, copy(R45_DISPLAY_STATES[codes[i]])])),
    flags: Object.fromEntries(R45_DEVICES.map((device, i) => [device, copy(R45_FLAG_STATES[(flagMask >> i) & 1])])),
  };
}
const oracleCases = [], oracleFailures = [];
for (const target of R45_TARGETS) for (let deviceIndex = 0; deviceIndex < 3; deviceIndex++)
  for (let flagMask = 0; flagMask < 8; flagMask++)
    for (let base = 0; base < 3; base++) for (let tablet = 0; tablet < 3; tablet++) for (let mobile = 0; mobile < 3; mobile++) {
      const codes = [base, tablet, mobile], device = R45_DEVICES[deviceIndex];
      const document = makeDocument(target, codes, flagMask), before = JSON.stringify(document);
      const actual = visibilityOracle(document, device);
      const expected = { target, device, ...expectedFromMatrix(codes, flagMask, deviceIndex) };
      const pass = JSON.stringify(actual) === JSON.stringify(expected) && JSON.stringify(document) === before;
      const test = { id: target + '/' + device + '/flags' + flagMask + '/display' + codes.join(''), document, device, expected };
      oracleCases.push(test);
      if (!pass) oracleFailures.push({ id: test.id, actual, expected, documentUnchanged: JSON.stringify(document) === before });
    }
if (oracleCases.length !== 1296) throw Error('Incorrect matrix size: ' + oracleCases.length);
// Cases remain available above for the later native-action adapter; they are not
// injected into Figma variables. Any live-action run must use a local state Map.
// Pending action layer: exact target/scope/property snapshots; guarded commits;
// Reset/Undo raw presence; useful no-op history; Layers/caller return; regression
// isolation from R38 typography and Image replacement/fit state.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('8463:2'));
const nativeVariables = await figma.variables.getLocalVariablesAsync();
for(const name of ['fixture-owner','chooser-fixture-owner']){const matches=nativeVariables.filter(v=>v.name==='r45/visibility/'+name);if(matches.length!==1)throw Error('Expected exactly one ownership variable '+name+', found '+matches.length);manifest.variables[name]=matches[0].id;}
const correctionProbe = { tabletColorVariables: nativeVariables.filter(v=>/^r45\/visibility\/(heading|image)\/tablet-(bg|fg)$/.test(v.name)).map(v=>({id:v.id,name:v.name,type:v.resolvedType})), tabBindings:[] };
for(const [target,ids] of Object.entries({heading:['8843:17018','8843:17020'],image:['8843:20677','8843:20679']}))for(const id of ids){const n=await figma.getNodeByIdAsync(id);correctionProbe.tabBindings.push({target,id,visibleVariable:n?.boundVariables?.visible?.id,expected:manifest.targets[target].v.normal});}
const defaults = new Map(nativeVariables.map(v => [v.id, Object.values(v.valuesByMode)[0]]));
const variableNames = new Map(nativeVariables.map(v => [v.id, v.name]));
const devices = ['Desktop','Tablet','Mobile'];
const propertyKeys = devices.flatMap(d => ['display-'+d, 'flag-'+d]);
const live = {}, actions = {}, escapes = {}, inspected = new Set();
const nodeIds = {...manifest.nodes, cancel:'8844:264665',styleClose:'8841:14868',styleBack:'8841:15383',legacyHeadingA:'8468:244789',legacyHeadingB:'8468:244842',legacyImage:'8507:2858',headingAlternate:'8843:17034',imageAlternate:'8905:18143',otherParagraph:'8843:17320',otherFlex:'8843:24418',otherGrid:'8843:24954'};
for(const [target,t] of Object.entries(manifest.targets))for(const key of ['entry','desktop','tablet','mobile','layer','layers','count','reset','selected'])nodeIds[target+'_'+key]=t[key];
for(const [key,id] of Object.entries(nodeIds)){
 if(!id)throw Error('Manifest missing node '+key);
 const n=await figma.getNodeByIdAsync(id);if(!n)throw Error('Missing native node '+key+' '+id);
 live[key]=n;inspected.add(id);actions[key]=n.reactions?.find(r=>r.trigger?.type==='ON_CLICK')?.actions;
 escapes[key]=n.reactions?.find(r=>r.trigger?.type==='ON_KEY_DOWN'&&r.trigger.keyCodes?.includes(27))?.actions;
}
let state=new Map(defaults), destination=null, written=new Set(), category='oracle_crosscheck';
const assertions=[], categories={};
const key=(name,target)=>target?manifest.targets[target].v[name]:(manifest.variables[name]||manifest.externalVariables[name]);
function resolve(id){if(!id)throw Error('Missing variable ID');const x=state.get(id);return x&&typeof x==='object'&&x.type==='VARIABLE_ALIAS'?resolve(x.id):x;}
const read=(name,target)=>resolve(key(name,target));
function put(name,value,target){const id=key(name,target);if(!id)throw Error('Missing variable '+name+'/'+target);state.set(id,value);}
function evaluate(v){if(v.type==='VARIABLE_ALIAS')return resolve(v.value.id);if(v.type!=='EXPRESSION')return v.value;const a=v.value.expressionArguments.map(evaluate);switch(v.value.expressionFunction){case'EQUALS':return a[0]===a[1];case'NOT':return !a[0];case'AND':return a.every(Boolean);case'OR':return a.some(Boolean);case'ADDITION':return a[0]+a[1];case'SUBTRACTION':return a[0]-a[1];case'MULTIPLICATION':return a[0]*a[1];default:throw Error('Unsupported expression '+v.value.expressionFunction);}}
function run(list){for(const a of list||[]){switch(a.type){case'SET_VARIABLE':state.set(a.variableId,evaluate(a.variableValue));written.add(a.variableId);break;case'CONDITIONAL':{const b=a.conditionalBlocks.find(b=>!b.condition||evaluate(b.condition));if(b)run(b.actions);break;}case'NODE':destination=a.destinationId;break;case'CLOSE':destination='CLOSED';break;default:throw Error('Unsupported action '+a.type);}}}
function tap(id){if(!actions[id])throw Error('No click actions '+id);run(actions[id]);}
function escape(id){if(!escapes[id])throw Error('No Escape actions '+id);run(escapes[id]);}
function check(label,actual,expected){const pass=JSON.stringify(actual)===JSON.stringify(expected);assertions.push({category,label,actual,expected,pass});categories[category]??={checks:0,passed:0};categories[category].checks++;if(pass)categories[category].passed++;}
function ownedDocument(target){return Object.fromEntries(propertyKeys.map(k=>[k,[read(k+'-present',target),read(k+'-raw',target),read(k+'-revision',target)]]));}
function history(target){return ['undo','before-key','before-present','before-raw','before-generation','undo-revision'].map(k=>read(k,target));}
function clean(target){for(const p of propertyKeys){put(p+'-present',false,target);put(p+'-raw','',target);put(p+'-revision',0,target);}put('undo',false,target);put('generation',1,target);put('locked',false,target);put('mixed',false,target);put('exists',true,target);put('device','Desktop',target);}
function setup(target='heading',device='Desktop'){state=new Map(defaults);destination=null;written=new Set();for(const t of R45_TARGETS)clean(t);put('device',device,target);tap(target+'_entry');}
function seed(target,document){for(const device of R45_DEVICES){const d=devices[R45_DEVICES.indexOf(device)];for(const kind of ['display','flag']){const source=document[kind==='display'?'display':'flags'][device];put(kind+'-'+d+'-present',source.present,target);put(kind+'-'+d+'-raw',kind==='display'&&source.present?(source.raw==='none'?'None':'Block'):source.raw,target);}}}
function oracleDocument(target){const display={},flags={};for(const d of devices){display[d.toLowerCase()]={present:read('display-'+d+'-present',target),raw:String(read('display-'+d+'-raw',target)).toLowerCase()};flags[d.toLowerCase()]={present:read('flag-'+d+'-present',target),raw:read('flag-'+d+'-raw',target)};}return {target,display,flags};}
function originCopy(result){if(result.displayOrigin==='default')return 'Default · Block';if(result.inherited)return result.displayOrigin==='tablet'?'Mobile · inherited from Tablet':'Inherited from Desktop';return devices[R45_DEVICES.indexOf(result.displayOrigin)]+' · local declaration';}
function output(target,label){const expected=visibilityOracle(oracleDocument(target),read('device',target).toLowerCase());const origin=originCopy(expected),device=read('device',target);let status='Visible on '+device;if(expected.hiddenByDisplay)status='Hidden by Display · '+origin;if(expected.hiddenByFlag)status=expected.hiddenByDisplay?'Hidden by Display and Show on '+device:'Hidden by Show on '+device;
 check(label,{effective:read('effective',target),visible:read('visible',target),hidden:read('hidden',target),origin:read('origin',target),result:read('result',target)},{effective:expected.effectiveDisplay==='none'?'None':'Block',visible:expected.visible,hidden:!expected.visible,origin,result:status});
}
function choose(value){tap('field');tap('choose'+value);}
check('Independent oracle matrix self-checks',oracleFailures,[]);
category='correction_commit_probe';
check('Four Tablet COLOR variables exist',correctionProbe.tabletColorVariables.length,4);check('Tablet variables are COLOR',correctionProbe.tabletColorVariables.every(v=>v.type==='COLOR'),true);for(const tab of correctionProbe.tabBindings)check('Tab normal binding '+tab.id,tab.visibleVariable,tab.expected);
category='live_sync_oracle_matrix';
for(const test of oracleCases){setup(test.document.target);seed(test.document.target,test.document);put('device',devices[R45_DEVICES.indexOf(test.device)],test.document.target);const before=ownedDocument(test.document.target);tap(test.document.target+'_entry');output(test.document.target,test.id);check('Entry leaves raw declarations unchanged '+test.id,ownedDocument(test.document.target),before);}
category='display_cascade_reset_history';
for(const target of R45_TARGETS)for(const device of devices){setup(target,device);const other=target==='heading'?'image':'heading',otherBefore=ownedDocument(other);choose('None');check('Display writes selected scope '+target+'/'+device,[read('display-'+device+'-present',target),read('display-'+device+'-raw',target)],[true,'None']);output(target,'Display None '+target+'/'+device);const hist=history(target),doc=ownedDocument(target);choose('None');check('Same choice keeps useful Undo '+target+'/'+device,history(target),hist);check('Same choice keeps revisions '+target+'/'+device,ownedDocument(target),doc);tap('field');tap('cancel');check('Cancel keeps snapshot '+target+'/'+device,history(target),hist);tap('field');escape('chooser');check('Escape keeps snapshot '+target+'/'+device,history(target),hist);tap('undo');check('Undo restores absent scope '+target+'/'+device,[read('display-'+device+'-present',target),read('display-'+device+'-raw',target)],[false,'']);output(target,'Undo '+target+'/'+device);check('Display leaves other target '+target+'/'+device,ownedDocument(other),otherBefore);
 choose('None');tap('resetDisplay');const resetHist=history(target),resetDoc=ownedDocument(target);tap('resetDisplay');check('Repeated absent Reset keeps Undo '+target+'/'+device,history(target),resetHist);check('Repeated absent Reset leaves document '+target+'/'+device,ownedDocument(target),resetDoc);tap('undo');check('Reset Undo restores explicit None '+target+'/'+device,[read('display-'+device+'-present',target),read('display-'+device+'-raw',target)],[true,'None']);}
for(const target of R45_TARGETS){setup(target,'Mobile');put('display-Tablet-present',true,target);put('display-Tablet-raw','None',target);tap(target+'_entry');output(target,'Tablet inheritance '+target);const hist=history(target);choose('None');check('Inherited equal choice stays absent '+target,read('display-Mobile-present',target),false);check('Inherited equal choice preserves history '+target,history(target),hist);choose('Block');output(target,'Mobile override shows '+target);tap('resetDisplay');output(target,'Mobile Reset reveals hidden Tablet '+target);tap('undo');check('Undo restores explicit Mobile Block '+target,[read('display-Mobile-present',target),read('display-Mobile-raw',target)],[true,'Block']);output(target,'Undo pin '+target);}
category='flags_named_scope_and_combined_causes';
for(const target of R45_TARGETS)for(const preview of devices)for(const band of devices){setup(target,preview);const before=ownedDocument(target);tap('flag'+band);check('Flag writes named base property '+target+'/'+preview+'/'+band,[read('flag-'+band+'-present',target),read('flag-'+band+'-raw',target)],[true,'true']);for(const p of propertyKeys.filter(k=>k!=='flag-'+band))check('Flag does not write '+p,ownedDocument(target)[p],before[p]);output(target,'Named flag '+target+'/'+preview+'/'+band);tap('resetFlag'+band);output(target,'Reset flag '+target+'/'+preview+'/'+band);tap('undo');check('Flag Reset Undo raw presence '+target+'/'+preview+'/'+band,[read('flag-'+band+'-present',target),read('flag-'+band+'-raw',target)],[true,'true']);}
for(const target of R45_TARGETS)for(const preview of devices)for(const first of ['display','flag']){setup(target,preview);choose('None');tap('flag'+preview);output(target,'Combined hidden '+target+'/'+preview);tap(first==='display'?'resetDisplay':'resetFlag'+preview);check('One cause removed remains hidden '+target+'/'+preview+'/'+first,read('visible',target),false);output(target,'Remaining cause '+target+'/'+preview+'/'+first);tap(first==='display'?'resetFlag'+preview:'resetDisplay');check('Both causes removed shows '+target+'/'+preview+'/'+first,read('visible',target),true);}
category='raw_flag_recovery_and_device_navigation';
for(const target of R45_TARGETS)for(const device of devices)for(const raw of ['', 'false', 'TRUE']){setup(target,device);put('flag-'+device+'-present',true,target);put('flag-'+device+'-raw',raw,target);tap(target+'_entry');check('Only exact true hides '+target+'/'+device+'/'+raw,read('visible',target),true);tap('flag'+device);check('Nontrue raw toggles to hidden '+target+'/'+device+'/'+raw,read('visible',target),false);tap('undo');check('Flag Undo preserves imported raw presence '+target+'/'+device+'/'+raw,[read('flag-'+device+'-present',target),read('flag-'+device+'-raw',target)],[true,raw]);}
for(const target of R45_TARGETS)for(const device of devices){setup(target,device);tap('flag'+device);tap('resetFlag'+device);const hist=history(target),doc=ownedDocument(target);tap('resetFlag'+device);check('Repeat absent flag Reset preserves history '+target+'/'+device,history(target),hist);check('Repeat absent flag Reset no document write '+target+'/'+device,ownedDocument(target),doc);tap('undo');check('Repeat flag Reset retains useful restoration '+target+'/'+device,[read('flag-'+device+'-present',target),read('flag-'+device+'-raw',target)],[true,'true']);
 setup(target,device);choose('None');const beforeSwitch=history(target),otherDevice=device==='Desktop'?'Mobile':'Desktop';tap(target+'_'+otherDevice.toLowerCase());check('Device navigation preserves recovery '+target+'/'+device,history(target),beforeSwitch);tap('undo');check('Undo edits original scope after device switch '+target+'/'+device,[read('display-'+device+'-present',target),read('display-'+device+'-raw',target)],[false,'']);output(target,'Undo recomputes after device switch '+target+'/'+device);}
category='undo_property_ownership';
for(const target of R45_TARGETS)for(const device of devices)for(const kind of ['display','flag']){setup(target,device);const own=kind+'-'+device;if(kind==='display')choose('None');else tap('flag'+device);const hist=history(target);for(const p of propertyKeys.filter(k=>k!==own)){put(p+'-present',true,target);put(p+'-raw',p.startsWith('display')?'None':'true',target);put(p+'-revision',12,target);}const external=ownedDocument(target);tap('undo');check('Owned Undo restores only raw slot '+target+'/'+own,[read(own+'-present',target),read(own+'-raw',target)],[false,'']);for(const p of propertyKeys.filter(k=>k!==own))check('Owned Undo preserves intervening '+target+'/'+own+'/'+p,ownedDocument(target)[p],external[p]);check('Unrelated revisions allow useful recovery '+target+'/'+own,read('undo',target),false);output(target,'Owned Undo recomputes current device '+target+'/'+own);
 setup(target,device);if(kind==='display')choose('None');else tap('flag'+device);put(own+'-revision',99,target);const doc=ownedDocument(target),staleHistory=history(target);tap('undo');check('Owned revision refuses Undo '+target+'/'+own,ownedDocument(target),doc);check('Refusal preserves recovery '+target+'/'+own,history(target),staleHistory);check('Refusal explains '+target+'/'+own,destination,nodeIds.blocked);}
category='captured_scope_identity_and_eligibility';
for(const target of R45_TARGETS)for(const race of ['caller','device','generation','revision','locked','mixed','exists']){setup(target,'Mobile');choose('None');tap('field');if(race==='caller')put('caller',target==='heading'?'image':'heading');else if(race==='device')put('device','Tablet',target);else if(race==='revision')put('display-Mobile-revision',99,target);else put(race,race==='generation'?2:race==='exists'?false:true,target);const docs=R45_TARGETS.map(ownedDocument),hist=R45_TARGETS.map(history);tap('chooseBlock');check('Captured chooser race no write '+target+'/'+race,R45_TARGETS.map(ownedDocument),docs);check('Captured race preserves recovery '+target+'/'+race,R45_TARGETS.map(history),hist);check('Captured race refusal '+target+'/'+race,destination,nodeIds.blocked);escape('blocked');check('Refusal Escape returns shared Style '+target+'/'+race,destination,nodeIds.style);}
for(const target of R45_TARGETS)for(const blocked of ['locked','mixed','exists'])for(const operation of ['flagMobile','resetFlagMobile','resetDisplay','undo']){setup(target,'Mobile');choose('None');tap('flagMobile');put(blocked,blocked==='exists'?false:true,target);const doc=ownedDocument(target),hist=history(target);tap(operation);check('Guarded operation no write '+target+'/'+blocked+'/'+operation,ownedDocument(target),doc);check('Guarded operation keeps history '+target+'/'+blocked+'/'+operation,history(target),hist);check('Guarded operation refusal '+target+'/'+blocked+'/'+operation,destination,nodeIds.blocked);}
category='independent_targets_layers_and_returns';
setup('heading','Mobile');choose('None');const headingDoc=ownedDocument('heading'),headingHist=history('heading');tap('image_entry');put('device','Tablet','image');tap('image_entry');tap('flagTablet');const imageDoc=ownedDocument('image'),imageHist=history('image');tap('heading_layer');check('Heading Layers restores caller',read('caller'),'heading');check('Heading Layers keeps device',read('device','heading'),'Mobile');tap('undo');check('Heading Undo leaves Image document',ownedDocument('image'),imageDoc);check('Heading Undo leaves Image history',history('image'),imageHist);tap('image_layer');check('Image Layers restores caller',read('caller'),'image');check('Image Layers keeps device',read('device','image'),'Tablet');tap('undo');check('Image Undo restores own flag',read('flag-Tablet-present','image'),false);
for(const target of R45_TARGETS)for(const device of devices)for(const route of ['layer','layers','count']){setup(target,device);choose('None');const doc=ownedDocument(target),hist=history(target);tap('styleBack');tap(target+'_'+route);check('Hidden recovery exact target '+target+'/'+device+'/'+route,read('caller'),target);check('Hidden recovery retains device '+target+'/'+device+'/'+route,read('device',target),device);check('Hidden recovery opens Style '+target+'/'+device+'/'+route,destination,nodeIds.style);check('Hidden recovery leaves document '+target+'/'+device+'/'+route,ownedDocument(target),doc);check('Hidden recovery preserves Undo '+target+'/'+device+'/'+route,history(target),hist);output(target,'Hidden recovery '+target+'/'+device+'/'+route);}
for(const target of R45_TARGETS)for(const exit of ['styleClose','styleBack','styleEscape']){setup(target,'Mobile');choose('None');const doc=ownedDocument(target),hist=history(target);if(exit==='styleEscape')escape('style');else tap(exit);tap(target+'_entry');check('Close/reopen cannot revive old aliases '+target+'/'+exit,ownedDocument(target),doc);check('Close/reopen preserves recovery '+target+'/'+exit,history(target),hist);output(target,'Reopen '+target+'/'+exit);}
category='fixture_ownership_and_legacy_routes';
const legacyRoutes=['legacyHeadingA','legacyHeadingB','legacyImage'];
const allDocs=()=>R45_TARGETS.map(ownedDocument),allHistory=()=>R45_TARGETS.map(history);
const sharedLegacy=()=>['display','showDesktop','showTablet','showMobile'].map(k=>read(k));
function legacySetup(prior,route){setup(prior,'Tablet');choose('None');tap('flagTablet');const docs=allDocs(),hist=allHistory(),expectedShared=sharedLegacy(),sharedKeys=['display','showDesktop','showTablet','showMobile'];for(const action of actions[route])if(action.type==='SET_VARIABLE'){const index=sharedKeys.findIndex(k=>key(k)===action.variableId);if(index>=0)expectedShared[index]=evaluate(action.variableValue);}tap(route);return {docs,hist,shared:sharedLegacy(),expectedShared};}
for(const prior of R45_TARGETS)for(const route of legacyRoutes){const before=legacySetup(prior,route),tag=prior+'/'+route;
 check('Legacy entry preserves its own direct shared assignments '+tag,sharedLegacy(),before.expectedShared);
 check('Legacy route clears fixture owner '+tag,read('fixture-owner'),false);
 check('Legacy route disables finite behavior '+tag,read('active'),false);
 check('Legacy extra families stay available after finite Tablet '+tag,read('extras'),true);
 check('Legacy entry preserves finite documents '+tag,allDocs(),before.docs);
 check('Legacy entry preserves finite Undo '+tag,allHistory(),before.hist);
 tap('field');check('Legacy field captures nonfixture owner '+tag,read('chooser-fixture-owner'),false);
 check('Legacy field does not acquire owner '+tag,read('fixture-owner'),false);
 check('Legacy field preserves shared legacy values '+tag,sharedLegacy(),before.shared);
 check('Legacy field opens existing chooser '+tag,destination,nodeIds.chooser);
 tap('cancel');check('Legacy cancel preserves owner '+tag,read('fixture-owner'),false);
 check('Legacy cancel preserves shared legacy values '+tag,sharedLegacy(),before.shared);
 check('Legacy cancel closes own chooser '+tag,destination,'CLOSED');
 check('Legacy field/cancel preserve finite documents '+tag,allDocs(),before.docs);
 check('Legacy field/cancel preserve finite Undo '+tag,allHistory(),before.hist);
 tap('field');escape('chooser');check('Legacy chooser Escape preserves shared values '+tag,sharedLegacy(),before.shared);
 check('Legacy chooser Escape preserves finite documents '+tag,allDocs(),before.docs);
}
for(const prior of R45_TARGETS)for(const route of legacyRoutes)for(const value of ['Block','Flex','Grid','None']){const before=legacySetup(prior,route),tag=prior+'/'+route+'/'+value;tap('field');tap('choose'+value);
 check('Legacy chooser retains own Display behavior '+tag,read('display'),value);
 check('Legacy chooser does not overwrite shared legacy flags '+tag,sharedLegacy().slice(1),before.shared.slice(1));
 check('Legacy chooser keeps finite ownership false '+tag,[read('fixture-owner'),read('active')],[false,false]);
 check('Legacy chooser preserves finite documents '+tag,allDocs(),before.docs);
 check('Legacy chooser preserves finite Undo '+tag,allHistory(),before.hist);
}
for(const route of legacyRoutes)for(const band of devices){const before=legacySetup('heading',route),tag=route+'/'+band,property='show'+band,old=read(property);tap('flag'+band);
 check('Legacy checkbox retains its own toggle '+tag,read(property),old==='Yes'?'No':'Yes');
 check('Legacy checkbox preserves finite documents '+tag,allDocs(),before.docs);
 check('Legacy checkbox preserves finite Undo '+tag,allHistory(),before.hist);
 check('Legacy checkbox cannot acquire fixture owner '+tag,read('fixture-owner'),false);
}
for(const [target,route]of [['heading','headingAlternate'],['image','imageAlternate']])for(const device of devices){setup(target,device);choose('None');tap('flag'+device);const doc=ownedDocument(target),hist=history(target);tap('legacyHeadingA');tap(route);const tag=target+'/'+device;
 check('Alternate finite entry explicitly owns fixture '+tag,read('fixture-owner'),true);
 check('Alternate finite entry correct caller '+tag,read('caller'),target);
 check('Alternate finite entry activates controls '+tag,read('active'),true);
 check('Alternate finite entry synchronizes shared values '+tag,[read('display'),read('show'+device)],['None','No']);
 check('Alternate finite entry leaves document '+tag,ownedDocument(target),doc);
 check('Alternate finite entry leaves Undo '+tag,history(target),hist);
 output(target,'Alternate finite entry full sync '+tag);
}
for(const target of R45_TARGETS)for(const value of ['Block','Flex','Grid','None']){setup(target,'Mobile');choose('None');tap('field');check('Finite chooser captured ownership '+target+'/'+value,read('chooser-fixture-owner'),true);put('fixture-owner',false);const docs=allDocs(),hist=allHistory(),shared=sharedLegacy();tap('choose'+value);
 check('Lost chooser ownership refuses '+target+'/'+value,destination,nodeIds.blocked);
 check('Lost chooser ownership cannot apply legacy fallback '+target+'/'+value,sharedLegacy(),shared);
 check('Lost chooser ownership preserves both documents '+target+'/'+value,allDocs(),docs);
 check('Lost chooser ownership preserves both Undo records '+target+'/'+value,allHistory(),hist);
}
category='other_family_fallback';
for(const prior of R45_TARGETS)for(const route of ['otherParagraph','otherFlex','otherGrid'])for(const value of ['Block','Flex','Grid','None']){setup(prior,'Tablet');choose('None');const docs=allDocs(),hist=allHistory();tap(route);const tag=prior+'/'+route+'/'+value;check('Other family finite controls inactive '+tag,read('active'),false);tap('field');tap('choose'+value);check('Other family Display fallback works '+tag,read('display'),value);check('Other family keeps finite documents '+tag,allDocs(),docs);check('Other family keeps finite Undo '+tag,allHistory(),hist);const flag=read('showMobile');tap('flagMobile');check('Other family flag fallback works '+tag,read('showMobile'),flag==='Yes'?'No':'Yes');}
category='bindings_and_existing_workflow_isolation';
for(const target of R45_TARGETS){check('Specimen visibility bound to target '+target,live[target+'_selected'].boundVariables?.visible?.id,key('visible',target));setup(target);const protectedIds=nativeVariables.filter(v=>v.name.startsWith('r38/')||v.name.startsWith('r36/image/')||v.name.startsWith('r44/')).map(v=>v.id);const before=protectedIds.map(id=>resolve(id));choose('None');tap('flagMobile');tap('undo');tap('resetDisplay');tap('undo');check('R45 actions preserve existing family state '+target,protectedIds.map(id=>resolve(id)),before);choose('Block');choose('None');for(const id of protectedIds){const value=resolve(id);if(typeof value==='boolean')state.set(id,!value);else if(typeof value==='number')state.set(id,value+17);else if(typeof value==='string')state.set(id,value+' / newer external edit');}const intervening=protectedIds.map(id=>resolve(id));tap('undo');check('R45 Undo preserves newer external family edits '+target,protectedIds.map(id=>resolve(id)),intervening);}
for(const target of R45_TARGETS)for(const value of ['Block','None','Flex','Grid']){setup(target);choose(value);check('Display reachable after '+target+'/'+value,read('display-eligible'),true);check('Chosen existing Display mode retained '+target+'/'+value,read('effective',target),value);}
return {scope:'Read-only interpreter of live authored R45 actions against an independent finite oracle. Local Map writes only; no native mutations. Not browser reflow, runtime CSS/export, accessibility or full module acceptance.',phase:'LIVE_ACTION_INTERPRETATION',correctionProbe,sourceManifest:['r45-visibility-mutation.json','r45-visibility-owner-correction.js'],oracleSelfChecks:{cases:oracleCases.length,passed:oracleCases.length-oracleFailures.length,failed:oracleFailures},matrixCases:oracleCases.length,checks:assertions.length,passed:assertions.filter(c=>c.pass).length,failed:assertions.filter(c=>!c.pass),categories,inspectedNodeIds:[...inspected],mutatedNodeIds:[],mutatedVariableIds:[]};
