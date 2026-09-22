import * as respostaRepository from '../repositories/respostaRepository.js';
import pool from '../config/database.js';

export async function criarResposta({ perguntaId, alternativaId }) {

    if(!perguntaId) {
        throw new Error('A pergunta é obrigatória.')
    }

    if(!alternativaId) {
        throw new Error('A alternativa é obrigatória.');
    }

    const [perguntas] = await pool.execute(
        `SELECT id
        FROM perguntas
        WHERE id = ?`,[perguntaId]
    );

    if(perguntas.length === 0) {
        throw new Error('Pergunta não encontrada.');
    }

    const [alternativas] = await pool.execute(
        `SELECT id
        FROM alternativas
        WHERE id = ? AND pergunta_id = ?`,[alternativaId, perguntaId]
    );

    if (alternativas.length === 0) {
        throw new Error('A alternativa não pertence à pergunta informada.');
    }

    const id = await respostaRepository.criar(perguntaId, alternativaId);

    return { id, perguntaId, alternativaId };
}

export async function buscarResposta(id) {

    if(!id) {
        throw new Error('Id da resposta é obrigatório.')
    }

    const resposta = await respostaRepository.buscarPorId(id);

    if(!resposta) {
        throw new Error('Resposta não encontrada.')
    }
    return resposta;
}

export async function listarPorPergunta(perguntaId) {
    if(!perguntaId) {
        throw new Error('A pergunta é obrigatória.')
    }

    const [perguntas] = await pool.execute(
        `SELECT id
        FROM perguntas
        WHERE id = ?`, [perguntaId]
    );

    if(perguntas.length === 0) {
        throw new Error('Pergunta não encontrada.')
    }

    return await respostaRepository.buscarTodosPorPergunta(perguntaId);
}

export async function exluirResposta(id) {

    if(!id) {
        throw new Error('Id da resposta é obrigatório.')
    }

    const resposta = await respostaRepository.buscarPorId(id);

    if(!resposta) {
        throw new Error('Resposta não encontrada.')
    }
    await respostaRepository.excluir(id);

    return {mensagem: 'Resposta excluída com sucesso.'};
}