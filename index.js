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

// Default route redirects to /login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Login route
app.get("/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-top-read",
    "playlist-modify-public",
    "playlist-modify-private",
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Spotify callback route
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
    console.log("Granted Scopes:", data.body.scope);

    // Redirect to the main app page
    res.redirect("/pages/index.html");

    // Refresh access token periodically
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

// Search route
app.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const searchData = await spotifyApi.searchTracks(q);
    const trackUri = searchData.body.tracks.items[0].uri;
    res.send({ uri: trackUri });
  } catch (err) {
    console.error("Search Error:", err);
    res.send("Error occurred during search");
  }
});

// Middleware to enforce authentication
app.use((req, res, next) => {
  const publicPaths = ["/login", "/callback"];
  if (!spotifyApi.getAccessToken() && !publicPaths.includes(req.path)) {
    res.redirect("/login");
  } else {
    next();
  }
});

// Fetch user profile
app.get("/api/profile", async (req, res) => {
  try {
    const userProfileResponse = await spotifyApi.getMe();
    res.json(userProfileResponse.body);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Fetch top artists
app.get("/api/top-artists", async (req, res) => {
  try {
    if (!spotifyApi.getAccessToken()) {
      console.error("No access token available");
      return res.status(401).json({ error: "Access token missing or expired" });
    }

    const topArtistsResponse = await spotifyApi.getMyTopArtists({ limit: 3 });

    if (!topArtistsResponse.body || !topArtistsResponse.body.items) {
      return res.status(404).json({ error: "No artists found" });
    }

    res.json(topArtistsResponse.body.items);
  } catch (error) {
    console.error("Error fetching top artists:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch top artists", details: error.message });
  }
});

// Fetch or refresh access token
app.get("/api/token", async (req, res) => {
  try {
    let accessToken = spotifyApi.getAccessToken();

    // Refresh the token if it has expired
    if (!accessToken) {
      const refreshData = await spotifyApi.refreshAccessToken();
      accessToken = refreshData.body["access_token"];
      spotifyApi.setAccessToken(accessToken);
    }

    res.json({ accessToken });
  } catch (error) {
    console.error("Error fetching or refreshing token:", error);
    res.status(500).json({ error: "Failed to retrieve access token" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
