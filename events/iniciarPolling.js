const mostrarOjitos = require('../scripts/animacionVigilancia.js');
const revisarClasificacionMarcaciones = require('./pollingClasificacion.js');
const revisarNuevosRegistros = require('./pollingMarcaciones.js');
const revisarContratosAVencer = require('./pollingContratosAVencer.js');
const cron = require('node-cron');

const iniciarPolling = () => {
    mostrarOjitos();
    setInterval(revisarNuevosRegistros, 5000);
    setInterval(revisarClasificacionMarcaciones, 5000);
    // Ejecutar ya mismo
    setTimeout(() => {
        revisarContratosAVencer();
    }, 5000)
    // Ejecutar todos los días a las 8:00 AM Bogotá
    cron.schedule('20 8 * * *', revisarContratosAVencer, { timezone: 'America/Bogota' });
};

module.exports = iniciarPolling;
