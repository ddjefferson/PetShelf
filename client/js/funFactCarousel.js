const MAX_LENGTH = 250;
const NUM_OF_FACTS = 20;

async function loadFacts() {
  const carousel = document.querySelectorAll(".carousel-inner");
  let res = await fetch(
    `https://dog-api.kinduff.com/api/facts?number=${NUM_OF_FACTS}`
  );
  let data = await res.json();
  const dogFact = data.facts.find((fact) => fact.length <= MAX_LENGTH);

  res = await fetch(`https://meowfacts.herokuapp.com/?count=${NUM_OF_FACTS}`);
  data = await res.json();
  const catFacts = data.data
    .filter(
      (fact) =>
        fact.length <= MAX_LENGTH &&
        !fact.includes("unsubscribe") &&
        !fact.includes("Invalid Command")
    )
    .slice(0, 2);

  const facts = [dogFact, ...catFacts];
  carousel.forEach(
    (slide, i) =>
      (slide.innerHTML = `<p class="is-size-4 is-size-6-mobile">${facts[i]}</p>`)
  );
}

loadFacts();

// Carousel appearance
var slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides((slideIndex += n));
}

function currentSlide(n) {
  showSlides((slideIndex = n));
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("item-slide");
  var captionText = document.getElementById("caption");
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
}
