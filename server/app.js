require("dotenv").config();
const express = require("express");
const axios = require("axios");

const { CLIENT_ID, CLIENT_SECRET, API_URL, PORT } = process.env;
const AUTH_URI = "/oauth2/token";

const app = express();

if (process.env.NODE_ENV === "development") {
  const cors = require("cors");
  corsOptions = { origin: "http://127.0.0.1:5500" };

  app.use(cors(corsOptions));
}

app.get("/token", async (req, res) => {
  const config = {
    headers: { "Accept-Encoding": "gzip,deflate,compress" },
  };

  const URL = `${API_URL}${AUTH_URI}`;
  // Credentials
  const params = {
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  try {
    const response = await axios.post(URL, params, config);
    response.data.expires_at = Date.now() + response.data.expires_in;
    delete response.data.expires_in;
    res.status(200).send({ success: true, data: response.data });
  } catch (e) {
    console.log(e);
    console.log("Something went wrong");
    res.status(500).send({ success: false, data: {} });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
