//////////////////////// db.js ////////////////////////
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbDir = 'G:/Meu Drive/soulfitdb';
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'estoque.db');
const db = new sqlite3.Database(dbPath);

// Inicialização
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS mercadorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE,
    nome TEXT,
    preco REAL,
    imagem TEXT
)`);
    db.run(`CREATE TABLE IF NOT EXISTS variantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_mercadoria TEXT,
        cor TEXT,
        tamanho TEXT,
        quantidade INTEGER,
        UNIQUE(codigo_mercadoria, cor, tamanho),
        FOREIGN KEY(codigo_mercadoria) REFERENCES mercadorias(codigo)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cpf TEXT,
    telefone TEXT,
    nascimento TEXT,
    UNIQUE(nome, cpf, telefone, nascimento)
)`);
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL,
            senha TEXT NOT NULL UNIQUE
        )`);
    db.run(`CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_venda TEXT,
        codigo TEXT,
        cor TEXT,
        tamanho TEXT,
        data TEXT,
        metodo TEXT,
        preco REAL,
        quantidade INTEGER,
        parcelas INTEGER,
        cliente_id INTEGER,
        vendedor_nome TEXT,
        FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    )`);
});

module.exports = {
    addMercadoria({ codigo, nome, preco, imagem, variantes }) {
        return new Promise((res, rej) => {
            db.run(`
      INSERT INTO mercadorias (codigo, nome, preco, imagem)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET
        nome = excluded.nome,
        preco = excluded.preco,
        imagem = excluded.imagem
    `,
                [codigo, nome, preco, imagem],
                (err) => {
                    if (err) rej(err);
                    else {
                        // Remove variantes antigas
                        db.run(`DELETE FROM variantes WHERE codigo_mercadoria = ?`, [codigo], (err2) => {
                            if (err2) rej(err2);
                            else if (Array.isArray(variantes)) {
                                // Insere variantes novas
                                let pending = variantes.length;
                                if (pending === 0) return res();
                                variantes.forEach(v => {
                                    db.run(`INSERT INTO variantes (codigo_mercadoria, cor, tamanho, quantidade) VALUES (?, ?, ?, ?)`,
                                        [codigo, v.cor, v.tamanho, v.quantidade],
                                        (err3) => {
                                            if (err3) rej(err3);
                                            else if (--pending === 0) res();
                                        }
                                    );
                                });
                            } else {
                                res();
                            }
                        });
                    }
                }
            );
        });
    },
    getMercadorias() {
        return new Promise((res, rej) => {
            db.all(`SELECT * FROM mercadorias`, [], (err, mercadorias) => {
                if (err) return rej(err);
                db.all(`SELECT * FROM variantes`, [], (err2, variantes) => {
                    if (err2) return rej(err2);
                    // Agrupa variantes por codigo_mercadoria
                    const variantesPorCodigo = {};
                    for (const v of variantes) {
                        if (!variantesPorCodigo[v.codigo_mercadoria]) variantesPorCodigo[v.codigo_mercadoria] = [];
                        variantesPorCodigo[v.codigo_mercadoria].push({ cor: v.cor, tamanho: v.tamanho, quantidade: v.quantidade });
                    }
                    // Junta variantes a cada mercadoria
                    const resultado = mercadorias.map(m => ({ ...m, variantes: variantesPorCodigo[m.codigo] || [] }));
                    res(resultado);
                });
            });
        });
    },
    addVenda({ id_venda, codigo, cor, tamanho, data, metodo, preco, cliente_nome, cliente_cpf, cliente_telefone, cliente_nascimento, quantidade, parcelas, vendedor_nome }) {
        return new Promise((res, rej) => {
            if (!id_venda) {
                id_venda = Date.now().toString(36) + Math.random().toString(36).slice(2);
            }
            function descontarVariante() {
                db.run(`UPDATE variantes SET quantidade = quantidade - ? WHERE codigo_mercadoria = ? AND cor = ? AND tamanho = ?`,
                    [quantidade, codigo, cor, tamanho], (err) => {
                        if (err) rej(err); else res();
                    });
            }
            if (!cliente_nome && !cliente_cpf && !cliente_telefone) {
                db.run(`INSERT INTO vendas (id_venda, codigo, cor, tamanho, data, metodo, preco, quantidade, parcelas, cliente_id, vendedor_nome) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
                    [id_venda, codigo, cor, tamanho, data, metodo, preco, quantidade, parcelas, vendedor_nome], (err) => {
                        if (err) rej(err);
                        else descontarVariante();
                    });
                return;
            }
            db.get(`SELECT id FROM clientes WHERE nome = ? AND cpf = ? AND telefone = ? AND nascimento = ?`,
                [cliente_nome, cliente_cpf, cliente_telefone, cliente_nascimento], (err, row) => {
                    if (err) return rej(err);
                    const insertVenda = (clienteId) => {
                        db.run(`INSERT INTO vendas (id_venda, codigo, cor, tamanho, data, metodo, preco, quantidade, parcelas, cliente_id, vendedor_nome) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id_venda, codigo, cor, tamanho, data, metodo, preco, quantidade, parcelas, clienteId, vendedor_nome], (err) => {
                                if (err) rej(err);
                                else descontarVariante();
                            });
                    };
                    if (row && row.id) {
                        insertVenda(row.id);
                    } else {
                        db.run(`INSERT INTO clientes (nome, cpf, telefone, nascimento) VALUES (?, ?, ?, ?)`,
                            [cliente_nome, cliente_cpf, cliente_telefone, cliente_nascimento], function (err) {
                                if (err) rej(err);
                                else insertVenda(this.lastID);
                            });
                    }
                });
        });
    },
    getClientes() {
        return new Promise((res, rej) => {
            db.all(`SELECT * FROM clientes ORDER BY nome COLLATE NOCASE`, [], (err, rows) => {
                if (err) rej(err); else res(rows);
            });
        });
    },
    getVendas() {
        return new Promise((res, rej) => {
            db.all(`
                SELECT v.*, c.nome as cliente_nome, c.cpf as cliente_cpf, c.telefone as cliente_telefone
                FROM vendas v
                LEFT JOIN clientes c ON v.cliente_id = c.id
                ORDER BY v.data DESC
            `, [], (err, rows) => {
                if (err) rej(err); else res(rows);
            });
        });
    },
    getEstatisticas() {
        return new Promise((res, rej) => {
            db.all(`
                SELECT mes, COUNT(DISTINCT id_venda) as vendas, SUM(total) as total FROM (
                    SELECT strftime('%Y-%m', data) as mes, id_venda, SUM(preco) as total
                    FROM vendas
                    GROUP BY mes, id_venda
                )
                GROUP BY mes
            `, [], (err, rows) => {
                if (err) rej(err); else res(rows);
            });
        });
    },
    getAnaliseGeral() {
        return new Promise((res, rej) => {
            db.all(`
      SELECT
        (SELECT COUNT(*) FROM vendas) AS total_vendas,
        (SELECT SUM(preco) FROM vendas) AS total_arrecadado,
        (SELECT AVG(preco) FROM vendas) AS ticket_medio,
        (SELECT metodo FROM vendas GROUP BY metodo ORDER BY COUNT(*) DESC LIMIT 1) AS metodo_mais_usado,
        (SELECT nome FROM mercadorias WHERE codigo = (
            SELECT codigo FROM vendas GROUP BY codigo ORDER BY COUNT(*) DESC LIMIT 1
        )) AS produto_mais_vendido
    `, [], (err, rows) => {
                if (err) rej(err); else res(rows[0]);
            });
        });
    },
    editarMercadoria({ codigo, nome, preco, imagem }) {
        return new Promise((res, rej) => {
            db.run(`UPDATE mercadorias SET nome = ?, preco = ?, imagem = ? WHERE codigo = ?`,
                [nome, preco, imagem, codigo],
                (err) => { if (err) rej(err); else res(); }
            );
        });
    },
    atualizarEstoque({ codigo, cor, tamanho, quantidade }) {
        return new Promise((res, rej) => {
            if (cor && tamanho) {
                db.run(`UPDATE variantes SET quantidade = quantidade + ? WHERE codigo_mercadoria = ? AND cor = ? AND tamanho = ?`,
                    [quantidade, codigo, cor, tamanho],
                    (err) => { if (err) rej(err); else res(); }
                );
            } else {
                // fallback: atualiza todas as variantes do produto
                db.run(`UPDATE variantes SET quantidade = quantidade + ? WHERE codigo_mercadoria = ?`,
                    [quantidade, codigo],
                    (err) => { if (err) rej(err); else res(); }
                );
            }
        });
    },
    adicionarVariantes({ codigo, cor, qtds }) {
        return new Promise((res, rej) => {
            const tamanhos = Object.keys(qtds);
            if (!tamanhos.length) return res();
            let pending = tamanhos.length;
            tamanhos.forEach(tamanho => {
                const quantidade = qtds[tamanho];
                db.run(`INSERT INTO variantes (codigo_mercadoria, cor, tamanho, quantidade) VALUES (?, ?, ?, ?)
                    ON CONFLICT(codigo_mercadoria, cor, tamanho) DO UPDATE SET quantidade = quantidade + excluded.quantidade`,
                    [codigo, cor, tamanho, quantidade],
                    (err) => {
                        if (err) rej(err);
                        else if (--pending === 0) res();
                    }
                );
            });
        });
    },
    deletarMercadoria(codigo) {
        return new Promise((res, rej) => {
            db.run(`DELETE FROM mercadorias WHERE codigo = ?`, [codigo], (err) => {
                if (err) rej(err); else res();
            });
        });
    },

    deletarVenda(id_venda) {
        return new Promise((res, rej) => {
           

            // Busca todas as linhas da venda
            db.all(`SELECT codigo, cor, tamanho, quantidade FROM vendas WHERE id_venda = ?`, [id_venda], (err, rows) => {
                if (err) return rej(err);

                if (rows && rows.length) {
                    let pending = rows.length;
                    rows.forEach(({ codigo, cor, tamanho, quantidade }) => {

                        db.get(`SELECT quantidade FROM variantes WHERE codigo_mercadoria = ? AND cor = ? AND tamanho = ?`,
                            [codigo, cor, tamanho],
                            (err2, variante) => {
                                if (err2) return rej(err2);


                                if (variante) {
                                    // Variante existe, só atualiza
                                    db.run(`UPDATE variantes SET quantidade = quantidade + ? WHERE codigo_mercadoria = ? AND cor = ? AND tamanho = ?`,
                                        [quantidade, codigo, cor, tamanho],
                                        (err3) => {
                                            if (err3) {
                                                return rej(err3);
                                            }
                                            if (--pending === 0) {
                                                db.run(`DELETE FROM vendas WHERE id_venda = ?`, [id_venda], (err4) => {
                                                    if (err4) rej(err4); else res();
                                                });
                                            }
                                        }
                                    );
                                } else {
                                    // Variante não existe, cria
                                    db.run(`INSERT INTO variantes (codigo_mercadoria, cor, tamanho, quantidade) VALUES (?, ?, ?, ?)`,
                                        [codigo, cor, tamanho, quantidade],
                                        (err5) => {
                                            if (err5) {
                                                return rej(err5);
                                            }
                                            if (--pending === 0) {
                                                db.run(`DELETE FROM vendas WHERE id_venda = ?`, [id_venda], (err6) => {
                                                    if (err6) rej(err6); else res();
                                                });
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    });
                } else {
                    console.log('Nenhuma row encontrada para a venda:', id_venda);
                    // Se não achou a venda, só tenta deletar
                    db.run(`DELETE FROM vendas WHERE id_venda = ?`, [id_venda], (err3) => {
                        if (err3) rej(err3); else res();
                    });
                }
            });
        });
    },
    // Usuários
    cadastrarUsuario({ nome, cpf, senha }) {
        return new Promise((res, rej) => {
            db.run(`INSERT INTO usuarios (nome, cpf, senha) VALUES (?, ?, ?)`,
                [nome, cpf, senha],
                function (err) {
                    if (err) rej(err);
                    else res({ id: this.lastID, nome, cpf });
                });
        });
    },
    loginUsuario({ senha }) {
        return new Promise((res, rej) => {
            db.get(`SELECT * FROM usuarios WHERE senha = ?`, [senha], (err, row) => {
                if (err) rej(err);
                else if (!row) res(null);
                else res(row);
            });
        });
    },
    getUsuarios() {
        return new Promise((res, rej) => {
            db.all(`SELECT id, nome, cpf FROM usuarios`, [], (err, rows) => {
                if (err) rej(err); else res(rows);
            });
        });
    },
};
