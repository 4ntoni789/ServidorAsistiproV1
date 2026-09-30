// forgotPassEmail.js
const forgotPassEmail = (email, process, expiresMinutes = 10) => {
    const fecha = new Date();
    const fechaFormato = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;


    return {
        from: process.env.EMAIL_USER,
        to: `${email.email}`,
        subject: `Código de verificación • AsistiPro • ${fechaFormato}`,
        text: `Tu código para restablecer la contraseña es: ${email.code}. Expira en ${expiresMinutes} minutos. Si no solicitaste este correo, ignóralo.`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
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
    .header {
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom: 8px;
    }
    .logo {
      height:48px;
      border-radius:8px;
      background:#0ea5a3;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-weight:700;
      font-size:18px;
    }
    h2 {
      color: #0f172a;
      margin: 0;
      font-size: 18px;
    }
    p {
      font-size: 15px;
      color: #333333;
      line-height: 1.4;
    }
    .code-box {
      display:flex;
      align-items:center;
      justify-content:center;
      margin: 22px 0;
    }
    .code {
      background:#0f172a;
      color:#fff;
      padding:18px 26px;
      border-radius:8px;
      font-size:28px;
      letter-spacing:6px;
      font-weight:700;
      font-family: "Courier New", Courier, monospace;
    }
    .help {
      font-size:13px;
      color:#64748b;
      margin-top:8px;
    }
    .footer {
      margin-top: 26px;
      font-size: 13px;
      color: #888;
      text-align: center;
    }
    a.support {
      color: #0ea5a3;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .code { font-size:24px; padding:14px 20px; letter-spacing:4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h2>Restablecer contraseña</h2>
        <div style="color:#64748b;font-size:13px;margin-top:4px;">Solicitud de recuperación • AsistiPro</div>
      </div>
    </div>

    <p>Hola,</p>

    <p>Hemos recibido una solicitud para restablecer la contraseña asociada a este correo. Utiliza el siguiente código para continuar con el proceso. Este código caduca en <strong>${expiresMinutes} minutos</strong>.</p>

    <div class="code-box">
      <div class="code">${email.code}</div>
    </div>

    <p class="help">Copia y pega el código en la pantalla de verificación de la aplicación. Si el código no funciona, solicita uno nuevo desde la aplicación.</p>

    <hr style="border:none;border-top:1px solid #eef2f7;margin:18px 0;" />
    
    <div class="footer">
      <div>Este mensaje fue generado automáticamente por <strong>AsistiPro</strong>.</div>
      <div style="margin-top:6px;color:#94a3b8;">© ${fecha.getFullYear()} AsistiPro. Todos los derechos reservados.</div>
    </div>
  </div>
</body>
</html>
    `
    };
};

module.exports = forgotPassEmail;
