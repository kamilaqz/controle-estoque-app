// ...existing code...

// Adiciona botão de apagar venda no histórico
function renderVendasAgrupadas(grupos) {
  const lista = document.getElementById('lista-vendas');
  if (!lista) return;
  lista.innerHTML = grupos.map((grupo, idx) => {
    const v = grupo[0];
    const { data, hora } = formatarDataHora(v.data);
    const total = grupo.reduce((acc, item) => acc + (item.preco || 0), 0);
    const totalQtd = grupo.reduce((acc, item) => acc + (item.quantidade || 0), 0);
    return `
      <div class="item-venda card venda-accordion" style="margin-bottom:12px;">
        <div class="venda-header" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:1em;" data-idx="${idx}">
          <div>
            <strong>${data}</strong> <span style="color:#888;font-size:0.95em;">${hora}</span> | R$ ${total.toFixed(2)} | ${v.metodo || '-'}
            ${v.cliente_nome ? `| Cliente: <span style='color:#1976d2'>${v.cliente_nome}</span>` : ''}
            | <b>Qtd:</b> ${totalQtd}
          </div>
          <span class="venda-toggle" style="font-size:1.0em;user-select:none;">&#x25BC;</span>
          <button class="btn-apagar-venda" data-id-venda="${v.id_venda}" style="margin-left:10px;color:#c00;">🗑️ Apagar</button>
        </div>
        <div class="venda-detalhes" style="display:none;padding:10px 0 0 0;">
          <b>Itens da venda:</b>
          <ul style="margin:8px 0 0 0; padding-left:18px;">
            ${grupo.map(item => `
              <li>
                <b>${item.codigo}</b> - Qtd: ${item.quantidade} - R$ ${item.preco?.toFixed(2) ?? '-'}
                ${item.cor ? `| Cor: ${item.cor}` : ''}
                ${item.tamanho ? `| Tam: ${item.tamanho === 'T.U.' ? 'Tamanho Único' : item.tamanho}` : ''}
              </li>
            `).join('')}
          </ul>
          <div style="margin-top:8px;">
            <b>Método de Pagamento:</b> ${v.metodo ?? '-'}<br>
            ${v.metodo === 'Cartão Crédito' ? `<b>Parcelas:</b> ${v.parcelas ? v.parcelas : '-'}<br>` : ''}
            <b>Data:</b> ${data} <span style="color:#888;font-size:0.95em;">${hora}</span><br>
            <b>Cliente:</b> ${v.cliente_nome || '-'}${v.cliente_cpf ? ' | CPF: ' + v.cliente_cpf : ''}${v.cliente_telefone ? ' | Tel: ' + v.cliente_telefone : ''}<br>
            <b>Vendedor:</b> ${v.vendedor_nome || '-'}
          </div>
        </div>
      </div>
    `;
  }).join('');
  // Acordeon toggle (sempre após render)
  setTimeout(() => {
    document.querySelectorAll('.venda-header').forEach(header => {
      header.onclick = function (e) {
        // Evita abrir/fechar se clicar no botão de apagar
        if (e.target.classList.contains('btn-apagar-venda')) return;
        const detalhes = this.parentElement.querySelector('.venda-detalhes');
        const toggle = this.querySelector('.venda-toggle');
        if (detalhes.style.display === 'none' || detalhes.style.display === '') {
          detalhes.style.display = 'block';
          toggle.innerHTML = '&#x25B2;';
        } else {
          detalhes.style.display = 'none';
          toggle.innerHTML = '&#x25BC;';
        }
      };
    });
    // Evento para apagar venda
    document.querySelectorAll('.btn-apagar-venda').forEach(btn => {
      btn.onclick = async function (e) {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja apagar esta venda?')) {
          const id_venda = btn.getAttribute('data-id-venda');
          await window.api.deletarVenda(id_venda);
          carregarVendas();
          mostrarToast('Venda apagada com sucesso!');
        }
      };
    });
  }, 0);
}
// ...existing code...
// Destacar botões do editor de mensagens quando selecionados
const toolbar = document.getElementById('toolbar-mensagem');
const editor = document.getElementById('editor-mensagem');
if (toolbar && editor) {
  function updateToolbarSelection() {
    const commands = [
      { cmd: 'bold', btn: toolbar.querySelector('[title="Negrito"]') },
      { cmd: 'italic', btn: toolbar.querySelector('[title="Itálico"]') },
      { cmd: 'underline', btn: toolbar.querySelector('[title="Sublinhado"]') }
    ];
    commands.forEach(({cmd, btn}) => {
      if (!btn) return;
      document.queryCommandState(cmd) ? btn.classList.add('selected') : btn.classList.remove('selected');
    });
  }
  editor.addEventListener('keyup', updateToolbarSelection);
  editor.addEventListener('mouseup', updateToolbarSelection);
  toolbar.addEventListener('click', setTimeout.bind(null, updateToolbarSelection, 0));
}
// Preview da imagem na aba de mensagens
document.getElementById('imagem-mensagem')?.addEventListener('change', function(e) {
  const preview = document.getElementById('preview-imagem-mensagem');
  preview.innerHTML = '';
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.maxWidth = '180px';
      img.style.maxHeight = '180px';
      img.style.borderRadius = '8px';
      img.style.marginTop = '8px';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});
// Exibe lista de clientes na aba "Clientes"
async function carregarClientes() {
  const container = document.getElementById('lista-clientes');
  if (!container) return;
  container.innerHTML = '<div style="color:#888; font-size:15px;">Carregando...</div>';
  let clientes = [];
  try {
    clientes = await window.api.getClientes();
  } catch (e) {
    container.innerHTML = '<div style="color:#c00;">Erro ao carregar clientes.</div>';
    return;
  }
  if (!clientes.length) {
    container.innerHTML = '<div style="color:#888; font-size:15px;">Nenhum cliente cadastrado.</div>';
    return;
  }
  function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
    return data;
  }
  function renderTabela(filtrados) {
    const html = `<table style="width:100%;border-collapse:collapse;font-size:1.15em;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:12px 8px;border-bottom:2px solid #b3d8f6;text-align:left;color:#1976d2;font-size:1em;">Nome</th>
          <th style="padding:12px 8px;border-bottom:2px solid #b3d8f6;text-align:left;color:#1976d2;font-size:1em;">Telefone</th>
          <th style="padding:12px 8px;border-bottom:2px solid #b3d8f6;text-align:left;color:#1976d2;font-size:1em;">Data de Nascimento</th>
        </tr>
      </thead>
      <tbody>
        ${filtrados.map(c => `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">${c.nome || '-'}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">${c.telefone || '-'}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #eee;">${formatarData(c.nascimento)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
    container.innerHTML = html;
  }
  // Filtro
  const buscaInput = document.getElementById('busca-clientes');
  function normalizarDataParaComparacao(data) {
    if (!data) return '';
    // Aceita AAAA-MM-DD ou DD/MM/AAAA
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      return data;
    }
    return data;
  }
  function filtrar() {
    const termo = (buscaInput?.value || '').toLowerCase().trim();
    if (!termo) {
      renderTabela(clientes);
      return;
    }
    const filtrados = clientes.filter(c => {
      const nome = (c.nome || '').toLowerCase();
      const telefone = (c.telefone || '').toLowerCase();
      const nasc = (c.nascimento || '');
      const nascFormatada = normalizarDataParaComparacao(nasc).toLowerCase();
      // Permite buscar por parte da data em ambos formatos
      return (
        nome.includes(termo) ||
        telefone.includes(termo) ||
        nascFormatada.includes(termo) ||
        nasc.includes(termo)
      );
    });
    renderTabela(filtrados);
  }
  buscaInput?.removeEventListener('input', filtrar);
  buscaInput?.addEventListener('input', filtrar);
  filtrar();
}

