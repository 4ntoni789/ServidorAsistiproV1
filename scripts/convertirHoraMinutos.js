const convertirHoraMinutos = (horaStr) => {
    if (!horaStr || typeof horaStr !== 'string') return { totalMin: null, hora: '' };

    const [horaNum, minutos] = horaStr.split(":").map(Number);
    const totalMin = horaNum * 60 + minutos;

    return {
        totalMin: totalMin,
        hora: horaStr
    };
};

module.exports = convertirHoraMinutos;
