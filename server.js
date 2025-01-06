const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let qrCodeData = '';

client.on('qr', async (qr) => {
    console.log('QR Code received');
    qrCodeData = await qrcode.toDataURL(qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (message) => {
    const messageContent = message.body.toLowerCase();

    // Respuestas automáticas básicas
    if (messageContent.includes('hola')) {
        await message.reply('¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?');
    } else if (messageContent.includes('horario')) {
        await message.reply('Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 6:00 PM');
    } else if (messageContent.includes('ubicacion') || messageContent.includes('direccion')) {
        await message.reply('Estamos ubicados en [Tu dirección aquí]');
    } else if (messageContent.includes('gracias')) {
        await message.reply('¡Gracias a ti! Estamos para servirte.');
    }
});

app.get('/qr', (req, res) => {
    res.send(qrCodeData);
});

const PORT = process.env.PORT || 3000;
client.initialize();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
