import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool, inicializarBancoDeDados } from './config/db.js';
import { autenticar, exigirPapel, JWT_SECRET, JWT_EXPIRES_IN } from './middleware/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

// Wrapper para nao repetir try/catch em toda rota assincrona
const async_ = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/* ===================== AUTENTICACAO ===================== */
app.post('/api/autenticacao/login', async_(async (req, res) => {
  const { email, senha } = req.body;
  const [linhas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  const usuario = linhas[0];
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'Email ou senha invalidos' });
  }
  const token = jwt.sign({ id: usuario.id, nome: usuario.nome, papel: usuario.papel }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel } });
}));

// Admin cria pesquisadores
app.post('/api/autenticacao/registrar', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { nome, email, senha, papel } = req.body;
  if (!nome || !email || !senha || !papel) return res.status(400).json({ erro: 'Dados incompletos' });
  try {
    const hash = bcrypt.hashSync(senha, 10);
    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?,?,?,?)',
      [nome, email, hash, papel]
    );
    res.status(201).json({ id: resultado.insertId, nome, email, papel });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ erro: 'Email ja cadastrado' });
    throw e;
  }
}));

app.get('/api/usuarios', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const [linhas] = await pool.query('SELECT id, nome, email, papel, criado_em FROM usuarios');
  res.json(linhas);
}));

/* ===================== PESQUISAS ===================== */
app.get('/api/pesquisas', autenticar, async_(async (req, res) => {
  const [linhas] = await pool.query('SELECT * FROM pesquisas ORDER BY criado_em DESC');
  res.json(linhas);
}));

app.post('/api/pesquisas', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { titulo, cidade } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'Titulo obrigatorio' });
  const [resultado] = await pool.query('INSERT INTO pesquisas (titulo, cidade, situacao) VALUES (?,?,?)', [titulo, cidade || '', 'ativa']);
  const [linhas] = await pool.query('SELECT * FROM pesquisas WHERE id = ?', [resultado.insertId]);
  res.status(201).json(linhas[0]);
}));

app.put('/api/pesquisas/:id', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { titulo, cidade, situacao } = req.body;
  await pool.query(
    'UPDATE pesquisas SET titulo = COALESCE(?,titulo), cidade = COALESCE(?,cidade), situacao = COALESCE(?,situacao) WHERE id = ?',
    [titulo ?? null, cidade ?? null, situacao ?? null, req.params.id]
  );
  const [linhas] = await pool.query('SELECT * FROM pesquisas WHERE id = ?', [req.params.id]);
  res.json(linhas[0]);
}));

app.delete('/api/pesquisas/:id', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  await pool.query('DELETE FROM pesquisas WHERE id = ?', [req.params.id]);
  res.json({ sucesso: true });
}));

/* ===================== PERGUNTAS + ALTERNATIVAS (CADASTRO DINAMICO) ===================== */
async function buscarPesquisaCompleta(pesquisaId) {
  const [linhasPesquisa] = await pool.query('SELECT * FROM pesquisas WHERE id = ?', [pesquisaId]);
  const pesquisa = linhasPesquisa[0];
  if (!pesquisa) return null;

  const [perguntas] = await pool.query('SELECT * FROM perguntas WHERE pesquisa_id = ? ORDER BY ordem ASC', [pesquisaId]);
  const [todasAlternativas] = await pool.query(
    `SELECT a.* FROM alternativas a
     JOIN perguntas p ON p.id = a.pergunta_id
     WHERE p.pesquisa_id = ? ORDER BY a.ordem ASC`,
    [pesquisaId]
  );

  pesquisa.perguntas = perguntas.map(p => ({
    ...p,
    obrigatoria: !!p.obrigatoria,
    alternativas: todasAlternativas.filter(a => a.pergunta_id === p.id),
  }));
  return pesquisa;
}

app.get('/api/pesquisas/:id/completa', autenticar, async_(async (req, res) => {
  const pesquisa = await buscarPesquisaCompleta(req.params.id);
  if (!pesquisa) return res.status(404).json({ erro: 'Pesquisa nao encontrada' });
  res.json(pesquisa);
}));

