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
    const accessToken = await fetchClientCredentialsToken();
    if (!accessToken) {
      alert("Failed to retrieve access token. Please try again later.");
      return;
    }


    // Song Recommendation function
    const songs = await getSongRecommendations(bpm, genre, accessToken);
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

      // Add song URI to `recommendedSongs` if not already included
    if (!recommendedSongs.some((s) => s.uri === song.uri)) {
      recommendedSongs.push({
        uri: song.uri,
        name: song.name,
        artists: song.artists.map((artist) => artist.name).join(", "),
      });
    }

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
  const clientId = "e7496cf650b2433a823ee3858e60c259";
  const clientSecret = "df513d014f5c4275a94ad91e4f9b97f9";
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

// Using Spotify API for songs
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

  // Populate the global `recommendedSongs` array with the track URIs
  recommendedSongs = data.tracks.map((track) => ({
    uri: track.uri, // Required for adding to playlists
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(", "),
  }));

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


//Playlist Spotify API functions
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("create-playlist-button").addEventListener("click", createAndRedirectPlaylist);

  async function createAndRedirectPlaylist() {
      const accessToken = await getAccessToken();
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
      
      // Check if the playlist already exists
      const existingPlaylistId = await findExistingPlaylist(accessToken, userId, playlistName);

      let playlistId;

      if (existingPlaylistId) {
        console.log(`Found existing playlist with ID: ${existingPlaylistId}`);
        playlistId = existingPlaylistId;
      } 
      else {
        // Create a new playlist if it doesn't exist
        playlistId = await createSpotifyPlaylist(accessToken, userId, playlistName);
        if (!playlistId) {
          alert("Failed to create playlist.");
          return;
        }
      }

      if (!recommendedSongs.length) {
        alert("No songs available to add to the playlist.");
        return;
      }

      const trackUris = recommendedSongs.map(song => song.uri);
      await overwritePlaylistTracks(accessToken, playlistId, trackUris);

      window.location.href = `https://open.spotify.com/playlist/${playlistId}`;
  }

  async function findExistingPlaylist(accessToken, userId, playlistName) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      if (!response.ok) {
        console.error("Error fetching playlists:", response.statusText);
        return null;
      }
  
      const data = await response.json();
      const existingPlaylist = data.items.find((playlist) => playlist.name === playlistName);
  
      return existingPlaylist ? existingPlaylist.id : null;
    } catch (error) {
      console.error("Failed to find existing playlist:", error);
      return null;
    }
  }

  async function clearPlaylistTracks(accessToken, playlistId) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "PUT", // Use the PUT method to overwrite tracks
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [] }), // Send an empty array to clear tracks
      });
  
      if (!response.ok) {
        console.error("Error clearing playlist tracks:", response.statusText);
        return false;
      }
  
      console.log("Playlist cleared successfully");
      return true;
    } catch (error) {
      console.error("Failed to clear playlist tracks:", error);
      return false;
    }
  }

  // Add tracks to a playlist after clearing it
  async function overwritePlaylistTracks(accessToken, playlistId, trackUris) {
    // Clear existing tracks
    const cleared = await clearPlaylistTracks(accessToken, playlistId);
    if (!cleared) {
      console.error("Failed to clear the playlist before overwriting.");
      return;
    }

    // Add new tracks
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: trackUris }),
      });

      if (!response.ok) {
        console.error("Error adding tracks to playlist:", response.statusText);
      } else {
        console.log("Tracks added successfully");
      }
    } catch (error) {
      console.error("Failed to add tracks to playlist:", error);
    }
  }
  //Find existing playlist
  async function findExistingPlaylist(accessToken, userId, playlistName) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?limit=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        console.error("Error fetching playlists:", response.statusText);
        return null;
      }

      const data = await response.json();
      const existingPlaylist = data.items.find((playlist) => playlist.name === playlistName);

      return existingPlaylist ? existingPlaylist.id : null;
    } catch (error) {
      console.error("Failed to find existing playlist:", error);
      return null;
    }
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

  // Retrieve Spotify user ID
  async function getSpotifyUserId(accessToken) {
    try {
        const response = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const rawText = await response.text();
        console.log("Raw Response from /v1/me:", rawText);

        if (!response.ok) {
            throw new Error(`Error fetching user ID: ${rawText}`);
        }

        const data = JSON.parse(rawText);
        return data.id;
    } catch (error) {
        console.error("Failed to fetch user ID:", error);
        return null;
    }
  }

  // Retrieve the token from the backend or localStorage
  async function getAccessToken() {
    try {
        const response = await fetch("http://localhost:5500/api/token");
        const rawResponse = await response.text();
        console.log("Raw Response:", rawResponse); // Log the raw response for debugging

        if (!response.ok) {
            console.error("Error retrieving access token:", rawResponse);
            return null;
        }

        const data = JSON.parse(rawResponse); // Parse the JSON response
        return data.accessToken;
    } catch (error) {
        console.error("Failed to fetch access token:", error);
        return null;
    }
  }
});