// Mostra aba clientes ao clicar no menu
document.querySelector("[onclick=\"abrirAba('clientes')\"]")?.addEventListener('click', carregarClientes);
// Toast simples para confirmações visuais (deve ficar no topo para uso global)
function mostrarToast(msg) {
  let toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '32px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#32cc4bff';
  toast.style.color = '#fff';
  toast.style.padding = '14px 32px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '1.1em';
  toast.style.boxShadow = '0 2px 12px #0003';
  toast.style.zIndex = 9999;
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}

// --- CONTROLE DE LOGIN SIMPLES (TELA INICIAL) ---
let usuarioLogado = null;

function mostrarLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.style.display = 'flex';
}

function esconderLoginScreen() {
  const screen = document.getElementById('login-screen');
  if (screen) screen.style.display = 'none';
}

function configurarLoginScreen() {
  const loginForm = document.getElementById('form-login');
  const cadastroForm = document.getElementById('form-cadastro');
  const btnAbrirCadastro = document.getElementById('btn-abrir-cadastro');
  const btnVoltarLogin = document.getElementById('btn-voltar-login');
  const loginContainer = document.getElementById('login-form-container');
  const cadastroContainer = document.getElementById('cadastro-form-container');
  
  if (!loginForm || !cadastroForm) return;

  // CPF Mask for cadastro
  const cadastroCpfInput = document.getElementById('cadastro-cpf');
  if (cadastroCpfInput) {
    cadastroCpfInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  // Custom toast function for login screen (non-blocking)
  function showLoginToast(message, isError = false) {
    const existingToast = document.querySelector('.login-toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'login-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isError ? '#f44336' : '#4caf50'};
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Função para focar no primeiro input visível e limpar formulários
  function focarPrimeiroInput(container) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const inputs = container.querySelectorAll('input[type="text"], input[type="password"], input[type="number"]');
      if (inputs.length > 0) {
        inputs[0].focus();
        // Force focus if needed
        setTimeout(() => {
          if (document.activeElement !== inputs[0]) {
            inputs[0].click();
            inputs[0].focus();
          }
        }, 50);
      }
    }, 100);
  }

  // Troca para cadastro
  btnAbrirCadastro.onclick = () => {
    loginContainer.style.display = 'none';
    cadastroContainer.style.display = '';
    
    // Limpa o formulário de cadastro
    cadastroForm.reset();
    
    // Foca no primeiro input do cadastro
    focarPrimeiroInput(cadastroContainer);
  };

  // Volta para login
  btnVoltarLogin.onclick = () => {
    cadastroContainer.style.display = 'none';
    loginContainer.style.display = '';
    
    // Limpa o formulário de login
    loginForm.reset();
    
    // Foca no primeiro input do login
    focarPrimeiroInput(loginContainer);
  };

  // Cadastro
  cadastroForm.onsubmit = async (e) => {
    e.preventDefault();
    const nome = document.getElementById('cadastro-nome').value.trim();
    const cpf = document.getElementById('cadastro-cpf').value.replace(/\D/g, '');
    const senha = document.getElementById('cadastro-senha').value;
    
    if (senha.length !== 6) {
      showLoginToast('A senha deve ter 6 dígitos.', true);
      return;
    }
    
    try {
      await window.api.cadastrarUsuario({ nome, cpf, senha });
      
      // Show success message without blocking
      showLoginToast('Usuário cadastrado com sucesso! Faça login.');
      
      // Switch to login form immediately (non-blocking)
      cadastroContainer.style.display = 'none';
      loginContainer.style.display = '';
      
      // Reset forms
      cadastroForm.reset();
      loginForm.reset();
      
      // Focus on password input after a short delay
      setTimeout(() => {
        const senhaInput = document.getElementById('login-senha');
        if (senhaInput) {
          senhaInput.focus();
        }
      }, 100);
      
    } catch (err) {
      if (err && (err.message || '').includes('UNIQUE') && (err.message || '').includes('senha')) {
        showLoginToast('Já existe um usuário cadastrado com essa senha. Escolha uma senha diferente.', true);
      } else {
        showLoginToast('Erro ao cadastrar usuário: ' + (err.message || err), true);
      }
    }
  };

  // Login
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const senha = document.getElementById('login-senha').value;
    
    if (senha.length !== 6) {
      showLoginToast('A senha deve ter 6 dígitos.', true);
      return;
    }
    
    const user = await window.api.loginUsuario({ senha });
    if (!user) {
      showLoginToast('Senha inválida!', true);
      // Clear and refocus on password input
      const senhaInput = document.getElementById('login-senha');
      if (senhaInput) {
        senhaInput.value = '';
        setTimeout(() => senhaInput.focus(), 100);
      }
      return;
    }
    
    usuarioLogado = user;
    esconderLoginScreen();
    localStorage.setItem('usuarioLogado', JSON.stringify(user));
    mostrarToast('Bem-vindo(a), ' + user.nome + '!');
  };

  // Initial focus on login screen
  setTimeout(() => {
    focarPrimeiroInput(loginContainer);
  }, 300);
}

// Exibe tela de login ao abrir app
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Sempre exige login ao abrir: limpa usuário salvo
    localStorage.removeItem('usuarioLogado');
    const tryShow = () => {
      const screen = document.getElementById('login-screen');
      if (screen) {
        mostrarLoginScreen();
        configurarLoginScreen();
      } else {
        setTimeout(tryShow, 100);
      }
    };
    tryShow();
  }, 200);
});
// Variável global para cache de mercadorias (deve ser declarada antes de qualquer uso)
let _mercadoriasCache = [];

