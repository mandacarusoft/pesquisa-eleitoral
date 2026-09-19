import * as authService from '../services/authService.js';

export async function login(req, res) {
    try {
        const usuario = await authService.autenticarUsuario(req.body);

        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(401).json({
            mensagem: error.message
        });
    }
}