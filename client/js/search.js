"use strict";
const API_KEY = "";
const API_SECRET = "";
const LS_KEY = "petshelf-data";
const PETFINDER_URL = "https://api.petfinder.com/v2";

const ANIMALS_URI = "/animals";
const ANIMAL_TYPES_URI = "/types";
const ANIMAL_BREEDS_URI = "/breeds";

const ANIMAL_TYPE_ATTRIB = "data-animal-type";
const SEARCH_RESULTS_ID = "searchResults";

window.addEventListener("load", async () => {
  const data = await getAnimalTypes();
  displayTypeButtons(data.types);
});

function displayTypeButtons(types) {
  const animalTypes = document.getElementById("animalTypes");
  console.log(types);
  types.forEach((type) => {
    const {
      name,
      _links: { self },
    } = type;
    // const animalType = self.href.split("/").pop();
    const col = document.createElement("div");
    col.classList = "column is-one-quarter";
    col.innerHTML = `
    <div class="card">
      <a ${ANIMAL_TYPE_ATTRIB}="${name}" class="button is-fullwidth is-white">
        <div class="card-content">
          <div class="content">${name}</div>
        </div>
      </a>
    </div>
    `;
    col.querySelector("a").addEventListener("click", displayResults);
    animalTypes.append(col);
  });
}

async function displayResults(e) {
  // Highlight button of selected animal.
  const anchor = e.target.closest(`[${ANIMAL_TYPE_ATTRIB}]`);
  document.querySelectorAll("#animalTypes a").forEach((a) => {
    a.classList.remove("is-primary");
    a.classList.add("is-white");
  });
  anchor.classList.add("is-primary");

  // Get animals of depending on button's animal type.
  const animalType = anchor.getAttribute(ANIMAL_TYPE_ATTRIB);
  const searchResults = document.getElementById(SEARCH_RESULTS_ID);
  searchResults.classList.toggle("loading");
  const data = await getAnimals({ type: animalType });
  searchResults.classList.toggle("loading");

  // Display the animals.
  clearSearchResults();
  data.animals.forEach((animal) => {
    const col = createAnimalCard(animal);
    searchResults.append(col);
  });
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
  while (searchResults.childElementCount > 1)
    searchResults.lastElementChild.remove();
}

//
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
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}/${type}${ANIMAL_BREEDS_URI}`;
  return getPetFinderData(url);
}

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

function getAppData() {
  return JSON.parse(localStorage.getItem(LS_KEY)) || {};
}

async function getNewAccessToken() {
  const res = await fetch("http://127.0.0.1:5000/token");
  const { data, success } = await res.json();
  return data;
}

function saveAppData(appData) {
  localStorage.setItem(LS_KEY, JSON.stringify(appData));
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
