import pool from '../config/database.js'

export async function criar(nome, email, senhaHash, role) {
    const [resultado] = await pool.execute(
        `
        INSERT INTO usuarios (nome, email, senha_hash, role) 
        VALUES (?, ?, ?, ?)
        `, [nome, email, senhaHash, role]
    );
    return resultado.insertId;
}

export async function buscarTodos() {
    const [usuarios] = await pool.execute(
        `SELECT id, nome, email, role
        FROM usuarios
        ORDER BY id`
    );
    return usuarios;
}

export async function buscarPorId(id) {
    const [usuarios] = await pool.execute(
        `SELECT id, nome, email, role
        FROM usuarios
        WHERE id = ?
        `,
        [id]
    );
    return usuarios[0] || null;
}

export async function buscarPorEmail(email) {
    const [usuarios] = await pool.execute(
        `SELECT id, nome, email, senha_hash, role
        FROM usuarios
        WHERE email = ?`, [email]
    );
    return usuarios[0] || null;
}
