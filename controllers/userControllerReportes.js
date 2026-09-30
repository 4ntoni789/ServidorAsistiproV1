const { sql, config } = require('../config/db.js');
const agruparRegistrosPorDia = require('../scripts/filtroEntradas.js');
const obtener_registros_consolidados = require('../sqlConsult/procedures.js');
const generarExcel = require('../utils/generarExcel.js');
const generarPDF = require('../utils/generarPdf.js');
// const { DBFFile } = require('dbffile'); 



exports.postGenerarReportes = async (req, res) => {
    const { fecha_ini, fecha_fin, id_pv, type_report, id_empleado, type_archive, reqUser } = req.body;

    if (!fecha_ini || !fecha_fin || !id_pv || !type_report) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }
    try {
        if (reqUser.id_rol == 1 || reqUser.id_rol == 2) {

            await sql.connect(config);
            const empleadosResult = await sql.query('SELECT * FROM Empleados');
            const empleados = empleadosResult.recordset;
            const accesosResult = await sql.query(obtener_registros_consolidados);
            const accesos = accesosResult.recordset;

            const horarioResult = await sql.query('SELECT * FROM Horarios');
            const horarios = horarioResult.recordset;

            const accesosPorEmpleado = accesos.reduce((acc, acceso) => {
                const numero = acceso.numero_empleado;
                if (!acc[numero]) acc[numero] = [];
                acc[numero].push(acceso);
                return acc;
            }, {});

            const resultadoFinal = empleados.map(empleado => {
                const registrosDesordenado = agruparRegistrosPorDia(accesosPorEmpleado[empleado.id_empleado] || [], horarios);
                const registros = registrosDesordenado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                return {
                    ...empleado,
                    registros
                };
            });


            if (type_archive == 'excel') {
                const buffer = await generarExcel(resultadoFinal, fecha_ini, fecha_fin, id_pv, type_report, id_empleado);

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=reporte_asistencias_.xlsx');
                res.send(buffer);
            } else {
                const buffer = await generarPDF(resultadoFinal, fecha_ini, fecha_fin, id_pv, type_report, id_empleado);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=asistencias.pdf');
                res.send(buffer);
            }

        } else {
            res.status(500).json({ message: 'No tienes permiso para esto' })
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error al generar este contrato' });
    } 
    // finally {
    //     sql.close();
    // }
}