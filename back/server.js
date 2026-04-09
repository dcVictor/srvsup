const express = require('express');
const cors = require('cors');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const snmp = require('net-snmp');
const { Pool } = require('pg')
const cron = require('node-cron');

const app = express();
const PORT = 4174;

const { autenticarNoAD } = require('./authService');

app.use(cors()); 
app.use(express.json()); 


const pool = new Pool({
  user: 'victor',         
  host: '192.168.1.32',        
  database: 'srvsuportebd', 
  password: 'NeyVic8+',    
  port: 5432,              
});

// const pool = new Pool({
//   user: 'postgres',         
//   host: '192.168.9.122',        
//   database: 'impressoras', 
//   password: 'NeyVic8+',    
//   port: 5432,              
// });


pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Erro ao conectar no banco de dados:', err.stack);
  }
  console.log('✅ Conectado com sucesso ao banco de dados!');
  release(); 
});

// --- FUNÇÃO DIGEST (MANTIDA IGUAL) ---
async function fazerChamadaDigest(url, options) {
  const { method = 'GET', username, password } = options;

  try {
    await axios({ method, url });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      const authHeader = error.response.headers['www-authenticate'];
      if (!authHeader) {
        throw new Error('O servidor não enviou o desafio WWW-Authenticate.');
      }

      const digestParams = {};
      authHeader.replace(/(\w+)="([^"]*)"/g, (match, key, value) => {
        digestParams[key] = value;
      });

      const { realm, nonce, qop } = digestParams;
      const cnonce = CryptoJS.lib.WordArray.random(8).toString();
      const nc = '00000001';
      const path = new URL(url).pathname + new URL(url).search;

      const HA1 = CryptoJS.MD5(`${username}:${realm}:${password}`).toString();
      const HA2 = CryptoJS.MD5(`${method}:${path}`).toString();
      const responseHash = CryptoJS.MD5(`${HA1}:${nonce}:${nc}:${cnonce}:${qop}:${HA2}`).toString();

      const authorization = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${path}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${responseHash}"`;

      return axios({
        method,
        url,
        headers: { 'Authorization': authorization },
      });
    }
    throw error;
  }
}

// --- ROTA DE LIBERAÇÃO DA CATRACA (MANTIDA IGUAL) ---
app.post('/api/abrir-porta', async (req, res, next) => {
  const { idCatraca } = req.body;

  const dispositivos = {
    'catraca1': { ip: '192.168.14.7', user: 'admin', pass: 'Admti89@' },
    'catraca2': { ip: '192.168.14.5', user: 'admin', pass: 'Admti89@' },
    'catraca3': { ip: '192.168.14.3', user: 'admin', pass: 'Admti89@' },
    'catraca4': { ip: '192.168.14.6', user: 'admin', pass: 'Admti89@' },
    'catraca5': { ip: '192.168.16.54', user: 'admin', pass: 'Admti89#' },
    'catraca6': { ip: '192.168.16.54', user: 'admin', pass: 'Admti89#' },
    'catraca7': { ip: '192.168.9.150', user: 'admin', pass: 'Admti89@' }
  };

  const dispositivo = dispositivos[idCatraca];
  if (!dispositivo) {
    return res.status(404).json({ message: 'Dispositivo (catraca) não encontrado' });
  }

  try {
    const url = `http://${dispositivo.ip}/cgi-bin/accessControl.cgi?action=openDoor&channel=1`;
    const response = await fazerChamadaDigest(url, {
      username: dispositivo.user,
      password: dispositivo.pass,
      method: 'GET'
    });
    res.json({ message: 'Comando enviado com sucesso', data: response.data });
  } catch (error) {
    console.error(`Erro ao comunicar com a catraca ${idCatraca}:`, error.message);
    next(new Error(`Falha ao comunicar com a catraca ${idCatraca}`));
  }
});

// --- FUNÇÃO SNMP DA IMPRESSORA (MANTIDA IGUAL) ---
const OIDS = {
  model: "1.3.6.1.2.1.25.3.2.1.3.1",
  pagesTotal: "1.3.6.1.2.1.43.10.2.1.4.1.1",
  tonerMax: "1.3.6.1.2.1.43.11.1.1.8.1.1",
  tonerCurrent: "1.3.6.1.2.1.43.11.1.1.9.1.1"
};

