import json
from pathlib import Path
p=Path(__file__).parent
s=p.parent/'inspector-2026-10-16'
def unwrap(name):
    raw=json.loads((p/name).read_text())
    return json.loads(next(x['text'] for x in raw['content'] if x['type']=='text'))
initial=unwrap('b4-20261020-initial.json')['nodes']
compound=unwrap('b4-20261020-compound-ledger.json')
controls=unwrap('b4-20261020-controls-ledger.json')
atlas=unwrap('b4-20261020-atlas-ledger.json')
frames=initial+compound['frames']+controls['frames']+unwrap('b4-20261020-corrections.json')['frames']+unwrap('b4-20261020-finalFixes.json')['frames']+unwrap('b4-20261020-indexed-ledger.json')['frames']+unwrap('b4-20261020-closure-ledger.json')['frames']
bycode={}
for f in frames:
    if f['name'].startswith('B4-'):
        bycode[f['name'].split(' · ')[0][3:]]=f['id']
groups={
 'I01':['1','2','13','15','16','17','18','19','21','22','23','25','26','27','28','32','33','36','39','40','48a','50','51','52'],
 'F20':['12','92'], 'I02':['34','42','90','91'], 'B01':['43','45','46','47'],
 'B04':['44','30'], 'IC01':['41','48k','49'], 'A01':['48g','66','69','73'],
 'A02':['67','70'], 'A03':['71','72','79'], 'A04':['78','80','82','83'],
 'A05':['74','75'], 'R01':['76'], 'I08':['77','81'], 'A06':['84','85','86'],
 'A07':['87'], 'B05':['88','89'], 'A09':['93','95','97'], 'A08':['94','96'],
 'I12':['101'], 'I15':['102'], 'A10':['103'], 'A11':['104','105','106'],
 'F01':['48j','107'], 'F02':['48c','54','55'], 'F10':['108'],
 'B02':['48f','64'], 'C01':['48h'], 'C14':['48i'],
}
mapping={}
for code,ids in groups.items():
    for id in ids:mapping['M07-'+id]=[bycode[code]]
mapping.update({
 'M07-3':['36:601'],'M07-4':['36:601'],'M07-5':['36:601'],
 'M07-11':[next(r['id'] for r in atlas['blockPanels'] if r['record']=='B69-theme-toggle')],
 'M07-38':['39:9114'],'M07-48d':['36:307'],'M07-48e':[next(r['id'] for r in atlas['blockPanels'] if r['record']=='B69-spacer')],
 'M07-48b':[next(r['id'] for r in atlas['blockPanels'] if r['record']=='B69-button')],
 'M07-53':[next(r['id'] for r in atlas['blockPanels'] if r['record']=='B69-button')],
 'M07-104':[bycode['I02']],
})
block_rows={'56':'image','57':'video','58':'audio','59':'svg','60':'icon','61':'video-embed','62':'map-embed','63':'countdown','65':'accordion','68':'product-card','98':'link','109':'slider','110':'slider','111':'collection-list'}
for key,block in block_rows.items():mapping['M07-'+key]=[next(r['id'] for r in atlas['blockPanels'] if r['record']=='B69-'+block)]
# Current-contract evidence replaces broad generic-I01 attribution.
overrides={
 '1':['I01','I02','I12','I09'],'3':['S06'],'5':['S06'],'6':['S01','S02'],'7':['S07'],'8':['S03','S04'],
 '12':['S22','F20'],'13':['S04','S32'],'14':['S05'],'15':['S32'],'16':['B01'],
 '19':['A03','A05','S18'],'20':['S17','S18'],'21':['S30'],'22':['S31'],'23':['S28','S29'],
 '28':['IC01','S25','S22'],'29':['S08','S09','S10','S20'],'30':['S11','S12','S19'],
 '32':['S13','S15','S25'],'34':['S13','S14'],'35':['S13','S14'],'37':['S15','S16'],
 '39':['S15','IC05'],'42':['I02','I08','S16'],'43':['B01'],'44':['B04'],'45':['B01','B02'],
 '47':['B01','B02','B04'],'48a':['I01','A12','A13'],'48d':['S33','S34','S35'],
 '48h':['C01','C02','C03','C04','C07','C09','C10','C17','C18','C13','C14','C15','C16'],
 '48i':['C14'],'48j':['F01'],'49':['IC01','IC02','IC03','IC04','IC05','IC06'],
 '51':['I01'],'52':['I01','A05'],'59':['S34','S35'],'61':['S33'],'64':['B02','B03','B06'],
 '76':['R01','R02','R04','R05','R06','R07','R08','R09'],
 '88':['I03','B05'],'89':['B05'],'90':['I02','I03','I06','I07','I08'],'91':['I03','I04','I05'],
 '92':['F20','S22','R06'],'99':['D01','D02','D03','D11','S23','S24','S25','S26','S27','S36'],
 '100':['D04','D05','D06','D07','D08','D09','D10'],'103':['A10'],
 '105':['A11','F02','C14'],'106':['A11'],'107':['F01','F02','F05','F06','F22','F23','F24','F29','F30','F34','F35']}
