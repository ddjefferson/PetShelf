"use strict";
const API_KEY = "";
const API_SECRET = "";
const LS_KEY = "petshelf-data";
const PETFINDER_URL = "https://api.petfinder.com";

const ANIMALS_URI = "/v2/animals";
const ANIMAL_TYPES_URI = "/v2/types";

const PAG_NAV_URI_ATTRIB = "page-navigation-uri";
const PAG_NAV_PAGE_ATTRIBUTE = "data-page";

const SEARCH_RESULTS_ID = "#searchResults";
const SEARCH_MODAL_ID = "#searchModal";
const ANIMAL_BREED_ID = "#animalBreed";
const ANIMAL_TYPES_ID = "#animalType";
const BREED_FILTER_INPUT_ID = "#breedSearch";

const DEFAULT_ANIMAL_PHOTO = "./img/cat3.png";

window.addEventListener("load", async () => {
  // Set up event listeners
  const searchModalForm = document.querySelector(`${SEARCH_MODAL_ID} form`);
  searchModalForm.addEventListener("submit", searchAnimalType);

  const breedFilterInput = document.querySelector(BREED_FILTER_INPUT_ID);
  breedFilterInput.addEventListener("keydown", filterBreedNames);

  const pagNav = document.querySelector("nav.pagination");
  pagNav.addEventListener("click", handlePaginationClick);

  // See if user clicked cat, dog, or some other animal type before landing here.
  let type = window.location.href.match(/type=(\w+)/);
  if (type) {
    searchModalForm.elements[ANIMAL_TYPES_ID.slice(1)].value = type;
    searchModalForm.requestSubmit();
  }
});

// Event listeners

function searchAnimalType(e) {
  e.preventDefault();
  const animalType = e.target.elements.animalType.value;
  const pageURI = `${ANIMALS_URI}?type=${animalType}`;
  displayAnimalResults(pageURI);
  populateFilterForm(animalType);
}

function filterBreedNames(e) {
  const breeds = Array.from(document.querySelectorAll("#animalBreed .field"));
  const query = e.target.value.toLowerCase();
  breeds.forEach((breedField) => {
    if (breedField.querySelector("input").value.toLowerCase().includes(query)) {
      breedField.classList.remove("is-hidden");
    } else {
      breedField.classList.add("is-hidden");
    }
  });
}

function handlePaginationClick(e) {
  const page = e.target.getAttribute(PAG_NAV_PAGE_ATTRIBUTE);

  if (page) {
    const pagNav = document.querySelector(".pagination");
    let uri = pagNav.getAttribute(PAG_NAV_URI_ATTRIB);
    uri = uri.replace(/page=[\d]+/, `page=${page}`);
    displayAnimalResults(uri);
  }
}

/**
 * UI functions
 */

async function displayAnimalResults(uri) {
  const searchResults = document.querySelector(SEARCH_RESULTS_ID);

  // Loading animation while getting results.
  const LOADING_CLASS = "loading";
  searchResults.classList.add(LOADING_CLASS);
  const url = new URL(PETFINDER_URL + uri);
  const data = await getPetFinderData(url);
  searchResults.classList.remove(LOADING_CLASS);

  clearChildren(searchResults);

  // Display new results.
  data.animals.forEach((animal) => {
    const col = createAnimalCard(animal);
    searchResults.append(col);
  });
  createPagination(data.pagination);
  // searchResults.scrollIntoView();
  window.scrollTo(0, 0);
}

