const normalizarIP = (ip) => {
    if (!ip) return '';
    if (ip.includes(',')) {
        ip = ip.split(',')[0];
    }
    return ip.replace('::ffff:', '').trim();
}

module.exports = normalizarIP;