const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 10000;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let qrString = '';

client.on('qr', (qr) => {
    console.log('QR Code received');
    qrString = qr;
});

app.get('/qr', async (req, res) => {
    try {
        if (!qrString) {
            return res.status(404).send('QR not ready');
        }
        const qrImage = await qrcode.toDataURL(qrString);
        res.send(`<html><body><img src="${qrImage}"></body></html>`);
    } catch (error) {
        res.status(500).send('Error generating QR');
    }
});

client.on('ready', () => {
    console.log('Client ready');
});

client.on('message', msg => {
    const text = msg.body.toLowerCase();
    if (text.includes('hola')) {
        msg.reply('¡Hola! ¿En qué puedo ayudarte?');
    }
});

client.initialize();
app.listen(port, () => console.log(`Server running on port ${port}`));
