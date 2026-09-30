const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const generarExcel = async (empleadosConRegistros, fecha_ini, fecha_fin, id_pv, type_report, id_empleado) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');

    worksheet.columns = [
        { header: 'Nombre', key: 'nombre', width: 25 },
        { header: 'Cédula', key: 'cedula', width: 12 },
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Día', key: 'dia_semana', width: 12 },
        { header: 'Entrada', key: 'entrada', width: 15 },
        { header: 'Salida Almuerzo', key: 'salida_almuerzo', width: 17 },
        { header: 'Entrada Almuerzo', key: 'entrada_almuerzo', width: 17 },
        { header: 'Salida', key: 'salida', width: 15 },
        { header: 'Punto de venta', key: 'dispositivo', width: 17 },
        { header: 'Turno', key: 'turno', width: 8 },
        { header: 'Tarde', key: 'tarde', width: 8 },
        { header: 'Temprano', key: 'temprano', width: 10 },
        { header: 'Tipo', key: 'tipo', width: 17 },
        { header: 'Cantidad de marcaciones', key: 'marcaciones', width: 25 },
        { header: 'Marcaciones desconocidas', key: 'marcacionesDesconocidas', width: 25 }
    ];
    worksheet.spliceRows(1, 0, []);

    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${type_report} - Punto de venta: ${id_pv}`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDEEFF' },
    };

    worksheet.mergeCells('M1:O1');
    const titleCell2 = worksheet.getCell('M1');
    titleCell2.value = `Desde: ${fecha_ini} hasta: ${fecha_fin}`;
    titleCell2.font = { bold: true };
    titleCell2.alignment = { horizontal: 'center' };
    titleCell2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDEEFF' },
    };
    titleCell2.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
    };


    worksheet.getRow(2).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center' };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDEEFF' },
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
    });

    empleadosConRegistros.forEach(empleado => {
        empleado.registros.forEach(dia => {
            const marcaciones = {
                entrada: '',
                salida: '',
                entrada_almuerzo: '',
                salida_almuerzo: '',
                turno: '',
                tarde: 0,
                temprano: 0,
                tipo: '',
                desconocida: ''
            };
            let tiposMarcaciones;


            if (id_empleado == null && dia.id_pv == id_pv && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin
                || id_empleado == null && id_pv == 'todos' && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin
                || id_empleado == dia.numero_empleado && dia.id_pv == id_pv && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin
                || id_empleado == dia.numero_empleado && id_pv == 'todos' && dia.fecha >= fecha_ini && dia.fecha <= fecha_fin) {

                dia.registros.forEach(reg => {
                    switch (reg.tipo) {
                        case 'Entrada normal':
                            marcaciones.entrada = reg.hora;
                            marcaciones.turno = reg.turno;
                            marcaciones.tipo = reg.tipo;
                            tiposMarcaciones += ' ' + reg.tipo;
                            break;

                        case 'Entrada temprano':
                            marcaciones.entrada = reg.hora;
                            marcaciones.turno = reg.turno;
                            marcaciones.tipo = reg.tipo;
                            tiposMarcaciones += ' ' + reg.tipo;
                            break;
                        case 'Entrada tarde':
                            marcaciones.entrada = reg.hora;
                            marcaciones.turno = reg.turno;
                            marcaciones.tarde = reg.diferenciaRest;
                            marcaciones.tipo = reg.tipo;
                            tiposMarcaciones += ' ' + reg.tipo;
                            break;

                        case 'Salida de almuerzo':
                            marcaciones.salida_almuerzo = reg.hora;
                            marcaciones.turno = reg.turno;
                            break;
                        case 'Entrada de almuerzo':
                            marcaciones.entrada_almuerzo = reg.hora;
                            marcaciones.turno = reg.turno;
                            break;

                        case 'Salida temprana':
                            marcaciones.salida = reg.hora;
                            marcaciones.turno = reg.turno;
                            tiposMarcaciones += ' ' + reg.tipo;
                            marcaciones.temprano = reg.diferenciaRest;
                            break;
                        case 'Salida':
                            marcaciones.salida = reg.hora;
                            marcaciones.turno = reg.turno;
                            marcaciones.temprano = 0;
                            break;
                        default:
                            // marcacionesDesconocidas.push(reg.hora);
                            tiposMarcaciones += ' ' + reg.tipo;
                            marcaciones.desconocida += ' ' + reg.hora;
                    }
                });
                const row = worksheet.addRow({
                    nombre: `${empleado.nombres} ${empleado.apellidos}`,
                    cedula: empleado.cedula,
                    fecha: dia.fecha,
                    dia_semana: dia.dia_semana,
                    entrada: marcaciones.entrada || '',
                    salida: marcaciones.salida || '',
                    entrada_almuerzo: marcaciones.entrada_almuerzo || '',
                    salida_almuerzo: marcaciones.salida_almuerzo || '',
                    dispositivo: dia.nombre_dispositivo || '',
                    turno: marcaciones.turno,
                    tarde: marcaciones.tarde,
                    temprano: marcaciones.temprano,
                    tipo: marcaciones.tipo,
                    marcaciones: dia.registros.length,
                    marcacionesDesconocidas: marcaciones.desconocida
                });

                // ✅ Primero aplicamos SIEMPRE los bordes y alineación
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                });
                // ✅ Luego, aplicamos colores según condición
                if (marcaciones.tipo === 'Entrada tarde') {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF9999' },
                        };
                    });
                }
                else if (marcaciones.tipo === 'Entrada normal') {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFCCFFCC' },
                        };
                    });
                }
                else if (marcaciones.tipo === 'Entrada temprano') {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF99CC99' },
                        };
                    });
                }

                else if (dia.nombre_dispositivo === 'No marcado') {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFCCCC' },
                        };
                    });
                } else if (marcaciones.turno === '') {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF99' }, // amarillo
                        };
                    });
                }

            }


        });
    });

    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = generarExcel