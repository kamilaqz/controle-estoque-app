const { getClientes, getVendas } = require('./db');
const path = require('path');

// Formata um número de telefone adicionando o código do Brasil se necessário
function formatarNumero(telefone) {
    let num = telefone.replace(/\D/g, ""); 
    if (!num.startsWith("55")) {
        num = "55" + num; 
    }
    return num;
}

// Envia mensagens de aniversário para clientes que fazem aniversário hoje
async function dispararAniversario(enviarMensagemFn) {
    const clientes = await getClientes();
    const hoje = new Date();
    const mesDiaHoje = String(hoje.getMonth() + 1).padStart(2,'0') + '-' + String(hoje.getDate()).padStart(2,'0');

    const telefonesEnviados = new Set();
    const imagemParabens = path.join(__dirname, 'assets', 'parabens.jpg'); 

    for (const c of clientes) {
        if (!c.nascimento) continue;

        const [dia, mes] = c.nascimento.split('/');
        const nascimentoFormatado = `${mes}-${dia}`;

        
        if (nascimentoFormatado === mesDiaHoje) {
            const numero = formatarNumero(c.telefone);
            if (telefonesEnviados.has(numero)) continue;

            telefonesEnviados.add(numero);
            const mensagem = `🎉 Parabéns, ${c.nome}! A equipe SoulFit deseja um novo ciclo cheio de conquistas, energia e treinos incríveis 💪 
Continue se superando com estilo — e conte com a gente nessa jornada! 🖤🔥`;

            await enviarMensagemFn(numero, mensagem, imagemParabens); 
        }
    }
}

// Envia mensagens para clientes inativos (sem compras recentes)
async function dispararInativos(enviarMensagemFn) {
    const vendas = await getVendas();
    const clientes = await getClientes();
    const hoje = new Date();
    const limiteDias = 30; // DIAS 
    const telefonesEnviados = new Set();
    const imagemInativos = path.join(__dirname, 'assets', 'inatividade.jpg'); 
    for (const c of clientes) {
        const ultVenda = vendas
            .filter(v => v.cliente_id === c.id)
            .sort((a,b) => new Date(b.data.split('/').reverse().join('-')) - new Date(a.data.split('/').reverse().join('-')))[0];

        if (ultVenda) { 
            const ultimaData = new Date(ultVenda.data.split('/').reverse().join('-'));
            const diasInativos = (hoje - ultimaData) / (1000*60*60*24);

            if (diasInativos > limiteDias) {
                const numero = formatarNumero(c.telefone);
                if (telefonesEnviados.has(numero)) continue;

                telefonesEnviados.add(numero);
                const mensagem = `👋 Oi, ${c.nome}! Sentimos sua falta 💜 A SoulFit está cheia de novidades pra te ajudar a manter o foco e o estilo nos treinos! 💪🔥`;

                await enviarMensagemFn(numero, mensagem, imagemInativos); 
            }
        }
    }
}


module.exports = { dispararAniversario, dispararInativos };
