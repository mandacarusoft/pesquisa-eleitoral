const URL_BASE = '/api';

function obterToken() {
  return localStorage.getItem('token');
}

async function requisitar(caminho, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  const token = obterToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${URL_BASE}${caminho}`, { ...opcoes, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const dados = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error((dados && dados.erro) || 'Erro na requisicao');
  }
  return dados;
}

export const api = {
  // Autenticacao
  login: (email, senha) => requisitar('/autenticacao/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  registrar: (payload) => requisitar('/autenticacao/registrar', { method: 'POST', body: JSON.stringify(payload) }),
  listarUsuarios: () => requisitar('/usuarios'),

  // Pesquisas
  listarPesquisas: () => requisitar('/pesquisas'),
  criarPesquisa: (payload) => requisitar('/pesquisas', { method: 'POST', body: JSON.stringify(payload) }),
  atualizarPesquisa: (id, payload) => requisitar(`/pesquisas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  excluirPesquisa: (id) => requisitar(`/pesquisas/${id}`, { method: 'DELETE' }),
  buscarPesquisaCompleta: (id) => requisitar(`/pesquisas/${id}/completa`),

  // Perguntas
  criarPergunta: (payload) => requisitar('/perguntas', { method: 'POST', body: JSON.stringify(payload) }),
  atualizarPergunta: (id, payload) => requisitar(`/perguntas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  excluirPergunta: (id) => requisitar(`/perguntas/${id}`, { method: 'DELETE' }),
  reordenarPerguntas: (pesquisaId, ids) => requisitar(`/pesquisas/${pesquisaId}/perguntas/reordenar`, { method: 'PUT', body: JSON.stringify({ ids }) }),

  // Alternativas
  criarAlternativa: (payload) => requisitar('/alternativas', { method: 'POST', body: JSON.stringify(payload) }),
  atualizarAlternativa: (id, payload) => requisitar(`/alternativas/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  excluirAlternativa: (id) => requisitar(`/alternativas/${id}`, { method: 'DELETE' }),
  reordenarAlternativas: (perguntaId, ids) => requisitar(`/perguntas/${perguntaId}/alternativas/reordenar`, { method: 'PUT', body: JSON.stringify({ ids }) }),

  // Coleta
  criarSessao: (payload) => requisitar('/sessoes', { method: 'POST', body: JSON.stringify(payload) }),
  enviarRespostas: (sessaoId, respostas) => requisitar(`/sessoes/${sessaoId}/respostas`, { method: 'POST', body: JSON.stringify({ respostas }) }),

  // Analises
  obterAnalise: (pesquisaId, filtros = {}) => {
    const qs = new URLSearchParams(filtros).toString();
    return requisitar(`/analises/${pesquisaId}${qs ? `?${qs}` : ''}`);
  },
  urlExportacao: (pesquisaId) => `${URL_BASE}/analises/${pesquisaId}/exportar`,
};
