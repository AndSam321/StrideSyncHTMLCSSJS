const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.static("assets"));

const clientId = "401d63283cf74348b61eb45d0531a011";
const clientSecret = "7bb43d21dd3f43f0abca372dcd1a72f4";
const redirectUri = "http://127.0.0.1:5500/assets/pages/callback.html";

app.get("/getSpotifyToken", async (req, res) => {
    const code = req.query.code;
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri
        })
    });

    const data = await response.json();
    console.log("Spotify token response data:", data); // Log the response data

        if (response.ok) {
            res.json(data); // Send the token data to the client
        } else {
            res.status(response.status).json(data); // Send error details to the client
        }
});

app.listen(5500, () => {
    console.log("Server running on http://127.0.0.1:5500");
});