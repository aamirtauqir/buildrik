// R45 read-only QA harness — phase 1, independent oracle only.
// No Figma APIs or native writes. Live manifest/action interpretation is pending.
// Run in an async function body (the same top-level-return format as use_figma).
// Case matrix: 2 targets x 3 preview devices x 8 named-flag combinations
//              x 27 absent/Block/None Display states across base/Tablet/Mobile.
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
return {
  phase: 'ORACLE_ONLY_LIVE_ACTIONS_PENDING',
  scope: 'Independent finite visibility oracle self-checks, not authored Figma action, browser or runtime acceptance.',
  oracle: {
    matrix: '2 targets x 3 preview devices x 8 named flag combinations x 27 scoped Display presence/value states',
    cases: oracleCases.length,
    passed: oracleCases.length - oracleFailures.length,
    failed: oracleFailures,
    targetNames: R45_TARGETS,
    devices: R45_DEVICES,
    displayStates: R45_DISPLAY_STATES,
    note: 'Block default is fixture-specific. Exact raw true hides only its named device. Display follows base > Tablet > Mobile cascade; all 1296 inputs are checked for nonmutation.',
  },
  liveActionChecks: 0,
  liveActionStatus: 'NOT_RUN_NO_MANIFEST',
  mutatedNodeIds: [], mutatedVariableIds: [],
};
