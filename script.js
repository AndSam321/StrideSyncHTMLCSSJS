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

    // Calculating the Total Height to Inches to work easier with
    const totalHeight = parseInt(heightFeet) * 12 + parseInt(heightInches);

    // Calculate BPM
    const bpm = calculateBpm(totalHeight, speed);
    console.log("Calculated BPM:", bpm);
    document.getElementById("bpm-display").innerText = bpm;

    // Spotify Access Token
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      console.error("Failed to retrieve access token.");
      return;
    }

    // Song Recommendation function
    const songs = await getSongRecommendations(bpm, genre, accessToken);
    if (!songs.length) {
      console.error("No songs were found.");
      return;
    }

    // Displaying the songs, mapping each ID to the song
    const songList = document.getElementById("recommended-songs");
    songList.innerHTML = "";

    const trackIds = songs.map((song) => song.id);
    const audioFeatures = await fetchAudioFeatures(trackIds, accessToken);

    audioFeatures.forEach((feature, index) => {
      const song = songs[index];

      // Creating the List for the songs
      const li = document.createElement("li");

      // Displaying the image of the album for each song
      const img = document.createElement("img");
      img.src = song.album.images[0].url; // Use the first image from the album's images
      img.alt = `${song.name} Album Art`;
      img.style.width = "50px"; // Set width for the image
      img.style.height = "50px"; // Set height for the image
      img.style.marginRight = "10px";

      // Anchor Element for each song
      const a = document.createElement("a");
      a.textContent = `${song.name} by ${song.artists
        .map((artist) => artist.name)
        .join(", ")} - Tempo: ${feature.tempo}`;
      a.href = song.external_urls.spotify;
      a.target = "_blank"; // Opens in a new tab

      // Append the image and anchor element to the list item
      li.appendChild(img); // Add image to list item
      li.appendChild(a); // Add song link to list item
      songList.appendChild(li);
    });
  });

// Calculating BPM
function calculateBpm(height, speed) {

  return Math.round((1056 * speed) / (height / 2) * (1.49 + (-0.101 * speed))); // Change formula here if needed
}

// Fetch Spotify Access Token
async function getSpotifyAccessToken() {
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
  console.log(
    `Fetching recommendations for BPM: ${bpm} and Genre: ${genre}...`
  );
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
  const url = `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(
    ","
  )}`;

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