function getPrinterData(ip) {
  return new Promise((resolve, reject) => {
    const session = snmp.createSession(ip, "public");
    const oidsToFetch = [OIDS.model, OIDS.pagesTotal, OIDS.tonerMax, OIDS.tonerCurrent];

    session.get(oidsToFetch, (error, varbinds) => {
      if (error) {
        session.close();
        return reject(`Erro ao conectar com ${ip}: ${error.message}`);
      }

      let printerInfo = { ip: ip, status: 'online' };

      for (let i = 0; i < varbinds.length; i++) {
        if (snmp.isVarbindError(varbinds[i])) {
          console.error(snmp.varbindError(varbinds[i]));
        } else {
          const oid = varbinds[i].oid;
          const value = varbinds[i].value;

          if (oid === OIDS.model) printerInfo.model = value.toString();
          if (oid === OIDS.pagesTotal) printerInfo.pagesPrinted = parseInt(value);
          if (oid === OIDS.tonerMax) printerInfo.maxToner = parseInt(value);
          if (oid === OIDS.tonerCurrent) printerInfo.currentToner = parseInt(value);
        }
      }

      // console.log(`[${ip}] - Máx Reportado: ${printerInfo.maxToner} | Atual Reportado: ${printerInfo.currentToner}`);
      
      let nivelCalculado = 0;

      if (printerInfo.maxToner === -2) {
        if (printerInfo.currentToner === -3) {
          nivelCalculado = 100; 
          printerInfo.status = 'online'; 
        } 
        else if (printerInfo.currentToner >= 0 && printerInfo.currentToner <= 100) {
          nivelCalculado = printerInfo.currentToner;
        }
        else if (printerInfo.currentToner > 100) {
            nivelCalculado = 100;
        }
      } else if (printerInfo.maxToner > 0) {
        nivelCalculado = Math.round((printerInfo.currentToner / printerInfo.maxToner) * 100);
      }

      if (nivelCalculado > 100) nivelCalculado = 100;
      if (nivelCalculado < 0) nivelCalculado = 0;

      printerInfo.tonerLevel = nivelCalculado;
      session.close();
      resolve(printerInfo);
    });
  });
}

// ARRAY FIXO REMOVIDO DAQUI

