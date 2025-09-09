# Soulfit Controle de Estoque

Este aplicativo foi desenvolvido para facilitar o controle de estoque, vendas, clientes e disparo de mensagens em lojas de roupas ou similares.

## Principais Funcionalidades

- **Cadastro de Mercadorias**
  - Adicione produtos com código, nome, preço, imagem e variantes (cor, tamanho, quantidade).
  - Pesquise mercadorias por nome ou código.

- **Registro de Vendas**
  - Venda múltiplos produtos em uma única operação.
  - Escolha método de pagamento (Dinheiro, Cartão Crédito/Débito, PIX).
  - Controle de parcelas para cartão de crédito.
  - Dados do cliente opcionais: nome, telefone, CPF, data de nascimento.

- **Histórico de Vendas**
  - Visualize todas as vendas realizadas.
  - Pesquise por código, cliente ou data.

- **Estatísticas**
  - Gráficos de vendas por mês, métodos de pagamento e histórico de total vendido.
  - Comparação de desempenho entre meses.

- **Clientes**
  - Lista de clientes cadastrados com nome, telefone e data de nascimento.
  - Filtro de busca por nome, telefone ou data de nascimento.

- **Disparo de Mensagens**
  - Editor de texto rico para criar mensagens (negrito, itálico, sublinhado, listas, citação, alinhamento).
  - Adicione imagem à mensagem.

## Sincronização do Banco de Dados

- O arquivo `estoque.db` pode ser sincronizado via Google Drive para uso em múltiplos dispositivos.

## Requisitos
- Node.js
- Electron
- Google Drive para Desktop (opcional, para sincronização)

## Como iniciar
1. Instale as dependências: `npm install`
2. Inicie o app: `npx electron .`

---

Para dúvidas ou sugestões, entre em contato com o desenvolvedor.
