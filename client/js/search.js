const API_KEY = "";
const API_SECRET = "";
const LS_KEY = "petshelf-data";

const searchForm = document.getElementById("searchForm");

searchForm.addEventListener("submit", handleSearchSubmit);

function handleSearchSubmit(e) {
  e.preventDefault();
  const input = e.target.elements.searchInput.value;
  getAnimals(input);
}

function getAnimals(input) {
  const token = getAccessToken();
}

async function getAccessToken() {
  // See if it always exists in local storage.
  const appData = getAppData();
  if (!appData.auth) {
    appData.auth = await getNewAccessToken();
    saveAppData(appData);
  } else {
    console.log("Already have a token!");
  }
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
