import bcrypt from 'bcryptjs';
import * as usuarioRepository from '../repositories/usuarioRepository.js'

export async function criarUsuario({nome, email, senha, role}) {
    if (!nome || !nome.trim()) {
        throw new Error('O nome é obrigatório.');
    }

    if (!email || !email.trim()) {
        throw new Error('O e-mail é obrigatório.');
    }
    
    if (!senha) {
        throw new Error('A senha é obrigatória.')
    }

    if (senha.length < 6) {
        throw new Error('A senha deve possuir pelo menos 6 caracteres.');
    }

    const emailExistente = await usuarioRepository.buscarPorEmail(email);

    if (emailExistente) {
        throw new Error('Esse e-mail já está cadastrado.');
    }

    const rolesPermitidas = ['admin', 'pesquisador'];
    const roleFinal = role || 'pesquisador'

    if (!rolesPermitidas.includes(roleFinal)) {
        throw new Error('Role inválida.');
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 10);

        const id = await usuarioRepository.criar(
            nome.trim(),
            email.trim().toLowerCase(),
            senhaHash,
            roleFinal
        );
        return {
            id,
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            role: roleFinal
        };
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('Este e-mail já está cadastrado.');
        }
        throw error;
    }
}

export async function listarUsuarios() {
    return await usuarioRepository.buscarTodos();
}

export async function buscarUsuario(id) {
    const usuario = await usuarioRepository.buscarPorId(id);

    if (!usuario) {
        throw new Error('Usuário não encontrado.')
    }
    return usuario;
}