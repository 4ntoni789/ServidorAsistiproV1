const { sql, config, poolPromise } = require('../config/db.js');


exports.getNotificacion = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM Notificaciones
            `);
        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al traer la infomación');
    }
}

exports.postNotificacion = async (req, res) => {
    const { envio_correo_electronico, correo_electronico, aviso_contratos, aviso_horas_contratos, aviso_dias_contratos, reqUser } = req.body;

    if (!envio_correo_electronico || !correo_electronico || !aviso_contratos || !aviso_horas_contratos || !aviso_dias_contratos) {
        return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    try {
        if (reqUser.id_rol == 1) {
            const modificador = `${reqUser.id_usuario}-${new Date}`;
            const pool = await poolPromise;
            await pool.request()
                .input('envio_correo_electronico_aviso', sql.Bit, envio_correo_electronico)
                .input('corre_electronico_aviso', sql.NVarChar, correo_electronico)
                .input('envio_correo_electronico_aviso_contratos', sql.Bit, aviso_contratos)
                .input('envio_correo_electronico_aviso_contratos_hora', sql.NVarChar, aviso_horas_contratos)
                .input('envio_correo_electronico_aviso_contratos_dias', sql.Int, aviso_dias_contratos)
                .input('usuario_modificador', sql.NVarChar, modificador)
                .query(`
                    INSERT INTO Notificaciones (envio_correo_electronico_aviso,
                        corre_electronico_aviso,
                        envio_correo_electronico_aviso_contratos,
                        envio_correo_electronico_aviso_contratos_hora,
                        envio_correo_electronico_aviso_contratos_dias,
                        usuario_modificador)
                    VALUES (@envio_correo_electronico_aviso,@corre_electronico_aviso,
                    @envio_correo_electronico_aviso_contratos,
                    @envio_correo_electronico_aviso_contratos_hora,
                    @envio_correo_electronico_aviso_contratos_dias,
                    @usuario_modificador)`
                );
            res.status(201).json({ message: 'Notificaciones actualizadas correctamente' });
        } else {
            res.status(403).json({ message: 'No tienes permiso para hacer esto' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al hacer esto');
    }
}