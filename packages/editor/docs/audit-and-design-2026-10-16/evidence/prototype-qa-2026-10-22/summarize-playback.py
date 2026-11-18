"""Intersect actual player observations with the current native graph.

Fixture loads, stale routes and self-navigation cannot satisfy a click route.
This reports navigation coverage, not visual or application acceptance.
"""
import json
from pathlib import Path

P = Path(__file__).resolve().parent
report = {}
for suite in ['editor', 'class', 'cms', 'journeys']:
    graph = json.loads((P / (suite + '-controls.json')).read_text())
    roots = set(json.loads((P / (suite + '-reachability.json')).read_text())['reachableRoots'])
    expected = {
        (f['id'], c['id'], a['to'])
        for f in graph['frames'] if f['id'] in roots
        for c in f['controls'] if c['visible'] and c['trigger'] == 'ON_CLICK'
        for a in c['actions'] if a['type'] == 'NODE' and a['to'] in roots
    }
    logs = json.loads((P / (suite + '-playback.json')).read_text())
    attempts = [e for e in logs if 'control' in e]
    observed = {(e['origin'], e['control'], e['to']) for e in attempts
                if e.get('pass') and e.get('actual') == e['to'] and e['origin'] != e['to']}
    passed = expected & observed
    failures = [e for e in attempts if not e.get('pass')]
    report[suite] = {
        'reachableRoots': len(roots), 'expectedClickRoutes': len(expected),
        'uniquePassed': len(passed), 'recordedAttempts': len(attempts),
        'historicalFailedAttempts': len(failures),
        'unresolvedFailedRoutes': sorted({(e['origin'], e['control'], e['to'])
                                         for e in failures} & (expected - passed)),
        'remaining': sorted(expected - passed),
        'invalidReachableDestinations': [
            [f['id'], c['id'], a['to']]
            for f in graph['frames'] if f['id'] in roots
            for c in f['controls'] for a in c['actions']
            if a['type'] == 'NODE' and a['to'] not in roots],
    }
    if suite == 'journeys':
        for family in ['second-open', 'second-resolved']:
            plan = json.loads((P.parent / 'article-skill-workflow-2026-10-21' /
                               ('approval-plan-' + family + '.json')).read_text())
            planned = {(e['from'], e['control'], e['to']) for e in plan if 'control' in e}
            report[family] = {'expected': len(planned), 'passed': len(planned & passed),
                              'remaining': sorted(planned - passed)}
(P / 'playback-summary.json').write_text(json.dumps(report, indent=2) + '\n')
for name, result in report.items():
    print(name, {k: (len(v) if k == 'remaining' else v) for k, v in result.items()})
