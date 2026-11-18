/**
 * Cognitive-walkthrough scoring widget. Shared across lessons.
 *
 * Markup contract:
 *   <div class="walk" data-key="unique-flow-id">
 *     <div class="step" data-verdict="pass|fail" data-q="3" data-note="Teacher's note">
 *       <h4>Step 1 · Rail › Pages</h4>
 *       <p class="do">What the user does at this step.</p>
 *     </div>
 *     …
 *   </div>
 *
 * The four NN/g questions are rendered by this script so every lesson asks
 * them in the same words. `data-verdict` is the teacher's call; `data-q` is the
 * (1-based) question the teacher says fails, if any. Both stay hidden until the
 * learner has answered all four — retrieval first, then feedback (immediate).
 *
 * Answers persist per data-key in localStorage so a lesson can be resumed.
 */
const QUESTIONS = [
  "Q1 · User ko pata hai yahan kya karna hai? (right result)",
  "Q2 · Sahi control nazar aata hai? (notice)",
  "Q3 · Label dekh kar samajh aata hai ke yehi karna hai? (associate)",
  "Q4 · Karne ke baad progress dikhti hai? (feedback)",
];

function load(key) {
  try { return JSON.parse(localStorage.getItem("walk:" + key) || "{}"); } catch { return {}; }
}
function save(key, state) {
  try { localStorage.setItem("walk:" + key, JSON.stringify(state)); } catch { /* private mode etc. */ }
}

document.querySelectorAll(".walk").forEach((walk) => {
  const key = walk.dataset.key || "walk";
  const state = load(key);
  const steps = [...walk.querySelectorAll(".step")];
  const summary = document.createElement("p");
  summary.className = "walk-summary";
  walk.appendChild(summary);

  const render = () => {
    let passed = 0, failed = 0, done = 0;
    steps.forEach((step, si) => {
      const answers = state[si] || [];
      const complete = answers.length === 4 && answers.every((a) => a !== undefined);
      const verdictEl = step.querySelector(".verdict");
      if (complete) {
        done++;
        const learner = answers.every(Boolean) ? "pass" : "fail";
        const teacher = step.dataset.verdict || "pass";
        if (teacher === "pass") passed++; else failed++;
        const agree = learner === teacher;
        verdictEl.dataset.state = teacher;
        verdictEl.innerHTML =
          `<strong>Aap: ${learner.toUpperCase()}</strong> · Teacher: ${teacher.toUpperCase()}` +
          (teacher === "fail" && step.dataset.q ? ` (Q${step.dataset.q} fails)` : "") +
          (agree ? " · match ✓" : " · alag — note padho") +
          (step.dataset.note ? `<span class="note-text">${step.dataset.note}</span>` : "");
        verdictEl.classList.add("show");
      }
    });
    summary.textContent = done === steps.length
      ? `Flow: ${passed} pass · ${failed} fail (${steps.length} steps). Har FAIL = ek issue-table row.`
      : `${done} / ${steps.length} steps scored.`;
  };

  steps.forEach((step, si) => {
    const grid = document.createElement("div");
    grid.className = "qgrid";
    QUESTIONS.forEach((q, qi) => {
      const row = document.createElement("div");
      row.className = "qrow";
      const label = document.createElement("span");
      label.textContent = q;
      const yes = document.createElement("button");
      yes.type = "button"; yes.textContent = "Haan";
      const no = document.createElement("button");
      no.type = "button"; no.textContent = "Nahi";
      const paint = () => {
        const a = (state[si] || [])[qi];
        yes.dataset.state = a === true ? "on" : "";
        no.dataset.state = a === false ? "on" : "";
      };
      const set = (v) => {
        state[si] = state[si] || [];
        state[si][qi] = v;
        save(key, state);
        paint();
        render();
      };
      yes.addEventListener("click", () => set(true));
      no.addEventListener("click", () => set(false));
      paint();
      row.append(label, yes, no);
      grid.appendChild(row);
    });
    const verdict = document.createElement("p");
    verdict.className = "verdict";
    step.append(grid, verdict);
  });

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "walk-reset";
  reset.textContent = "Reset scores";
  reset.addEventListener("click", () => {
    Object.keys(state).forEach((k) => delete state[k]);
    save(key, state);
    walk.querySelectorAll(".qrow button").forEach((b) => (b.dataset.state = ""));
    walk.querySelectorAll(".verdict").forEach((v) => { v.classList.remove("show"); v.textContent = ""; });
    render();
  });
  walk.appendChild(reset);
  render();
});
