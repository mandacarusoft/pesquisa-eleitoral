import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import * as usuarioRepository from '../repositories/usuarioRepository.js'

export async function autenticarUsuario({ email, senha }) {

    if (!email || !email.trim()) {
        throw new Error('O e-mail é obrigatório.');
    }

    if (!senha) {
        throw new Error('A senha é obrigatória.');
    }
    const emailNormalizado = email.trim().toLowerCase();

    const usuario = await usuarioRepository.buscarPorEmail(emailNormalizado);

    if (!usuario) {
        throw new Error('E-mail ou senha inválidos.');
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos.');
    }

    const token = jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            role: usuario.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );

    return {
        mensagem: 'Login realizado com sucesso.',
        token,
        uduario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role
        } 
    };
}