// Função para redimensionar e salvar imagem (escopo global real)
async function resizeAndSaveImage(file, codigo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const maxWidth = 200;
        const maxHeight = 200;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        // Salva como base64 temporariamente
        const dataUrl = canvas.toDataURL('image/png');
        // Envia para o backend salvar como arquivo
        window.api.salvarImagem({ codigo, dataUrl }).then((relativePath) => {
          resolve(relativePath);
        }).catch(reject);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Garantir disponibilidade mínima de abrirAba antes do DOMContentLoaded
if (typeof window.abrirAba !== 'function') {
  window.abrirAba = function (id) {
    try {
      document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
      const el = document.getElementById(id);
      if (el) el.classList.add('ativa');
    } catch (e) { /* noop */ }
  };
}

// Utilitário para filtrar dados por mês/ano (YYYY-MM)
window.filtrarPorMes = function filtrarPorMes(dados, campoData, mesAno) {
  if (!mesAno) return dados;
  // mesAno: '2025-08' (input type="month")
  return dados.filter(e => {
    const data = (e[campoData] || '').slice(0, 7); // Assume formato 'YYYY-MM-DD' ou 'YYYY-MM'
    return data === mesAno;
  });
};

window.atualizarGraficosComFiltro = async function atualizarGraficosComFiltro() {
  const mesSelecionado = document.getElementById('filtro-mes').value;
  // Filtra estatísticas e vendas
  let stats = window._estatisticasCache || [];
  let vendas = window._vendasCache || [];

  if (mesSelecionado) {
    // Sempre mostra o mês selecionado no gráfico, mesmo sem vendas
    let found = false;
    stats = stats.filter(e => {
      let mes = e.mes || '';
      // Aceita formatos '2025-08', '08/2025', '2025/08', etc
      if (/^\d{4}-\d{2}$/.test(mes) && mes === mesSelecionado) { found = true; return true; }
      if (/^\d{2}\/\d{4}$/.test(mes)) {
        // '08/2025' => '2025-08'
        const [m, y] = mes.split('/');
        if (`${y}-${m}` === mesSelecionado) { found = true; return true; }
      }
      if (/^\d{4}\/\d{2}$/.test(mes) && mes.replace('/', '-') === mesSelecionado) { found = true; return true; }
      return false;
    });
    if (!found) {
      // Adiciona mês zerado
      stats = [{ mes: mesSelecionado, total: 0, vendas: 0 }];
    }
    vendas = window.filtrarPorMes(vendas, 'data', mesSelecionado);
  }

  // Initialize charts object if it doesn't exist
  window._charts = window._charts || {};

  // Atualiza gráficos
  const canvasVendas = document.getElementById('grafico-vendas');
  const canvasPizza = document.getElementById('grafico-pizza');
  const canvasLinha = document.getElementById('grafico-linha-vendas');
  
  if (!canvasVendas || !canvasPizza) return;

  // Bar Chart (Vendas por mês)
  if (window._charts['grafico-vendas']) window._charts['grafico-vendas'].destroy();
  window._charts['grafico-vendas'] = new Chart(canvasVendas, {
    type: 'bar',
    data: {
      labels: stats.length ? stats.map(e => e.mes) : ['(sem dados)'],
      datasets: [
        {
          label: 'Total R$ Vendido',
          data: stats.length ? stats.map(e => e.total) : [0],
          backgroundColor: '#4caf50'
        },
        {
          label: 'Qtd de Vendas',
          data: stats.length ? stats.map(e => e.vendas) : [0],
          backgroundColor: '#2196f3'
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Estatísticas por Mês' }
      }
    }
  });

  // Pie Chart (Métodos de pagamento)
  if (window._charts['grafico-pizza']) window._charts['grafico-pizza'].destroy();
  const metodos = ['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'PIX'];
  const counts = metodos.map(m => vendas.length ? vendas.filter(v => v.metodo === m).length : 0);
  window._charts['grafico-pizza'] = new Chart(canvasPizza, {
    type: 'pie',
    data: {
      labels: metodos,
      datasets: [{
        data: counts,
        backgroundColor: ['#4caf50', '#ff9800', '#1976d2', '#2196f3']
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Métodos de Pagamento' }
      }
    }
  });

  // Line Chart (Total vendido mês a mês) - FIXED
  if (canvasLinha) {
    if (window._charts['grafico-linha-vendas']) window._charts['grafico-linha-vendas'].destroy();
    
    // Use all stats for line chart (not filtered), unless we want to show trend
    const allStats = window._estatisticasCache || [];
    
    window._charts['grafico-linha-vendas'] = new Chart(canvasLinha, {
      type: 'line',
      data: {
        labels: allStats.length ? allStats.map(e => e.mes) : ['(sem dados)'],
        datasets: [{
          label: 'Total Vendido (R$)',
          data: allStats.length ? allStats.map(e => e.total) : [0],
          borderColor: '#e91e63',
          backgroundColor: 'rgba(233,30,99,0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#e91e63',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Histórico de Total Vendido por Mês' }
        },
        scales: {
          y: { 
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toFixed(2);
              }
            }
          }
        },
        elements: {
          point: {
            hoverRadius: 8
          }
        }
      }
    });
  }

  // Atualiza cards
  if (typeof carregarAnaliseGeral === 'function') carregarAnaliseGeral(mesSelecionado);
};

document.addEventListener('DOMContentLoaded', () => {
  // --- SUPORTE A VARIANTES NO CADASTRO DE MERCADORIA ---
  function adicionarVariante(cor = '', qtds = { P: 0, M: 0, G: 0, GG: 0 }) {
    const container = document.getElementById('variantes-container');
    const div = document.createElement('div');
    div.className = 'variante-linha';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.margin = '8px 0';
    div.style.gap = '8px';
    div.innerHTML = `
      <input type="text" class="cor-variante" placeholder="Cor" required style="width:90px;" value="${cor}" />
      <span style="margin:0 8px 0 8px;">Qtd por tamanho:</span>
  <label>P <input type="number" class="qtd-tamanho" data-tamanho="P" min="0" value="${qtds.P || 0}" style="width:50px;" /></label>
  <label>M <input type="number" class="qtd-tamanho" data-tamanho="M" min="0" value="${qtds.M || 0}" style="width:50px;" /></label>
  <label>G <input type="number" class="qtd-tamanho" data-tamanho="G" min="0" value="${qtds.G || 0}" style="width:50px;" /></label>
  <label>GG <input type="number" class="qtd-tamanho" data-tamanho="GG" min="0" value="${qtds.GG || 0}" style="width:50px;" /></label>
  <label>T.U. <input type="number" class="qtd-tamanho" data-tamanho="T.U." min="0" value="${qtds['T.U.'] || 0}" style="width:50px;" /></label>
      <button type="button" class="remover-variante" style="margin-left:8px;">✖</button>
    `;
    container.appendChild(div);
    atualizarRemoverVisibilidade();
    div.querySelector('.remover-variante').onclick = function () {
      div.remove();
      atualizarRemoverVisibilidade();
    };
  }

  function atualizarRemoverVisibilidade() {
    const linhas = document.querySelectorAll('#variantes-container .variante-linha');
    linhas.forEach((linha, idx) => {
      const btn = linha.querySelector('.remover-variante');
      btn.style.display = (linhas.length > 1) ? '' : 'none';
    });
  }

  const btnAddVariante = document.getElementById('adicionar-variante');
  if (btnAddVariante) {
    btnAddVariante.onclick = () => adicionarVariante('', { P: 0, M: 0, G: 0, GG: 0, 'T.U.': 0 });
  }

  // Inicializa com apenas uma linha (já existe no HTML)
  atualizarRemoverVisibilidade();

  let lastMonth = (new Date()).toISOString().slice(0, 7); // 'YYYY-MM'
  setInterval(() => {
    const nowMonth = (new Date()).toISOString().slice(0, 7);
    if (nowMonth !== lastMonth) {
      lastMonth = nowMonth;
      // Se estiver na aba de gráficos, recarrega
      const abaGraficos = document.getElementById('graficos');
      if (abaGraficos && abaGraficos.classList.contains('ativa')) {
        carregarEstatisticas();
        carregarAnaliseGeral();
      }
    }
  }, 60000); // verifica a cada minuto

  // Atualiza o valor total da venda em tempo real
  async function atualizarTotalVenda() {
    const mercadorias = await window.api.getMercadorias();
    let total = 0;
    document.querySelectorAll('.item-venda-linha').forEach(linha => {
      const codigo = linha.querySelector('.codigo-produto').value;
      const qtd = parseInt(linha.querySelector('.quantidade-produto').value) || 0;
      const prod = mercadorias.find(m => m.codigo === codigo);
      if (prod && qtd > 0) total += prod.preco * qtd;
    });
    const el = document.getElementById('venda-total');
    if (el) el.textContent = total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Observa mudanças nos inputs de código e quantidade
  function bindTotalVendaListeners() {
    document.querySelectorAll('.item-venda-linha').forEach(linha => {
      linha.querySelector('.codigo-produto').addEventListener('input', atualizarTotalVenda);
      linha.querySelector('.quantidade-produto').addEventListener('input', atualizarTotalVenda);
    });
  }

  // Inicializa listeners ao adicionar novo item
  const containerVenda = document.getElementById('itens-venda');
  if (containerVenda) {
    new MutationObserver(() => {
      bindTotalVendaListeners();
      atualizarTotalVenda();
    }).observe(containerVenda, { childList: true, subtree: true });
  }
  // Inicializa para os campos já existentes
  bindTotalVendaListeners();
  atualizarTotalVenda();

  // Exibe campo de parcelas se Cartão Crédito for selecionado
  const metodoSelect = document.getElementById('metodo');
  const parcelasContainer = document.getElementById('parcelas-container');
  if (metodoSelect && parcelasContainer) {
    metodoSelect.addEventListener('change', function () {
      if (metodoSelect.value === 'Cartão Crédito') {
        parcelasContainer.style.display = '';
      } else {
        parcelasContainer.style.display = 'none';
      }
    });
    // Garante estado inicial
    if (metodoSelect.value !== 'Cartão Crédito') parcelasContainer.style.display = 'none';
  }

  // --- CLIENT MASKS & AUTOCOMPLETE FOR VENDAS ---
  const vCpfInput = document.getElementById('venda_cliente_cpf');
  const vPhoneInput = document.getElementById('venda_cliente_telefone');
  const vNomeInput = document.getElementById('venda_cliente_nome');
  const vNascimentoInput = document.getElementById('venda_cliente_nascimento');
  let clientList = [];

  // Simple mask for CPF: 999.999.999-99
  vCpfInput && vCpfInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  });

  // Simple mask for phone: (99) 99999-9999
  vPhoneInput && vPhoneInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = v;
  });

  // --- CLIENT AUTOCOMPLETE ---
  async function updateClientList() {
    if (!window.api.getClientes) return;
    const clientes = await window.api.getClientes();
    clientList = clientes;
  }
  updateClientList();

  // Autocomplete dropdown
  let acDropdown;
  vNomeInput && vNomeInput.addEventListener('input', function (e) {
    const val = e.target.value.trim().toLowerCase();
    if (!val) { removeDropdown(); return; }
    const matches = clientList.filter(c => c.nome && c.nome.toLowerCase().includes(val));
    if (matches.length === 0) { removeDropdown(); return; }
    showDropdown(matches, e.target);
  });

  function showDropdown(matches, input) {
    removeDropdown();
    acDropdown = document.createElement('div');
    acDropdown.className = 'autocomplete-dropdown';
    acDropdown.style.position = 'absolute';
    acDropdown.style.background = '#fff';
    acDropdown.style.border = '1px solid #ccc';
    acDropdown.style.zIndex = 1000;
    acDropdown.style.width = input.offsetWidth + 'px';
    acDropdown.style.maxHeight = '140px';
    acDropdown.style.overflowY = 'auto';
    acDropdown.style.fontSize = '1em';
    acDropdown.style.left = input.getBoundingClientRect().left + window.scrollX + 'px';
    acDropdown.style.top = input.getBoundingClientRect().bottom + window.scrollY + 'px';
    matches.forEach(c => {
      const opt = document.createElement('div');
      opt.textContent = c.nome;
      opt.style.padding = '4px 8px';
      opt.style.cursor = 'pointer';
      opt.addEventListener('mousedown', () => {
        vNomeInput.value = c.nome;
        if (vCpfInput) vCpfInput.value = c.cpf || '';
        if (vPhoneInput) vPhoneInput.value = c.telefone || '';
        if (vNascimentoInput) {
          let nasc = c.nascimento || '';
          // Se vier no formato DD/MM/YYYY, converte para YYYY-MM-DD
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(nasc)) {
            const [dia, mes, ano] = nasc.split('/');
            nasc = `${ano}-${mes}-${dia}`;
          }
          vNascimentoInput.value = nasc;
        }
        removeDropdown();
      });
      acDropdown.appendChild(opt);
    });
    document.body.appendChild(acDropdown);
  }

  function removeDropdown() {
    if (acDropdown && acDropdown.parentNode) acDropdown.parentNode.removeChild(acDropdown);
    acDropdown = null;
  }

  document.addEventListener('click', (e) => {
    if (acDropdown && !vNomeInput.contains(e.target)) removeDropdown();
  });

  // Atualiza lista de clientes ao registrar venda
  const formVenda = document.getElementById('form-venda');
  formVenda && formVenda.addEventListener('submit', () => setTimeout(updateClientList, 500));

  window.abrirAba = function (id) {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativa');
    if (id === 'mercadorias') {
      _mercadoriasCache = [];
      carregarMercadorias();
    }
    if (id === 'graficos') {
      setTimeout(() => {
        carregarEstatisticas();
        carregarAnaliseGeral();
      }, 100);
    }
  };

  _mercadoriasCache = [];
  carregarMercadorias();
  carregarVendas();
  carregarEstatisticas();
  carregarAnaliseGeral();

  document.getElementById('form-mercadoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = document.getElementById('codigo').value;
    const nome = document.getElementById('nome').value;
    const preco = parseFloat(document.getElementById('preco').value);
    const imagemInput = document.getElementById('imagem');

    // Verifica se já existe produto com o mesmo código
    const mercadoriasExistentes = await window.api.getMercadorias();
    if (mercadoriasExistentes.some(m => m.codigo === codigo)) {
      alert('Já existe uma mercadoria cadastrada com este código. Edite a mercadoria existente ou delete para cadastrar novamente.');
      return;
    }

    let imagem = '';
    if (imagemInput.files && imagemInput.files[0]) {
      imagem = await resizeAndSaveImage(imagemInput.files[0], codigo);
    }

    // Coleta variantes: para cada cor, gera uma variante para cada tamanho com quantidade > 0
    const variantes = [];
    Array.from(document.querySelectorAll('#variantes-container .variante-linha')).forEach(linha => {
      const cor = linha.querySelector('.cor-variante').value.trim();
      linha.querySelectorAll('.qtd-tamanho').forEach(input => {
        const tamanho = input.getAttribute('data-tamanho');
        const quantidade = parseInt(input.value);
        if (cor && tamanho && quantidade > 0) {
          variantes.push({ cor, tamanho, quantidade });
        }
      });
    });

    if (variantes.length === 0) {
      alert('Preencha pelo menos uma variante com quantidade maior que zero!');
      return;
    }

    console.log('Variantes a cadastrar:', variantes);
    const dados = {
      codigo,
      nome,
      preco,
      imagem,
      variantes
    };

    await window.api.addMercadoria(dados);
    e.target.reset();
    // Remove variantes extras e reseta primeira
    const container = document.getElementById('variantes-container');
    while (container.children.length > 1) container.lastChild.remove();
    const corInput = container.querySelector('.cor-variante');
    if (corInput) corInput.value = '';
    container.querySelectorAll('.qtd-tamanho').forEach(input => input.value = 0);
    atualizarRemoverVisibilidade();
    _mercadoriasCache = [];
    await carregarMercadorias();
  });

  document.getElementById('form-venda').addEventListener('submit', async (e) => {
    e.preventDefault();

    const itens = Array.from(document.querySelectorAll('.item-venda-linha'));
    const metodo = document.getElementById('metodo').value;
    let parcelas = 1;
    if (metodo === 'Cartão Crédito') {
      parcelas = parseInt(document.getElementById('parcelas').value) || 1;
    }
    // Dados do cliente
  const cliente_nome = vNomeInput ? vNomeInput.value : '';
  const cliente_cpf = vCpfInput ? vCpfInput.value : '';
  const cliente_telefone = vPhoneInput ? vPhoneInput.value : '';
  const cliente_nascimento = vNascimentoInput ? vNascimentoInput.value : '';

    const mercadorias = await window.api.getMercadorias();
    let erroEstoque = false;

    for (const item of itens) {
      const codigo = item.querySelector('.codigo-produto').value;
      const cor = item.querySelector('.cor-variante-venda')?.value;
      const tamanho = item.querySelector('.tamanho-variante-venda')?.value;
      const quantidade = parseInt(item.querySelector('.quantidade-produto').value);
      const produto = mercadorias.find(p => p.codigo === codigo);
      if (!produto) {
        alert(`Produto com código ${codigo} não encontrado.`);
        erroEstoque = true;
        continue;
      }
      const variante = (produto.variantes || []).find(v => v.cor === cor && v.tamanho === tamanho);
      if (!variante) {
        alert(`Variante não encontrada para ${codigo} (${cor} ${tamanho})`);
        erroEstoque = true;
        continue;
      }
      if (quantidade > variante.quantidade) {
        alert(`Estoque insuficiente para ${produto.nome} - ${cor} ${tamanho} (em estoque: ${variante.quantidade}, solicitado: ${quantidade})`);
        erroEstoque = true;
        continue;
      }
    }
    if (erroEstoque) return;


    // Gera um id_venda único para todos os itens desta venda
    const id_venda = Date.now().toString(36) + Math.random().toString(36).slice(2);
    // Recupera nome do usuário logado do localStorage (garantia)
    let vendedor_nome = null;
    try {
      vendedor_nome = (usuarioLogado && usuarioLogado.nome) ? usuarioLogado.nome : null;
      if (!vendedor_nome) {
        const userStr = localStorage.getItem('usuarioLogado');
        if (userStr) vendedor_nome = JSON.parse(userStr).nome;
      }
    } catch {}

    for (const item of itens) {
      const codigo = item.querySelector('.codigo-produto').value;
      const cor = item.querySelector('.cor-variante-venda')?.value;
      const tamanho = item.querySelector('.tamanho-variante-venda')?.value;
      const quantidade = parseInt(item.querySelector('.quantidade-produto').value);
      const produto = mercadorias.find(p => p.codigo === codigo);
      const variante = (produto.variantes || []).find(v => v.cor === cor && v.tamanho === tamanho);
      if (!produto || !variante || quantidade > variante.quantidade) continue;

      const venda = {
        id_venda,
        codigo,
        cor,
        tamanho,
        quantidade,
        data: new Date().toISOString(),
        metodo,
        preco: produto.preco * quantidade,
  cliente_nome,
  cliente_cpf,
  cliente_telefone,
  cliente_nascimento,
        parcelas,
        vendedor_nome
      };

      await window.api.registrarVenda(venda);
    }

  e.target.reset();
  carregarVendas();
  carregarEstatisticas();
  carregarAnaliseGeral();
  limparItensVenda();
  mostrarToast('Venda registrada com sucesso!');
// Toast simples para confirmações visuais
  });

  document.getElementById('adicionar-item').addEventListener('click', () => {
    adicionarLinhaVenda();
  });

  // --- AUTOCOMPLETE E SELECTS DINÂMICOS PARA VENDA ---
  async function autocompleteMercadoriasInit() {
    if (!_mercadoriasCache.length) _mercadoriasCache = await window.api.getMercadorias();
  }

  function criarSelect(options, className, placeholder) {
    const select = document.createElement('select');
    select.className = className;
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = placeholder;
    select.appendChild(optDefault);
    let opts = options.slice();
    if (!opts.includes('T.U.')) opts.push('T.U.');
    opts.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    });
    return select;
  }

  function adicionarLinhaVenda() {
    const container = document.getElementById('itens-venda');
    const linha = document.createElement('div');
    linha.classList.add('item-venda-linha');
    linha.style.display = 'flex';
    linha.style.gap = '8px';

    // Inputs para código e nome
    const inputCodigo = document.createElement('input');
    inputCodigo.type = 'text';
    inputCodigo.className = 'codigo-produto';
    inputCodigo.placeholder = 'Código do Produto';
    inputCodigo.setAttribute('autocomplete', 'off');

    const inputNome = document.createElement('input');
    inputNome.type = 'text';
    inputNome.className = 'nome-produto';
    inputNome.placeholder = 'Nome do Produto';
    inputNome.setAttribute('autocomplete', 'off');

    // Selects de cor e tamanho (preenchidos dinamicamente)
    const selectCor = criarSelect([], 'cor-variante-venda', 'Cor');
    const selectTamanho = criarSelect([], 'tamanho-variante-venda', 'Tamanho');

    // Quantidade
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.className = 'quantidade-produto';
    inputQtd.placeholder = 'Qtd';
    inputQtd.min = 1;
    inputQtd.value = 1;

    // Remover item
    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'remover-item';
    btnRemover.textContent = '✖';
    btnRemover.onclick = () => linha.remove();

    linha.appendChild(inputCodigo);
    linha.appendChild(inputNome);
    linha.appendChild(selectCor);
    linha.appendChild(selectTamanho);
    linha.appendChild(inputQtd);
    linha.appendChild(btnRemover);
    container.appendChild(linha);

    // --- AUTOCOMPLETE LÓGICA ---
    let acDropdownCodigo = null;
    let acDropdownNome = null;

    function removeDropdownCodigo() {
      if (acDropdownCodigo && acDropdownCodigo.parentNode) acDropdownCodigo.parentNode.removeChild(acDropdownCodigo);
      acDropdownCodigo = null;
    }
    function removeDropdownNome() {
      if (acDropdownNome && acDropdownNome.parentNode) acDropdownNome.parentNode.removeChild(acDropdownNome);
      acDropdownNome = null;
    }

    inputCodigo.addEventListener('input', async function (e) {
      await autocompleteMercadoriasInit();
      const val = e.target.value.trim().toLowerCase();
      if (!val) { removeDropdownCodigo(); return; }
      const matches = _mercadoriasCache.filter(m => m.codigo && m.codigo.toLowerCase().includes(val));
      if (matches.length === 0) { removeDropdownCodigo(); return; }
      removeDropdownCodigo();
      acDropdownCodigo = document.createElement('div');
      acDropdownCodigo.className = 'autocomplete-dropdown';
      acDropdownCodigo.style.position = 'absolute';
      acDropdownCodigo.style.background = '#fff';
      acDropdownCodigo.style.border = '1px solid #ccc';
      acDropdownCodigo.style.zIndex = 1000;
      acDropdownCodigo.style.width = inputCodigo.offsetWidth + 'px';
      acDropdownCodigo.style.maxHeight = '140px';
      acDropdownCodigo.style.overflowY = 'auto';
      acDropdownCodigo.style.fontSize = '1em';
      acDropdownCodigo.style.left = inputCodigo.getBoundingClientRect().left + window.scrollX + 'px';
      acDropdownCodigo.style.top = inputCodigo.getBoundingClientRect().bottom + window.scrollY + 'px';
      matches.forEach(m => {
        const opt = document.createElement('div');
        opt.textContent = `${m.codigo} - ${m.nome}`;
        opt.style.padding = '4px 8px';
        opt.style.cursor = 'pointer';
        opt.addEventListener('mousedown', () => {
          inputCodigo.value = m.codigo;
          inputNome.value = m.nome;
          preencherCoresETamanhos(m, selectCor, selectTamanho);
          removeDropdownCodigo();
          removeDropdownNome();
        });
        acDropdownCodigo.appendChild(opt);
      });
      document.body.appendChild(acDropdownCodigo);
    });

    inputNome.addEventListener('input', async function (e) {
      await autocompleteMercadoriasInit();
      const val = e.target.value.trim().toLowerCase();
      if (!val) { removeDropdownNome(); return; }
      const matches = _mercadoriasCache.filter(m => m.nome && m.nome.toLowerCase().includes(val));
      if (matches.length === 0) { removeDropdownNome(); return; }
      removeDropdownNome();
      acDropdownNome = document.createElement('div');
      acDropdownNome.className = 'autocomplete-dropdown';
      acDropdownNome.style.position = 'absolute';
      acDropdownNome.style.background = '#fff';
      acDropdownNome.style.border = '1px solid #ccc';
      acDropdownNome.style.zIndex = 1000;
      acDropdownNome.style.width = inputNome.offsetWidth + 'px';
      acDropdownNome.style.maxHeight = '140px';
      acDropdownNome.style.overflowY = 'auto';
      acDropdownNome.style.fontSize = '1em';
      acDropdownNome.style.left = inputNome.getBoundingClientRect().left + window.scrollX + 'px';
      acDropdownNome.style.top = inputNome.getBoundingClientRect().bottom + window.scrollY + 'px';
      matches.forEach(m => {
        const opt = document.createElement('div');
        opt.textContent = `${m.nome} (${m.codigo})`;
        opt.style.padding = '4px 8px';
        opt.style.cursor = 'pointer';
        opt.addEventListener('mousedown', () => {
          inputCodigo.value = m.codigo;
          inputNome.value = m.nome;
          preencherCoresETamanhos(m, selectCor, selectTamanho);
          removeDropdownCodigo();
          removeDropdownNome();
        });
        acDropdownNome.appendChild(opt);
      });
      document.body.appendChild(acDropdownNome);
    });

    document.addEventListener('click', (e) => {
      if (acDropdownCodigo && !inputCodigo.contains(e.target)) removeDropdownCodigo();
      if (acDropdownNome && !inputNome.contains(e.target)) removeDropdownNome();
    });

    // Ao sair do input, se código/nome bater, preenche o outro
    inputCodigo.addEventListener('blur', async function () {
      await autocompleteMercadoriasInit();
      const val = inputCodigo.value.trim();
      if (!val) return;
      const m = _mercadoriasCache.find(m => m.codigo === val);
      if (m) {
        inputNome.value = m.nome;
        preencherCoresETamanhos(m, selectCor, selectTamanho);
      }
    });
    inputNome.addEventListener('blur', async function () {
      await autocompleteMercadoriasInit();
      const val = inputNome.value.trim();
      if (!val) return;
      const m = _mercadoriasCache.find(m => m.nome === val);
      if (m) {
        inputCodigo.value = m.codigo;
        preencherCoresETamanhos(m, selectCor, selectTamanho);
      }
    });

    // Ao trocar cor, preenche tamanhos disponíveis
    selectCor.addEventListener('change', function () {
      const codigo = inputCodigo.value.trim();
      const m = _mercadoriasCache.find(m => m.codigo === codigo);
      preencherTamanhosPorCor(m, selectCor.value, selectTamanho);
    });

    // Inicializa autocomplete se já houver valor
    if (inputCodigo.value) inputCodigo.dispatchEvent(new Event('blur'));
    if (inputNome.value) inputNome.dispatchEvent(new Event('blur'));
  }

  function preencherCoresETamanhos(produto, selectCor, selectTamanho) {
    if (!produto) return;
    // Preenche cores
    const cores = [...new Set((produto.variantes || []).map(v => v.cor))];
    selectCor.innerHTML = '';
    const optDefault = document.createElement('option');
    optDefault.value = '';
    optDefault.textContent = 'Cor';
    selectCor.appendChild(optDefault);
    cores.forEach(cor => {
      const o = document.createElement('option');
      o.value = cor;
      o.textContent = cor;
      selectCor.appendChild(o);
    });
    // Limpa tamanhos
    selectTamanho.innerHTML = '';
    const optT = document.createElement('option');
    optT.value = '';
    optT.textContent = 'Tamanho';
    selectTamanho.appendChild(optT);
  }

  function preencherTamanhosPorCor(produto, cor, selectTamanho) {
    if (!produto) return;
    let tamanhos = (produto.variantes || []).filter(v => v.cor === cor).map(v => v.tamanho);
    // Só mostra T.U. se realmente existir para a cor selecionada
    selectTamanho.innerHTML = '';
    const optT = document.createElement('option');
    optT.value = '';
    optT.textContent = 'Tamanho';
    selectTamanho.appendChild(optT);
    tamanhos.forEach(t => {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t;
      selectTamanho.appendChild(o);
    });
  }

  // Inicializa a primeira linha de venda ao carregar a página
  // (Moved initialization to the end to ensure DOM is ready)
  setTimeout(async () => {
    if (!_mercadoriasCache.length) _mercadoriasCache = await window.api.getMercadorias();
    const container = document.getElementById('itens-venda');
    // Sempre remove a(s) linha(s) inicial(is) do HTML e cria uma nova via adicionarLinhaVenda()
    if (container) {
      while (container.children.length > 0) container.removeChild(container.firstChild);
      adicionarLinhaVenda();
    }
  }, 100);

  function limparItensVenda() {
    const container = document.getElementById('itens-venda');
    if (container) container.innerHTML = '';
  }

  // Filtro de busca de mercadorias
  const buscaInput = document.getElementById('busca-mercadorias');
  if (buscaInput) {
    buscaInput.addEventListener('input', function () {
      carregarMercadorias(this.value);
    });
  }
});