for row,codes in overrides.items():mapping['M07-'+row]=[bycode[c] for c in codes]
superseded={
 '2':('Grouped Content/Style/Behavior/Effects tabs replace flat list',['I01','I02']),
 '4':('Page appearance replaces old Select something prompt; AI removed by SC21',['S06']),
 '10':('Global owners replace Whole-site takeover; owned outside B4',[]),
 '17':('Meaningful eligibility reasons replace section-count footer',['B01','B04']),
 '18':('Full Pro controls plus disclosure/search replace density=fewer',['A03','S17']),
 '25':('Canvas selection replaces crosshair; no second picking mode',['I01']),
 '26':('Ancestor breadcrumb replaces parent button',['S31']),
 '27':('Property-row binding and Binding subview replace retired header popover',['S25','S26']),
 '31':('Shared reversible deletion with Undo replaces Inspector-only confirmation',['S09']),
 '33':('Explicit Apply style categories replace scope switch',['S11','S12','S19']),
 '36':('Canvas breakpoint control replaces Inspector picker',['S15','IC05']),
 '40':('Persistent active state replaces separate hover banner',['S13']),
 '41':('Component identity actions replace Detach context pill',['IC01','IC06']),
 '46':('Shared eligible Style controls replace five-row batch panel',['B01']),
 '50':('Property-owned sections replace mixed TypeBlock frame',['I01','A01','I12']),
 '73':('Merged Layout/Border replace standalone Flexbox/Grid/radius',['A01','A02','A07']),
 '83':('Box and row/column Gap replace paired spacing rows',['A04']),
 '112':('All CSS editor retired; preserved raw/custom values stay in property owners',['I08','A08','A09'])}
deferred={'9':'SC21: AI takeover absent this release','24':'SC21: AI entry absent this release','104':'SC23/P6: class selector deferred; stored class membership preserved','68':'P1: commerce engine deferred; existing text/media/attributes preserved with neutral note'}
original=json.loads((s/'inspector-preservation-map.json').read_text())
rows=[]
for row in original['rows']:
    key=row['id'][4:];ids=mapping.get(row['id'],[])
    disposition='Current control semantics drawn';decision='Current owner retained; source controls remain acceptance requirements'
    if key in superseded:
        decision,codes=superseded[key];ids=[bycode[c] for c in codes];disposition='Superseded historical UI'
    elif key in deferred:
        decision=deferred[key];disposition='Explicitly deferred by current contract'
        if key!='68':ids=[]
    elif key=='99':decision='BD20: property-row binding, read-only Content summary and exact Binding subview'
    elif key=='100':decision='Current delta: Content Conditions editor; legacy rule remains inactive until explicit activation'
    elif key=='105':decision='Native attributes retained by type; form transport controls withdrawn because no writer exists'
    if key=='16':disposition='Nonvisual implementation contract';decision='Polite selection announcement requires runtime accessibility implementation; group identity/count visible in B01'
    rows.append({'id':row['id'],'feature':row['feature'],'source_register':'inspector-preservation-map.json',
      'source_disposition':row['primary_disposition'],'current_disposition':disposition,'current_decision':decision,
      'canonical_home':row['new_home'],'indexed_controls':row['controls_and_values'],'figma_node_ids':ids,
      'evidence_scope':'Named visible control/state specimens. Dropdown enums and implementation-only behavior are acceptance requirements, not independently simulated by every linked frame.' if ids else decision,
      'runtime':'NOT RUN','prototype':'Authored selected reactions; playback NOT RUN'})
counts={d:sum(r['current_disposition']==d for r in rows) for d in sorted(set(r['current_disposition'] for r in rows))}
out={'date':'2026-10-20','fileKey':'2L9OTGzBrL6kYmU18yA1c7','page':'3:5',
 'authority':['PRODUCT-DESIGN-BRIEF.md','panels/06-INSPECTOR-DELTA.md','panels/00-SHARED-CONTRACTS.md'],
 'counts':{'m07_rows':len(rows),'dispositions':counts,'blocks':69,'native_tags':120,'native_families':12,'added_workspace_states':93,'added_reference_boards':16},
 'm07':rows,'blocks':atlas['blockPanels'],'native_routes':atlas['nativeRoutes'],
 'remaining_acceptance':['Runtime save/reopen, keyboard/focus/announcements, live-write coalescing, permission revalidation and rendered output parity unrun.',
 '69 blocks have distinct source-derived control references; every dropdown enum, native tag and interactive mutation sequence is not independently prototyped.',
 'Binding loading/empty/no-match/type-mismatch/save-failure variants are owned in the CMS design; B4 draws exact-origin success, source deletion, unbind and current Conditions. No end-to-end playback claimed.',
 'Inspector menu Copy/Paste style, Save as component and Add interaction are visible entries; current S08 frame does not simulate each outcome. Existing interaction owner I14–I24 is separately drawn.',
 'Page header global actions, full font resource CRUD and cross-owner context restoration need integrated owner/runtime validation.'],
 'limits':['Current dispositions replace stale source classifications for AI, Classes, Commerce, Conditions and form transport.',
 '122-row classification is not a claim of 122 independently interactive workflows.','No application code changed.']}
(p/'b4-20261020-source-mapping.json').write_text(json.dumps(out,indent=2))
lines=['# B4 current-contract mapping · 2026-10-20','',
 'All 122 historical rows have an explicit current disposition. Links identify concrete design evidence; deferred and superseded UI is not counted as missing work. Runtime and full prototype playback remain unrun.','',
 'Added: 93 workspace states and 16 reference boards. Registers: 69 block references and 120 native routes in 12 semantic families.','',
 '| Row | Feature | Current disposition and decision | Evidence |','|---|---|---|---|']
for r in rows:
 links=', '.join(f"[{id}](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id={id.replace(':','-')})" for id in r['figma_node_ids']) or 'No new control: '+r['current_decision']
 lines.append(f"| {r['id']} | {r['feature'].replace('|','/')} | {r['current_disposition']}: {r['current_decision']} | {links} |")
lines+=['','## Remaining acceptance','']+['- '+x for x in out['remaining_acceptance']]
(p/'b4-20261020-source-mapping.md').write_text('\n'.join(lines))
print(json.dumps(out['counts']))
