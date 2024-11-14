require("dotenv").config();
const express = require("express");
const path = require("path");
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();
const port = 5500;

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

// Static Files
app.use(express.static(path.join(__dirname, "/assets")));

app.get("/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-top-read",
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.send("Missing authorization code");
    return;
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];
    const refreshToken = data.body["refresh_token"];
    const expiresIn = data.body["expires_in"];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    console.log("Access token:", accessToken);
    console.log("Refresh token:", refreshToken);

    // Redirect to the index.html
    res.redirect("/pages/index.html");

    // Periodically to avoid expiration
    setInterval(async () => {
      try {
        const refreshData = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(refreshData.body["access_token"]);
      } catch (refreshError) {
        console.error("Error refreshing access token:", refreshError);
      }
    }, (expiresIn / 2) * 1000);
  } catch (error) {
    console.error("Error getting tokens:", error);
    res.send("Error during callback");
  }
});

app.get("/search", (req, res) => {
  // Search parameter
  const { q } = req.query;
  spotifyApi
    .searchTracks(q)
    .then((searchData) => {
      // Extract the URI of the first track from the search results
      const trackUri = searchData.body.tracks.items[0].uri;
      // Send the track URI back to the client
      res.send({ uri: trackUri });
    })
    .catch((err) => {
      console.error("Search Error:", err);
      res.send("Error occurred during search");
    });
});

// Checking if token is set before profile extract
function ensureAuthenticated(req, res, next) {
  if (spotifyApi.getAccessToken()) {
    return next();
  }
  res.redirect("/login");
}

app.get("/api/profile", async (req, res) => {
  try {
    const userProfileResponse = await spotifyApi.getMe();
    res.json(userProfileResponse.body);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

app.get("/api/top-artists", async (req, res) => {
  try {
    console.log("Fetching top artists...");
    if (!spotifyApi.getAccessToken()) {
      console.error("No access token available");
      return res.status(401).json({ error: "Access token missing or expired" });
    }

    const topArtistsResponse = await spotifyApi.getMyTopArtists({ limit: 3 });

    if (!topArtistsResponse.body || !topArtistsResponse.body.items) {
      console.error("No artists found in the response");
      return res.status(404).json({ error: "No artists found" });
    }

    console.log(
      "Top artists fetched successfully:",
      topArtistsResponse.body.items
    );
    res.json(topArtistsResponse.body.items);
  } catch (error) {
    console.error("Error fetching top artists:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch top artists", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
