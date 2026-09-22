import pool from '../config/database.js'

export async function criar(titulo, cidade, status) {
    const [resultado] = await pool.execute(
        `
        INSERT INTO pesquisas (titulo, cidade, status)
        VALUES (?, ?, ?)
        `, [titulo, cidade, status]
    );
    return resultado.insertId;
}

export async function buscarTodos() {
    const [pesquisas] = await pool.execute(
        `SELECT id, titulo, cidade, status
        FROM pesquisas
        ORDER BY id`
    );
    return pesquisas;
}

export async function buscarMaisRecente() {
    const [pesquisas] = await pool.execute(
        `SELECT id, titulo, cidade, status
        FROM pesquisas
        ORDER BY id DESC
        LIMIT 1`
    );
    return pesquisas[0];
}

export async function buscarPorCargo(cargo) {
    const [pesquisas] = await pool.execute(
        `SELECT DISTINCT p.id, p.titulo, p.cidade, p.status
        FROM pesquisas p
        INNER JOIN perguntas pg
            ON pg.pesquisa_id = p.id
        WHERE pg.texto LIKE CONCAT('%', ?, '%')
        ORDER BY p.id`, [cargo]
    );
    return pesquisas;
}

export async function buscarPorId(id) {
    const [pesquisas] = await pool.execute(
        `SELECT id, titulo, cidade, status
        FROM pesquisas
        WHERE id = ?
        `,
        [id]
    );
    return pesquisas[0];
}

export async function atualizar(id, titulo, cidade) {
    const [resultado] = await pool.execute(
        `UPDATE pesquisas
        SET titulo = ?, cidade = ?
        WHERE id = ?
        AND status <> 'encerrada'`, [titulo, cidade, id]
    );
    return resultado.affectedRows;
}

export async function alterarStatus(id, status, usuarioId) {
    const [resultado] = await pool.execute(
        `UPDATE pesquisas
        SET status = ?
        WHERE id = ?
        AND EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = ? AND role = 'admin'
        )`, [status, id, usuarioId]
    );
    return resultado.affectedRows;
}

export async function encerrar(id, usuarioId) {
    const [resultado] = await pool.execute(
        `UPDATE pesquisas
        SET status = 'encerrada'
        WHERE id = ?
        AND EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = ? AND role = 'admin'
        )`, [id, usuarioId]
    );
    return resultado.affectedRows;
}
