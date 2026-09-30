const obtenerFecha = require('../scripts/formatearFecha.js');

const contratosPorVencerEmail = (email, process, contratos) => {
  const fecha = new Date;

  return {
    from: process.env.EMAIL_USER,
    to: `${email}`,
    subject: `Notificación de contratos por vencer y vencidos ${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDay()}`,
    text: 'Este es un correo enviado usando nodemailer y SMTP.',
    html: `Notificación de contratos ${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`,
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
      max-width: 900px;
      background-color: #ffffff;
      padding: 20px;
      margin: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h2 {
      color: #1565c0;
      margin-bottom: 10px;
    }
    p {
      font-size: 16px;
      color: #333333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    th {
      background-color: #1565c0;
      color: #ffffff;
    }
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #e3f2fd;
    }
    .footer {
      margin-top: 30px;
      font-size: 14px;
      color: #888;
      text-align: center;
    }
    .vencidos th {
      background-color: #c62828;
    }
    .vencidos tr:hover {
      background-color: #ffebee;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Contratos próximos a vencer</h2>
    <p>Estimado/a,</p>
    <p>Se ha generado un listado de contratos que están próximos a su fecha de finalización:</p>

    <table>
      <thead>
        <tr>
          <th>Empleado</th>
          <th>Cargo</th>
          <th>Tipo</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
          <th>Días restantes</th>
          <th>Empleador</th>
        </tr>
      </thead>
      <tbody>
        ${contratos.proximosAVencer.map(c => `
          <tr>
            <td>${c.nombres}</td>
            <td>${c.nombre_cargo}</td>
            <td>${c.tipo_contrato}</td>
            <td>${obtenerFecha(c.fecha_inicio)}</td>
            <td>${obtenerFecha(c.fecha_fin)}</td>
            <td>${c.dias_restantes}</td>
            <td>${c.nombre_empleador}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2 style="color:#c62828;">Contratos vencidos</h2>
    <p>A continuación se listan los contratos que ya han superado su fecha de finalización:</p>

    <table class="vencidos">
      <thead>
        <tr>
          <th>Empleado</th>
          <th>Cargo</th>
          <th>Tipo</th>
          <th>Fecha Inicio</th>
          <th>Fecha Fin</th>
          <th>Días de vencido</th>
          <th>Empleador</th>
        </tr>
      </thead>
      <tbody>
        ${contratos.vencidos.map(c => `
          <tr>
            <td>${c.nombres}</td>
            <td>${c.nombre_cargo}</td>
            <td>${c.tipo_contrato}</td>
            <td>${obtenerFecha(c.fecha_inicio)}</td>
            <td>${obtenerFecha(c.fecha_fin)}</td>
            <td>${Math.abs(c.dias_restantes)}</td>
            <td>${c.nombre_empleador}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p>Por favor, tome las medidas necesarias respecto a la renovación o finalización de estos contratos. 
    <strong>De no tomarse acciones, se aplicará automáticamente una prórroga de 3 meses.</strong></p>

    <div class="footer">
      Este mensaje ha sido generado automáticamente por el sistema de gestión de contratos <strong>AsistiPro</strong>.
    </div>
  </div>
</body>
</html>`
  }
}


module.exports = contratosPorVencerEmail;