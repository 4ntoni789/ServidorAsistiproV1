const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const GenerarContratoPDF = async (datosEmpleado) => {
  const htmlPath = path.resolve(__dirname, `../contratosGenerados/${datosEmpleado.tipo_contrato === 'Fijo Manejo y Confianza' ? 'plazoFijoManejoYConfianza.html' : 'plazoFijo.html'}`);
  let html = fs.readFileSync(htmlPath, 'utf-8');

  for (const clave in datosEmpleado) {
    const valor = datosEmpleado[clave];
    const regex = new RegExp(`{{\\s*${clave}\\s*}}`, 'g');
    html = html.replace(regex, valor);
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  await new Promise(resolve => setTimeout(resolve, 1000));

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '30mm', bottom: '50mm', left: '30mm', right: '30mm' },
  });

  await browser.close();
  return pdfBuffer;
};

module.exports = GenerarContratoPDF;
