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
  editarVariante: (dados) => ipcRenderer.invoke('editar-variante', dados),
  atualizarEstoque: (dados) => ipcRenderer.invoke('atualizar-estoque', dados),
  deletarMercadoria: (codigo) => ipcRenderer.invoke('deletar-mercadoria', codigo),
  exportarMercadorias: () => ipcRenderer.invoke('exportar-mercadorias'),
  importarMercadorias: () => ipcRenderer.invoke('importar-mercadorias'),
  onQrGenerated: (callback) => ipcRenderer.on('qr-code-generated', (event, url) => callback(url)),
  requestQr: () => ipcRenderer.send('request-qr'),
  resetWhatsappSession: () => ipcRenderer.invoke('reset-whatsapp-session'), 
  enviarMensagemGlobal: (mensagem, arquivo) => {
    console.log("🔗 preload: enviarMensagemGlobal chamada com", mensagem, arquivo);
    return ipcRenderer.invoke('enviar-mensagem-global', mensagem, arquivo);
},
  deletarVenda: (id_venda) => ipcRenderer.invoke('deletar-venda', id_venda),
  // Pagamentos
  addPagamento: (dados) => ipcRenderer.invoke('add-pagamento', dados),
  getPagamentos: () => ipcRenderer.invoke('get-pagamentos'),
  getClientesComDivida: () => ipcRenderer.invoke('get-clientes-com-divida'),
  getDividaCliente: (cliente_id) => ipcRenderer.invoke('get-divida-cliente', cliente_id),
  deletarPagamento: (id) => ipcRenderer.invoke('deletar-pagamento', id),
});

