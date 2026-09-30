const { poolPromise } = require('../config/db');
const revisarContratosAVencer = require('../events/pollingContratosAVencer.js')


const prorrogaContrato = async (id_contrato, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_contrato', id_contrato)
            .query(`
       UPDATE contratos
        SET fecha_fin = DATEADD(MONTH, 3, fecha_fin),
            cantidad_prorrogas = ISNULL(cantidad_prorrogas, 0) + 1
        WHERE id_contrato = @id_contrato
          AND DATEDIFF(MONTH, GETDATE(), fecha_fin) <= 1
          AND ISNULL(cantidad_prorrogas, 0) < 3
      `);

        if (result.rowsAffected[0] > 0) {
            res ? res.status(201).json({ message: 'Contrato prorrogado correctamente' }) : null
            console.log(`✅ Contrato ${id_contrato} prorrogado por 3 meses`);
            
        } else {
            res ? res.status(500).json({ error: 'Este contrato no cumple las condiciones para prorrogar' }) : null
            console.log(`⚠️ Contrato ${id_contrato} no cumple condición para prórroga`);
        }
        return result.rowsAffected[0];
    } catch (err) {
        console.error('Error al prorrogar contrato:', err);
        throw err;
    }
}

module.exports = prorrogaContrato;