const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "secrets.env"),
});
const app = express().use(cors()).use(express.json()); 
const port = process.env.PORT || 20202; 

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "¡Hola! Esta es mi API REST",
    rutas: [
      {
        url: "/spotify",
        info: "Información sobre mi Spotify.",
    ],
  });
});

//Rutas para spotify
app.use("/spotify", require("./src/spotify"));

app.listen(port, () => {
  console.log("Escuchando en el puerto " + port);
});
