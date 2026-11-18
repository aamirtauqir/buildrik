"""Reconcile final native evidence without treating native links as playback."""
import collections
import glob
import json
from pathlib import Path

HERE = Path(__file__).parent

def read(name):
    return json.loads((HERE / name).read_text())

def tool_data(name):
    value = read(name)
    if 'content' in value:
        return json.loads(next(c['text'] for c in value['content'] if c['type'] == 'text'))
    return value

frames = []
for p in sorted(HERE.glob('phase6-final-account-*.json')):
    frames.extend(json.loads(p.read_text())['records'])
assert len(frames) == len({f['id'] for f in frames}) == 116
by_frame = {f['id']: f for f in frames}
old = read('phase6-reconciled-action-audit.json')
old_by_id = {a['controlNodeId']: a for a in old['actions']}
edges = sum((read(f'phase6-final-graph-{i}.json')['edges'] for i in (0, 220, 440)), [])
by_source = collections.defaultdict(list)
for edge in edges:
    by_source[edge[0]].append(edge)
assert len(by_source) == 607
native = read('phase6-final-native-validation.json')
assert native['missingDestinations'] == []
assert native['distinctStartNames'] == len(native['starts']) == 37

reasons = {
    'covered': 'Behind the active modal or context menu. Reactions are removed; the foreground owner controls dismissal and return.',
    'wired': 'The native reaction defines this finite action. See destination and trigger; a native edge alone is not browser verification.',
    'inherited-action': 'Child visual belonging to an ancestor action; it is not a separate command.',
    'label-or-readonly-text': 'Text label or fixed fixture value. This layer does not independently execute an action.',
    'site-content': 'Website-content fixture inside the editor/visual preview, not an editor command. Visitor scripts and delivery are not executed.',
    'structural-display': 'Selection outline, section heading or table structure, not an independent command.',
    'readonly-field': 'Fixed field/search specimen. Arbitrary text entry, validation and document writes are not simulated in this scene; the displayed value is retained.',
    'action-container': 'Container holding separately accounted child actions, not an additional command.',
    'disabled-state': 'Uses the shared disabled button variant. The state-specific label/nearby explanation and scope note define why it cannot execute.',
    'finite-scene-limit': 'Explicitly unavailable in this finite scene and visually muted. The named action has no matching state/caller fixture here; use the named representative start for its supported journey. This is a prototype restriction, not product permission enforcement.',
    'geometry-specimen': 'Static resize handle. Continuous pointer geometry, transactions, snapping and live Undo require the editor engine; no resize operation is executed.',
    'menu-command-limit': 'Static, muted Arrange command. Runtime sibling order/eligibility and mutation are defined in PHASE6-CONTROL-CONTRACTS.md; this demo validates menu ownership, collision and cancellation only.',
    'design-specimen': 'Static component/state specification board, not an application journey or live command.',
    'frame-keyboard': 'Screen-level native keyboard reaction; browser evidence is credited only when the specific Escape path was traversed.',
    'frame-no-keyboard': 'Screen root with no generic keyboard handler. Only explicitly linked temporary tasks support Escape in this finite prototype.',
    'scope-link': 'Opens the visible, domain-specific prototype restriction note without a product-side mutation.',
    'scope-return': 'Returns from the scope note using Figma BACK, or Escape. Restores the exact source fixture, including its retained panel/draft/sample state.',
    'hidden-retained': 'Inside an invisible collapsed panel. The inherited reaction exists but cannot be reached in this screen; it is not counted as visible interaction coverage.',
}
records = {}
for frame in frames:
    for row in frame['controls']:
        node, label, kind, parent, state, reactions = row
        if node in by_source:
            state = 'wired'
        records[node] = {
            'controlNodeId': node, 'controlLabel': label, 'nodeType': kind,
            'sourceFrameId': frame['id'], 'sourceFrameName': frame['name'],
            'parentId': parent, 'classification': state,
            'reason': f'{label}: {reasons[state]}',
            'scopeCategory': frame['category'], 'visibleScopeNodeId': frame['scope']['body'],
            'scopeEntryNodeId': frame['scopeButton'], 'externalEffectExecuted': False,
            'nativeEdges': by_source.get(node, []),
            'verification': {'level': 'native_readback', 'result': 'accounted', 'evidence': ['phase6-final-account-*.json', 'phase6-final-graph-*.json']},
        }
    node = frame['scopeButton']
    records[node] = {'controlNodeId': node, 'controlLabel': 'Prototype scope', 'sourceFrameId': frame['id'], 'classification': 'scope-link', 'reason': reasons['scope-link'], 'nativeEdges': by_source[node], 'visibleScopeNodeId': frame['scope']['body'], 'externalEffectExecuted': False}

