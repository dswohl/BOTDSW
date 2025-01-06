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

app.get('/qr', async (req, res) => {
    try {
        if (!qrString) {
            client.initialize();
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
