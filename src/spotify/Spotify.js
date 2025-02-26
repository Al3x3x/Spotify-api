const axios = require('axios');
const querystring = require('querystring');

const client_id = process.env.CLIENT_ID; 
const client_secret = process.env.CLIENT_SECRET;
const BASIC = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

class Spotify {
  constructor() {
    this.API_URL = "https://api.spotify.com/v1";
    this.BASIC_AUTH = BASIC;
    this.tokenExpires = 0;
    this.access_token = null;
    this.queued = {};
  }

  refreshToken() {
    return new Promise((resolve, reject) => {
   
      if (Date.now() < this.tokenExpires) {
        resolve(this.access_token);
        return;
      }
      const data = {
        grant_type: "refresh_token",
        refresh_token: REFRESH_TOKEN,
      };
  
      axios({
        method: "POST",
        url: "https://accounts.spotify.com/api/token",
        headers: {
          Authorization: "Basic " + this.BASIC_AUTH,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams(data).toString(),
      })
        .then(({ data }) => {
          if (data.access_token) {
            this.access_token = data.access_token;
            this.tokenExpires = (Number(data.expires_in) - 10) * 1000 + Date.now();
            resolve(data.access_token);
          } else {
            reject(new Error('No access token returned'));
          }
        })
        .catch((error) => {
          console.error('Error al obtener el token de acceso:', error.response ? error.response.data : error.message);
          reject(error);
        });
    });
  }
  


  /**
   * Función que nos dirá qué canción estoy
   * @returns Retornará un objeto con la información
   */
  async getCurrentTrack() {
    await this.refreshToken();

    try {
      const response = await axios.get(`${this.API_URL}/me/player/currently-playing`, {
        headers: {
          Authorization: "Bearer " + this.access_token,
        },
      });

      if (!response.data.item) {
        throw new Error("No se pudo recuperar el current track");
      }

      const { progress_ms: progress, is_playing, item } = response.data;
      const { duration_ms: duration, external_urls, id, name, artists, album } = item;
      const urlCancion = external_urls.spotify;
      const artista = artists[0].name;
      const image = album.images[album.images.length - 1];

      return {
        progress,
        is_playing,
        duration,
        url: urlCancion,
        id,
        name,
        artista,
        image,
      };
    } catch (error) {
      console.error('Error al obtener la canción actual:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  /**
   * Función que añadirá una canción a la lista de reproducción
   * @param {string} idTrack ID del track a añadir
   * @param {string} ip IP del usuario
   * @returns Retornará un objeto con la información
   */
  async addQueueTrack(idTrack, ip) {
    await this.refreshToken();

    try {
      const fecha = new Date().toISOString().slice(0, 10);

      if (!this.queued[fecha]) {
        this.queued[fecha] = [];
      }


      const response = await axios.post(`${this.API_URL}/me/player/queue`, null, {
        params: {
          uri: `spotify:track:${idTrack}`
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.access_token}`,
        },
      });

      if (response.status === 200) { // Verificar solo el código de estado 204
        this.queued[fecha].push(ip);
        return { status: "ok" };
      } else {
        return { error: "No se pudo añadir la canción." };
      }
    } catch (error) {
      console.error("Error al añadir la canción a la cola:", error.response ? error.response.data : error.message);
      throw error;
    }
  }

  /**
   * Función para buscar una canción
   * @param {string} search Texto para buscar la canción
   * @returns Retornará un objeto con la información
   */
  async searchTrack(search) {
    await this.refreshToken();

    try {
      const response = await axios.get(`${this.API_URL}/search`, {
        params: {
          type: "track",
          limit: 1,
          q: search
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + this.access_token,
        },
      });

      if (response.data.tracks && response.data.tracks.items.length > 0) {
        const item = response.data.tracks.items[0];
        const { duration_ms: duration, external_urls, id, name, artists, album } = item;
        const urlCancion = external_urls.spotify;
        const artista = artists[0].name;
        const image = album.images[album.images.length - 1];

        return {
          duration,
          url: urlCancion,
          id,
          name,
          artista,
          image,
        };
      } else {
        return { error: "No se encontró la canción" };
      }
    } catch (error) {
      console.error('Error al buscar la canción:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

module.exports = Spotify;
