// events/events.js
let clients = [];

function addClient(res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  clients.push(res);

  res.on('close', () => {
    clients = clients.filter((client) => client !== res);
  });
}

function sendEventToClients(data) {
  const formatted = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.write(formatted));
}

module.exports = { addClient, sendEventToClients };
