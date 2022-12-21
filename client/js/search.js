"use strict";
const LS_KEY = "petshelf-data";

const PETFINDER_URL = "https://api.petfinder.com";
const ANIMALS_URI = "/v2/animals";
const ANIMAL_TYPES_URI = "/v2/types";

const PAG_NAV_PAGE_ATTRIBUTE = "data-page";
const RESULTS_PARAMS_ATTRIB = "data-results-params";

const SEARCH_RESULTS_ID = "#searchResults";
const TYPE_MODAL_ID = "#searchModal";
const ANIMAL_TYPES_ID = "#animalType";
const LOCATION_BTN = "#locationBtn";
const DISTANCE_FIELD_ID = "#distanceField";
const CLOSE_TYPE_MODAL_BTN_ID = "#closeSelectTypeBtn";
const FILTER_MODAL_ID = "#filterModal";
const BREED_FILTER_INPUT_ID = "#breedSearch";
const ANIMAL_BREED_ID = "#animalBreed";
const ANIMAL_COLOR_ID = "#animalColor";
const ANIMAL_COAT_ID = "#animalCoat";
const CLOSE_FILTER_MODAL_BTN_ID = "#closeFilterBtn";
const FILTER_MODAL_OPEN_BTN_ID = "#filterModalOpenBtn";
const FILTER_TAGS_ID = "#filterTags";

const DEFAULT_ANIMAL_PHOTO = "./img/default-photo.png";

window.addEventListener("load", async () => {
  // Set up event listeners
  const searchModalForm = document.querySelector(`${TYPE_MODAL_ID} form`);
  searchModalForm.addEventListener("submit", searchAnimalType);

  const locationBtn = document.querySelector(LOCATION_BTN);
  locationBtn.addEventListener("click", requestUserLocation);

  const closeTypeModalBtn = document.querySelector(CLOSE_TYPE_MODAL_BTN_ID);
  closeTypeModalBtn.addEventListener("click", resetSearchModalForm);

  const filterModalOpenBtn = document.querySelector(FILTER_MODAL_OPEN_BTN_ID);
  filterModalOpenBtn.addEventListener("click", (e) =>
    filterModalForm.scrollIntoView()
  );

  const filterModalForm = document.querySelector(`${FILTER_MODAL_ID} form`);
  filterModalForm.addEventListener("submit", handleApplyFilters);

  const breedFilterInput = document.querySelector(BREED_FILTER_INPUT_ID);
  breedFilterInput.addEventListener("keyup", filterBreedNames);

  const closeFilterModalBtn = document.querySelector(CLOSE_FILTER_MODAL_BTN_ID);
  closeFilterModalBtn.addEventListener("click", resetFilterModalForm);

  const pagNav = document.querySelector("nav.pagination");
  pagNav.addEventListener("click", handlePaginationClick);

  // See if user clicked cat, dog, or some other valid animal type before landing here.
  let type = window.location.href.match(/type=(\w+)/);
  if (!type) return;
  type = type[1];
  const { types } = await getAnimalTypes();
  if (types.find(({ name }) => name.toLowerCase() === type.toLowerCase())) {
    searchModalForm.elements[ANIMAL_TYPES_ID.slice(1)].value = type;
    searchModalForm.requestSubmit();
  }
});

// Event listeners
async function searchAnimalType(e) {
  e.preventDefault();

  // Get form information.
  const animalType = e.target.elements.animalType.value;

  // Build the URI and request the data.
  const params = new URLSearchParams(`type=${animalType}`);
  let modifiedUrl = new URL(window.location);
  modifiedUrl.searchParams.set("type", animalType);
  window.history.replaceState({}, "", modifiedUrl);
  await locateUserThenDisplayAnimals(params);

  clearFilterTags();

  // Enable filter options.
  populateFilterForm(animalType);
  document
    .querySelector(FILTER_MODAL_OPEN_BTN_ID)
    .classList.remove("is-hidden");
}

