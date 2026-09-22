import * as alternativaRepository from '../repositories/alternativaRepository.js';
import pool from '../config/database.js';

export async function criarAlternativa({ perguntaId, texto }) {

    if (!perguntaId) {
        throw new Error('A pergunta é obrigátoria.')
    }

    if (!texto || !texto.trim()) {
        throw new Error('O texto da alternativa é obrigátorio.')
    }

    const [perguntas] = await pool.execute(
        `SELECT id
        FROM perguntas
        WHERE id = ?`,[perguntaId]
    );

    if(perguntas.length === 0) {
        throw new Error('Pergunta não encontrada.')
    }

    const [ordemResultado] = await pool.execute(
        `SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima_ordem
        FROM alternativas
        WHERE pergunta_id = ?
        `, [perguntaId]
    );
    
    const ordem = ordemResultado[0].proxima_ordem;

    const id = await alternativaRepository.criar(perguntaId, texto.trim(), ordem);

    return { id, perguntaId, texto: texto.trim(), ordem};
}

export async function listarPorPergunta(perguntaId) {

    if(!perguntaId) {
        throw new Error('A pergunta é obrigátoria.')
    }

    const [perguntas] = await pool.execute(
        `SELECT id
        FROM perguntas
        WHERE id = ?`, [perguntaId]
    );

    if(perguntas.length === 0) {
        throw new  Error('Pergunta não encontrada.')
    }

    return await alternativaRepository.buscarTodosPorPergunta(perguntaId);
}

export async function buscarAlternativa(id) {

    if(!id) {
        throw new Error('Id da alternativa é obrigátorio.')
    }

    const alternativa = await alternativaRepository.buscarPorId(id);

    if(!alternativa) {
        throw new Error('Alternatica não encontrada.')
    }

    return alternativa;
}

export async function atualizarAlternativa(id, {texto, ordem}) {

    if(!id) {
        throw new Error('Id da alternativa é obrigátorio.')
    }

    if(!texto || !texto.trim()) {
        throw new Error('O texto da alternativa é obrigátorio.')
    }

    const alternativa = await alternativaRepository.buscarPorId(id);

    if(!alternativa) {
        throw new Error('Alternativa não encontrada.')
    }

    const novaOrdem = ordem !== undefined ? ordem : alternativa.ordem;

    if(!Number.isInteger(novaOrdem) || novaOrdem <= 0) {
        throw new Error('A ordem deve ser um número inteiro maior que zero.')
    }

    await alternativaRepository.update(id, texto.trim(), novaOrdem);

    return {
        id: alternativa.id,
        perguntaId: alternativa.perguntaId,
        texto: texto.trim(),
        ordem: novaOrdem
    }
}

export async function excluirAlternativa(id) {
    
    if(!id) {
        throw new Error('Id da alternativa é obrigatório.')
    }

    const alternativa = await alternativaRepository.buscarPorId(id);

    if(!alternativa) {
        throw new Error('Alternativa não encontrada.')
    }

    await alternativaRepository.excluir(id);

    return {
        mensagem: 'Alternativa excluida com sucesso.'
    };
}