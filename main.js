const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { client, enviarMensagem} = require('./whatsapp');
const cron = require('node-cron');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'assets/favicon.ico')
    });

    mainWindow.loadFile('index.html');
    global.mainWindow = mainWindow;
}

app.whenReady().then(() => {
    createWindow();
    client.initialize();
    console.log("🚀 WhatsApp Client inicializado no main.js");
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ------------------- IPC HANDLERS -------------------

ipcMain.handle('cadastrar-usuario', (e, dados) => db.cadastrarUsuario(dados));
ipcMain.handle('login-usuario', (e, dados) => db.loginUsuario(dados));
ipcMain.handle('get-usuarios', () => db.getUsuarios());
ipcMain.handle('add-mercadoria', (e, dados) => db.addMercadoria(dados));
ipcMain.handle('get-mercadorias', () => db.getMercadorias());
ipcMain.handle('registrar-venda', (e, venda) => db.addVenda(venda));
ipcMain.handle('get-vendas', () => db.getVendas());
ipcMain.handle('get-estatisticas', () => db.getEstatisticas());
ipcMain.handle('get-clientes', () => db.getClientes());
ipcMain.handle('get-analise-geral', () => db.getAnaliseGeral());

ipcMain.handle('salvar-imagem', async (e, { codigo, dataUrl }) => {
    try {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const imagesDir = path.join(__dirname, 'assets', 'images');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        const fileName = `mercadoria_${codigo}_${Date.now()}.png`;
        const filePath = path.join(imagesDir, fileName);
        fs.writeFileSync(filePath, base64Data, 'base64');
        return `assets/images/${fileName}`;
    } catch (err) {
        console.error('Erro ao salvar imagem:', err);
        return '';
    }
});

ipcMain.handle('editar-mercadoria', (e, dados) => db.editarMercadoria(dados));
ipcMain.handle('atualizar-estoque', (e, dados) => db.atualizarEstoque(dados));
ipcMain.handle('adicionar-variantes', (e, dados) => db.adicionarVariantes(dados));
ipcMain.handle('deletar-mercadoria', (e, codigo) => db.deletarMercadoria(codigo));

// ------------------- ENVIO GLOBAL DE MENSAGENS -------------------

// Recebe do front-end uma mensagem e, opcionalmente, uma imagem, 
// e envia para todos os clientes da base de forma única (sem repetir números)
ipcMain.handle('enviar-mensagem-global', async (event, mensagem, imagemPath) => {
    const clientes = await db.getClientes();
    const telefonesUnicos = new Set();

    for (const c of clientes) {
        const telefoneLimpo = c.telefone.replace(/\D/g, '');
        if (!telefoneLimpo) continue; 

        if (telefonesUnicos.has(telefoneLimpo)) {
            continue;
        }

        telefonesUnicos.add(telefoneLimpo);

        try {
            await enviarMensagem(telefoneLimpo, mensagem, imagemPath);
        } catch (err) {
            console.error("❌ Erro enviando para:", telefoneLimpo, err);
        }
    }

    return true;
});

