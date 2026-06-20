/* Reusable self-grading quiz widget for the Buildrik design course.
   Markup contract:
     <div class="q" data-explain="Shown after any answer.">
       <p class="q-stem">Question?</p>
       <div class="q-opts">
         <button class="q-opt" data-correct>Right answer</button>
         <button class="q-opt">Wrong answer</button>
       </div>
       <p class="q-fb"></p>
     </div>
   Behaviour: first click locks the question, marks correct/wrong, reveals the
   explanation. Retrieval practice (recall from memory), immediate feedback. */
(function () {
  function wire(q) {
    var opts = q.querySelectorAll(".q-opt");
    var fb = q.querySelector(".q-fb");
    var explain = q.getAttribute("data-explain") || "";
    var answered = false;
    opts.forEach(function (opt) {
      opt.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        var right = opt.hasAttribute("data-correct");
        opt.classList.add(right ? "correct" : "wrong");
        if (!right) {
          // also reveal the actual correct option
          opts.forEach(function (o) { if (o.hasAttribute("data-correct")) o.classList.add("correct"); });
        }
        if (fb) {
          fb.textContent = (right ? "Correct. " : "Not quite. ") + explain;
          fb.classList.add("show");
        }
      });
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".q").forEach(wire);
  });
})();
