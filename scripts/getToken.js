const express = require('express');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const port = 3000;

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_423351319439-0lk2skdlvnnv3unrjqf6hhorkil50kqu.apps.googleusercontent.com.json');

let oAuth2Client;

// 1. Cargar credenciales y configurar OAuth2
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.error('Error cargando credenciales:', err);
  const { client_secret, client_id, redirect_uris } = JSON.parse(content).web;

  oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000/oauth2callback'
  );
});

// 2. Página principal con botón
app.get('/', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.send(`
    <h2>Autenticación con Gmail</h2>
    <a href="${authUrl}">
      <button>Iniciar sesión con Google</button>
    </a>
  `);
});

// 3. Ruta para recibir el token después del consentimiento
app.get('/oauth2callback', (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send('No se recibió el código de autorización.');
  }

  oAuth2Client.getToken(code, (err, token) => {
    if (err) return res.send('Error obteniendo el token: ' + err.message);

    oAuth2Client.setCredentials(token);
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err) return res.send('Error guardando el token.');

      res.send('<h3>✅ Autenticación exitosa. Token guardado.</h3>');
    });
  });
});

app.listen(port, () => {
  console.log(`✅ Servidor web escuchando en http://localhost:${port}`);
});