function createAnimalCard(animal) {
  const { name, age, gender, url, id, primary_photo_cropped } = animal;
  let genderIconClass = "fa-ganderless";
  let genderColor = "has-text-black";
  if (gender === "Male") {
    genderIconClass = "fa-mars";
    genderColor = "has-text-info";
  } else if (gender === "Female") {
    genderIconClass = "fa-venus";
    genderColor = "has-text-danger";
  }
  const col = document.createElement("col");
  const imageSrc = primary_photo_cropped?.small || DEFAULT_ANIMAL_PHOTO;
  col.classList =
    "column is-one-quarter-tablet is-flex is-justify-content-center";
  col.innerHTML = `
  <div class="card is-flex-grow-1 is-flex is-flex-direction-column">
    <a href="${url}" target="_blank" rel="noopener">
      <div class="card-image">
        <img
          style="width: 100%; object-fit: cover; aspect-ratio: 1/1"
          src="${imageSrc}"
          alt="${name}"
        />
      </div>
    </a>
    <div class="card-content has-text-centered p-3 is-flex is-flex-grow-1">
      <div class="content is-flex-grow-1 is-flex is-flex-direction-column is-justify-content-space-between">
        <p class="has-text-primary is-size-5 has-text-weight-bold m-1">${name}</p>
        <p>
          <span class="${genderColor}"><i class="fa-solid ${genderIconClass} m-1"></i></span>${gender}
          <span class="has-text-success"> <i class="fa-solid fa-seedling"></i> ${age}
          </p>
      </div>
    </div>
  </div>
  `;
  return col;
}

async function populateFilterForm(animalType) {
  const { breeds } = await getAnimalBreeds(animalType);
  const { type } = await getSingleAnimalType(animalType);
  const animalColors = document.querySelector("#animalColor");
  const animalCoats = document.querySelector("#animalCoat");
  const animalBreeds = document.querySelector("#animalBreed");

  clearChildren(animalColors);
  clearChildren(animalCoats);
  clearChildren(animalBreeds);

  type.coats.forEach((coat) => {
    animalCoats.append(createCheckbox(coat));
  });
  type.colors.forEach((color) => {
    animalColors.append(createCheckbox(color));
  });
  breeds.flat().forEach(({ name }) => {
    animalBreeds.append(createCheckbox(name));
  });
}

function createCheckbox(value) {
  const checkboxField = document.createElement("div");
  checkboxField.classList.add("field");
  checkboxField.innerHTML = `
    <div class="control">
      <label class="checkbox">
        <input type="checkbox" value=${value}/>
          ${value}
      </label>
    </div>`;
  return checkboxField;
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

  pagNav.setAttribute(PAG_NAV_URI_ATTRIB, next?.href || previous?.href);

  // Compute pagination numbers.
  const MAX = 5; // number of buttons to show at most.
  const nums = [1, total];
  for (let i = Math.max(2, current - 1); i < total && nums.length < MAX; i++) {
    nums.splice(nums.length - 1, 0, i); // Insert the number.
  }

  // Add buttons to UI.
  nums.forEach((n) => {
    ul.innerHTML += `
    <li>
      <a class="pagination-link has-background-light has-text-white" 
        aria-label="Goto page ${n}" ${PAG_NAV_PAGE_ATTRIBUTE}=${n}>
         ${n}
      </a>
    </li>`;
  });

  // Style button for current page.
  const currentIndex = nums.indexOf(current);
  const currentLink = ul.children[currentIndex].querySelector("a");
  currentLink.classList.add("is-current");
  currentLink.classList.toggle("has-background-light");
  currentLink.setAttribute("aria-current", "page");

  // Decide if to display ellipses next to first and last page.
  const ellipsesMinDistance = MAX / 2;
  const ellipses = "<li><span class='pagination-ellipsis'>&hellip;</span</li>";
  if (current - 1 > ellipsesMinDistance) {
    ul.firstElementChild.insertAdjacentHTML("afterend", ellipses);
  }

  if (total - current > ellipsesMinDistance) {
    ul.lastElementChild.insertAdjacentHTML("beforebegin", ellipses);
  }

  // Decide if to display prev and next buttons.
  const prevBtn = document.querySelector(".pagination-previous");
  if (current > 1) {
    prevBtn.classList.remove("is-hidden");
    prevBtn.setAttribute(PAG_NAV_PAGE_ATTRIBUTE, current - 1);
  } else {
    prevBtn.classList.add("is-hidden");
  }

  const nextBtn = document.querySelector(".pagination-next");
  if (current < total) {
    nextBtn.classList.remove("is-hidden");
    nextBtn.setAttribute(PAG_NAV_PAGE_ATTRIBUTE, current + 1);
  } else {
    nextBtn.classList.add("is-hidden");
  }
}

function clearChildren(parent) {
  while (parent.firstElementChild) parent.firstElementChild.remove();
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
