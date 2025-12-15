//////////////////////// preload.js ////////////////////////
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  cadastrarUsuario: (dados) => ipcRenderer.invoke('cadastrar-usuario', dados),
  loginUsuario: (dados) => ipcRenderer.invoke('login-usuario', dados),
  getUsuarios: () => ipcRenderer.invoke('get-usuarios'),
  adicionarVariantes: (dados) => ipcRenderer.invoke('adicionar-variantes', dados),
  addMercadoria: (dados) => ipcRenderer.invoke('add-mercadoria', dados),
  getMercadorias: () => ipcRenderer.invoke('get-mercadorias'),
  registrarVenda: (venda) => ipcRenderer.invoke('registrar-venda', venda),
  getVendas: () => ipcRenderer.invoke('get-vendas'),
  getEstatisticas: () => ipcRenderer.invoke('get-estatisticas'),
  getAnaliseGeral: () => ipcRenderer.invoke('get-analise-geral'),
  salvarImagem: (imgData) => ipcRenderer.invoke('salvar-imagem', imgData),
  getClientes: () => ipcRenderer.invoke('get-clientes'),
  editarMercadoria: (dados) => ipcRenderer.invoke('editar-mercadoria', dados),
  atualizarEstoque: (dados) => ipcRenderer.invoke('atualizar-estoque', dados),
  deletarMercadoria: (codigo) => ipcRenderer.invoke('deletar-mercadoria', codigo),
  onQrGenerated: (callback) => ipcRenderer.on('qr-code-generated', (event, url) => callback(url)),
  requestQr: () => ipcRenderer.send('request-qr'),
  resetWhatsappSession: () => ipcRenderer.invoke('reset-whatsapp-session'), 
  enviarMensagemGlobal: (mensagem, arquivo) => {
    console.log("🔗 preload: enviarMensagemGlobal chamada com", mensagem, arquivo);
    return ipcRenderer.invoke('enviar-mensagem-global', mensagem, arquivo);
},
  deletarVenda: (id_venda) => ipcRenderer.invoke('deletar-venda', id_venda),
});

