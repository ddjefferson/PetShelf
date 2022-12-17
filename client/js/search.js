"use strict";
const API_KEY = "";
const API_SECRET = "";
const LS_KEY = "petshelf-data";
const PETFINDER_URL = "https://api.petfinder.com";

const ANIMALS_URI = "/v2/animals";
const ANIMAL_TYPES_URI = "/v2/types";

const ANIMAL_TYPE_ATTRIB = "data-animal-type";
const ANIMAL_BREED_ATTRIB = "data-animal-breed";
const SEARCH_RESULTS_ID = "searchResults";

const ANIMAL_TYPES_ID = "animalTypes";

window.addEventListener("load", async () => {
  const data = await getAnimalTypes();
  displayTypeButtons(data.types);
});

/**
 * UI functions
 */
function displayTypeButtons(types) {
  const animalTypes = document.getElementById(ANIMAL_TYPES_ID);
  console.log(types);
  types.forEach((type) => {
    const col = createAnimalTypeButton(type);
    animalTypes.append(col);
  });
}

function createAnimalTypeButton(type) {
  const { name, _links } = type;
  const col = document.createElement("div");
  col.classList = "column is-one-quarter";
  col.innerHTML = `
    <div class="card">
      <a ${ANIMAL_TYPE_ATTRIB}="${_links.self.href}" 
        ${ANIMAL_BREED_ATTRIB}="${_links.breeds.href}" 
        class="button is-fullwidth is-white"
      >
        <div class="card-content">
          <div class="content">${name}</div>
        </div>
      </a>
    </div>
    `;
  const anchor = col.querySelector("a");
  anchor.addEventListener("click", handleAnimalTypeClick);
  return col;
}

function handleAnimalTypeClick(e) {
  const anchor = e.target.closest(`a[${ANIMAL_TYPE_ATTRIB}]`);
  if (!anchor.classList.contains("is-primary")) {
    // Make this anchor the only one with class primary.
    document.querySelectorAll(`#${ANIMAL_TYPES_ID} a`).forEach((a) => {
      a.classList.remove("is-primary");
      a.classList.add("is-white");
    });
    anchor.classList.add("is-primary");
    // Display the results associated with this button.
    const typeURI = anchor.getAttribute(ANIMAL_TYPE_ATTRIB);
    const animalType = typeURI.split("/").pop();
    console.log(animalType);
    const pageURI = `${ANIMALS_URI}?type=${animalType}`;
    console.log(pageURI);
    displayResults(pageURI);
  }
}

async function displayResults(uri) {
  const searchResults = document.getElementById(SEARCH_RESULTS_ID);

  // Loading animation while getting results.
  const LOADING_CLASS = "loading";
  searchResults.classList.add(LOADING_CLASS);
  console.log(uri);
  const url = new URL(PETFINDER_URL + uri);
  console.log(url);
  const data = await getPetFinderData(url);
  searchResults.classList.remove(LOADING_CLASS);

  clearSearchResults();

  // Display new results.
  console.log(data);
  data.animals.forEach((animal) => {
    const col = createAnimalCard(animal);
    searchResults.append(col);
  });
  createPagination(data.pagination);
}

function createAnimalCard(animal) {
  const { name, age, gender, url, id, primary_photo_cropped } = animal;
  const col = document.createElement("col");
  const imageSrc = primary_photo_cropped
    ? `src="${primary_photo_cropped.small}"`
    : "";
  col.classList =
    "column is-one-quarter-tablet is-flex is-justify-content-center";
  col.innerHTML = `
  <div class="card is-flex-grow-1">
    <a href="#" target="_blank" rel="noopener">
      <div class="card-image">
        <img
          style="width: 100%; object-fit: cover; aspect-ratio: 1/1"
          ${imageSrc}
          alt="${name}"
        />
      </div>
    </a>
    <div class="card-content">
      <div class="content">${name} ${gender} ${age}</div>
    </div>
  </div>
  `;
  return col;
}

function clearSearchResults() {
  const searchResults = document.getElementById(SEARCH_RESULTS_ID);
  while (searchResults.firstElementChild)
    searchResults.firstElementChild.remove();
}

