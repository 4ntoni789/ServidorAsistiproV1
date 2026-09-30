const { poolPromise } = require('../config/db.js');
const marcacionesAyerHoy = require('../globals/marcacionesAyerHoy.js');


exports.getAccesosAyer = async (req, res) => {
    try {
        // if (marcacionesAyerHoy.get(1) == undefined) {
        // }
        marcacionesAyerHoy.get(1) ? res.json(marcacionesAyerHoy.get(1).ayer) : null
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
}

exports.getAccesosDia = async (req, res) => {
    try {
        // if (marcacionesAyerHoy.get(1) == undefined) {
        // }

        marcacionesAyerHoy.get(1) ? res.json(marcacionesAyerHoy.get(1).hoy) : null
    } catch (err) {
        console.error(err);
        res.status(500).send('Error en la base de datos');
    }
}