// --- ROTA DE BUSCA DAS IMPRESSORAS (ATUALIZADA) ---
app.get('/api/printers', async (req, res) => {
  try {
    const dbResult = await pool.query(`
      SELECT c.codimp, c.ip, c.nome as name, m.nomemarca as brand 
      FROM CADImp c 
      JOIN marcas m ON c.codmarca = m.codmarca
    `);

    const results = await Promise.all(dbResult.rows.map(async (p) => {
      try {
        const snmpData = await getPrinterData(p.ip);
        
        // Grava no histórico se for a primeira consulta do dia
        const historyQuery = `
          INSERT INTO historico_impressao (codimp, total_paginas, nivel_toner, data_leitura)
          SELECT $1, $2, $3, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (
            SELECT 1 FROM historico_impressao 
            WHERE codimp = $1 AND data_leitura::date = CURRENT_DATE
          );
        `;
        pool.query(historyQuery, [p.codimp, snmpData.pagesPrinted, snmpData.tonerLevel])
            .catch(e => console.error("Erro ao salvar histórico:", e.message));

        return { ...p, ...snmpData };
      } catch (err) {
        return { ...p, status: 'offline', tonerLevel: 0, pagesPrinted: 0 };
      }
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/printersrefresh', async (req, res) => {
  try {
    const dbResult = await pool.query(`
      SELECT c.codimp, c.ip, c.nome as name, m.nomemarca as brand 
      FROM CADImp c 
      JOIN marcas m ON c.codmarca = m.codmarca
    `);

    const results = await Promise.all(dbResult.rows.map(async (p) => {
      try {
        const snmpData = await getPrinterData(p.ip);
        
        // Grava no histórico se for a primeira consulta do dia
        const historyQuery = `
          INSERT INTO historico_impressao (codimp, total_paginas, nivel_toner, data_leitura)
          SELECT $1, $2, $3, CURRENT_TIMESTAMP
  
        `;
        pool.query(historyQuery, [p.codimp, snmpData.pagesPrinted, snmpData.tonerLevel])
            .catch(e => console.error("Erro ao salvar histórico:", e.message));

        return { ...p, ...snmpData };
      } catch (err) {
        return { ...p, status: 'offline', tonerLevel: 0, pagesPrinted: 0 };
      }
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Handler de Erro Global ---
app.use((err, req, res, next) => {
  console.error(err.stack); 
  res.status(err.status || 500).json({ 
    error: {
      message: err.message || 'Erro interno no servidor.'
    }
  });
});


// --- ROTAS DE CADASTRO (CRUD) ---

// Buscar todas as marcas
app.get('/api/marcas', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT codmarca, nomemarca FROM marcas ORDER BY codmarca');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    next(new Error('Falha ao buscar marcas do banco de dados'));
  }
});

// Listar todas as impressoras (Para a tabela do painel de gerenciamento)
app.get('/api/cadimp', async (req, res, next) => {
  try {
    // Adicionado 'local' e 'codigo' na busca
    const result = await pool.query('SELECT codimp, nome, ip, codmarca, local, codigo FROM CADImp ORDER BY codimp');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar impressoras:', error);
    next(new Error('Falha ao listar impressoras cadastradas'));
  }
});
// Cadastrar nova impressora (INSERT)
app.post('/api/cadimp', async (req, res, next) => {
  const { nome, ip, codmarca, local, codigo } = req.body;
  
  try {
    const query = `
      INSERT INTO CADImp (nome, ip, codmarca, local, codigo) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const values = [nome, ip, codmarca, local, codigo];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]); 
  } catch (error) {
    console.error('Erro ao cadastrar impressora:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: { message: 'Este IP já está cadastrado.' } });
    }
    next(new Error('Falha ao cadastrar a impressora no banco de dados'));
  }
});

// Atualizar uma impressora existente (UPDATE)
app.put('/api/cadimp/:id', async (req, res, next) => {
  const { id } = req.params;
  const { nome, ip, codmarca, local, codigo } = req.body;
  
  try {
    const query = `
      UPDATE CADImp 
      SET nome = $1, ip = $2, codmarca = $3, local = $4, codigo = $5 
      WHERE codimp = $6 
      RETURNING *;
    `;
    const values = [nome, ip, codmarca, local, codigo, id];
    const result = await pool.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Impressora não encontrada para atualização.' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao atualizar impressora ${id}:`, error);
    if (error.code === '23505') {
      return res.status(400).json({ error: { message: 'Este IP já está sendo usado por outra impressora.' } });
    }
    next(new Error(`Falha ao atualizar a impressora ${id}`));
  }
});

// Excluir uma impressora (DELETE)
app.delete('/api/cadimp/:id', async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM CADImp WHERE codimp = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Impressora não encontrada para exclusão.' });
    }
    
    res.json({ message: 'Impressora excluída com sucesso.' });
  } catch (error) {
    console.error(`Erro ao excluir impressora ${id}:`, error);
    next(new Error(`Falha ao excluir a impressora ${id}`));
  }
});




app.get('/api/historico', async (req, res, next) => {
  const { dataInicial, dataFinal } = req.query;

  try {
    const query = `
      WITH leituras AS (
        SELECT 
          h.codimp,
          c.nome as nome_impressora,
          c.local, 
          c.codigo, -- Certifique-se de que este nome é identico ao do banco
          MIN(h.total_paginas) as leitura_inicial,
          MAX(h.total_paginas) as leitura_final,
          MIN(h.data_leitura) as primeira_leitura,
          MAX(h.data_leitura) as ultima_leitura
        FROM historico_impressao h
        JOIN CADImp c ON h.codimp = c.codimp
        WHERE h.data_leitura::date BETWEEN $1 AND $2
        GROUP BY h.codimp, c.nome, c.local, c.codigo -- É OBRIGATÓRIO incluir o código aqui
      )
      SELECT *, (leitura_final - leitura_inicial) as copias_feitas 
      FROM leituras
      ORDER BY copias_feitas DESC;
    `;
    const result = await pool.query(query, [dataInicial, dataFinal]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    next(new Error('Falha ao calcular histórico.'));
  }
});


async function executarLeituraDiaria() {
    console.log(`[${new Date().toLocaleString()}] Iniciando rotina de leitura e limpeza...`);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Inicia uma transação para garantir segurança dos dados

        // 1. BUSCAR IMPRESSORAS CADASTRADAS
        const dbResult = await client.query('SELECT codimp, ip FROM CADImp');

        // 2. REALIZAR NOVA LEITURA (A PRIMEIRA DO DIA ATUAL)
        for (const p of dbResult.rows) {
            try {
                const snmpData = await getPrinterData(p.ip);
                const insertQuery = `
                    INSERT INTO historico_impressao (codimp, total_paginas, nivel_toner, data_leitura)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                `;
                await client.query(insertQuery, [p.codimp, snmpData.pagesPrinted, snmpData.tonerLevel]);
            } catch (err) {
                console.error(`❌ Erro SNMP na impressora ${p.ip}:`, err.message);
            }
        }

      
        const deleteQuery = `
            DELETE FROM historico_impressao
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM historico_impressao
                WHERE data_leitura::date = CURRENT_DATE - INTERVAL '1 day'
                GROUP BY codimp
            )
            AND data_leitura::date = CURRENT_DATE - INTERVAL '1 day';
        `;
        
        const deleteResult = await client.query(deleteQuery);
        await client.query('COMMIT');
        
        console.log(`[${new Date().toLocaleString()}] Sucesso! Registros excedentes removidos: ${deleteResult.rowCount}`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Erro crítico na rotina automática:', err);
    } finally {
        client.release();
    }
}


async function realizarGravacaoHistorico() {
    const dbResult = await pool.query('SELECT codimp, ip FROM CADImp');
    for (const p of dbResult.rows) {
        try {
            const snmpData = await getPrinterData(p.ip);
            const insertQuery = `
                INSERT INTO historico_impressao (codimp, total_paginas, nivel_toner, data_leitura)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            `;
            await pool.query(insertQuery, [p.codimp, snmpData.pagesPrinted, snmpData.tonerLevel]);
            console.log(`✅ Gravado: ${p.ip} - ${snmpData.pagesPrinted} páginas`);
        } catch (err) {
            console.error(`❌ Erro na impressora ${p.ip}:`, err.message);
        }
    }
}

// --- AGENDAMENTO 1: FECHAMENTO DO DIA (23:59) ---
cron.schedule('59 23 * * *', async () => {
    console.log(`[${new Date().toLocaleString()}] Rodando FECHAMENTO do dia (23:59)...`);
    await realizarGravacaoHistorico();
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});

// --- AGENDAMENTO 2: ABERTURA DO DIA + LIMPEZA (00:00) ---
cron.schedule('0 0 * * *', async () => {
    console.log(`[${new Date().toLocaleString()}] Rodando ABERTURA do dia e LIMPEZA...`);
    
    // 1. Grava a leitura de abertura (00:00)
    await realizarGravacaoHistorico();

    // 2. Limpeza: Mantém apenas a PRIMEIRA (00:00) e a ÚLTIMA (23:59) de ontem
    // Remove tudo que não for o ID mínimo ou o ID máximo do dia anterior
    try {
        const deleteQuery = `
            DELETE FROM historico_impressao
            WHERE data_leitura::date = CURRENT_DATE - INTERVAL '1 day'
            AND id NOT IN (
                SELECT MIN(id) FROM historico_impressao 
                WHERE data_leitura::date = CURRENT_DATE - INTERVAL '1 day' 
                GROUP BY codimp
                UNION
                SELECT MAX(id) FROM historico_impressao 
                WHERE data_leitura::date = CURRENT_DATE - INTERVAL '1 day' 
                GROUP BY codimp
            );
        `;
        const res = await pool.query(deleteQuery);
        console.log(`[${new Date().toLocaleString()}] Limpeza concluída. Registros intermediários removidos: ${res.rowCount}`);
    } catch (err) {
        console.error('❌ Erro na limpeza de registros:', err);
    }
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});


app.post('/api/login-ad', async (req, res) => {
  const { user, pass } = req.body;
  try {
    await autenticarNoAD(user, pass); 
    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Falha no AD' });
  }
});




app.post('/api/assinar-termo', async (req, res) => {
  const { user, pass, codimp } = req.body;

  try {
    // Valida no Active Directory
    await autenticarNoAD(user, pass);

    // Se passou, grava a assinatura digital no Postgres
    const query = `
      INSERT INTO assinaturas_termos (codimp, usuario_login, data_assinatura)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await pool.query(query, [codimp, user]);

    res.json({ 
      success: true, 
      message: 'Termo assinado digitalmente via AD!',
      data: result.rows[0] 
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});


// Rota para cadastrar usuários usando o Pool específico
app.post('/api/usuarios', async (req, res) => {
  const { cracha, nome, cpf, email, telefone, setor, senha } = req.body;

  try {
    const query = `
      INSERT INTO usuarios (cracha, nome, cpf, email, telefone, setor, senha)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING cracha;
    `;
    const values = [cracha, nome, cpf, email, telefone, setor, senha];
    
  
    const result = await poolAssinaturas.query(query, values);

    res.status(201).json({ 
      success: true, 
      message: 'Usuário cadastrado com sucesso!',
      cracha: result.rows[0].cracha 
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Crachá ou CPF já cadastrado no sistema.' });
    }
    res.status(500).json({ message: 'Erro interno no servidor de assinaturas.' });
  }
});


// Buscar colaborador por crachá para exibir o nome na tela de entrega
app.get('/api/usuarios/:cracha', async (req, res) => {
  const { cracha } = req.params;
  const result = await poolAssinaturas.query('SELECT nome, setor FROM usuarios WHERE cracha = $1', [cracha]);
  if (result.rows.length > 0) res.json(result.rows[0]);
  else res.status(404).send('Não encontrado');
});

// Finalizar devolução (Data de Devolução e Status)
app.put('/api/entregas/:id/devolver', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // 'Perfeito', 'Defeito', etc. [cite: 18, 19]
  
  const query = `
    UPDATE entrega_de_aparelhos 
    SET data_devolucao = CURRENT_TIMESTAMP, status = 'Devolvido', obs = $1 
    WHERE cod_entrega = $2
  `;
  await poolAssinaturas.query(query, [estado, id]);
  res.send('Devolução registrada');
});

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso em http://localhost:${PORT}`);
});

