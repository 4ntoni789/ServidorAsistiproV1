const { sql, config, poolPromise } = require('../config/db.js');
const agruparRegistrosPorDia = require('../scripts/filtroEntradas.js');
const obtener_registros_consolidados = require('../sqlConsult/procedures.js');
const empleadosMarcaciones = require('../globals/empleadosMarcaciones.js');


const revisarClasificacionMarcaciones = async () => {
    try {
        const pool = await poolPromise;
        const empleadosResult = await pool.request().query('SELECT * FROM Empleados');
        const empleados = empleadosResult.recordset;

        const accesosResult = await pool.request().query(obtener_registros_consolidados);
        const accesos = accesosResult.recordset;

        const horarioResult = await pool.request().query('SELECT * FROM Horarios');
        const horarios = horarioResult.recordset;

        const accesosPorEmpleado = accesos.reduce((acc, acceso) => {
            const numero = acceso.numero_empleado;
            if (!acc[numero]) acc[numero] = [];
            acc[numero].push(acceso);
            return acc;
        }, {});

        const resultadoFinal = empleados.map(empleado => {
            const registrosDesordenado = agruparRegistrosPorDia(accesosPorEmpleado[empleado.id_empleado] || [], horarios, empleado);
            const registros = registrosDesordenado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            return {
                ...empleado,
                registros
            };
        });

        empleadosMarcaciones.set(1, resultadoFinal);

    } catch (error) {
        console.error(error);
        // res.status(500).send('Error al fusionar empleados con accesos');
    }
}

module.exports = revisarClasificacionMarcaciones;