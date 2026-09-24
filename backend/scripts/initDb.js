// Script manual para criar tabelas + seed sem precisar subir o servidor.
// Uso: npm run db:init
import { inicializarBancoDeDados, pool } from '../config/db.js';

try {
  console.log('Conectando ao MySQL e preparando o schema...');
  await inicializarBancoDeDados();
  console.log('Banco de dados pronto.');
} catch (err) {
  console.error('Falha ao inicializar o banco:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
