/**
 * Prove the census method offline, against a fixture that reproduces every
 * error it has actually made.
 *
 * Why this exists: the component census has been wrong twice, both times in a
 * way that looked like a finding. It reported 204 zero-use components where 49
 * were real (it counted COMPONENT_SETs and their state variants), and 12 name
 * collisions where 0 were real (it compared variant property strings such as
 * "State=rest" as component names). Both fixes are in audit-components.mjs and
 * both were, until now, unverifiable without a Figma call — so the only way to
 * find out whether the fix worked was to spend quota and read the number, which
 * is exactly how a wrong census gets believed twice.
 *
 * This runs the REAL sandbox source. It slices the template literal out of
 * audit-components.mjs and executes it against a stub `figma`, so the thing
 * under test is the shipped code and not a paraphrase of it. Editing the
 * census and forgetting this file will fail here, not in Figma.
 *
 * The fixture is built to trip each recorded error:
 *   - two fully-used COMPONENT_SETs whose variants carry every instance. The
 *     naive count calls all three sets AND their unplaced state variants
 *     zero-use; the correct one calls none of them zero-use.
 *   - two sets that both own a variant literally named "State=rest". The naive
 *     compare reports them as colliding components; they are unrelated.
 *   - "Icon / bell" against "icon/bell" — a real duplicate that EXACT equality
 *     cannot see, which is why the normalised pass exists.
 *   - "Icon / plus" against "icon/plus-16" — a real duplicate that even the
 *     normalised pass cannot see, reported as a CANDIDATE by the leaf pass.
 *   - a hand-drawn "rail" frame repeated three times, plus a fourth identical
 *     "rail" frame living INSIDE an instance. The shapes pass must count 3: a
 *     component's own internals are not a hand-drawn copy of it, and counting
 *     them turns every adopted component into evidence against itself.
 *
 * Usage: node scripts/figma/audit-components.selftest.mjs [pathToCensusScript]
 */
import { readFileSync } from "node:fs";

/* Path is an argument so the harness itself can be proved: run it against a
   deliberately-broken copy and it must FAIL. A test that has never been seen to
   fail is a claim, not a check. */
const SRC = process.argv[2] || "scripts/figma/audit-components.mjs";
const BT = String.fromCharCode(96);
const src = readFileSync(SRC, "utf8");
const open = src.indexOf("const code = " + BT);
if (open < 0) throw new Error("could not find the sandbox literal in " + SRC);
const body = src.slice(open + ("const code = " + BT).length);
const lit = body.slice(0, body.indexOf("\n" + BT + ";"));

/* Bind the same interpolations the real script binds, so the executed text is
   byte-for-byte what Figma would receive. */
const render = (PAGE, MIN, SHAPES) =>
  new Function("PAGE", "MIN", "SHAPES", "return " + BT + lit + BT)(PAGE, MIN, SHAPES);

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = async (figma, PAGE, MIN, SHAPES) =>
  new AsyncFunction("figma", render(PAGE, MIN, SHAPES))(figma);

/* ---------- fixture ---------- */
const nodes = new Map();
const N = (o) => {
  const n = { children: [], width: 100, height: 30, x: 0, y: 0, ...o };
  n.findAll = (pred = () => true) => {
    const acc = [];
    (function walk(p) { for (const c of p.children || []) { if (pred(c)) acc.push(c); walk(c); } })(n);
    return acc;
  };
  nodes.set(n.id, n);
  for (const c of n.children) c.parent = n;
  return n;
};
const variant = (id, name, w, h) => N({ id, name, type: "COMPONENT", width: w, height: h });
const set = (id, name, kids) => { const s = N({ id, name, type: "COMPONENT_SET", children: kids, width: kids[0].width, height: kids[0].height }); for (const k of kids) k.parent = s; return s; };
const inst = (id, main) => N({ id, name: "i", type: "INSTANCE", getMainComponentAsync: async () => main });

const navItem = set("A", "Nav item", [variant("A1", "State=rest", 240, 32), variant("A2", "State=hover", 240, 32), variant("A3", "State=active", 240, 32)]);
const settingsNav = set("B", "Settings nav row", [variant("B1", "Active=Off", 140, 30), variant("B2", "Active=On", 140, 30)]);
const orphanSet = set("C", "Zero set", [variant("C1", "State=rest", 200, 20), variant("C2", "State=hover", 200, 20)]);
const iconBellUpper = N({ id: "D", name: "Icon / bell", type: "COMPONENT", width: 16, height: 16 });
const iconBellLower = N({ id: "E", name: "icon/bell", type: "COMPONENT", width: 16, height: 16 });
const iconPlusUpper = N({ id: "F", name: "Icon / plus", type: "COMPONENT", width: 16, height: 16 });
const iconPlus16 = N({ id: "G", name: "icon/plus-16", type: "COMPONENT", width: 16, height: 16 });
const masters = [navItem, settingsNav, orphanSet, iconBellUpper, iconBellLower, iconPlusUpper, iconPlus16];

