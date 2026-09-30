const partirTextoEnDos = (texto) => {
    const palabras = texto.split(' ');
    const mitad = Math.ceil(palabras.length / 2);
    const primeraParte = palabras.slice(0, mitad).join(' ');
    const segundaParte = palabras.slice(mitad).join(' ');
    return [primeraParte, segundaParte];
}



module.exports = partirTextoEnDos;