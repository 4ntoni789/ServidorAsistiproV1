const { sql, config } = require('../config/db.js');

const actualizarCampoCorreoElectronico = async (id) => {
    try {
        await sql.connect(config);
        const request = new sql.Request();
        request.input('id', sql.Int, id);

        const result = await request.query(`
            UPDATE Registros
            SET correo_enviado = 1
            WHERE id_registro = @id;
        `);

        if (result?.rowsAffected?.some(count => count > 0)) {
            console.log(`Correo actualizado para el registro con id ${id}`);
        } else {
            console.log(`No se encontró un registro con id ${id}`);
        }

    } catch (error) {
        console.error('Error al actualizar el campo correo_enviado:', error);
    } finally {
        sql.close();
    }
};

module.exports = actualizarCampoCorreoElectronico;