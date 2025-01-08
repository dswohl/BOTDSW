const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const port = process.env.PORT || 10000;
const GITHUB_TOKEN = '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';
const GITHUB_REPO = 'BOTDSW';
const GITHUB_USER = 'dswohl';

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

async function updateGithubFile(content) {
    try {
        // Primero obtener el archivo actual para obtener el SHA
        const getOptions = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/responses.json`,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(getOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const fileInfo = JSON.parse(data);
                    
                    // Ahora actualizar el archivo
                    const updateOptions = {
                        hostname: 'api.github.com',
                        path: `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/responses.json`,
                        method: 'PUT',
                        headers: {
                            'User-Agent': 'Node.js',
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        }
                    };

                    const updateReq = https.request(updateOptions, (updateRes) => {
                        let updateData = '';
                        updateRes.on('data', chunk => updateData += chunk);
                        updateRes.on('end', () => resolve(updateData));
                    });

                    updateReq.on('error', reject);
                    updateReq.write(JSON.stringify({
                        message: 'Update responses.json via admin panel',
                        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
                        sha: fileInfo.sha
                    }));
                    updateReq.end();
                });
            });

            req.on('error', reject);
            req.end();
        });
    } catch (error) {
        console.error('Error updating GitHub:', error);
        throw error;
    }
}

client.on('message', async (msg) => {
    if (msg.fromMe) return;
    
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
        fs.writeFileSync('responses.json', JSON.stringify(req.body, null, 2));
        await updateGithubFile(req.body);
        res.json({ success: true });
    } catch (err) {
        console.error('Error completo:', err);
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