function createPagination(pagination) {
  console.log(pagination);
  const { count_per_page, current_page, total_count, total_pages } = pagination;
  console.log("current page: ", current_page, "total_pages: ", total_pages);
  const {
    _links: { next, previous },
  } = pagination;

  const MAX_BUTTONS = 5;

  if (total_pages > 1) {
    const ul = document.querySelector(".pagination .pagination-list");
    let content = "";
    let pageNumbers = [1];
    for (
      let i = Math.max(2, current_page - 1);
      i < total_pages - 1 && pageNumbers.length < MAX_BUTTONS - 1;
      i++
    ) {
      pageNumbers.push(i);
    }
    pageNumbers.push(total_pages);
    pageNumbers.forEach((n) => {
      content += `
      <li>
        <a class="pagination-link" aria-label="Goto page ${n}" data-page=${n}>${n}</a>
      </li>
      `;
    });

    ul.innerHTML = content;
    const currentIndex = pageNumbers.indexOf(current_page);
    const currentLink = ul.children[currentIndex].querySelector("a");
    currentLink.classList.add("is-current");
    currentLink.setAttribute("aria-current", "page");

    // Add ellipses next to 1
    if (total_pages > MAX_BUTTONS && current_page > 3) {
      ul.firstElementChild.insertAdjacentHTML(
        "afterend",
        `
      <li>
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      `
      );
    }

    // Add ellipses next to last page
    if (total_pages > MAX_BUTTONS && total_pages - current_page > 2) {
      ul.lastElementChild.insertAdjacentHTML(
        "beforebegin",
        `
      <li>
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      `
      );
    }

    const prevBtn = document.querySelector(".pagination-previous");
    if (current_page > 1) {
      prevBtn.classList.remove("is-hidden");
      prevBtn.setAttribute("data-page", previous.href);
    } else {
      prevBtn.classList.add("is-hidden");
    }

    const nextBtn = document.querySelector(".pagination-next");
    if (current_page < total_pages) {
      nextBtn.classList.remove("is-hidden");
      nextBtn.setAttribute("data-page", next.href);
    } else {
      nextBtn.classList.add("is-hidden");
    }
  }
}

{
  /* <nav class="pagination" role="navigation" aria-label="pagination">
  <a class="pagination-previous">Previous</a>
  <a class="pagination-next">Next page</a>
  <ul class="pagination-list">
    <li>
      <a class="pagination-link" aria-label="Goto page 1">1</a>
    </li>
    <li>
      <span class="pagination-ellipsis">&hellip;</span>
    </li>
    <li>
      <a class="pagination-link" aria-label="Goto page 45">45</a>
    </li>
    <li>
      <a class="pagination-link is-current" aria-label="Page 46" aria-current="page">46</a>
    </li>
    <li>
      <a class="pagination-link" aria-label="Goto page 47">47</a>
    </li>
    <li>
      <span class="pagination-ellipsis">&hellip;</span>
    </li>
    <li>
      <a class="pagination-link" aria-label="Goto page 86">86</a>
    </li>
  </ul>
</nav> */
}

/**
 * PetFinder API requests.
 */
async function getAnimals(params) {
  const url = new URL(`${PETFINDER_URL}${ANIMALS_URI}`);
  url.search = new URLSearchParams(params);
  return getPetFinderData(url, params);
}

async function getAnimalById(id) {
  const url = new URL(`${PETFINDER_URL}${ANIMALS_URI}/${id}`);
  return getPetFinderData(url);
}

async function getAnimalTypes() {
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}`;
  return getPetFinderData(url);
}

async function getSingleAnimalType(type) {
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}/${type}`;
  return getPetFinderData(url);
}

async function getAnimalBreeds(type) {
  const BREEDS = "/breeds";
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}/${type}${BREEDS}`;
  return getPetFinderData(url);
}

/**
 * Token request to our server.
 */
async function getAccessToken() {
  // See if it always exists in local storage.
  const appData = getAppData();
  if (!isTokenValid(appData)) {
    appData.auth = await getNewAccessToken();
    saveAppData(appData);
  } else {
    console.log("Already have a token!");
  }
  return appData.auth.access_token;
}

async function getNewAccessToken() {
  const res = await fetch("http://127.0.0.1:5000/token");
  const { data, success } = await res.json();
  return data;
}

// Has token and it has not expired.
function isTokenValid(auth) {
  return auth && Date.now() < auth.expires_at;
}

async function getAuthHeaders() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

async function getPetFinderData(url) {
  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
}

/**
 * Local Storage Functions
 */
function getAppData() {
  return JSON.parse(localStorage.getItem(LS_KEY)) || {};
}

function saveAppData(appData) {
  localStorage.setItem(LS_KEY, JSON.stringify(appData));
}
