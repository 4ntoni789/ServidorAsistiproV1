const fs = require('fs');
const ExcelJS = require('exceljs');

const data = JSON.parse(fs.readFileSync('datos_agrupados.json', 'utf8'));

function obtenerDiaSemana(fechaStr) {
    const [dia, mes, anio] = fechaStr.split('/').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return diasSemana[fecha.getDay()];
}

function parseHora(h) {
    let [time, ampm] = h.split(' ');
    let [hh, mm, ss] = time.split(':').map(Number);
    if (ampm.toLowerCase().includes('p') && hh !== 12) hh += 12;
    if (ampm.toLowerCase().includes('a') && hh === 12) hh = 0;
    return hh * 3600 + mm * 60 + ss;
}

async function generarExcels() {
    for (const punto of data) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(punto.nombre);

        // Fusionar celdas para título
        sheet.mergeCells('A1', 'G1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = punto.nombre;
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

        // Encabezados
        sheet.addRow([
            'Fecha', 'Día de la semana', 'Empleado', 'Entrada',
            'Salida a almuerzo', 'Entrada de almuerzo', 'Salida'
        ]);
        const headerRow = sheet.getRow(2);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Obtener todas las fechas y empleados
        const todasLasFechas = Object.keys(punto.fechas).sort((a, b) => {
            const [da, ma, aa] = a.split('/').map(Number);
            const [db, mb, ab] = b.split('/').map(Number);
            return new Date(aa, ma - 1, da) - new Date(ab, mb - 1, db);
        });
        const todosLosEmpleados = new Set();
        for (const fecha in punto.fechas) {
            for (const empleado in punto.fechas[fecha]) {
                todosLosEmpleados.add(empleado);
            }
        }

        const filas = [];
        todosLosEmpleados.forEach(empleado => {
            todasLasFechas.forEach(fecha => {
                if (punto.fechas[fecha] && punto.fechas[fecha][empleado]) {
                    let horas = punto.fechas[fecha][empleado].sort((a, b) => parseHora(a) - parseHora(b));
                    filas.push({
                        fecha,
                        dia_semana: obtenerDiaSemana(fecha),
                        empleado,
                        entrada: horas[0] || 'No marcado',
                        salida_almuerzo: horas[1] || 'No marcado',
                        entrada_almuerzo: horas[2] || 'No marcado',
                        salida: horas[3] || 'No marcado'
                    });
                } else {
                    filas.push({
                        fecha,
                        dia_semana: obtenerDiaSemana(fecha),
                        empleado,
                        entrada: 'No marcado',
                        salida_almuerzo: 'No marcado',
                        entrada_almuerzo: 'No marcado',
                        salida: 'No marcado'
                    });
                }
            });
        });

        // Ordenar por empleado y fecha
        filas.sort((a, b) => {
            if (a.empleado < b.empleado) return -1;
            if (a.empleado > b.empleado) return 1;
            const [diaA, mesA, anioA] = a.fecha.split('/').map(Number);
            const [diaB, mesB, anioB] = b.fecha.split('/').map(Number);
            return new Date(anioA, mesA - 1, diaA) - new Date(anioB, mesB - 1, diaB);
        });

        // Agregar filas y aplicar bordes
        filas.forEach(fila => {
            const row = sheet.addRow(Object.values(fila));
            row.eachCell(cell => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };

                if (cell.value === 'No marcado') {
                    cell.font = { color: { argb: 'FFFF0000' }, bold: true };
                }
            });
        });

        // Ajustar ancho automático
        sheet.columns.forEach(col => {
            let maxLength = 0;
            col.eachCell({ includeEmpty: true }, cell => {
                const length = cell.value ? cell.value.toString().length : 0;
                if (length > maxLength) maxLength = length;
            });
            col.width = maxLength < 15 ? 15 : maxLength;
        });

        // Guardar archivo
        const nombreArchivo = `${punto.nombre.replace(/[<>:"/\\|?*]+/g, '_')}.xlsx`;
        await workbook.xlsx.writeFile(nombreArchivo);
        console.log(`Archivo Excel creado: ${nombreArchivo}`);
    }
}

generarExcels().catch(err => console.error(err));
