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
   console.log('QR Code received');
});

client.on('ready', () => {
   console.log('Client is ready!');
});

client.on('message_create', async (msg) => {
   const text = msg.body.toLowerCase();
   
   console.log('Mensaje recibido:', text);
   
   try {
       if (text.includes('hola')) {
           await msg.reply('¡Hola! Gracias por contactarnos. ¿En qué puedo ayudarte?');
       } else if (text.includes('horario')) {
           await msg.reply('Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 6:00 PM');
       } else if (text.includes('ubicacion') || text.includes('direccion')) {
           await msg.reply('Estamos ubicados en [Tu dirección aquí]');
       } else if (text.includes('gracias')) {
           await msg.reply('¡Gracias a ti! Estamos para servirte.');
       }
       console.log('Respuesta enviada');
   } catch (err) {
       console.error('Error al responder:', err);
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
