const obtenerDiaDeLaSemana = (fechaInput) => {
    // Crear un objeto Date con la fecha recibida
    const fecha = new Date(fechaInput);

    // Array con los nombres de los días en español (domingo = 0)
    const diasSemana = [
        "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
    ];

    // Obtener el índice del día de la semana (0-6)
    const diaNumero = fecha.getDay();

    // Devolver el nombre del día
    return diasSemana[diaNumero];
}
module.exports = obtenerDiaDeLaSemana;