async function carregarMercadorias(filtro = '') {
  const lista = document.getElementById('lista-mercadorias');
  if (!lista) return;

  let dados = _mercadoriasCache.length ? _mercadoriasCache : await window.api.getMercadorias();
  if (!_mercadoriasCache.length) _mercadoriasCache = dados;

  if (filtro) {
    const termo = filtro.trim().toLowerCase();
    dados = dados.filter(m =>
      (m.codigo && m.codigo.toLowerCase().includes(termo)) ||
      (m.nome && m.nome.toLowerCase().includes(termo))
    );
  }

  lista.innerHTML = dados.map(d => {
    const estoqueTotal = (d.variantes || []).reduce((acc, v) => acc + (v.quantidade || 0), 0);
    return `
      <div class="item-mercadoria card" style="display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px;">
        <div>
          <div class="mercadoria-header"><strong>${d.nome}</strong></div>
          <div class="mercadoria-info">Código: ${d.codigo}</div>
          <div class="mercadoria-info">Preço: R$ ${d.preco.toFixed(2)}</div>
          <div class="mercadoria-info">Estoque total: <b>${estoqueTotal}</b></div>
          <div class="mercadoria-info">
            <ul style="margin:2px 0 0 0;padding-left:18px;">
              ${(d.variantes || [])
        .slice()
        .sort((a, b) => {
          // Ordena por cor (alfabética)
          if (a.cor < b.cor) return -1;
          if (a.cor > b.cor) return 1;
          // Se cor igual, ordena por tamanho (P, M, G, GG)
          const ordemTamanhos = ['P', 'M', 'G', 'GG', 'T.U.'];
          return ordemTamanhos.indexOf(a.tamanho) - ordemTamanhos.indexOf(b.tamanho);
        })
        .map(v => `<li>${v.cor} - ${v.tamanho}: <b>${v.quantidade}</b></li>`).join('')}
            </ul>
          </div>
          <div class="mercadoria-actions" style="margin-top:0.5em; display:flex; gap:0.5em; align-items:center;">
            <button class="btn-editar" title="Editar" data-codigo="${d.codigo}" style="padding:2px 8px;">✏️</button> 
            <button class="btn-deletar" title="Deletar" data-codigo="${d.codigo}" style="padding:2px 8px; color:#c00;">🗑️</button>  
            <button class="btn-estoque" title="Atualizar estoque" data-codigo="${d.codigo}" style="padding:2px 8px;">Atualizar estoque</button>
          </div>
        </div>
        ${d.imagem ? `<img src="${d.imagem}" alt="Imagem" style="max-width:100px;max-height:100px;border-radius:8px;box-shadow:0 1px 4px #0002;object-fit:cover;" />` : ''}
      </div>
    `;
  }).join('');

  // Adiciona listeners para os botões de ação
  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const codigo = btn.getAttribute('data-codigo');
      const mercadorias = await window.api.getMercadorias();
      const item = mercadorias.find(m => m.codigo == codigo);
      if (!item) return alert('Mercadoria não encontrada!');
      abrirDialogEditar(item);
    });
  });

  document.querySelectorAll('.btn-estoque').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const codigo = btn.getAttribute('data-codigo');
      const mercadorias = await window.api.getMercadorias();
      const item = mercadorias.find(m => m.codigo == codigo);
      if (!item) return alert('Mercadoria não encontrada!');
      abrirDialogEstoque(item);
    });
  });

  document.querySelectorAll('.btn-deletar').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const codigo = btn.getAttribute('data-codigo');
      if (confirm('Tem certeza que deseja deletar este produto e todo o seu estoque?')) {
        await window.api.deletarMercadoria(codigo);
        _mercadoriasCache = [];
        carregarMercadorias();
      }
    });
  });
}

