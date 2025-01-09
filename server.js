const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { Octokit } = require("@octokit/rest");
require('dotenv').config();

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
   if (msg.fromMe) return;
   
   const text = msg.body.toLowerCase();
   console.log('Mensaje recibido:', text);
   
   try {
       const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));
       console.log('Respuestas cargadas:', responses);
       
       for (const [keyword, response] of Object.entries(responses)) {
           if (text.includes(keyword)) {
               console.log('Coincidencia encontrada:', keyword);
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

app.post('/api/responses', async (req, res) => {
   try {
       // Guardar localmente
       fs.writeFileSync('responses.json', JSON.stringify(req.body, null, 2));
       
       // Actualizar en GitHub
       const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
       
       // Obtener el contenido actual del archivo
       const { data: fileData } = await octokit.rest.repos.getContent({
           owner: 'dswohl',
           repo: 'BOTDSW',
           path: 'responses.json'
       });

       // Actualizar el archivo en GitHub
       await octokit.rest.repos.createOrUpdateFileContents({
           owner: 'dswohl',
           repo: 'BOTDSW',
           path: 'responses.json',
           message: 'Update responses via admin panel',
           content: Buffer.from(JSON.stringify(req.body, null, 2)).toString('base64'),
           sha: fileData.sha
       });

       res.json({ success: true });
   } catch (err) {
       console.error('Error completo:', err);
       res.status(500).json({ error: 'Error al guardar respuestas' });
   }
});
