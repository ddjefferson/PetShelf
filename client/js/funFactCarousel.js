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

// Carousel fun fact population
const numberOfFacts = 20;

fetch(`https://meowfacts.herokuapp.com/?count=${numberOfFacts}`)
  .then((response) => response.json())
  .then(({ data }) => addToUI(data))
  .catch((err) => console.error(err));

function addToUI(facts) {
  let i = 2;
  const carousel = document.querySelectorAll(".carousel-inner");
  carousel.forEach((slide) => {
    slide.innerHTML = `
        <div class="is-size-5">
            <p class="block">${facts[i]}</p>
        </div>
    `;
    i++;
  });
}
