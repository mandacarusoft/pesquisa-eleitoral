import * as respostaService from '../services/respostaService.js';

export async function criar(req, res) {
    try {
        const resposta = await respostaService.criarResposta(req.body);
        return res.status(201).json(resposta);
    } catch (error) {
        if (error.message === 'Pergunta não encontrada.' || error.message === 'A alternativa não pertence à pergunta informada.') {
            return res.status(404).json({
                mensagem: error.message
            });
        }
        return res.status(400).json({
            mensagem: error.message
        });
    }
}

export async function buscarPorId(req, res) {
    try {
        const id = await Number(res.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: 'Id da resposta inválido.'
            });
        }

        const resposta = await respostaService.buscarResposta(id);
        return res.status(200).json(resposta);
    } catch (error) {

        if(error.message === 'Resposta não encontrada.') {
            return res.status(404).json({
                mensagem: error.message
            });
        }
        return res.status(500).json({
            mensagem: 'Erro ao buscar resposta.'
        });
    }
}

export async function listarPorPergunta(req, res) {
    try {
        const perguntaId = Number(req.params.perguntaId);

        if(!Number.isInteger(perguntaId) || perguntaId <= 0) {
            return res.status(400).json({
                mensagem: 'Id da pergunta inválido.'
            });
        }

        const respostas = await respostaService.listarPorPergunta(perguntaId);
        return res.status(200).json(respostas);
    } catch (error) {

        if(error.message === 'Pergunta não encontrada.') {
            return res.status(404).json({
                mensagem: error.message
            });
        }
        return res.status(500).json({
            mensagem: 'Erro ao buscar respostas.'
        });
    }
}

export async function excluir(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: 'Id da resposta inválido.'
            });
        }

        const resultado = await respostaService.exluirResposta(id);
        return res.status(200).json(resultado);
    } catch (error) {
        if (error.message === 'Resposta não encontrada.') {
            return res.status(404).json({
                mensagem: error.message
            });
        }
        return res.status(500).json({
            mensagem: 'Erro ao excluir resposta.'
        })
    }
}