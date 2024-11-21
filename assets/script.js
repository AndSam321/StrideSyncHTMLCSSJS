//GLOBAL VARIABLES *NOT RECOMMENDED*
let recommendedSongs = [];


// Accessing the DOM
document
  .getElementById("run-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // User Input from the form
    const heightFeet = document.getElementById("height-feet").value;
    const heightInches = document.getElementById("height-inches").value;
    const speed = document.getElementById("speed").value;
    const genre = document.getElementById("genre").value;

    // Input validation
    if (!heightFeet || !heightInches || !speed || !genre) {
      alert("Please fill out all fields.");
      return;
    }
    
    if (isNaN(heightFeet) || isNaN(heightInches) || isNaN(speed)) {
      alert("Height and speed must be numeric values.");
      return;
    }

    // Calculating the Total Height to Inches to work easier with
    const totalHeight = parseInt(heightFeet) * 12 + parseInt(heightInches);

    // Calculate BPM
    const bpm = calculateBpm(totalHeight, speed);
    console.log("Calculated BPM:", bpm);
    document.getElementById("bpm-display").innerText = bpm;

    // Spotify Access Token
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      alert("Failed to retrieve access token. Please try again later.");
      return;
    }


    // Song Recommendation function
    const songs = await getSongRecommendations(bpm, genre, clientCedentialsToken);
    if (!songs.length) {
      alert("No songs found matching your preferences.");
      return;
    }

    // Displaying the songs in the table
    const songTableBody = document.getElementById("recommended-songs-table").querySelector("tbody");
    songTableBody.innerHTML = ""; // Clear existing table rows

    const trackIds = songs.map((song) => song.id);
    const audioFeatures = await fetchAudioFeatures(trackIds, accessToken);

    audioFeatures.forEach((feature, index) => {
      const song = songs[index];

      // Creating a new row for each song
      const row = document.createElement("tr");

      // Album Art Cell
      const albumArtCell = document.createElement("td");
      const img = document.createElement("img");
      img.src = song.album.images[0].url; // Use the first image from the album's images
      img.alt = `${song.name} Album Art`;
      img.style.width = "50px";
      img.style.height = "50px";
      albumArtCell.appendChild(img);

      // Song Name and Artist Cell
      const songCell = document.createElement("td");
      const songLink = document.createElement("a");
      songLink.textContent = song.name;
      songLink.href = song.external_urls.spotify;
      songLink.target = "_blank"; // Opens in a new tab
      songLink.style.color = "#1DB954"; // Spotify green color for link
      songLink.style.textDecoration = "none";
      songCell.appendChild(songLink);

      // Artist Cell
      const artistCell = document.createElement("td");
      artistCell.textContent = song.artists.map((artist) => artist.name).join(", ");

      // Tempo Cell
      const tempoCell = document.createElement("td");
      tempoCell.textContent = feature.tempo.toFixed(1); // Rounding to 1 decimal point

      // Append all cells to the row
      row.appendChild(albumArtCell);
      row.appendChild(songCell);
      row.appendChild(artistCell);
      row.appendChild(tempoCell);

      // Append the row to the table body
      songTableBody.appendChild(row);
    });
  });

// Calculating BPM
function calculateBpm(height, speed) {
  return Math.round((2 * (speed / height) * 1056 * 105) / 88); // Change formula here if needed
}

async function getSpotifyAccessToken() {
  const token = localStorage.getItem("spotifyAccessToken");
  if (token) return token;

  alert("Please log in to Spotify.");
  return null;
}



// Fetch Spotify Access Token
async function fetchClientCredentialsToken() {
  const clientId = "e91849cdad7b49eb8fb76ea40b4950ba";
  const clientSecret = "c121e3fa80274a0b906aa8eb4af0a6e8";
  const encodedCredentials = btoa(`${clientId}:${clientSecret}`);

  console.log("Fetching Spotify Access Token...");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  console.log("Access Token Data:", data);

  if (response.status !== 200) {
    console.error("Failed to fetch access token. Response:", data);
    return null;
  }

  return data.access_token;
}



// Using Spotify API
async function getSongRecommendations(bpm, genre, accessToken) {
  console.log(`Fetching recommendations for BPM: ${bpm} and Genre: ${genre}...`);
  const url = `https://api.spotify.com/v1/recommendations?seed_genres=${genre}&target_tempo=${bpm}&limit=10`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log("Response Status:", response.status);
  const data = await response.json();
  console.log("Recommended Songs Data:", data);

  if (response.status !== 200) {
    console.error("Failed to fetch song recommendations. Response:", data);
    return [];
  }

  return data.tracks;
}

// Audio Features of the songs to fetch the Tempo
async function fetchAudioFeatures(trackIds, accessToken) {
  console.log("Fetching audio features for track IDs:", trackIds);
  const url = `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(",")}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log("Response status for audio features:", response.status);
  const data = await response.json();
  console.log("Audio features data:", data);

  if (response.status !== 200) {
    console.error("Failed to fetch audio features. Response:", data);
    return [];
  }

  return data.audio_features;
}




document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("create-playlist-button").addEventListener("click", createAndRedirectPlaylist);

  async function createAndRedirectPlaylist() {
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
          alert("Failed to retrieve access token. Please try again later.");
          return;
      }

      const userId = await getSpotifyUserId(accessToken);
      if (!userId) {
          alert("Failed to retrieve Spotify user ID.");
          return;
      }

      const playlistName = "Your BPM Matched Playlist";
      const playlistId = await createSpotifyPlaylist(accessToken, userId, playlistName);
      if (!playlistId) {
          alert("Failed to create playlist.");
          return;
      }

      const trackUris = recommendedSongs.map(song => song.uri);
      await addTracksToPlaylist(accessToken, playlistId, trackUris);

      window.location.href = `https://open.spotify.com/playlist/${playlistId}`;
  }

  // Retrieve Spotify user ID
  async function getSpotifyUserId(accessToken) {
      const response = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await response.json();
      return response.status === 200 ? data.id : null;
  }

  // Create a new Spotify playlist
  async function createSpotifyPlaylist(accessToken, userId, playlistName) {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              name: playlistName,
              description: "Playlist generated based on your BPM preference",
              public: true
          })
      });
      const data = await response.json();
      return response.status === 201 ? data.id : null;
  }

  // Add tracks to the playlist
  async function addTracksToPlaylist(accessToken, playlistId, trackUris) {
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: "POST",
          headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ uris: trackUris })
      });
  }
});





