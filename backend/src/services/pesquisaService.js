import * as pesquisaRepository from '../repositories/pesquisaRepository.js'

export class ErroHttp extends Error {
    constructor(mensagem, status = 400) {
        super(mensagem);
        this.name = 'ErroHttp';
        this.status = status;
    }
}

const statusPermitidos = ['ativa', 'encerrada'];

const tamanhoMaximoTitulo = 200;
const tamanhoMaximoCidade = 150;

function validarDados(titulo, cidade) {
    if (typeof titulo !== 'string' || !titulo.trim()) {
        throw new ErroHttp('O título é obrigatório.');
    }

    if (titulo.trim().length > tamanhoMaximoTitulo) {
        throw new ErroHttp(`O título deve ter no máximo ${tamanhoMaximoTitulo} caracteres.`);
    }

    if (typeof cidade !== 'string' || !cidade.trim()) {
        throw new ErroHttp('A cidade é obrigatória.');
    }

    if (cidade.trim().length > tamanhoMaximoCidade) {
        throw new ErroHttp(`A cidade deve ter no máximo ${tamanhoMaximoCidade} caracteres.`);
    }
}

export async function criarPesquisa({titulo, cidade, status}) {
    validarDados(titulo, cidade);

    const statusFinal = status || 'ativa'

    if (!statusPermitidos.includes(statusFinal)) {
        throw new ErroHttp('Status inválido.');
    }

    const id = await pesquisaRepository.criar(
        titulo.trim(),
        cidade.trim(),
        statusFinal
    );
    return {
        id,
        titulo: titulo.trim(),
        cidade: cidade.trim(),
        status: statusFinal
    };
}

export async function listarPesquisas() {
    return await pesquisaRepository.buscarTodos();
}

export async function buscarPesquisaMaisRecente() {
    const pesquisa = await pesquisaRepository.buscarMaisRecente();

    if (!pesquisa) {
        throw new ErroHttp('Pesquisa não encontrada.', 404);
    }
    return pesquisa;
}

export async function listarPesquisasPorCargo(cargo) {
    if (!cargo || !cargo.trim()) {
        throw new ErroHttp('O cargo é obrigatório.');
    }
    return await pesquisaRepository.buscarPorCargo(cargo.trim());
}

export async function buscarPesquisa(id) {
    const pesquisa = await pesquisaRepository.buscarPorId(id);

    if (!pesquisa) {
        throw new ErroHttp('Pesquisa não encontrada.', 404);
    }
    return pesquisa;
}

export async function atualizarPesquisa(id, {titulo, cidade}) {
    validarDados(titulo, cidade);

    const pesquisa = await buscarPesquisa(id);

    if (pesquisa.status === 'encerrada') {
        throw new ErroHttp('Não é possível alterar uma pesquisa encerrada.');
    }

    // O SQL também bloqueia encerradas, caso ela seja encerrada entre a checagem acima e o UPDATE
    const alteradas = await pesquisaRepository.atualizar(id, titulo.trim(), cidade.trim());

    if (!alteradas) {
        throw new ErroHttp('Não é possível alterar uma pesquisa encerrada.');
    }

    return {
        ...pesquisa,
        titulo: titulo.trim(),
        cidade: cidade.trim()
    };
}

export async function alterarStatusPesquisa(id, status, usuarioId) {
    if (!statusPermitidos.includes(status)) {
        throw new ErroHttp('Status inválido.');
    }

    const pesquisa = await buscarPesquisa(id);

    if (pesquisa.status === status) {
        throw new ErroHttp(`A pesquisa já está ${status}.`);
    }

    const alteradas = await pesquisaRepository.alterarStatus(id, status, usuarioId);

    if (!alteradas) {
        throw new ErroHttp('Apenas administradores podem alterar o status da pesquisa.', 403);
    }
    return { ...pesquisa, status };
}

export async function encerrarPesquisa(id, usuarioId) {
    const pesquisa = await buscarPesquisa(id);

    if (pesquisa.status === 'encerrada') {
        throw new ErroHttp('A pesquisa já está encerrada.');
    }

    const alteradas = await pesquisaRepository.encerrar(id, usuarioId);

    if (!alteradas) {
        throw new ErroHttp('Apenas administradores podem encerrar a pesquisa.', 403);
    }
    return { ...pesquisa, status: 'encerrada' };
}
