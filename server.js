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
    if (msg.fromMe) return; // Ignora mensajes propios
    
    const text = msg.body.toLowerCase();
    console.log('Mensaje recibido:', text); // Para debug
    
    try {
        const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));
        console.log('Respuestas cargadas:', responses); // Para debug
        
        for (const [keyword, response] of Object.entries(responses)) {
            if (text.includes(keyword)) {
                console.log('Coincidencia encontrada:', keyword); // Para debug
                await msg.reply(response);
                break;
            }
        }
    } catch (err) {
        console.error('Error completo:', err);
    }
});

client.on('disconnected', () => {
    console.log('Client disconnected');
    client.initialize();
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/responses', (req, res) => {
    try {
        const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));
        res.json(responses);
    } catch (err) {
        res.status(500).json({ error: 'Error al leer respuestas' });
    }
});

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
