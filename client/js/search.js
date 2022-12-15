const API_KEY = "";
const API_SECRET = "";
const API_BASE_URL = "https://api.petfinder.com/v2";
const AUTH = "/oauth2/token";
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
  const data = getAppData();
  if (!data.auth) {
    await getNewAccessToken();
    console.log(data);
  } else {
    console.log("Already have a token!");
  }
}

function getAppData() {
  return JSON.parse(localStorage.getItem(LS_KEY)) || {};
}

async function getNewAccessToken() {
  console.log("Getting new token...");
  const res = await fetch(`${API_BASE_URL}${AUTH}`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: API_KEY,
      client_secret: API_SECRET,
    }),
  });

  const data = await res.json();
  const appData = getAppData();
  appData.auth = data;
  saveAppData(appData);
}

function saveAppData(appData) {
  localStorage.setItem(LS_KEY, JSON.stringify(appData));
}