async function requestUserLocation(e) {
  function handleNoLocation() {
    alert("Unable to get your location");
    document.querySelector(DISTANCE_FIELD_ID).classList.add("is-hidden");
  }

  function useLocation(position) {
    alert("You've granted permission to use your location");
    document.querySelector(DISTANCE_FIELD_ID).classList.remove("is-hidden");
  }

  if (!navigator.geolocation) {
    handleNoLocation();
    return;
  } else {
    navigator.geolocation.getCurrentPosition(useLocation, handleNoLocation);
  }
}

// Ensure modal form shows the correctly selected values when it's re-opened.
function resetSearchModalForm(e) {
  const type = getCurrentResultParams().get("type");
  const searchModalForm = document.querySelector(`${TYPE_MODAL_ID} form`);
  searchModalForm.elements[ANIMAL_TYPES_ID.slice(1)].value = type;
  searchModalForm.elements[DISTANCE_FIELD_ID.slice(1)].value = "";
  if (!hasLocationBeenGranted()) {
    document.querySelector(DISTANCE_FIELD_ID).classList.add("is-hidden");
  }
}

async function handleApplyFilters(e) {
  e.preventDefault();

  // Get checked filter boxes.
  const checked = e.target.querySelectorAll(`input[type=checkbox]:checked`);

  // Create query parameters.
  const filterParams = {};
  checked.forEach((box) => {
    let values = filterParams[box.name] || [];
    values.push(box.value);
    filterParams[box.name] = values;
  });
  const params = new URLSearchParams(filterParams);
  params.set("type", getCurrentResultParams().get("type"));

  // Build URI from params and request data.
  await locateUserThenDisplayAnimals(params);
  // Show filter tags.
  updateFilterTags(new URLSearchParams(filterParams));
}

function filterBreedNames(e) {
  const breeds = Array.from(
    document.querySelectorAll(`${ANIMAL_BREED_ID} .field`)
  );
  const query = e.target.value.toLowerCase();
  breeds.forEach((breedField) => {
    if (breedField.querySelector("input").value.toLowerCase().includes(query)) {
      breedField.classList.remove("is-hidden");
    } else {
      breedField.classList.add("is-hidden");
    }
  });
}

function resetFilterModalForm(e) {
  const params = new URLSearchParams(getCurrentResultParams());
  const inputs = document.querySelectorAll(
    `${FILTER_MODAL_ID} input[type=checkbox]`
  );
  inputs.forEach((b) => {
    b.checked = params.has(b.name) && params.get(b.name).includes(b.value);
  });
  document.querySelector(`${FILTER_MODAL_ID} form`).scrollIntoView();
}

async function handlePaginationClick(e) {
  const page = e.target.getAttribute(PAG_NAV_PAGE_ATTRIBUTE);
  if (page) {
    const params = getCurrentResultParams();
    params.set("page", page);
    await locateUserThenDisplayAnimals(params);
  }
}

async function hasLocationBeenGranted() {
  const result = await navigator.permissions.query({ name: "geolocation" });
  return result.state === "granted";
}

/**
 * UI functions
 */

function locateUserThenDisplayAnimals(params) {
  // See if location is available.
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const select = document.querySelector(`${DISTANCE_FIELD_ID} select`);
      if (select.value) {
        // Using user's location.
        params.set("distance", select.value);
        const { latitude, longitude } = position.coords;
        params.set("location", `${latitude},${longitude}`);
      }
      displayAnimals(params);
    },
    () => {
      // Not using user's location.
      displayAnimals(params);
    }
  );
}

async function displayAnimals(params) {
  const searchResults = document.querySelector(SEARCH_RESULTS_ID);

  // Save relevant URI params on container.
  searchResults.setAttribute(RESULTS_PARAMS_ATTRIB, params.toString());

  // Loading animation while getting results.
  const LOADING_CLASS = "loading";
  searchResults.classList.add(LOADING_CLASS);
  toggleDisableAllButtons();
  const { animals, pagination } = await getAnimals(params.toString());
  toggleDisableAllButtons();
  searchResults.classList.remove(LOADING_CLASS);

  clearChildren(searchResults);

  if (animals.length === 0) {
    searchResults.innerHTML = `
      <h2 class="has-text-grey-light has-text-centered is-size-4">No matching results</h2>
    `;
  }
  // Display new results.
  animals.forEach((animal) => {
    const col = createAnimalCard(animal);
    searchResults.append(col);
  });
  createPagination(pagination);
  // searchResults.scrollIntoView();
  window.scrollTo(0, 0);
}

