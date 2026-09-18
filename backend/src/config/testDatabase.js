import pool from './database.js';

async function testarConexao() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexão com MySQL realizada com sucesso!');

        connection.release();
        await pool.end();
    } catch (error) {
        console.error('Erro ao conectar com MySQL:');
        console.error(error.message);

        process.exit(1);
    }
}

testarConexao();