const railCopy = (id) => N({ id, name: "rail", type: "FRAME", width: 60, height: 812 });
const railInstance = N({ id: "RI", name: "rail", type: "INSTANCE", getMainComponentAsync: async () => navItem,
  children: [N({ id: "RI-in", name: "rail", type: "FRAME", width: 60, height: 812 })] });
const board = N({ id: "BD1", name: "Board", type: "FRAME", width: 1440, height: 900,
  children: [railCopy("R1"), railCopy("R2"), railCopy("R3"), railInstance] });
const instances = [inst("i1", navItem.children[0]), inst("i2", navItem.children[0]), inst("i3", navItem.children[1]),
  inst("i4", settingsNav.children[0]), inst("i5", settingsNav.children[0]), inst("i6", settingsNav.children[1]),
  inst("i7", iconBellLower)];

const mkPage = (id, name, kids, crit) => {
  const p = N({ id, name, type: "PAGE", children: kids });
  p.findAllWithCriteria = ({ types }) => crit.filter((n) => types.includes(n.type));
  return p;
};
const compsPage = mkPage("1:2", "Components", masters, masters.concat(masters.flatMap((m) => m.children || [])));
const section = N({ id: "S1", name: "28 · Library · shared chrome", type: "SECTION", children: [board] });
const editorPage = mkPage("1:3", "Editor", [section],
  instances.concat([railInstance]).concat(masters.flatMap(() => [])));
const figma = {
  root: { children: [compsPage, editorPage] },
  setCurrentPageAsync: async () => {},
  getNodeByIdAsync: async (id) => nodes.get(id) || null,
};

/* ---------- the two errors, implemented as they were made ---------- */
const rawMasters = masters.concat(masters.flatMap((m) => m.children || []));
const instCount = {};
for (const i of instances) { const m = await i.getMainComponentAsync(); instCount[m.id] = (instCount[m.id] || 0) + 1; }
const naiveZeroUse = rawMasters.filter((m) => !instCount[m.id]).length;
const naiveCollisions = (() => {
  const by = {};
  for (const m of rawMasters) (by[m.name] = by[m.name] || []).push(m);
  return Object.keys(by).filter((k) => by[k].length > 1).length;
})();

/* ---------- run and assert ---------- */
let fails = 0;
const check = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log((ok ? "PASS  " : "FAIL  ") + label + "  got=" + got + " want=" + want);
};

const census = await run(figma, "1:3", 8, false);
const num = (re) => { const m = census.match(re); return m ? m[1] : "(not found)"; };

console.log("--- what the two recorded errors produce on this fixture ---");
console.log("  naive zero-use (sets + state variants counted):   " + naiveZeroUse + "  of " + rawMasters.length + " raw masters");
console.log("  naive name collisions (variant strings as names): " + naiveCollisions);
console.log("--- what audit-components.mjs produces on the same fixture ---");

check("raw masters counted", num(/MASTERS\t(\d+)/), rawMasters.length);
check("units judged (sets + standalone only)", num(/UNITS JUDGED \((\d+) sets/), masters.length);
check("truly zero-use excludes used sets AND their unplaced variants", num(/TRULY ZERO-USE \((\d+)\)/), 4);
/* Scope the zero-use assertions to the zero-use BLOCK. The first version tested
   them against the whole report and failed on the raw-master listing at the top,
   which legitimately prints every variant — a checker reading the wrong region
   is the same class of mistake as a census counting the wrong things. */
const zeroBlock = (census.split("TRULY ZERO-USE")[1] || "").split("TOP UNITS")[0];
check("zero-use names the orphan SET", /\tC\tZero set/.test(zeroBlock), true);
check("zero-use does not name that set's variants", !/\tC1\t/.test(zeroBlock) && !/\tC2\t/.test(zeroBlock), true);
check("zero-use never names a used set", !/\tA\t/.test(zeroBlock) && !/\tB\t/.test(zeroBlock), true);
check("exact collisions ignore variant property strings", num(/EXACT NAME COLLISIONS \((\d+)\)/), 0);
check("normalised pass finds Icon / bell vs icon\\/bell", num(/NORMALISED COLLISIONS \((\d+)\)/), 1);
check("leaf pass finds Icon / plus vs icon\\/plus-16", num(/LEAF COLLISIONS \((\d+)\)/), 1);
check("leaf pass does not re-report the bell pair", !/^bell\t/m.test(census), true);

const shapes = await run(figma, "1:3", 3, true);
check("shapes pass counts the 3 hand-drawn rails", /^3\trail\t60x812/m.test(shapes), true);
check("shapes pass does not descend into the instance", !/^4\trail/m.test(shapes), true);

console.log(fails ? "\n" + fails + " ASSERTION(S) FAILED" : "\nall assertions passed — the census avoids both recorded errors on a fixture that reproduces them");
process.exit(fails ? 1 : 0);
