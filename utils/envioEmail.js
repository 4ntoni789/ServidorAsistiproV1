const nodemailer = require('nodemailer');
const actualizarCampoCorreoElectronico = require('./actualizarCampoEnvioCorreo.js');
const entradaTarde = require('../plantiallasCorreoElectronicos/entradaTarde.js');
const contratosPorVencerEmail = require('../plantiallasCorreoElectronicos/contratosPorVencer.js');
const forgotPassEmail = require('../plantiallasCorreoElectronicos/restablecerContrasena.js');

const enviarEmail = (inforEmpleado, datos, horario, tipoEnvio) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    let mailOptions;
    if (tipoEnvio === 'entradar-tarde') {
        actualizarCampoCorreoElectronico(datos.id_registro);
        mailOptions = entradaTarde(inforEmpleado, process, horario, datos);
    } else if (tipoEnvio === 'contratos-por-vencer') {
        mailOptions = contratosPorVencerEmail(inforEmpleado, process, datos);
    } else if (tipoEnvio === 'restablecer-contrasena') {
        mailOptions = forgotPassEmail(inforEmpleado, process);
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('❌ Error al enviar:', error);
        }
        console.log('✅ Correo enviado:', info.response);
    });
}

module.exports = enviarEmail;