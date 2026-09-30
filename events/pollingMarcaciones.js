const { poolPromise } = require('../config/db.js');
const { enviarNotificacion } = require('../utils/envioNotificacionSse.js');
const obtenerUltimosAccesosDeHoy = require('../scripts/obtenerUltimosAccesosDeHoy.js');
const obtenerUltimosAccesosDeAyer = require('../scripts/obtenerUltimosRegistrosDeAyer.js')
const marcacionesAyerHoy = require('../globals/marcacionesAyerHoy.js');

const revisarNuevosRegistros = async () => {
    try {
        const pool = await poolPromise;
        const resultado = await pool.request().query(`EXEC procesar_nuevos_registros`);
        const accesos = await pool.request().query('EXEC obtener_registros_consolidado');

        if (resultado.recordset.length > 0) {
            enviarNotificacion(null, "nuevas-marcaciones", {
                texto: "¡Tienes nuevas marcaciones por ver!",
                // detalles: `Nombre:`,
                fecha: new Date().toISOString()
            });

            console.log("✅ Registros insertados:");
            console.table(resultado.recordset);
        }
        marcacionesAyerHoy.set(1, {
            ayer: obtenerUltimosAccesosDeAyer(accesos.recordset),
            hoy: obtenerUltimosAccesosDeHoy(accesos.recordset)
        })
    } catch (error) {
        console.error("❌ Error al revisar registros:", error.message);
    }
};


module.exports = revisarNuevosRegistros;