async function populateFilterForm(animalType) {
  const { breeds } = await getAnimalBreeds(animalType);
  const {
    type: { coats, colors },
  } = await getSingleAnimalType(animalType);
  const animalColors = document.querySelector(ANIMAL_COLOR_ID);
  const animalCoats = document.querySelector(ANIMAL_COAT_ID);
  const animalBreeds = document.querySelector(ANIMAL_BREED_ID);

  clearChildren(animalColors);
  clearChildren(animalCoats);
  clearChildren(animalBreeds);

  coats.forEach((coat) => {
    animalCoats.append(createCheckbox(coat, "coat"));
  });
  colors.forEach((color) => {
    animalColors.append(createCheckbox(color, "color"));
  });
  breeds.flat().forEach(({ name }) => {
    animalBreeds.append(createCheckbox(name, "breed"));
  });
}

function clearFilterTags() {
  const filterTags = document.querySelector(FILTER_TAGS_ID);
  clearChildren(filterTags);
}

function updateFilterTags(params) {
  clearFilterTags();
  for (const [param, values] of params) {
    values.split(",").forEach((p) => {
      const tag = document.createElement("a");
      tag.classList = "control";
      tag.innerHTML = `
      <div class="control">
        <div class="tags has-addons">
          <a class="tag is-link">${isNaN(p) ? p : param}</a>
          <a class="tag is-delete"></a>
        </div>
      </div>`;
      tag.addEventListener("click", removeFilterTag);
      filterTags.append(tag);
    });
  }
}

function removeFilterTag(e) {
  const tag = e.target.closest(".control");
  const param = tag.querySelector(".tag.is-link").textContent;
  const filterForm = document.querySelector(`${FILTER_MODAL_ID} form`);
  const boxes = Array.from(
    filterForm.querySelectorAll(`input[type=checkbox]:checked`)
  );
  const boxToUncheck = boxes.find((b) => b.value === param || b.name === param);
  boxToUncheck.checked = false;
  tag.remove();
  filterForm.requestSubmit();
}

function toggleDisableAllButtons() {
  document
    .querySelectorAll("button, a")
    .forEach((el) => el.classList.toggle("disabled-anchor"));
}

function getCurrentResultParams() {
  const searchResults = document.querySelector(SEARCH_RESULTS_ID);
  const oldParams = searchResults.getAttribute(RESULTS_PARAMS_ATTRIB);
  return new URLSearchParams(oldParams);
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
        ${animal.distance ? `<p>${animal.distance.toFixed(1)} miles</p>` : ""}
      </div>
    </div>
  </div>
  `;
  return col;
}

function createCheckbox(value, inputName) {
  const checkboxField = document.createElement("div");
  checkboxField.classList.add("field");
  checkboxField.innerHTML = `
    <div class="control">
      <label class="checkbox">
        <input type="checkbox" value="${value}" name="${inputName}"/>
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
    pagNav.classList.add("is-hidden");
    return;
  }
  pagNav.classList.remove("is-hidden");

  // Destructure pagination data.
  const { current_page: current, total_pages: total } = pagination;

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

async function getPetFinderData(url) {
  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
}

/**
 * Token request to our server.
 */
async function getAuthHeaders() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

async function getAccessToken() {
  // See if it always exists in local storage.
  const appData = getAppData();
  if (!isTokenValid(appData)) {
    appData.auth = await getNewAccessToken();
    saveAppData(appData);
  } else {
  }
  return appData.auth.access_token;
}

async function getNewAccessToken() {
  // "http://127.0.0.1:5000/token"
  const url = "https://petsg.xyz/api/petshelf/token";
  const res = await fetch(url);
  const { data, success } = await res.json();
  return data;
}

// Has token and it has not expired.
function isTokenValid(auth) {
  return auth && Date.now() < auth.expires_at;
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
