/**
 * Retrieval-practice widget. Shared across lessons.
 *
 * Markup contract:
 *   <div class="quiz" data-answer="1">
 *     <p class="q">Question?</p>
 *     <button>Option A</button>
 *     <button>Option B</button>
 *     <p class="why">Explanation shown after any answer.</p>
 *   </div>
 *
 * `data-answer` is the zero-based index of the correct button.
 *
 * Deliberate: the explanation shows on a WRONG answer too, and the correct
 * option is revealed. Hiding it would leave the wrong answer as the last thing
 * retrieved, which is the opposite of what retrieval practice is for.
 */
document.querySelectorAll(".quiz").forEach((quiz) => {
  const correct = Number(quiz.dataset.answer);
  const buttons = [...quiz.querySelectorAll("button")];
  const why = quiz.querySelector(".why");

  buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      if (quiz.dataset.done) return;
      quiz.dataset.done = "1";
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (j === correct) b.dataset.state = "right";
        else if (j === i) b.dataset.state = "wrong";
      });
      if (why) why.classList.add("show");
    });
  });
});
