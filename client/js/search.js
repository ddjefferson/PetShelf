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

  clearChildren(searchResults);

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
    <a href="${url}" target="_blank" rel="noopener">
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

function clearChildren(parent) {
  while (parent.firstElementChild) parent.firstElementChild.remove();
}

function createPagination(pagination) {
  const pagNav = document.querySelector("nav.pagination");
  const ul = pagNav.querySelector(".pagination-list");
  clearChildren(ul);
  if (pagination.total_pages <= 1) {
    return;
  }

  // Destructure pagination data.
  const { current_page: current, total_pages: total, _links } = pagination;
  const { next, previous } = _links;

  // Compute pagination numbers.
  const MAX = 5; // number of buttons to show at most.
  const nums = [1, total];
  for (let i = Math.max(2, current); i < total && nums.length < MAX; i++) {
    nums.splice(nums.length - 1, 0, i); // Insert the number.
  }

  // Add buttons to UI.
  nums.forEach((n) => {
    ul.innerHTML += `<li><a class="pagination-link" aria-label="Goto page ${n}" data-page=${n}>${n}</a></li>`;
  });

  // Style button for current page.
  const currentIndex = nums.indexOf(current);
  const currentLink = ul.children[currentIndex].querySelector("a");
  currentLink.classList.add("is-current");
  currentLink.setAttribute("aria-current", "page");

  // Decide if to display ellipses next to first and last page.
  const ellipsesMinDistance = MAX / 2;
  const ellipses = "<li><span class='pagination-ellipsis'>&hellip;</span</li>";
  if (current - 1 > ellipsesMinDistance) {
    ul.firstElementChild.insertAdjacentElement("afterend", ellipses);
  }

  if (MAX - current > ellipsesMinDistance) {
    ul.lastElementChild.insertAdjacentHTML("beforebegin", ellipses);
  }

  // Decide if to display prev and next buttons.
  const prevBtn = document.querySelector(".pagination-previous");
  if (current > 1) {
    prevBtn.classList.remove("is-hidden");
  } else {
    prevBtn.classList.add("is-hidden");
  }

  const nextBtn = document.querySelector(".pagination-next");
  if (current < total) {
    nextBtn.classList.remove("is-hidden");
  } else {
    nextBtn.classList.add("is-hidden");
  }
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
