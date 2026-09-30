const readline = require('readline');

const mostrarOjitos = () => {
    const frames = ['[O_O] ', '[O_O] ', '[ O_O] ', '[ O_O] ', '[O_O ] ', '[O_O ] ', '[o_o] ', '[-_-] ', '[o_o] '];
    let i = 0;

    setInterval(() => {
        // Mueve el cursor al inicio de la línea y sobreescribe solo esa línea
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`🚀 Observador de eventos iniciado.... ${frames[i % frames.length]}`);
        i++;
    }, 300);
}

module.exports = mostrarOjitos