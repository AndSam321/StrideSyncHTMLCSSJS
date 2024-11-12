const express = require("express");
const fetch = require("node-fetch");
const app = express();

const clientId = "your_client_id";
const clientSecret = "your_client_secret";
const redirectUri = "http://127.0.0.1:5500/callback.html";

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
    res.json(data); // Return the token data to the client
});

app.listen(5500, () => {
    console.log("Server running on http://localhost:5500");
});