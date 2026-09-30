const express = require('express');
const cors = require('cors');
const iniciarPolling = require('./events/iniciarPolling.js');

const app = express();
const PORT = 5000;
const userRoutes = require('./routes/userRoutes');
app.use(cors());
app.use(express.json());
app.use('/api',userRoutes);

app.listen(PORT, () => {
  console.log(
    `Servidor asistiPro iniciado..
     █████╗ ███████╗██╗███████╗████████╗██╗██████╗ ██████╗  ██████╗ ██╗   ██╗ ██╗
██╔══██╗██╔════╝██║██╔════╝╚══██╔══╝██║██╔══██╗██╔══██╗██╔═══██╗██║   ██║███║
███████║███████╗██║███████╗   ██║   ██║██████╔╝██████╔╝██║   ██║██║   ██║╚██║
██╔══██║╚════██║██║╚════██║   ██║   ██║██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝ ██║
██║  ██║███████║██║███████║   ██║   ██║██║     ██║  ██║╚██████╔╝ ╚████╔╝  ██║
╚═╝  ╚═╝╚══════╝╚═╝╚══════╝   ╚═╝   ╚═╝╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝   ╚═╝
                                                                             
                              AsistiProv1
    `);
  iniciarPolling();
}); 
  