// Dialog para editar mercadoria (exceto quantidade)
function abrirDialogEditar(item) {
  const html = `
    <div id="dialog-editar" class="dialog-overlay">
      <div class="dialog-box">
        <h3>Editar Mercadoria</h3>
        <label>Nome:<br><input id="edit-nome" type="text" value="${item.nome}" /></label><br>
        <label>Preço:<br><input id="edit-preco" type="number" min="0" step="0.01" value="${item.preco}" /></label><br>
        <label>Imagem:<br><input id="edit-imagem" type="file" accept="image/*" /></label><br>
        <img src="${item.imagem || ''}" id="edit-preview" style="display:${item.imagem ? 'block' : 'none'};margin:8px 0;" />
        <div class="dialog-actions">
          <button id="btn-salvar-edit">Salvar</button>
          <button id="btn-cancelar-edit" class="btn-cancelar-edit">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  fecharDialogs();
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('btn-cancelar-edit').onclick = fecharDialogs;
  document.getElementById('edit-imagem').onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        document.getElementById('edit-preview').src = ev.target.result;
        document.getElementById('edit-preview').style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };
  document.getElementById('btn-salvar-edit').onclick = async function () {
    const nome = document.getElementById('edit-nome').value.trim();
    const preco = parseFloat(document.getElementById('edit-preco').value);
    let imagem = item.imagem;
    const file = document.getElementById('edit-imagem').files[0];
    if (file) {
      imagem = await resizeAndSaveImage(file, item.codigo);
    }
    await window.api.editarMercadoria({ codigo: item.codigo, nome, preco, imagem });
    fecharDialogs();
    _mercadoriasCache = [];
    carregarMercadorias();
  };
}

// Dialog para atualizar estoque
function abrirDialogEstoque(item) {
  // Busca variantes do produto
  const variantes = (item.variantes || []);
  const html = `
    <div id="dialog-estoque" class="dialog-overlay">
      <div class="dialog-box">
        <h3>Atualizar Estoque</h3>
        <div>Produto: <strong>${item.nome}</strong></div>
        <label>Cor:<br><select id="estoque-cor"><option value="">Selecione</option>${[...new Set(variantes.map(v => v.cor))].map(cor => `<option value="${cor}">${cor}</option>`).join('')}<option value="__nova__">+ Nova cor</option></select></label>
         <div id="nova-cor-container" style="display:none; margin-top:10px;">
          <label>Nova cor:<br><input id="nova-cor-input" type="text" placeholder="Cor" style="width:90px;" /></label><br>
        </div>
        <div id="estoque-tamanhos-container" style="margin-top:10px;">
          <div style="margin-top:6px;">Qtd por tamanho:<br>
            <label>P <input type="number" class="qtd-tamanho-nova" data-tamanho="P" min="0" value="0" style="width:50px;" /></label>
            <label>M <input type="number" class="qtd-tamanho-nova" data-tamanho="M" min="0" value="0" style="width:50px;" /></label>
            <label>G <input type="number" class="qtd-tamanho-nova" data-tamanho="G" min="0" value="0" style="width:50px;" /></label>
            <label>GG <input type="number" class="qtd-tamanho-nova" data-tamanho="GG" min="0" value="0" style="width:50px;" /></label>
            <label>T.U. <input type="number" class="qtd-tamanho-nova" data-tamanho="T.U." min="0" value="0" style="width:50px;" /></label>
          </div>
        </div>
        <div class="dialog-actions" style="margin-top:12px;">
          <button id="btn-salvar-estoque">Salvar</button>
          <button id="btn-cancelar-estoque" class="btn-cancelar-edit">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  fecharDialogs();
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('btn-cancelar-estoque').onclick = fecharDialogs;

  // Preenche tamanhos ao selecionar cor
  const corSelect = document.getElementById('estoque-cor');
  const tamSelect = document.getElementById('estoque-tamanho');
  const tamanhosContainer = document.getElementById('estoque-tamanhos-container');
  const novaCorContainer = document.getElementById('nova-cor-container');

  corSelect.onchange = function () {
    if (corSelect.value === '__nova__') {
      novaCorContainer.style.display = '';
    } else {
      novaCorContainer.style.display = 'none';
    }
  };

  document.getElementById('btn-salvar-estoque').onclick = async function () {
    let cor;
    if (corSelect.value === '__nova__') {
      cor = document.getElementById('nova-cor-input').value.trim();
      if (!cor) return alert('Informe a nova cor!');
    } else {
      cor = corSelect.value;
      if (!cor) return alert('Selecione uma cor!');
    }
    const qtds = {};
    document.querySelectorAll('.qtd-tamanho-nova').forEach(input => {
      const t = input.getAttribute('data-tamanho');
      const q = parseInt(input.value);
      if (q > 0) qtds[t] = q;
    });
    if (Object.keys(qtds).length === 0) return alert('Informe ao menos uma quantidade para algum tamanho!');
    await window.api.adicionarVariantes({ codigo: item.codigo, cor, qtds });
    fecharDialogs();
    _mercadoriasCache = [];
    carregarMercadorias();
  };
}

