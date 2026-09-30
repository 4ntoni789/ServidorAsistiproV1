const obtenerFecha = require('../scripts/formatearFecha.js');

const entradaTarde = (inforEmpleado, process, horario, registro) => {
    return {
        from: process.env.EMAIL_USER,
        to: `${inforEmpleado.correo},elkinram0113@icloud.com,rrhh@kikoswilly.net`,
        subject: `${obtenerFecha(registro.horaCompleta)} ${registro.id_registro} Notificación de llegada tarde – ${inforEmpleado.nombres} ${inforEmpleado.apellidos}`,
        text: 'Este es un correo enviado usando nodemailer y SMTP.',
        html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f6f8;
                    margin: 0;
                    padding: 20px;
                    }
                    .container {
                    max-width: 600px;
                    background-color: #ffffff;
                    padding: 20px;
                    margin: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    h2 {
                    color: #e53935;
                    }
                    p {
                    font-size: 16px;
                    color: #333333;
                    }
                    .detalle {
                    background-color: #fce4ec;
                    padding: 10px;
                    border-left: 4px solid #e53935;
                    margin: 20px 0;
                    border-radius: 4px;
                    }
                    .footer {
                    margin-top: 30px;
                    font-size: 14px;
                    color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Notificación de llegada tarde</h2>
                    <p>Estimado/a <strong>${inforEmpleado.nombres} ${inforEmpleado.apellidos}</strong>,</p>

                    <p>Se ha registrado una entrada fuera del horario establecido.</p>

                    <div class="detalle">
                    <p><strong>Fecha:</strong> ${obtenerFecha(registro.horaCompleta)}</p>
                    <p><strong>Hora de ingreso registrada:</strong> ${registro.hora}</p>
                    <p><strong>Hora de ingreso permitida:</strong> ${horario.entrada}</p>
                    </div>

                    <p>Te recordamos la importancia de cumplir con los horarios establecidos para asegurar el buen funcionamiento del equipo y los procesos.</p>

                    <p>Si consideras que se trata de un error o tienes alguna justificación, por favor comunícate con Recursos Humanos.</p>

                    <div class="footer">
                    Este mensaje ha sido generado automáticamente por el sistema de control de asistencia AsistiPro.
                    </div>
                </div>
            </body>
        </html>
    `
    }
}

module.exports = entradaTarde;