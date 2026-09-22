import * as pesquisaService from '../services/pesquisaService.js';

function lerId(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function lerUsuarioId(req) {
    const usuarioId = Number(req.body?.usuarioId);
    return Number.isInteger(usuarioId) && usuarioId > 0 ? usuarioId : null;
}

function responderErro(res, error, mensagemPadrao) {
    if (error instanceof pesquisaService.ErroHttp) {
        return res.status(error.status).json({
            mensagem: error.message
        });
    }

    console.error(error);
    return res.status(500).json({
        mensagem: mensagemPadrao
    });
}

export async function criar(req, res) {
    try {
        const pesquisa = await pesquisaService.criarPesquisa(req.body);
        return res.status(201).json(pesquisa);
    } catch (error) {
        return responderErro(res, error, 'Erro ao criar pesquisa.');
    }
}

export async function listar(req, res) {
    try {
        const pesquisas = await pesquisaService.listarPesquisas();
        return res.status(200).json(pesquisas);
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar pesquisas.');
    }
}

export async function buscarMaisRecente(req, res) {
    try {
        const pesquisa = await pesquisaService.buscarPesquisaMaisRecente();
        return res.status(200).json(pesquisa);
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar pesquisa mais recente.');
    }
}

export async function listarPorCargo(req, res) {
    try {
        const pesquisas = await pesquisaService.listarPesquisasPorCargo(req.params.cargo);
        return res.status(200).json(pesquisas);
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar pesquisas por cargo.');
    }
}

export async function buscarPorId(req, res) {
    try {
        const id = lerId(req);
        if (!id) {
            return res.status(400).json({
                mensagem: 'ID inválido.'
            });
        }

        const pesquisa = await pesquisaService.buscarPesquisa(id);
        return res.status(200).json(pesquisa);
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar pesquisa.');
    }
}

export async function atualizar(req, res) {
    try {
        const id = lerId(req);
        if (!id) {
            return res.status(400).json({
                mensagem: 'ID inválido.'
            });
        }

        const pesquisa = await pesquisaService.atualizarPesquisa(id, req.body);
        return res.status(200).json(pesquisa);
    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar pesquisa.');
    }
}

export async function alterarStatus(req, res) {
    try {
        const usuarioId = lerUsuarioId(req);
        if (!usuarioId) {
            return res.status(400).json({
                mensagem: 'O usuarioId é obrigatório.'
            });
        }

        const id = lerId(req);
        if (!id) {
            return res.status(400).json({
                mensagem: 'ID inválido.'
            });
        }

        const pesquisa = await pesquisaService.alterarStatusPesquisa(id, req.body?.status, usuarioId);
        return res.status(200).json(pesquisa);
    } catch (error) {
        return responderErro(res, error, 'Erro ao alterar status da pesquisa.');
    }
}

export async function encerrar(req, res) {
    try {
        const usuarioId = lerUsuarioId(req);
        if (!usuarioId) {
            return res.status(400).json({
                mensagem: 'O usuarioId é obrigatório.'
            });
        }

        const id = lerId(req);
        if (!id) {
            return res.status(400).json({
                mensagem: 'ID inválido.'
            });
        }

        const pesquisa = await pesquisaService.encerrarPesquisa(id, usuarioId);
        return res.status(200).json(pesquisa);
    } catch (error) {
        return responderErro(res, error, 'Erro ao encerrar pesquisa.');
    }
}
