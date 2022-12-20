//looking for inner card
const cards = document.querySelectorAll(".flip-card__inner");
// listening for click
// toggle when is flipped
cards.forEach((card) => {
  card.addEventListener("click", function (e) {
    card.classList.toggle("is-flipped");
  });
});
