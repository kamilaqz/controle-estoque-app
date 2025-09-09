const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db');

function createWindow() {

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/favicon.ico')
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  const { app, BrowserWindow, ipcMain } = require('electron');
  const path = require('path');
  const fs = require('fs');
  const db = require('./db');

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
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
    return '';
  }
});
ipcMain.handle('editar-mercadoria', (e, dados) => db.editarMercadoria(dados));
ipcMain.handle('atualizar-estoque', (e, dados) => db.atualizarEstoque(dados));
ipcMain.handle('adicionar-variantes', (e, dados) => db.adicionarVariantes(dados));
ipcMain.handle('deletar-mercadoria', (e, codigo) => db.deletarMercadoria(codigo));


