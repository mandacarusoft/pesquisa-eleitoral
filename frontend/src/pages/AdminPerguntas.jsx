import { useEffect, useState } from 'react';
import {
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown, ListChecks,
  CheckCircle2, Circle, Type, Save, X
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';
import { api } from '../api.js';

const RESPOSTA_LABEL = {
  unica_escolha: 'Escolha Única',
  multipla_escolha: 'Múltipla Escolha',
  texto_livre: 'Texto Livre',
  demografica: 'Demográfica',
};

const RESPOSTA_ICONE = {
  unica_escolha: <Circle size={14} />,
  multipla_escolha: <CheckCircle2 size={14} />,
  texto_livre: <Type size={14} />,
  demografica: <ListChecks size={14} />,
};

export default function AdminPerguntas() {
  const [pesquisas, setPesquisas] = useState([]);
  const [pesquisaId, setPesquisaId] = useState(null);
  const [pesquisa, setPesquisa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarNovaPesquisa, setMostrarNovaPesquisa] = useState(false);
  const [novaPesquisa, setNovaPesquisa] = useState({ titulo: '', cidade: '' });
  const [novaPergunta, setNovaPergunta] = useState({ texto: '', tipo: 'unica_escolha', obrigatoria: true, alternativas: ['', ''] });

  useEffect(() => { carregarPesquisas(); }, []);
  useEffect(() => { if (pesquisaId) carregarPesquisaCompleta(pesquisaId); }, [pesquisaId]);

  async function carregarPesquisas() {
    const dados = await api.listarPesquisas();
    setPesquisas(dados);
    if (dados.length && !pesquisaId) setPesquisaId(dados[0].id);
    setCarregando(false);
  }

  async function carregarPesquisaCompleta(id) {
    const dados = await api.buscarPesquisaCompleta(id);
    setPesquisa(dados);
  }

  async function handleCriarPesquisa(e) {
    e.preventDefault();
    if (!novaPesquisa.titulo.trim()) return;
    const criada = await api.criarPesquisa(novaPesquisa);
    setNovaPesquisa({ titulo: '', cidade: '' });
    setMostrarNovaPesquisa(false);
    await carregarPesquisas();
    setPesquisaId(criada.id);
  }

  function atualizarAlternativaNova(index, valor) {
    const alts = [...novaPergunta.alternativas];
    alts[index] = valor;
    setNovaPergunta({ ...novaPergunta, alternativas: alts });
  }

  function adicionarCampoAlternativa() {
    setNovaPergunta({ ...novaPergunta, alternativas: [...novaPergunta.alternativas, ''] });
  }

  function removerCampoAlternativa(index) {
    setNovaPergunta({ ...novaPergunta, alternativas: novaPergunta.alternativas.filter((_, i) => i !== index) });
  }

  async function handleCriarPergunta(e) {
    e.preventDefault();
    if (!novaPergunta.texto.trim()) return;

    const precisaAlternativas = novaPergunta.tipo === 'unica_escolha' || novaPergunta.tipo === 'multipla_escolha';
    const alternativas = precisaAlternativas
      ? novaPergunta.alternativas.filter(a => a.trim()).map(texto => ({ texto }))
      : [];

    await api.criarPergunta({
      pesquisa_id: pesquisaId,
      texto: novaPergunta.texto,
      tipo: novaPergunta.tipo,
      obrigatoria: novaPergunta.obrigatoria,
      alternativas,
    });

    setNovaPergunta({ texto: '', tipo: 'unica_escolha', obrigatoria: true, alternativas: ['', ''] });
    carregarPesquisaCompleta(pesquisaId);
  }

  async function handleExcluirPergunta(id) {
    if (!confirm('Remover esta pergunta e todas as suas alternativas?')) return;
    await api.excluirPergunta(id);
    carregarPesquisaCompleta(pesquisaId);
  }

  async function handleMoverPergunta(index, direcao) {
    const ids = [...pesquisa.perguntas].map(p => p.id);
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[index], ids[alvo]] = [ids[alvo], ids[index]];
    await api.reordenarPerguntas(pesquisaId, ids);
    carregarPesquisaCompleta(pesquisaId);
  }

  async function handleAdicionarAlternativa(perguntaId, texto) {
    if (!texto.trim()) return;
    await api.criarAlternativa({ pergunta_id: perguntaId, texto });
    carregarPesquisaCompleta(pesquisaId);
  }

  async function handleExcluirAlternativa(alternativaId) {
    await api.excluirAlternativa(alternativaId);
    carregarPesquisaCompleta(pesquisaId);
  }

  async function handleMoverAlternativa(pergunta, index, direcao) {
    const ids = pergunta.alternativas.map(a => a.id);
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= ids.length) return;
    [ids[index], ids[alvo]] = [ids[alvo], ids[index]];
    await api.reordenarAlternativas(pergunta.id, ids);
    carregarPesquisaCompleta(pesquisaId);
  }

  if (carregando) return <AdminLayout><p className="text-gray-500">Carregando...</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Perguntas</h1>
            <p className="text-sm text-gray-500">Crie pesquisas e cadastre perguntas e alternativas dinamicamente.</p>
          </div>
          <button
            onClick={() => setMostrarNovaPesquisa(!mostrarNovaPesquisa)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Nova Pesquisa
          </button>
        </div>

        {mostrarNovaPesquisa && (
          <form onSubmit={handleCriarPesquisa} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Título da Pesquisa</label>
              <input required value={novaPesquisa.titulo} onChange={e => setNovaPesquisa({ ...novaPesquisa, titulo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Eleições Municipais 2026" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Cidade</label>
              <input value={novaPesquisa.cidade} onChange={e => setNovaPesquisa({ ...novaPesquisa, cidade: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Esperança - PB" />
            </div>
            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Save size={16} /> Salvar
            </button>
          </form>
        )}

        {/* Seletor de pesquisa */}
        <div className="flex gap-2 flex-wrap">
          {pesquisas.map(p => (
            <button
              key={p.id}
              onClick={() => setPesquisaId(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                pesquisaId === p.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p.titulo} {p.situacao === 'encerrada' && '(encerrada)'}
            </button>
          ))}
        </div>

        {pesquisa && (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Lista de perguntas cadastradas */}
            <div className="md:col-span-3 space-y-4">
              {pesquisa.perguntas.length === 0 && (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 text-sm">
                  Nenhuma pergunta cadastrada ainda para esta pesquisa.
                </div>
              )}

              {pesquisa.perguntas.map((p, index) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <GripVertical size={16} className="text-gray-300 mt-1" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                            {RESPOSTA_ICONE[p.tipo]} {RESPOSTA_LABEL[p.tipo]}
                          </span>
                          {p.obrigatoria && (
                            <span className="text-[11px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Obrigatória</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-800">{index + 1}. {p.texto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleMoverPergunta(index, -1)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded"><ChevronUp size={16} /></button>
                      <button onClick={() => handleMoverPergunta(index, 1)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded"><ChevronDown size={16} /></button>
                      <button onClick={() => handleExcluirPergunta(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {(p.tipo === 'unica_escolha' || p.tipo === 'multipla_escolha') && (
                    <div className="mt-3 pl-6 space-y-1.5">
                      {p.alternativas.map((alt, ai) => (
                        <div key={alt.id} className="flex items-center gap-2 group">
                          <span className="text-gray-300">{RESPOSTA_ICONE[p.tipo]}</span>
                          <span className="text-sm text-gray-600 flex-1">{alt.texto}</span>
                          <button onClick={() => handleMoverAlternativa(p, ai, -1)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700"><ChevronUp size={14} /></button>
                          <button onClick={() => handleMoverAlternativa(p, ai, 1)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-700"><ChevronDown size={14} /></button>
                          <button onClick={() => handleExcluirAlternativa(alt.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600"><X size={14} /></button>
                        </div>
                      ))}
                      <AdicionarAlternativaInline onAdicionar={(texto) => handleAdicionarAlternativa(p.id, texto)} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Formulário de nova pergunta */}
            <div className="md:col-span-2">
              <form onSubmit={handleCriarPergunta} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 sticky top-6">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Plus size={18} /> Nova Pergunta</h2>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Texto da Pergunta</label>
                  <textarea
                    required rows={2} value={novaPergunta.texto}
                    onChange={e => setNovaPergunta({ ...novaPergunta, texto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Ex: Em quem você pretende votar para prefeito?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Resposta</label>
                  <select
                    value={novaPergunta.tipo}
                    onChange={e => setNovaPergunta({ ...novaPergunta, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="unica_escolha">Escolha Única</option>
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="texto_livre">Texto Livre</option>
                  </select>
                </div>

                {(novaPergunta.tipo === 'unica_escolha' || novaPergunta.tipo === 'multipla_escolha') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Alternativas</label>
                    <div className="space-y-2">
                      {novaPergunta.alternativas.map((alt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={alt} onChange={e => atualizarAlternativaNova(i, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                            placeholder={`Alternativa ${i + 1}`}
                          />
                          {novaPergunta.alternativas.length > 2 && (
                            <button type="button" onClick={() => removerCampoAlternativa(i)} className="text-gray-400 hover:text-red-600">
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={adicionarCampoAlternativa} className="mt-2 text-sm text-brand-600 font-medium flex items-center gap-1">
                      <Plus size={14} /> Adicionar alternativa
                    </button>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={novaPergunta.obrigatoria}
                    onChange={e => setNovaPergunta({ ...novaPergunta, obrigatoria: e.target.checked })} />
                  Resposta obrigatória
                </label>

                <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <Save size={16} /> Salvar Pergunta
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function AdicionarAlternativaInline({ onAdicionar }) {
  const [valor, setValor] = useState('');
  function enviar(e) {
    e.preventDefault();
    if (!valor.trim()) return;
    onAdicionar(valor.trim());
    setValor('');
  }
  return (
    <form onSubmit={enviar} className="flex items-center gap-2 pt-1">
      <input
        value={valor} onChange={e => setValor(e.target.value)}
        placeholder="Nova alternativa..."
        className="flex-1 border border-dashed border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-brand-500"
      />
      <button type="submit" className="text-brand-600"><Plus size={16} /></button>
    </form>
  );
}
