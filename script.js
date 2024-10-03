// Handle form submission
document.getElementById("run-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get user inputs
    const heightFeet = document.getElementById("height-feet").value; // height in feet
    const heightInches = document.getElementById("height-inches").value; // height in inches
    const speed = document.getElementById("speed").value; // speed in mph
    const genre = document.getElementById("genre").value;

    // Calculate total height in inches
    const totalHeight = parseInt(heightFeet) * 12 + parseInt(heightInches);

    // Calculate BPM
    const bpm = calculateBpm(totalHeight, speed);
    console.log("Calculated BPM:", bpm);
    document.getElementById("bpm-display").innerText = bpm; // Display BPM

    // Get song recommendations
    const songs = await getSongRecommendations(bpm, genre);

    // Display the song list
    const songList = document.getElementById("recommended-songs");
    songList.innerHTML = ""; // Clear the previous list

    const trackIds = songs.map((song) => song.id);
    const audioFeatures = await fetchAudioFeatures(trackIds);

    audioFeatures.forEach((feature, index) => {
        const song = songs[index];

        // Create a list item
        const li = document.createElement("li");

        // For Each song, create an anchor element
        const a = document.createElement("a");
        a.textContent = `${song.name} by ${song.artists.map((artist) => artist.name).join(", ")} - Tempo: ${feature.tempo}`;

        // Set the href to Spotify's track URL
        a.href = song.external_urls.spotify;
        a.target = "_blank"; // Opens in a new tab

        // Append element to the list of songs
        li.appendChild(a);

        // Append the list item to the song list
        songList.appendChild(li);
    });
});

// Handle the Calculate BPM button click
document.getElementById("calculate-bpm").addEventListener("click", function() {
    const heightFeet = document.getElementById("height-feet").value; // height in feet
    const heightInches = document.getElementById("height-inches").value; // height in inches
    const speed = document.getElementById("speed").value; // speed in mph

    // Calculate total height in inches
    const totalHeight = parseInt(heightFeet) * 12 + parseInt(heightInches);

    // Calculate BPM
    const bpm = calculateBpm(totalHeight, speed);
    console.log("Calculated BPM:", bpm);
    document.getElementById("bpm-display").innerText = bpm; // Display BPM
});
