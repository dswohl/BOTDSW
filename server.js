const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

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
    console.log('QR Code received');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    const text = msg.body.toLowerCase();
    try {
        const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));
        for (const [keyword, response] of Object.entries(responses)) {
            if (text.includes(keyword)) {
                await msg.reply(response);
                break;
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Ruta para obtener respuestas
app.get('/api/responses', (req, res) => {
    try {
        const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));
        res.json(responses);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer respuestas' });
    }
});

// Ruta para guardar respuestas
app.post('/api/responses', (req, res) => {
    try {
        fs.writeFileSync('responses.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error al guardar respuestas' });
    }
});

app.get('/qr', async (req, res) => {
    try {
        if (!qrString) {
            return res.send('Generando QR...');
        }
        const qrImage = await qrcode.toDataURL(qrString);
        res.send(`<html><body><img src="${qrImage}"></body></html>`);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

client.initialize();
app.listen(port, () => console.log(`Server on port ${port}`));
