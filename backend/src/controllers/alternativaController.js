import * as alternativaService from "../services/alternativaService.js";

export async function criar(req, res) {
  try {
    const alternativa = await alternativaService.criarAlternativa(req.body);
    return res.status(201).json(alternativa);
  } catch (error) {
    if (error.message === "Pergunta não encontrada.") {
      return res.status(400).json({
        mensagem: error.message,
      });
    }
    return res.status(400).json({
      mensagem: error.message,
    });
  }
}

export async function listarPorPergunta(req, res) {
  try {
    const perguntaId = Number(req.params.perguntaId);

    if (!Number.isInteger(perguntaId) || perguntaId <= 0) {
      throw new Error("Id da pergunta inválido.");
    }

    const alternativas = await alternativaService.listarPorPergunta(perguntaId);
    return res.status(200).json(alternativas);
  } catch (error) {
    if (error.message === "Pergunta não encontrada.") {
      return res.status(404).json({ mensagem: error.message });
    }
  }

  return res.status(500).json({ mensagem: "Erro ao buscar alternativas." });
}

export async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id <= 0) {
            throw new Error('Id da alternativa inválido.')
        };

        const alternativa = await alternativaService.buscarAlternativa(id);
        return res.status(200).json(alternativa);
    } catch (error) {

        if(error === 'Alternativa não encontrada.') {
            return res.status(404).json({mensagem: error.message});
        }
        return res.status(500).json({
            mensagem: 'Erro ao buscar alternativa.'
        });
    }
}

export async function atualizar(req, res) {
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id <= 0) {
            res.status(400).json({
                mensagem: 'Id da alternativa inválido.'
            });
        }

        const alternativa = await alternativaService.atualizarAlternativa(id, req.body);
        return res.status(200).json(alternativa);
    } catch (error) {
        
        if(error.message === 'Alternativa não encontrada.') {
            return res.status(400).json({
                mensagem: error.message
            });
        }
        return res.status(400).json({
            mensagem: error.message
        });
    }
}

export async function excluir(req, res) {
    try {

        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: 'Id da alternativa inválido.'
            });
        }

        const resultado = await alternativaService.excluirAlternativa(id);
        return res.status(200).json(resultado);
    } catch (error) {
        
        if(error.message === 'Alternativa não encontrada.') {
            return res.status(404).json({
                mensagem: error.message
            });
        }

        return res.status(500).json({
            mensagem: 'Erro ao excluir alternativa.'
        })
    }
}
