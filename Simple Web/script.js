document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".song-form");
  const songInput = form.querySelector("input");
  const searchResults = document.querySelector("#search-results");
  const trackStatus = document.querySelector("#track-status");
  const trackInfo = document.querySelector("#track-info");
  var reproduciendo = false;

  const API_BASE_URL = "https://spotify-api-csb8.onrender.com/spotify";

  // Función para mostrar la canción actual
  async function loadCurrentTrack() {
    try {
      const response = await fetch(`${API_BASE_URL}/current-track`);
      const data = await response.json();
      if (data.name) {
        trackStatus.textContent = `Actualmente escuchando: ${data.name}`;
        trackInfo.innerHTML = `
          <img src="${data.image.url}" alt="${data.name}" width="100" /> <!-- Tamaño reducido para evitar borrosidad -->
          <p>Artista: ${data.artista}</p>
        `;

        
        const progressBar = document.createElement("progress");
        progressBar.value = data.progress / data.duration;
        progressBar.max = 1;
        trackInfo.appendChild(progressBar);
        reproduciendo = true;
        setInterval(async () => {
          
          const updatedData = await fetch(`${API_BASE_URL}/current-track`).then(res => res.json());
          progressBar.value = updatedData.progress / updatedData.duration;
          if(updatedData.progress+2000>updatedData.duration)
             setTimeout(() => location.reload(), 2000);
        }, 1000);

      } else {
        trackStatus.textContent = "En este momento no estoy escuchando nada, puedes recomendarme musica por IG: Al3x.jar :)";
         reproduciendo=false;
        trackInfo.innerHTML = "";
      }
    } catch (error) {
      trackStatus.textContent = "Error al cargar la información de la canción actual.";
      console.error(error);
    }
  }


  async function searchSongs(query) {
    const forbiddenWords = ["xxx", "gemidos", "porno", "grito", "screamer", "gemido"];
    const lowerCaseQuery = query.toLowerCase();
     if (!reproduciendo) {
      alert("Solo puedes recomendar mientras estoy escuchando musica :(");
      setTimeout(() => location.reload(), 200);
      return;
    }

    if (forbiddenWords.some(word => lowerCaseQuery.includes(word))) {
      alert("No pongas eso :)");
      setTimeout(() => location.reload(), 1000); 
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/search?type=track&limit=1&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      searchResults.innerHTML = `
        <div class="song">
          <img src="${data.image.url}" alt="${data.name}" width="64" />
          <p>${data.name} - ${data.artista}</p>
          <button data-song-id="${data.id}">Agregar a la cola</button>
        </div>
      `;

      // Asignar el evento al botón de agregar a la cola
      const addButton = searchResults.querySelector("button");
      addButton.addEventListener("click", () => {
        const songId = addButton.getAttribute("data-song-id");
        addSong(songId);
      });
    } catch (error) {
      searchResults.innerHTML = "Error al buscar canciones.";
      console.error(error);
    }
  }

  async function addSong(songId) {
    try {
      console.log(`Intentando agregar la canción con ID ${songId} a la cola.`);
      const response = await fetch(`${API_BASE_URL}/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ track: songId }) 
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === "ok") {
          alert("Canción agregada a la cola.");
          setTimeout(() => location.reload(), 3000); 
        } else {
          alert("Error al agregar la canción a la cola: " + (result.error || "Desconocido"));
        }
      } else {
        alert("Error al agregar la canción a la cola.");
      }
    } catch (error) {
      alert("Error al agregar la canción.");
      console.error(error);
    }
  }


  form.addEventListener("submit", event => {
    event.preventDefault();
    const query = songInput.value.trim();
    if (query) {
      searchSongs(query);
    }
  });

 
  loadCurrentTrack();
});
