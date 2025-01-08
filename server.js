const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const responses = require('./responses.json');

const app = express();
app.use(express.json());

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

client.on('disconnected', () => {
    console.log('Client disconnected');
    client.initialize();
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
