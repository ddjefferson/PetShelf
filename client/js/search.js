"use strict";
const API_KEY = "";
const API_SECRET = "";
const LS_KEY = "petshelf-data";
const PETFINDER_URL = "https://api.petfinder.com";

const ANIMALS_URI = "/v2/animals";
const ANIMAL_TYPES_URI = "/v2/types";

const ANIMAL_TYPE_ATTRIB = "data-animal-type";
const ANIMAL_BREED_ATTRIB = "data-animal-breed";
const PAG_NAV_URI_ATTRIB = "page-navigation-uri";
const PAG_NAV_PAGE_ATTRIBUTE = "data-page";
const SEARCH_RESULTS_ID = "searchResults";
const SEARCH_MODAL_ID = "searchModal";

const ANIMAL_TYPES_ID = "animalTypes";
const DEFAULT_ANIMAL_PHOTO = "./img/cat3.png";

window.addEventListener("load", async () => {
  const searchModalForm = document.querySelector("#searchModal form");
  searchModalForm.addEventListener("submit", searchAnimalType);
  const data = await getAnimalTypes();

  // displayTypeButtons(data.types);
  const pagNav = document.querySelector("nav.pagination");
  pagNav.addEventListener("click", handlePaginationClick);
  // See if user clicked cat, dog, or some other animal type before landing here.
  let type = window.location.href.match(/type=(\w+)/);
  if (type) {
    const anchor = Array.from(
      document.querySelectorAll(`#${ANIMAL_TYPES_ID} a`)
    ).find((a) => a.getAttribute(ANIMAL_TYPE_ATTRIB).endsWith(type[1]));
    if (anchor) anchor.click();
  }
});

function searchAnimalType(e) {
  e.preventDefault();
  const animalType = e.target.elements.animalType.value;
  const pageURI = `${ANIMALS_URI}?type=${animalType}`;
  displayResults(pageURI);
  createFilterForm(animalType);
}

/**
 * UI functions
 */

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
    const pageURI = `${ANIMALS_URI}?type=${animalType}`;
    displayResults(pageURI);
    // createFilterForm
    createFilterForm(animalType);
  }
}

async function displayResults(uri) {
  const searchResults = document.getElementById(SEARCH_RESULTS_ID);

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
  const col = document.createElement("col");
  const imageSrc = primary_photo_cropped?.small || DEFAULT_ANIMAL_PHOTO;
  col.classList =
    "column is-one-quarter-tablet is-flex is-justify-content-center";
  col.innerHTML = `
  <div class="card is-flex-grow-1">
    <a href="${url}" target="_blank" rel="noopener">
      <div class="card-image">
        <img
          style="width: 100%; object-fit: cover; aspect-ratio: 1/1"
          src="${imageSrc}"
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

async function createFilterForm(animalType) {
  console.log(animalType);
  const { breeds } = await getAnimalBreeds(animalType);
  const { type } = await getSingleAnimalType(animalType);
  const animalColors = document.getElementById("animalColor");
  const animalCoats = document.getElementById("animalCoat");
  const animalBreeds = document.getElementById("animalBreed");

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
  console.log(breeds); // animal breeds
  console.log(type); // coats, colors, genders
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

function clearChildren(parent) {
  while (parent.firstElementChild) parent.firstElementChild.remove();
}

function handlePaginationClick(e) {
  const page = e.target.getAttribute(PAG_NAV_PAGE_ATTRIBUTE);

  if (page) {
    const pagNav = document.querySelector(".pagination");
    let uri = pagNav.getAttribute(PAG_NAV_URI_ATTRIB);
    uri = uri.replace(/page=[\d]+/, `page=${page}`);
    displayResults(uri);
  }
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
    ul.innerHTML += `<li><a class="pagination-link" aria-label="Goto page ${n}" ${PAG_NAV_PAGE_ATTRIBUTE}=${n}>${n}</a></li>`;
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