function fecharDialogs() {
  document.querySelectorAll('.dialog-overlay').forEach(d => d.remove());
}

function limparItensVenda() {
  const container = document.getElementById('itens-venda');
  if (container) container.innerHTML = '';
}

async function carregarVendas(filtro = '') {
  const lista = document.getElementById('lista-vendas');
  if (!lista) return;

  let dados = await window.api.getVendas();

  // Agrupa vendas por venda (data+cliente+metodo+parcelas)
  function groupVendas(vendas) {
    const map = new Map();
    vendas.forEach(v => {
      let key = v.id_venda;
      if (!key) {
        let dataKey = v.data;
        if (typeof dataKey === 'string' && dataKey.length > 19) dataKey = dataKey.slice(0, 19);
        key = [dataKey, v.cliente_nome || '', v.cliente_cpf || '', v.cliente_telefone || '', v.metodo || '', v.parcelas || ''].join('|');
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(v);
    });
    return Array.from(map.values());
  }

  let grupos = groupVendas(dados);

  if (filtro) {
    const termo = filtro.trim().toLowerCase();
    grupos = grupos.filter(grupo =>
      grupo.some(v => {
        const data = (v.data || '').split('T')[0].split('-').reverse().join('/');
        return (
          (v.codigo && v.codigo.toLowerCase().includes(termo)) ||
          (v.cliente_nome && v.cliente_nome.toLowerCase().includes(termo)) ||
          (data && data.includes(termo))
        );
      })
    );
  }

  function formatarDataHora(dataIso) {
    if (!dataIso) return { data: '-', hora: '-' };
    const d = new Date(dataIso);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return { data: `${dia}/${mes}/${ano}`, hora: `${hora}:${min}` };
  }

  // Agrupa vendas por venda (data+cliente+metodo+parcelas)
  function groupVendas(vendas) {
    const map = new Map();
    vendas.forEach(v => {
      // Se existir id_venda, agrupa por ele; senão, usa fallback antigo
      let key = v.id_venda;
      if (!key) {
        let dataKey = v.data;
        if (typeof dataKey === 'string' && dataKey.length > 19) dataKey = dataKey.slice(0, 19);
        key = [dataKey, v.cliente_nome || '', v.cliente_cpf || '', v.cliente_telefone || '', v.metodo || '', v.parcelas || ''].join('|');
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(v);
    });
    return Array.from(map.values());
  }

  function renderVendasAgrupadas(grupos) {
    lista.innerHTML = grupos.map((grupo, idx) => {
      const v = grupo[0];
      const { data, hora } = formatarDataHora(v.data);
      const total = grupo.reduce((acc, item) => acc + (item.preco || 0), 0);
      const totalQtd = grupo.reduce((acc, item) => acc + (item.quantidade || 0), 0);
      return `
        <div class="item-venda card venda-accordion" style="margin-bottom:12px;">
          <div class="venda-header" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:1em;" data-idx="${idx}">
            <div>
              <strong>${data}</strong> <span style="color:#888;font-size:0.95em;">${hora}</span> | R$ ${total.toFixed(2)} | ${v.metodo || '-'}
              ${v.cliente_nome ? `| Cliente: <span style='color:#1976d2'>${v.cliente_nome}</span>` : ''}
              | <b>Qtd:</b> ${totalQtd}
            </div>
            <span class="venda-toggle" style="font-size:1.0em;user-select:none;">&#x25BC;</span>
          </div>
          <div class="venda-detalhes" style="display:none;padding:10px 0 0 0;">
            <b>Itens da venda:</b>
            <ul style="margin:8px 0 0 0; padding-left:18px;">
              ${grupo.map(item => `
                <li>
                  <b>${item.codigo}</b> - Qtd: ${item.quantidade} - R$ ${item.preco?.toFixed(2) ?? '-'}
                  ${item.cor ? `| Cor: ${item.cor}` : ''}
                  ${item.tamanho ? `| Tam: ${item.tamanho === 'T.U.' ? 'Tamanho Único' : item.tamanho}` : ''}
                </li>
              `).join('')}
            </ul>
            <div style="margin-top:8px;">
              <b>Método de Pagamento:</b> ${v.metodo ?? '-'}<br>
              ${v.metodo === 'Cartão Crédito' ? `<b>Parcelas:</b> ${v.parcelas ? v.parcelas : '-'}<br>` : ''}
              <b>Data:</b> ${data} <span style="color:#888;font-size:0.95em;">${hora}</span><br>
              <b>Cliente:</b> ${v.cliente_nome || '-'}${v.cliente_cpf ? ' | CPF: ' + v.cliente_cpf : ''}${v.cliente_telefone ? ' | Tel: ' + v.cliente_telefone : ''}<br>
              <b>Vendedor:</b> ${v.vendedor_nome || '-'}
              <div style="margin-top:16px; display:flex; justify-content:flex-end;">
                <button class="btn-apagar-venda" data-id-venda="${v.id_venda}" style="background:#fff0f0;border:1px solid #e57373;color:#c00;padding:6px 16px;border-radius:6px;font-size:0.80em;cursor:pointer;transition:background 0.2s;">
                  Apagar venda
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    // Acordeon toggle (sempre após render)
    setTimeout(() => {
      document.querySelectorAll('.venda-header').forEach(header => {
        header.onclick = function (e) {
          // Evita abrir/fechar se clicar no botão de apagar
          if (e.target.classList.contains('btn-apagar-venda')) return;
          const detalhes = this.parentElement.querySelector('.venda-detalhes');
          const toggle = this.querySelector('.venda-toggle');
          if (detalhes.style.display === 'none' || detalhes.style.display === '') {
            detalhes.style.display = 'block';
            toggle.innerHTML = '&#x25B2;';
          } else {
            detalhes.style.display = 'none';
            toggle.innerHTML = '&#x25BC;';
          }
        };
      });
      // Evento para apagar venda
      document.querySelectorAll('.btn-apagar-venda').forEach(btn => {
        btn.onclick = async function (e) {
          e.stopPropagation();
          const id_venda = btn.getAttribute('data-id-venda');
          if (confirm('Tem certeza que deseja apagar esta venda?')) {
            await window.api.deletarVenda(id_venda);
            carregarVendas();
            mostrarToast('Venda apagada com sucesso!');
          }
        };
      });
    }, 0);
  }

  renderVendasAgrupadas(grupos);

  // Filtro de pesquisa
  const buscaInput = document.getElementById('busca-vendas');
  if (buscaInput) {
    buscaInput.addEventListener('input', function () {
      carregarVendas(this.value.trim().toLowerCase());
    });
  }
}

async function carregarEstatisticas() {
  // Carrega dados
  window._estatisticasCache = await window.api.getEstatisticas();
  window._vendasCache = await window.api.getVendas();
  atualizarGraficosComFiltro();

  // Adiciona listeners de filtro
  setTimeout(() => {
    const btnFiltro = document.getElementById('btn-filtrar-mes');
    const btnLimpar = document.getElementById('btn-limpar-filtro');
    if (btnFiltro && !btnFiltro._listener) {
      btnFiltro.addEventListener('click', atualizarGraficosComFiltro);
      btnFiltro._listener = true;
    }
    if (btnLimpar && !btnLimpar._listener) {
      btnLimpar.addEventListener('click', () => {
        document.getElementById('filtro-mes').value = '';
        atualizarGraficosComFiltro();
      });
      btnLimpar._listener = true;
    }
  }, 200);
}

// Atualiza cards de análise geral conforme filtro
async function carregarAnaliseGeral(mesSelecionado) {
  // Use window._vendasCache filtrado se mesSelecionado
  let vendas = window._vendasCache || [];
  if (mesSelecionado) {
    vendas = filtrarPorMes(vendas, 'data', mesSelecionado);
  }

  // Garante que _mercadoriasCache está carregado
  if (!_mercadoriasCache.length) {
    _mercadoriasCache = await window.api.getMercadorias();
  }

  // Atualiza cards de análise geral com vendas filtradas
  // Total de mercadorias vendidas (itens)
  const total_mercadorias = vendas.length;
  // Total de vendas únicas (por id_venda)
  const total_vendas = new Set(vendas.map(v => v.id_venda)).size;
  const total_arrecadado = vendas.reduce((acc, v) => acc + (v.preco || 0), 0);
  const ticket_medio = total_vendas ? total_arrecadado / total_vendas : 0;

  // Produto mais vendido
  let produto_mais_vendido = 'Nenhum';
  if (vendas.length) {
    const prodCount = {};
    vendas.forEach(v => { prodCount[v.codigo] = (prodCount[v.codigo] || 0) + (v.quantidade || 1); });
    const max = Math.max(...Object.values(prodCount));
    const cod = Object.keys(prodCount).find(c => prodCount[c] === max);
    let nome = vendas.find(v => v.codigo === cod)?.nome;
    if (!nome && Array.isArray(_mercadoriasCache)) {
      nome = _mercadoriasCache.find(m => m.codigo === cod)?.nome;
    }
    produto_mais_vendido = nome || cod || 'Nenhum';
  }

  // Método mais usado
  let metodo_mais_usado = 'Nenhum';
  if (vendas.length) {
    const metodoCount = {};
    vendas.forEach(v => { metodoCount[v.metodo] = (metodoCount[v.metodo] || 0) + 1; });
    const max = Math.max(...Object.values(metodoCount));
    metodo_mais_usado = Object.keys(metodoCount).find(m => metodoCount[m] === max) || 'Nenhum';
  }

  const cards = `
    <div class="dashboard-grid">
      <div class="card">📦 Total de mercadorias vendidas: <strong>${total_mercadorias}</strong></div>
      <div class="card">💳 Total de vendas: <strong>${total_vendas}</strong></div>
      <div class="card">💰 Total Arrecadado: <strong>R$ ${total_arrecadado.toFixed(2)}</strong></div>
      <div class="card">🧾 Ticket Médio: <strong>R$ ${ticket_medio.toFixed(2)}</strong></div>
      <div class="card">🏆 Produto Mais Vendido: <strong>${produto_mais_vendido}</strong></div>
      <div class="card">💳 Método Mais Usado: <strong>${metodo_mais_usado}</strong></div>
    </div>
  `;

  const cardsContainer = document.getElementById('cards-analise');
  if (cardsContainer) cardsContainer.innerHTML = cards;

  // Agora desenha os gráficos (com controle de instâncias Chart.js)
  if (!window._charts) window._charts = {};

  function destroyChart(id) {
    if (window._charts[id]) {
      window._charts[id].destroy();
      window._charts[id] = null;
    }
  }

  // Gráfico de vendas por mês (barras)
  const stats = await window.api.getEstatisticas();
  const canvasVendas = document.getElementById('grafico-vendas');
  if (canvasVendas) {
    destroyChart('grafico-vendas');
    window._charts['grafico-vendas'] = new Chart(canvasVendas, {
      type: 'bar',
      data: {
        labels: stats.length ? stats.map(e => e.mes) : ['(sem dados)'],
        datasets: [
          { label: 'Total R$ Vendido', data: stats.length ? stats.map(e => e.total) : [0], backgroundColor: '#4caf50' },
          { label: 'Qtd de Vendas', data: stats.length ? stats.map(e => e.vendas) : [0], backgroundColor: '#2196f3' }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Vendas por Mês' }
        }
      }
    });
  }

  // Gráfico de métodos de pagamento (pizza)
  const metodos = ['Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'PIX'];
  const vendasAll = await window.api.getVendas();
  const counts = metodos.map(m => vendasAll.filter(v => v.metodo === m).length);
  const canvasPizza = document.getElementById('grafico-pizza');
  if (canvasPizza) {
    destroyChart('grafico-pizza');
    window._charts['grafico-pizza'] = new Chart(canvasPizza, {
      type: 'pie',
      data: {
        labels: metodos,
        datasets: [{
          data: counts,
          backgroundColor: ['#4caf50', '#ff9800', '#1976d2', '#2196f3']
        }]
      },
      options: {
        plugins: {
          title: { display: true, text: 'Métodos de Pagamento' }
        }
      }
    });
  }
}