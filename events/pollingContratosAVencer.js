const { poolPromise } = require('../config/db.js');
const contratosPorVencer = require('../utils/contratosPorVencer.js');
const contratosAVencer = require('../globals/contratosAVencer.js');
const enviarEmail = require('../utils/envioEmail.js')
const { enviarNotificacion } = require('../utils/envioNotificacionSse.js');

const revisarContratosAVencer = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT 
            c.id_contrato,
            c.fecha_inicio,
            c.fecha_fin,
            c.estado,
            c.tipo_contrato,
            c.id_cargo,
            NULLIF(c.meses, 0) AS meses,
            ca.nombre_cargo,
            c.id_empleado,
            c.salario,
            e.nombres,
            emp.nombre_empleador,
            emp.id_empleador,
            c.cantidad_prorrogas,
            CASE 
                WHEN GETDATE() > c.fecha_fin THEN 'VENCIDO'
                ELSE 'VIGENTE'
            END AS estado_contrato
        FROM contratos c
        JOIN Cargos ca ON c.id_cargo = ca.id_cargo
        JOIN Empleados e ON c.id_empleado = e.id_empleado
        JOIN Empleadores emp ON c.id_empleador = emp.id_empleador;`);

        const contratos = contratosPorVencer(result.recordset);
        contratosAVencer.set(1, contratos);
        if (Object.keys(contratos).length > 0) {
            enviarEmail('antonyparra789@gmail.com', contratos, null, 'contratos-por-vencer');
            enviarNotificacion(null, "contratos-vencer-vencidos", {
                texto: "¡Tienes nuevos contratos por vencer!",
                detalles: `Tienes ${contratos.vencidos.length} contratos vencidos y ${contratos.proximosAVencer.length} contratos por vencer`,
                fecha: new Date().toISOString()
            });

        } else {
            null
        }

    } catch (error) {
        console.error("❌ Error al revisar registros:", error.message);

    }
}

module.exports = revisarContratosAVencer;