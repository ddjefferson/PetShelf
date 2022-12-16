"use strict";
const API_KEY = "";
const API_SECRET = "";
const LS_KEY = "petshelf-data";
const PETFINDER_URL = "https://api.petfinder.com/v2";

const ANIMALS_URI = "/animals";
const ANIMAL_TYPES_URI = "/types";
const ANIMAL_BREEDS_URI = "/breeds";

const searchForm = document.getElementById("searchForm");

searchForm.addEventListener("submit", handleSearchSubmit);

async function handleSearchSubmit(e) {
  e.preventDefault();
  const input = e.target.elements.searchInput.value;
  // const animals = await getAnimals();
  // const dogs = await getAnimals({ type: "Dogs" });
  // const animal = await getAnimalById(59179795);
  // const types = await getAnimalTypes();
  // const type = await getSingleAnimalType("Dog");
  // const breed = await getAnimalBreeds("Dog");
  console.log(breed);
}

//
async function getAnimals(params) {
  // Prepare URL
  const url = new URL(`${PETFINDER_URL}${ANIMALS_URI}`);
  url.params = new URLSearchParams(params);

  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
}

async function getAnimalById(id) {
  // Prepare URL
  const url = new URL(`${PETFINDER_URL}${ANIMALS_URI}/${id}`);

  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
}

async function getAnimalTypes() {
  // Prepare URL
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}`;

  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
}

async function getSingleAnimalType(type) {
  // Prepare URL
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}/${type}`;

  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
}

async function getAnimalBreeds(type) {
  // Prepare URL
  const url = `${PETFINDER_URL}${ANIMAL_TYPES_URI}/${type}${ANIMAL_BREEDS_URI}`;
  // Prepare headers
  const headers = await getAuthHeaders();

  // Get the data
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data;
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
