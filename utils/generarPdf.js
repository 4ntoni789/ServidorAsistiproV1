const PDFDocument = require('pdfkit-table');

const generarPDF = async (empleadosConRegistros, fecha_ini, fecha_fin, id_pv, type_report, id_empleado) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // Título
  doc.fontSize(16).text(type_report, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Desde: ${fecha_ini} Hasta: ${fecha_fin}`, { align: 'center' });
  doc.moveDown(1);

  // Tabla
  const table = {
    headers: [
      'Nombre',
      'Cédula',
      'Fecha',
      'Día',
      'Entrada',
      'Salida Almuerzo',
      'Entrada Almuerzo',
      'Salida',
      'Dispositivo',
      'Turno'
    ],
    rows: []
  };

  empleadosConRegistros.forEach(empleado => {
    empleado.registros.forEach(dia => {
      if (id_empleado == null && dia.id_pv == id_pv && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin
        || id_empleado == null && id_pv == 'todos' && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin || id_empleado == dia.numero_empleado
        && dia.id_pv == id_pv && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin) {
        const m = { entrada: '', salida: '', entrada_almuerzo: '', salida_almuerzo: '', turno: '' };

        dia.registros.forEach(reg => {
          switch (reg.tipo) {
            case 'Entrada normal':
            case 'Entrada temprano':
            case 'Entrada tarde':
              m.entrada = reg.hora;
              m.turno = reg.turno;
              break;
            case 'Salida de almuerzo':
              m.salida_almuerzo = reg.hora;
              break;
            case 'Entrada de almuerzo':
              m.entrada_almuerzo = reg.hora;
              break;
            case 'Salida temprana':
            case 'Salida':
              m.salida = reg.hora;
              break;
          }
        });

        table.rows.push([
          `${empleado.nombres ?? ''} ${empleado.apellidos ?? ''}`,
          String(empleado.cedula ?? ''),
          String(dia.fecha ?? ''),
          dia.dia_semana ?? '',
          m.entrada ?? '',
          m.salida_almuerzo ?? '',
          m.entrada_almuerzo ?? '',
          m.salida ?? '',
          dia.nombre_dispositivo ?? '',
          m.turno ?? '',
        ]);
      }
    });
  });

  // Insertar la tabla
  await doc.table(table, {
    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
    prepareRow: () => doc.font('Helvetica').fontSize(9),
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
};

module.exports = generarPDF;