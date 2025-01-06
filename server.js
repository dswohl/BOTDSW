const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 10000;

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    },
    authStrategy: new LocalAuth()
});

let qrString = '';

client.on('qr', (qr) => {
    qrString = qr;
    console.log('Nuevo QR generado');
});

app.get('/qr', async (req, res) => {
    if (!qrString) {
        return res.status(404).send('QR no disponible aún');
    }
    const qrImage = await qrcode.toDataURL(qrString);
    res.send(`<html><body><img src="${qrImage}"></body></html>`);
});

client.on('ready', () => {
    console.log('Cliente listo');
});

client.initialize();
app.listen(port, () => console.log(`Servidor iniciado en puerto ${port}`));