// Criar pergunta (com alternativas inline, se aplicavel)
app.post('/api/perguntas', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { pesquisa_id, texto, tipo, obrigatoria, alternativas } = req.body;
  if (!pesquisa_id || !texto || !tipo) return res.status(400).json({ erro: 'Dados incompletos' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[{ maiorOrdem }]] = await conn.query(
      'SELECT COALESCE(MAX(ordem), -1) as maiorOrdem FROM perguntas WHERE pesquisa_id = ?',
      [pesquisa_id]
    );
    const [resultadoPergunta] = await conn.query(
      'INSERT INTO perguntas (pesquisa_id, texto, tipo, ordem, obrigatoria) VALUES (?,?,?,?,?)',
      [pesquisa_id, texto, tipo, maiorOrdem + 1, obrigatoria ? 1 : 0]
    );
    const perguntaId = resultadoPergunta.insertId;

    if (Array.isArray(alternativas) && (tipo === 'unica_escolha' || tipo === 'multipla_escolha')) {
      let i = 0;
      for (const alt of alternativas) {
        const textoAlternativa = alt.texto ?? alt;
        await conn.query('INSERT INTO alternativas (pergunta_id, texto, ordem) VALUES (?,?,?)', [perguntaId, textoAlternativa, i]);
        i++;
      }
    }

    await conn.commit();
    const pesquisa = await buscarPesquisaCompleta(pesquisa_id);
    res.status(201).json(pesquisa.perguntas.find(p => p.id === perguntaId));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Atualizar pergunta (texto, tipo, obrigatoriedade)
app.put('/api/perguntas/:id', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { texto, tipo, obrigatoria } = req.body;
  await pool.query(
    'UPDATE perguntas SET texto = COALESCE(?,texto), tipo = COALESCE(?,tipo), obrigatoria = COALESCE(?,obrigatoria) WHERE id = ?',
    [texto ?? null, tipo ?? null, obrigatoria === undefined ? null : (obrigatoria ? 1 : 0), req.params.id]
  );
  const [linhas] = await pool.query('SELECT * FROM perguntas WHERE id = ?', [req.params.id]);
  res.json(linhas[0]);
}));

// Reordenar perguntas de uma pesquisa: body = { ids: [perguntaId1, perguntaId2, ...] } na nova ordem
app.put('/api/pesquisas/:id/perguntas/reordenar', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { ids } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query('UPDATE perguntas SET ordem = ? WHERE id = ? AND pesquisa_id = ?', [i, ids[i], req.params.id]);
    }
    await conn.commit();
    res.json(await buscarPesquisaCompleta(req.params.id));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

app.delete('/api/perguntas/:id', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  await pool.query('DELETE FROM perguntas WHERE id = ?', [req.params.id]);
  res.json({ sucesso: true });
}));

// Adicionar alternativa a uma pergunta
app.post('/api/alternativas', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { pergunta_id, texto } = req.body;
  if (!pergunta_id || !texto) return res.status(400).json({ erro: 'Dados incompletos' });
  const [[{ maiorOrdem }]] = await pool.query(
    'SELECT COALESCE(MAX(ordem), -1) as maiorOrdem FROM alternativas WHERE pergunta_id = ?',
    [pergunta_id]
  );
  const [resultado] = await pool.query(
    'INSERT INTO alternativas (pergunta_id, texto, ordem) VALUES (?,?,?)',
    [pergunta_id, texto, maiorOrdem + 1]
  );
  const [linhas] = await pool.query('SELECT * FROM alternativas WHERE id = ?', [resultado.insertId]);
  res.status(201).json(linhas[0]);
}));

app.put('/api/alternativas/:id', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { texto } = req.body;
  await pool.query('UPDATE alternativas SET texto = ? WHERE id = ?', [texto, req.params.id]);
  const [linhas] = await pool.query('SELECT * FROM alternativas WHERE id = ?', [req.params.id]);
  res.json(linhas[0]);
}));

// Reordenar alternativas: body = { ids: [alternativaId1, alternativaId2, ...] } na nova ordem
app.put('/api/perguntas/:id/alternativas/reordenar', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { ids } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < ids.length; i++) {
      await conn.query('UPDATE alternativas SET ordem = ? WHERE id = ? AND pergunta_id = ?', [i, ids[i], req.params.id]);
    }
    await conn.commit();
    const [linhas] = await pool.query('SELECT * FROM alternativas WHERE pergunta_id = ? ORDER BY ordem ASC', [req.params.id]);
    res.json(linhas);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

app.delete('/api/alternativas/:id', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  await pool.query('DELETE FROM alternativas WHERE id = ?', [req.params.id]);
  res.json({ sucesso: true });
}));

