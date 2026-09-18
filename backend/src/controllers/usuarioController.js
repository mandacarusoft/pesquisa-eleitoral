import * as usuarioService from '../services/usuarioService.js';

export async function criar(req, res) {
    try {
        const usuario = await usuarioService.criarUsuario(req.body);
        return res.status(201).json(usuario);
    } catch (error) {
        return res.status(400).json({
            mensagem: error.message
        });
    }
}

export async function listar(req, res) {
    try {
        const usuarios = await usuarioService.listarUsuarios();
        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({
            mensagem: 'Erro ao buscar usuários.'
        });
    }
}

export async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: 'ID inválido.'
            });
        }

        const usuario = await usuarioService.buscarPorId(id);
        return res.status(200).json(usuario);
    } catch (error) {
        if (error.message === 'Usuário não encontrado.') {
            return res.status(400).json({
                mensagem: error.message
            });
        }
        return res.status(500).json({
            mensagem: 'Erro ao buscar usuário.'
        });
    }
}