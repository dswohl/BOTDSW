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

const port = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = 'dswohl';
const GITHUB_REPO = 'BOTDSW';

// Verificar token
if (!GITHUB_TOKEN) {
    console.error('ERROR: No se encontró GITHUB_TOKEN en las variables de entorno');
}

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

async function updateGitHub(content) {
    try {
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        console.log('Iniciando actualización en GitHub...');

        // Obtener el archivo actual
        const { data: fileData } = await octokit.rest.repos.getContent({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            path: 'responses.json'
        });
        console.log('Archivo actual obtenido de GitHub');

        // Actualizar el archivo
        const updateResponse = await octokit.rest.repos.createOrUpdateFileContents({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            path: 'responses.json',
            message: 'Update responses via admin panel',
            content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
            sha: fileData.sha
        });
        console.log('Archivo actualizado en GitHub:', updateResponse.status);
        return true;
    } catch (error) {
        console.error('Error actualizando GitHub:', error.message);
        if (error.response) {
            console.error('Estado:', error.response.status);
            console.error('Mensaje:', error.response.data);
        }
        throw error;
    }
}

client.on('message', async (msg) => {
    if (msg.fromMe) return;
    
    const text = msg.body.toLowerCase();
    console.log('Mensaje recibido:', text);
    
    try {
        const responses = JSON.parse(fs.readFileSync('responses.json', 'utf8'));
        console.log('Respuestas cargadas:', responses);
        
        let foundMatch = false;
        for (const [keyword, response] of Object.entries(responses)) {
            if (keyword !== 'default' && text.includes(keyword)) {
                await msg.reply(response);
                foundMatch = true;
                break;
            }
        }
        
        // Si no se encontró coincidencia, usar respuesta por defecto
        if (!foundMatch && responses.default) {
            await msg.reply(responses.default);
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
        console.log('Recibida solicitud para actualizar respuestas');
        // Formatear el JSON correctamente antes de guardar
        const formattedJson = JSON.stringify(req.body, null, 2);
        // Verificar que el JSON es válido antes de guardar
        JSON.parse(formattedJson); // Esto lanzará error si el JSON no es válido
        
        // Guardar localmente
        fs.writeFileSync('responses.json', formattedJson);
        console.log('Archivo guardado localmente');

        // Actualizar en GitHub
        await updateGitHub(req.body);
        console.log('Actualización completada');

        res.json({ success: true });
    } catch (err) {
        console.error('Error completo:', err);
        res.status(500).json({ 
            error: 'Error al guardar respuestas',
            details: err.message
        });
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
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log('GitHub Token presente:', !!GITHUB_TOKEN);
});