/* ===================== COLETA (SESSOES E RESPOSTAS) ===================== */
// Pesquisador inicia uma sessao de entrevista
app.post('/api/sessoes', autenticar, exigirPapel('pesquisador', 'admin'), async_(async (req, res) => {
  const { pesquisa_id, bairro, zona } = req.body;
  if (!pesquisa_id || !bairro || !zona) return res.status(400).json({ erro: 'Bairro e zona sao obrigatorios' });
  const id = uuidv4();
  await pool.query(
    'INSERT INTO sessoes (id, pesquisa_id, pesquisador_id, bairro, zona) VALUES (?,?,?,?,?)',
    [id, pesquisa_id, req.usuario.id, bairro, zona]
  );
  res.status(201).json({ id, pesquisa_id, bairro, zona });
}));

// Finalizar entrevista: grava todas as respostas de uma vez, em transacao
// body = { respostas: [{ pergunta_id, alternativa_id?, alternativa_ids?[], resposta_texto? }] }
app.post('/api/sessoes/:id/respostas', autenticar, exigirPapel('pesquisador', 'admin'), async_(async (req, res) => {
  const sessaoId = req.params.id;
  const { respostas } = req.body;

  const [linhasSessao] = await pool.query('SELECT * FROM sessoes WHERE id = ?', [sessaoId]);
  if (!linhasSessao[0]) return res.status(404).json({ erro: 'Sessao nao encontrada' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const r of (respostas || [])) {
      if (Array.isArray(r.alternativa_ids) && r.alternativa_ids.length) {
        for (const altId of r.alternativa_ids) {
          await conn.query(
            'INSERT INTO respostas (sessao_id, pergunta_id, alternativa_id, resposta_texto) VALUES (?,?,?,?)',
            [sessaoId, r.pergunta_id, altId, null]
          );
        }
      } else {
        await conn.query(
          'INSERT INTO respostas (sessao_id, pergunta_id, alternativa_id, resposta_texto) VALUES (?,?,?,?)',
          [sessaoId, r.pergunta_id, r.alternativa_id ?? null, r.resposta_texto ?? null]
        );
      }
    }
    await conn.commit();
    res.status(201).json({ sucesso: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

/* ===================== ANALISES (PAINEL ADMIN) ===================== */
app.get('/api/analises/:pesquisaId', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { pesquisaId } = req.params;
  const { bairro, pesquisador_id, de, ate } = req.query;

  let filtroSessao = 'WHERE s.pesquisa_id = ?';
  const params = [pesquisaId];
  if (bairro) { filtroSessao += ' AND s.bairro = ?'; params.push(bairro); }
  if (pesquisador_id) { filtroSessao += ' AND s.pesquisador_id = ?'; params.push(pesquisador_id); }
  if (de) { filtroSessao += ' AND DATE(s.criado_em) >= ?'; params.push(de); }
  if (ate) { filtroSessao += ' AND DATE(s.criado_em) <= ?'; params.push(ate); }

  const [[{ total: totalFormularios }]] = await pool.query(
    `SELECT COUNT(*) as total FROM sessoes s ${filtroSessao}`,
    params
  );

  const [porPesquisador] = await pool.query(
    `SELECT u.nome as pesquisador, COUNT(*) as total
     FROM sessoes s JOIN usuarios u ON u.id = s.pesquisador_id
     ${filtroSessao}
     GROUP BY s.pesquisador_id, u.nome ORDER BY total DESC`,
    params
  );

  const [porBairro] = await pool.query(
    `SELECT s.bairro as bairro, COUNT(*) as total
     FROM sessoes s ${filtroSessao}
     GROUP BY s.bairro ORDER BY total DESC`,
    params
  );

  const [porZona] = await pool.query(
    `SELECT s.zona as zona, COUNT(*) as total
     FROM sessoes s ${filtroSessao}
     GROUP BY s.zona`,
    params
  );

  const [perguntas] = await pool.query('SELECT * FROM perguntas WHERE pesquisa_id = ? ORDER BY ordem ASC', [pesquisaId]);

  const resultadosPorPergunta = [];
  for (const p of perguntas) {
    if (p.tipo === 'texto_livre' || p.tipo === 'demografica') {
      const [textos] = await pool.query(
        `SELECT r.resposta_texto
         FROM respostas r JOIN sessoes s ON s.id = r.sessao_id
         ${filtroSessao} AND r.pergunta_id = ? AND r.resposta_texto IS NOT NULL AND r.resposta_texto != ''`,
        [...params, p.id]
      );
      resultadosPorPergunta.push({
        pergunta_id: p.id,
        texto: p.texto,
        tipo: p.tipo,
        respostas: textos.map(t => t.resposta_texto),
      });
      continue;
    }

    const [distribuicao] = await pool.query(
      `SELECT a.id as alternativa_id, a.texto, COUNT(r.id) as total
       FROM alternativas a
       LEFT JOIN respostas r ON r.alternativa_id = a.id
         AND r.sessao_id IN (SELECT s.id FROM sessoes s ${filtroSessao})
       WHERE a.pergunta_id = ?
       GROUP BY a.id, a.texto, a.ordem ORDER BY a.ordem ASC`,
      [...params, p.id]
    );
    const totalRespostas = distribuicao.reduce((soma, d) => soma + Number(d.total), 0) || 1;
    resultadosPorPergunta.push({
      pergunta_id: p.id,
      texto: p.texto,
      tipo: p.tipo,
      alternativas: distribuicao.map(d => ({
        ...d,
        total: Number(d.total),
        percentual: Math.round((Number(d.total) / totalRespostas) * 1000) / 10,
      })),
    });
  }

  res.json({
    totalFormularios: Number(totalFormularios),
    porPesquisador: porPesquisador.map(r => ({ ...r, total: Number(r.total) })),
    porBairro: porBairro.map(n => ({ ...n, total: Number(n.total) })),
    porZona: porZona.map(z => ({ ...z, total: Number(z.total) })),
    resultadosPorPergunta,
  });
}));

// Exportacao CSV: colunas dinamicas por pergunta
app.get('/api/analises/:pesquisaId/exportar', autenticar, exigirPapel('admin'), async_(async (req, res) => {
  const { pesquisaId } = req.params;
  const [perguntas] = await pool.query('SELECT * FROM perguntas WHERE pesquisa_id = ? ORDER BY ordem ASC', [pesquisaId]);
  const [sessoes] = await pool.query(
    `SELECT s.*, u.nome as pesquisador_nome FROM sessoes s JOIN usuarios u ON u.id = s.pesquisador_id WHERE s.pesquisa_id = ?`,
    [pesquisaId]
  );

  const cabecalho = ['sessao_id', 'pesquisador', 'bairro', 'zona', 'data', ...perguntas.map(p => `"${p.texto.replace(/"/g, '""')}"`)];
  const linhas = [cabecalho.join(',')];

  for (const s of sessoes) {
    const [respostas] = await pool.query(
      `SELECT r.pergunta_id, r.alternativa_id, r.resposta_texto, a.texto as alternativa_texto
       FROM respostas r LEFT JOIN alternativas a ON a.id = r.alternativa_id
       WHERE r.sessao_id = ?`,
      [s.id]
    );
    const porPergunta = {};
    respostas.forEach(r => {
      const valor = r.alternativa_texto ?? r.resposta_texto ?? '';
      porPergunta[r.pergunta_id] = porPergunta[r.pergunta_id] ? `${porPergunta[r.pergunta_id]}; ${valor}` : valor;
    });
    const linha = [
      s.id, `"${s.pesquisador_nome}"`, `"${s.bairro}"`, s.zona, s.criado_em,
      ...perguntas.map(p => `"${(porPergunta[p.id] || '').replace(/"/g, '""')}"`)
    ];
    linhas.push(linha.join(','));
  }

  const csv = linhas.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pesquisa_${pesquisaId}.csv"`);
  res.send('\uFEFF' + csv);
}));

/* ===================== STATUS (HEALTHCHECK) ===================== */
app.get('/api/status', async_(async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', banco: 'mysql-conectado' });
}));

/* ===================== TRATAMENTO DE ERROS ===================== */
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') {
    return res.status(500).json({ erro: 'Nao foi possivel conectar ao MySQL. Verifique o .env e se o servico esta rodando.' });
  }
  res.status(500).json({ erro: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    if ((process.env.AUTO_MIGRATE || 'true') === 'true') {
      console.log('Verificando/criando tabelas no MySQL...');
      await inicializarBancoDeDados();
    }
    await pool.query('SELECT 1');
    app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT} (MySQL: ${process.env.DB_NAME || 'pesquisa_eleitoral'})`));
  } catch (err) {
    console.error('Falha ao iniciar o servidor / conectar ao MySQL:', err.message);
    console.error('Verifique se o MySQL esta instalado, rodando, e se as credenciais em backend/.env estao corretas.');
    process.exit(1);
  }
}

iniciar();
