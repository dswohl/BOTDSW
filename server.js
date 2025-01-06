const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 10000;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

let qrString = '';

client.on('qr', (qr) => {
    qrString = qr;
    console.log('QR Code received:', qr);
});

client.on('message', async (message) => {
    const text = message.body.toLowerCase();
    
    if (text.includes('hola')) {
        await message.reply('¡Hola! Gracias por contactarnos. ¿En qué puedo ayudarte?');
    } else if (text.includes('horario')) {
        await message.reply('Nuestro horario de atención es de Lunes a Viernes de 10:30 AM a 16:30 ');
    } else if (text.includes('ubicacion') || text.includes('direccion')) {
        await message.reply('Estamos ubicados en Av. Federico LAcroze 2827 6C - CABA');
    } else if (text.includes('gracias')) {
        await message.reply('¡Gracias a ti! Estamos para servirte.');
    }
});

app.get('/qr', async (req, res) => {
    try {
        if (!qrString) {
            return res.send('<html><body>Generando QR... Refresca en 5 segundos</body></html>');
        }
        const qrImage = await qrcode.toDataURL(qrString);
        res.send(`<html><body><img src="${qrImage}"><br><button onclick="location.reload()">Refrescar QR</button></body></html>`);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

client.initialize();
app.listen(port, () => console.log(`Server on port ${port}`));
