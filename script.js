const clientId = "e91849cdad7b49eb8fb76ea40b4950ba";
const redirectUri = "http://127.0.0.1:5500"; // Spotify redirect URI after authentication
let accessToken = ""; // Store the access token here after authentication

// Function to calculate the estimated BPM
function calculateBpm(height, speed) {
  const strideLength = height * 0.413; // Average stride length in meters (conversion factor for inches)
  const speedInMetersPerMinute = (speed * 1609.34) / 60;
  const stepsPerMinute = speedInMetersPerMinute / strideLength;
  const bpm = Math.round(stepsPerMinute);
  return Math.max(60, Math.min(bpm, 200)); // Ensure BPM is in the range [60, 200]
}

// Function to authenticate and get Spotify access token
function authenticateSpotify() {
  const scopes = "user-read-private user-read-email";
  const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location = authUrl; // Redirect to Spotify login
}

// Function to fetch song recommendations from Spotify
async function getSongRecommendations(bpm, genre) {
  const endpoint = `https://api.spotify.com/v1/recommendations?seed_genres=${genre}&limit=20&target_tempo=${bpm}`;
  console.log("Fetching from endpoint:", endpoint);

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!data.tracks || data.tracks.length === 0) {
    console.error("No tracks found");
    return [];
  }

  return data.tracks;
}

// Function to fetch audio features for the recommended songs
async function fetchAudioFeatures(trackIds) {
  const audioFeatures = [];

  for (const id of trackIds) {
    const response = await fetch(
      `https://api.spotify.com/v1/audio-features/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      audioFeatures.push(data);
    } else {
      console.error(
        `Error fetching audio features for ID ${id}:`,
        response.statusText
      );
    }
  }

  return audioFeatures;
}

// Handle form submission
document
  .getElementById("run-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get user inputs
    const height = document.getElementById("height").value; // height in inches
    const speed = document.getElementById("speed").value; // speed in mph
    const genre = document.getElementById("genre").value;

    // Calculate BPM
    const bpm = calculateBpm(height, speed);
    console.log("Calculated BPM:", bpm);
    console.log("Genre:", genre);

    // Get song recommendations
    const songs = await getSongRecommendations(bpm, genre);

    // Display the song list
    const songList = document.getElementById("recommended-songs");
    songList.innerHTML = ""; // Clear the previous list

    const trackIds = songs.map((song) => song.id);
    const audioFeatures = await fetchAudioFeatures(trackIds);

    audioFeatures.forEach((feature, index) => {
      const song = songs[index];
      const li = document.createElement("li");
      li.textContent = `${song.name} by ${song.artists
        .map((artist) => artist.name)
        .join(", ")} - Tempo: ${feature.tempo}`;
      songList.appendChild(li);
    });
  });

// If the user is redirected back after Spotify authentication, extract the access token
if (window.location.hash) {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  accessToken = params.get("access_token");
  console.log("Access Token:", accessToken); // Check if it's being set
}

// Redirect to authenticate if no token is available
if (!accessToken) {
  authenticateSpotify(); // Redirect to Spotify for authentication
}

console.log("Access Token:", accessToken); // Check if it's being set before API calls
