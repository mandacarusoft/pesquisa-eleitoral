import pool from '../config/database.js';

export async function criar(perguntaId, texto, ordem) {

    const [resultado] = await pool.execute(
        `
        INSERT INTO alternativas (perguntas_id, texto, ordem)
        VALUES(?,?,?)
        `,
        [perguntaId, texto, ordem]
    );

    return resultado.insertId;
}

export async function buscarTodosPorPergunta(perguntaId) {

    const [alternativas] = await pool.execute(
        `
        SELECT id, pergunta_id, texto, ordem
        FROM alternativas
        WHERE pergunta_id = ?
        ORDER BY ordem
        `,
        [perguntaId]
    );
    return alternativas;
}

export async function buscarPorId(id) {

    const [alternativas] = await pool.execute(
        `
        SELECT id, pergunta_id, texto, ordem
        FROM alternativas
        WHERE id = ?`, [id]
    );
    return alternativas[0] || null;
}
export async function update(id, texto, ordem) {

    const [resultado] = await pool.execute(
        `
        UPDATE alternativas
        SET texto = ?, ordem = ?
        WHERE id = ?
        `, [id, texto, ordem]
    );
    return resultado.affectedRows;
}

export async function excluir(id) {

    const [resultado] = await pool.execute(
        `DELETE FROM alternativas
        WHERE id = ?`, [id]
    );
    return resultado.affectedRows;
}