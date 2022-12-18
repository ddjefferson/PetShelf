const numberOfFacts = 20;

fetch(`https://meowfacts.herokuapp.com/?count=${numberOfFacts}`)
  .then((response) => response.json())
  .then(({ data }) => addToUI(data))
  .catch((err) => console.error(err));

function addToUI(facts) {
  const carousel = document.querySelector(".carousel-inner");
  facts.forEach((fact) => {
    const row = document.createElement("div");
    row.classList = "carousel-item bg-info";
    row.style.height = "300px";
    row.innerHTML = `
      <div class="row justify-content-center h-100">
        <div class="col-6 h-100 d-flex flex-column justify-content-center">
          <h2 class="text-muted">Did you know?</h1>
          <p class="text-white">${fact}</p>
        </div>
      </div>
    `;
    carousel.append(row);
  });
  carousel.firstElementChild.classList.add("active");
}