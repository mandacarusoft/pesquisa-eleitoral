import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pesquisa_eleitoral',
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  waitForConnections: true,
  namedPlaceholders: false,
  dateStrings: true,
});

// Cria as tabelas caso ainda nao existam (idempotente) e popula dados iniciais.
// Equivalente ao sql/schema.sql, mas executado automaticamente ao iniciar o servidor
// quando AUTO_MIGRATE=true no .env. Util para o primeiro start sem precisar rodar SQL na mao.
export async function inicializarBancoDeDados() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        papel ENUM('admin','pesquisador') NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS pesquisas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        cidade VARCHAR(150),
        situacao ENUM('ativa','encerrada') NOT NULL DEFAULT 'ativa',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS perguntas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pesquisa_id INT NOT NULL,
        texto TEXT NOT NULL,
        tipo ENUM('unica_escolha','multipla_escolha','texto_livre','demografica') NOT NULL,
        ordem INT NOT NULL DEFAULT 0,
        obrigatoria TINYINT(1) NOT NULL DEFAULT 1,
        FOREIGN KEY (pesquisa_id) REFERENCES pesquisas(id) ON DELETE CASCADE,
        INDEX idx_perguntas_pesquisa (pesquisa_id)
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS alternativas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pergunta_id INT NOT NULL,
        texto VARCHAR(255) NOT NULL,
        ordem INT NOT NULL DEFAULT 0,
        FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
        INDEX idx_alternativas_pergunta (pergunta_id)
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessoes (
        id VARCHAR(36) PRIMARY KEY,
        pesquisa_id INT NOT NULL,
        pesquisador_id INT NOT NULL,
        bairro VARCHAR(150),
        zona ENUM('Urbana','Rural'),
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pesquisa_id) REFERENCES pesquisas(id) ON DELETE CASCADE,
        FOREIGN KEY (pesquisador_id) REFERENCES usuarios(id),
        INDEX idx_sessoes_pesquisa (pesquisa_id),
        INDEX idx_sessoes_pesquisador (pesquisador_id),
        INDEX idx_sessoes_bairro (bairro)
      ) ENGINE=InnoDB
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS respostas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sessao_id VARCHAR(36) NOT NULL,
        pergunta_id INT NOT NULL,
        alternativa_id INT NULL,
        resposta_texto TEXT NULL,
        FOREIGN KEY (sessao_id) REFERENCES sessoes(id) ON DELETE CASCADE,
        FOREIGN KEY (pergunta_id) REFERENCES perguntas(id) ON DELETE CASCADE,
        FOREIGN KEY (alternativa_id) REFERENCES alternativas(id) ON DELETE SET NULL,
        INDEX idx_respostas_sessao (sessao_id),
        INDEX idx_respostas_pergunta (pergunta_id)
      ) ENGINE=InnoDB
    `);

    await popularDadosIniciais(conn);
  } finally {
    conn.release();
  }
}

async function popularDadosIniciais(conn) {
  const [[{ total: totalUsuarios }]] = await conn.query('SELECT COUNT(*) as total FROM usuarios');
  if (totalUsuarios === 0) {
    const hashAdmin = bcrypt.hashSync('admin123', 10);
    const hashPesquisador = bcrypt.hashSync('pesq123', 10);
    await conn.query(
      'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?,?,?,?), (?,?,?,?)',
      ['Administrador', 'admin@pesquisa.com', hashAdmin, 'admin',
       'Pesquisador Demo', 'pesquisador@pesquisa.com', hashPesquisador, 'pesquisador']
    );
    console.log('Usuarios padrao criados: admin@pesquisa.com / admin123 e pesquisador@pesquisa.com / pesq123');
  }

  const [[{ total: totalPesquisas }]] = await conn.query('SELECT COUNT(*) as total FROM pesquisas');
  if (totalPesquisas === 0) {
    const [resultadoPesquisa] = await conn.query(
      'INSERT INTO pesquisas (titulo, cidade, situacao) VALUES (?,?,?)',
      ['Eleicoes Municipais 2026', 'Esperanca - PB', 'ativa']
    );
    const pesquisaId = resultadoPesquisa.insertId;

    const [pergunta1] = await conn.query(
      'INSERT INTO perguntas (pesquisa_id, texto, tipo, ordem, obrigatoria) VALUES (?,?,?,?,?)',
      [pesquisaId, 'Em quem voce pretende votar para prefeito?', 'unica_escolha', 0, 1]
    );
    const pergunta1Id = pergunta1.insertId;
    const alternativas1 = ['Candidato A', 'Candidato B', 'Candidato C', 'Indeciso', 'Branco/Nulo'];
    for (let i = 0; i < alternativas1.length; i++) {
      await conn.query('INSERT INTO alternativas (pergunta_id, texto, ordem) VALUES (?,?,?)', [pergunta1Id, alternativas1[i], i]);
    }

    const [pergunta2] = await conn.query(
      'INSERT INTO perguntas (pesquisa_id, texto, tipo, ordem, obrigatoria) VALUES (?,?,?,?,?)',
      [pesquisaId, 'Como voce avalia a atual gestao municipal?', 'unica_escolha', 1, 1]
    );
    const pergunta2Id = pergunta2.insertId;
    const alternativas2 = ['Otimo', 'Bom', 'Regular', 'Ruim', 'Pessimo'];
    for (let i = 0; i < alternativas2.length; i++) {
      await conn.query('INSERT INTO alternativas (pergunta_id, texto, ordem) VALUES (?,?,?)', [pergunta2Id, alternativas2[i], i]);
    }

    await conn.query(
      'INSERT INTO perguntas (pesquisa_id, texto, tipo, ordem, obrigatoria) VALUES (?,?,?,?,?)',
      [pesquisaId, 'Deixe aqui alguma observacao ou sugestao (opcional)', 'texto_livre', 2, 0]
    );
  }
}
