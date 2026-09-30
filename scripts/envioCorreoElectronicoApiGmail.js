const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Rutas a los archivos
const CREDENTIALS_PATH = path.join(__dirname, '../client_secret_423351319439-0lk2skdlvnnv3unrjqf6hhorkil50kqu.apps.googleusercontent.com.json');
const TOKEN_PATH = path.join(__dirname, '../token.json');

// Cargar las credenciales
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

const { client_secret, client_id, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
);

// Establecer las credenciales
oAuth2Client.setCredentials(token);

// Crear el cliente de Gmail
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Crear un mensaje en formato RFC 5322 codificado en base64url
function createMessage(to, subject, body) {
    const message = [
        `To: ${to}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        body,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return encodedMessage;
}

// Enviar el correo
const sendEmail = async () => {
    const time = new Date;
    const raw = createMessage(
        'antonyparra789@gmail.com',   // Cambia esto por el destinatario real
        'Asunto del correo',
        'Hola, este es un mensaje enviado desde Gmail API usando Node.js.'
    );

    try {
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: raw,
            },
        });

        console.log('✅ Correo enviado:', response.data.id, ' ', time);
    } catch (error) {
        console.error('❌ Error al enviar el correo:', error.message);
    }
}

module.exports = sendEmail;