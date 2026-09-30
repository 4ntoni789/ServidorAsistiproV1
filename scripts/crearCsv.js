const fs = require('fs');
const xlsx = require('xlsx');

const crearExcel = (datos, dateIni, dateFin, name) => {
    const agrupados = {};

    datos.forEach(reg => {
        const fecha = new Date(reg.fecha_hora_autenticacion).toISOString().split('T')[0]; // yyyy-mm-dd

        if (fecha >= dateIni && fecha <= dateFin && reg.nombre_dispositivo == name) {
            const clave = `${reg.numero_empleado}|${fecha}`;

            if (!agrupados[clave]) {
                agrupados[clave] = {
                    Nombre: reg.nombre_persona,
                    'Número de empleado': reg.numero_empleado,
                    Fecha: fecha,
                    Dispositivo: reg.nombre_dispositivo,
                    Horas: [],
                };
            }

            agrupados[clave].Horas.push({
                hora: reg.fecha_hora_autenticacion,
                dispositivo: reg.nombre_dispositivo,
            });
        }
    });

    // Construir datos para el Excel
    const filas = [];
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (const clave in agrupados) {
        const grupo = agrupados[clave];
        const horasOrdenadas = grupo.Horas.sort((a, b) => new Date(a.hora) - new Date(b.hora));
        const fechaObj = new Date(grupo.Fecha);
        const diaSemana = diasSemana[fechaObj.getDay()];

        filas.push({
            Nombre: grupo.Nombre,
            'Número de empleado': grupo['Número de empleado'],
            Fecha: grupo.Fecha,
            'Día de la semana': diaSemana,
            Dispositivo: grupo.Dispositivo,
            'Registro de entrada': horasOrdenadas[0]?.hora.toISOString().split('T')[1].substring(0, 8) || '',
            'Salida a almuerzo': horasOrdenadas[1]?.hora.toISOString().split('T')[1].substring(0, 8) || '',
            'Entrada de almuerzo': horasOrdenadas[2]?.hora.toISOString().split('T')[1].substring(0, 8) || '',
            'Registro de salida': horasOrdenadas[3]?.hora.toISOString().split('T')[1].substring(0, 8) || '',
        });

    }

    try {
        const worksheet = xlsx.utils.json_to_sheet(filas);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Asistencia');

        xlsx.writeFile(workbook, `asistencia_${dateIni}${name}.xlsx`);
        console.log('✅ Archivo Excel generado correctamente');
    } catch (err) {
        console.error('❌ Error al generar Excel:', err);
    }
};

module.exports = crearExcel;
