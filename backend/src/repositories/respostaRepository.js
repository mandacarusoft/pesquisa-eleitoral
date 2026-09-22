import pool from '../config/database.js'

export async function criar(perguntaId, respostaId) {

    const [resultado] = await pool.execute(
        `INSERT INTO respostas (pergunta_id, alternativa_id
        VALUES (?, ?)`, [perguntaId, respostaId]
    );

    return resultado.insertId;
}

export async function buscarPorId(id) {
    
    const [respostas] = await pool.execute(
        `SELECT id, pergunta_id, alternativa_id
        FROM respostas
        WHERE id=?`, [id]
    );

    return respostas[0] || null;
}

export async function buscarTodosPorPergunta(perguntaId) {

    const [respostas] = await pool.execute(
        `SELECT id, pergunta_id, alternativa_id
        FROM respostas
        WHERE pergunta_id = ?
        ORDEM BY id`, [perguntaId]
    );

    return respostas;
}

export async function excluir(id) {

    const [resultado] = await pool.execute(
        `DELETE FROM respostas
        WHERE id = ?`, [id]
    );

    return resultado.affectedRows;
}