extras = read('phase6-closure-graph-meta.json')['extra']
for node, label, root in extras:
    if node in records:
        continue
    state = 'geometry-specimen' if label == 'Resize handle' else 'menu-command-limit'
    if root not in by_frame:
        state = 'design-specimen'
    elif label == 'project-image ⌄':
        state = 'readonly-field'
    records[node] = {'controlNodeId': node, 'controlLabel': label, 'sourceFrameId': root, 'classification': state, 'reason': reasons[state], 'externalEffectExecuted': False, 'nativeEdges': by_source.get(node, []), 'visibleScopeNodeId': by_frame.get(root, {}).get('scope', {}).get('body')}

retired = list(old['retiredActions'])
for p in HERE.glob('phase6-legacy-closure-*.json'):
    for row in json.loads(p.read_text()):
        node = row[0]
        if row[1] == 'removed':
            retired.append({'controlNodeId': node, 'reason': 'Not present at final native readback; identity retired, capability not counted as complete.', 'originalRecord': old_by_id.get(node), 'evidence': p.name})
            continue
        if node in records:
            continue
        _, label, kind, root, visible, reactions, parent = row
        state = 'frame-keyboard' if node in by_source else 'frame-no-keyboard' if node == root else 'design-specimen' if root not in by_frame else 'structural-display'
        records[node] = {'controlNodeId': node, 'controlLabel': label, 'sourceFrameId': root, 'parentId': parent, 'classification': state, 'reason': reasons[state], 'externalEffectExecuted': False, 'nativeEdges': by_source.get(node, [])}

scopes = tool_data('phase6-scope-views.json')['scopes']
for category, scope in scopes.items():
    for node in (scope['frame'], scope['return']):
        records[node] = {'controlNodeId': node, 'controlLabel': f'{category} scope return', 'sourceFrameId': scope['frame'], 'classification': 'scope-return', 'reason': reasons['scope-return'], 'nativeEdges': by_source[node], 'externalEffectExecuted': False}

for hidden in read('phase6-hidden-graph-sources.json'):
    assert hidden['hiddenAncestors']
    node = hidden['id']
    records[node] = {'controlNodeId': node, 'controlLabel': hidden['name'], 'sourceFrameId': hidden['frame'], 'classification': 'hidden-retained', 'reason': reasons['hidden-retained'], 'hiddenAncestors': hidden['hiddenAncestors'], 'nativeEdges': by_source[node], 'externalEffectExecuted': False}

# Any newer root or route must be retained, rather than silently omitted.
for node, node_edges in by_source.items():
    if node not in records:
        assert node in by_frame, f'Unaccounted live reaction source {node}'
        records[node] = {'controlNodeId': node, 'controlLabel': by_frame[node]['name'], 'sourceFrameId': node, 'classification': 'frame-keyboard', 'reason': reasons['frame-keyboard'], 'nativeEdges': node_edges, 'externalEffectExecuted': False}

for node, record in records.items():
    previous = old_by_id.get(node)
    if previous:
        record['originalAuditRecord'] = previous
        verification = previous.get('verification', {})
        if verification.get('level') == 'presentation_traversed' and node in by_source:
            record['priorPlayback'] = verification

scope_sources = {
    'Editor scope disclosure': by_frame['8317:297']['scopeButton'],
    'Collapsed panels scope disclosure': by_frame['8377:1674']['scopeButton'],
    'Applied Brand scope disclosure': by_frame['8387:1701']['scopeButton'],
}
new_steps = []
for filename in ('phase6-closure-playback.json', 'phase6-closure-final-playback.json', 'phase6-closure-boundary-playback.json'):
    for step in read(filename)['steps']:
        assert step['pass'], step
        node = step.get('sourceNodeId') or scope_sources.get(step['label'])
        assert node in records, (filename, step)
        evidence = dict(step, evidence=filename, controlNodeId=node)
        records[node].setdefault('closurePlayback', []).append(evidence)
        new_steps.append(evidence)
assert len(new_steps) == 43
assert set(old_by_id) <= set(records) | {r.get('controlNodeId') for r in retired}

output = {
    'schemaVersion': 2, 'date': '2026-10-12', 'fileKey': 'g4GzQFqzNYz5sosz1QtZXC',
    'scope': 'Bounded, representative Figma design prototype. Explicitly limited controls are NOT counted as functional or browser-passed. Application/engine/service implementation remains outside Phase 6.',
    'sourceFrames': [{k: f[k] for k in ('id', 'name', 'category', 'scope', 'scopeButton')} for f in frames],
    'classificationDefinitions': reasons,
    'counts': {'records': len(records), 'classifications': dict(collections.Counter(r['classification'] for r in records.values())), 'nativeReactionSources': len(by_source), 'newPlaybackChecks': len(new_steps), 'historicalRecordsPreserved': len(old_by_id)},
    'nativeValidation': native, 'actions': list(records.values()), 'retiredActions': retired,
    'closurePlayback': new_steps,
}
(HERE / 'phase6-final-control-ledger.json').write_text(json.dumps(output, indent=2) + '\n')
print(json.dumps(output['counts'], indent=2))
