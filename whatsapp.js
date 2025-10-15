const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cron = require('node-cron');
const { dispararAniversario, dispararInativos } = require('./jobs');

const {LocalAuth} = require('whatsapp-web.js');

let client = new Client({
    authStrategy: new LocalAuth({
        clientId: "main", 
        dataPath: path.join(__dirname, 'whatsapp-session') 
    })
});

client.on('qr', qr => {

    lastQr = qr;

    if (global.mainWindow) {
        qrcode.toDataURL(qr).then(url => {
            global.mainWindow.webContents.send('qr-code-generated', url);
        }).catch(console.error);
    }
});

// Envia o último QR Code salvo para a janela, caso exista
function sendLastQrIfExists() {
    if (lastQr && global.mainWindow) {
        qrcode.toDataURL(lastQr).then(url => {
            global.mainWindow.webContents.send('qr-code-generated', url);
            console.log("🔄 Reenviando QR:", url);
        });
    }
}

let lastQr = null; 
const { MessageMedia } = require('whatsapp-web.js');
let clientReady = false;

client.on('ready', async () => {
    console.log('✅ WhatsApp pronto!');
    clientReady = true;
    iniciarJobsAutomáticos();
});

// Envia uma mensagem para um número do WhatsApp, opcionalmente com imagem
async function enviarMensagem(telefone, mensagem, imagemPath) {
    if (!clientReady) {
        console.log("⚠️ Client ainda não pronto! Aguardando...");
        await new Promise(resolve => client.on('ready', resolve));
        console.log("✅ Client agora pronto, continuando envio...");
    }

    let numeroWhatsApp = telefone.replace(/\D/g, '') + "@c.us";

    try {
        if (imagemPath && fs.existsSync(imagemPath)) {
            const media = await MessageMedia.fromFilePath(imagemPath);
            await client.sendMessage(numeroWhatsApp, media, { caption: mensagem });
        } else {
            await client.sendMessage(numeroWhatsApp, mensagem);
        }
    } catch (err) {
        console.error("❌ Erro ao enviar mensagem para", numeroWhatsApp, err);
        throw err;
    }
}


// Inicia jobs automáticos diários (aniversário e clientes inativos) 10 DA MANHÃ 
function iniciarJobsAutomáticos() {
    cron.schedule('0 10 * * *', async () => {
        try {
            await dispararAniversario(enviarMensagem);
            await dispararInativos(enviarMensagem);
        } catch(e) {
            console.error('❌ Erro nos jobs do cron:', e);
        }
    }, {
        timezone: "America/Sao_Paulo" 
    });
}

// Reinicia a sessão do WhatsApp, limpa dados antigos e dispara novo QR Code
let isResetting = false;
ipcMain.handle('reset-whatsapp-session', async () => {
    if (isResetting) return;
    isResetting = true;

    if (global.mainWindow) {
        global.mainWindow.webContents.send('qr-status', 'Gerando QR Code, aguarde...');
    }

    try {
        await client.destroy();
        const sessionPath = path.join(__dirname, 'whatsapp-session');
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }

        client = new Client({
            authStrategy: new LocalAuth({
                clientId: "main",
                dataPath: sessionPath
            })
        });

        client.on('qr', qr => {
            lastQr = qr;
            if (global.mainWindow) {
                qrcode.toDataURL(qr).then(url => {
                    global.mainWindow.webContents.send('qr-code-generated', url);
                });
            }
        });

        client.on('ready', () => {
            clientReady = true;
        });

        await client.initialize(); 
    } catch (err) {
        console.error("❌ Erro ao reiniciar sessão:", err);
    } finally {
        isResetting = false;
    }
});

module.exports = { client, enviarMensagem, sendLastQrIfExists, iniciarJobsAutomáticos };
