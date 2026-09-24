import { useEffect, useState } from 'react';
import { LogOut, MapPin, CheckCircle2, Circle, ArrowRight, ArrowLeft, PartyPopper, Vote } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Coleta() {
  const { usuario, sair } = useAuth();
  const [pesquisas, setPesquisas] = useState([]);
  const [pesquisaId, setPesquisaId] = useState(null);
  const [pesquisa, setPesquisa] = useState(null);
  const [etapa, setEtapa] = useState('configuracao'); // configuracao -> formulario -> concluido
  const [bairro, setBairro] = useState('');
  const [zona, setZona] = useState('');
  const [sessaoId, setSessaoId] = useState(null);
  const [respostas, setRespostas] = useState({}); // pergunta_id -> valor
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.listarPesquisas().then(lista => {
      const ativas = lista.filter(p => p.situacao === 'ativa');
      setPesquisas(ativas);
      if (ativas.length) setPesquisaId(ativas[0].id);
    });
  }, []);

  useEffect(() => {
    if (pesquisaId) api.buscarPesquisaCompleta(pesquisaId).then(setPesquisa);
  }, [pesquisaId]);

  function mostrarAviso(mensagem) {
    setAviso(mensagem);
    setTimeout(() => setAviso(null), 2500);
  }

  async function handleIniciarEntrevista(e) {
    e.preventDefault();
    if (!bairro.trim() || !zona) return;
    const sessao = await api.criarSessao({ pesquisa_id: pesquisaId, bairro: bairro.trim(), zona });
    setSessaoId(sessao.id);
    setRespostas({});
    setEtapa('formulario');
  }

  function definirRespostaUnica(perguntaId, alternativaId) {
    setRespostas(prev => ({ ...prev, [perguntaId]: { alternativa_id: alternativaId } }));
  }

  function alternarRespostaMultipla(perguntaId, alternativaId) {
    setRespostas(prev => {
      const atuais = prev[perguntaId]?.alternativa_ids || [];
      const existe = atuais.includes(alternativaId);
      const proximas = existe ? atuais.filter(id => id !== alternativaId) : [...atuais, alternativaId];
      return { ...prev, [perguntaId]: { alternativa_ids: proximas } };
    });
  }

  function definirRespostaTexto(perguntaId, texto) {
    setRespostas(prev => ({ ...prev, [perguntaId]: { resposta_texto: texto } }));
  }

  function formularioValido() {
    if (!pesquisa) return false;
    return pesquisa.perguntas.every(p => {
      if (!p.obrigatoria) return true;
      const r = respostas[p.id];
      if (!r) return false;
      if (p.tipo === 'unica_escolha') return !!r.alternativa_id;
      if (p.tipo === 'multipla_escolha') return (r.alternativa_ids || []).length > 0;
      if (p.tipo === 'texto_livre') return !!(r.resposta_texto && r.resposta_texto.trim());
      return true;
    });
  }

  async function handleFinalizar() {
    if (!formularioValido()) {
      mostrarAviso('Preencha todas as perguntas obrigatórias.');
      return;
    }
    setEnviando(true);
    const payload = pesquisa.perguntas
      .filter(p => respostas[p.id])
      .map(p => ({ pergunta_id: p.id, ...respostas[p.id] }));

    try {
      await api.enviarRespostas(sessaoId, payload);
      setEtapa('concluido');
      mostrarAviso('Entrevista registrada com sucesso!');
      setTimeout(() => {
        setEtapa('configuracao');
        setBairro('');
        setZona('');
        setRespostas({});
        setSessaoId(null);
      }, 1600);
    } catch (err) {
      mostrarAviso('Erro ao salvar: ' + err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
        <div className="flex items-center gap-2">
          <Vote size={20} />
          <div>
            <p className="text-sm font-semibold leading-tight">{pesquisa?.titulo || 'Coleta de Dados'}</p>
            <p className="text-[11px] text-brand-100">{usuario?.nome}</p>
          </div>
        </div>
        <button onClick={sair} className="p-2 hover:bg-brand-700 rounded-lg"><LogOut size={18} /></button>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-8">
        {etapa === 'configuracao' && (
          <form onSubmit={handleIniciarEntrevista} className="bg-white rounded-2xl shadow-sm p-5 space-y-5 mt-4">
            <div className="text-center mb-2">
              <MapPin className="mx-auto text-brand-600 mb-2" size={32} />
              <h2 className="font-bold text-gray-800 text-lg">Nova Entrevista</h2>
              <p className="text-sm text-gray-500">Informe o local antes de iniciar</p>
            </div>

            {pesquisas.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pesquisa</label>
                <select value={pesquisaId} onChange={e => setPesquisaId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm">
                  {pesquisas.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bairro</label>
              <input required value={bairro} onChange={e => setBairro(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
                placeholder="Ex: Centro" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Zona</label>
              <div className="grid grid-cols-2 gap-3">
                {['Urbana', 'Rural'].map(z => (
                  <button
                    type="button" key={z} onClick={() => setZona(z)}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                      zona === z ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={!pesquisa} className="w-full bg-brand-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              Iniciar Entrevista <ArrowRight size={18} />
            </button>
          </form>
        )}

        {etapa === 'formulario' && pesquisa && (
          <div className="space-y-4 mt-4">
            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 shadow-sm">
              <span className="flex items-center gap-1"><MapPin size={14} /> {bairro} • {zona}</span>
              <button onClick={() => setEtapa('configuracao')} className="text-brand-600 font-medium flex items-center gap-1">
                <ArrowLeft size={12} /> Trocar
              </button>
            </div>

            {pesquisa.perguntas.map((p, idx) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
                <p className="font-semibold text-gray-800 mb-3 text-[15px]">
                  {idx + 1}. {p.texto} {p.obrigatoria && <span className="text-red-500">*</span>}
                </p>

                {p.tipo === 'unica_escolha' && (
                  <div className="grid grid-cols-1 gap-2">
                    {p.alternativas.map(alt => {
                      const ativo = respostas[p.id]?.alternativa_id === alt.id;
                      return (
                        <button
                          key={alt.id} type="button" onClick={() => definirRespostaUnica(p.id, alt.id)}
                          className={`flex items-center gap-2 text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition active:scale-[0.98] ${
                            ativo ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {ativo ? <CheckCircle2 size={18} className="shrink-0" /> : <Circle size={18} className="shrink-0 text-gray-300" />}
                          {alt.texto}
                        </button>
                      );
                    })}
                  </div>
                )}

                {p.tipo === 'multipla_escolha' && (
                  <div className="grid grid-cols-1 gap-2">
                    {p.alternativas.map(alt => {
                      const ativo = (respostas[p.id]?.alternativa_ids || []).includes(alt.id);
                      return (
                        <button
                          key={alt.id} type="button" onClick={() => alternarRespostaMultipla(p.id, alt.id)}
                          className={`flex items-center gap-2 text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition active:scale-[0.98] ${
                            ativo ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'
                          }`}
                        >
                          {ativo ? <CheckCircle2 size={18} className="shrink-0" /> : <Circle size={18} className="shrink-0 text-gray-300" />}
                          {alt.texto}
                        </button>
                      );
                    })}
                  </div>
                )}

                {p.tipo === 'texto_livre' && (
                  <textarea
                    rows={3} value={respostas[p.id]?.resposta_texto || ''}
                    onChange={e => definirRespostaTexto(p.id, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-500"
                    placeholder="Digite a resposta..."
                  />
                )}
              </div>
            ))}

            <button
              onClick={handleFinalizar} disabled={enviando}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 sticky bottom-4"
            >
              <PartyPopper size={20} /> Finalizar Entrevista
            </button>
          </div>
        )}

        {etapa === 'concluido' && (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <div className="bg-green-100 text-green-600 p-5 rounded-full mb-4">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Entrevista registrada!</h2>
            <p className="text-sm text-gray-500 mt-1">Preparando o formulário para a próxima abordagem...</p>
          </div>
        )}
      </main>

      {aviso && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 animate-bounce">
          {aviso}
        </div>
      )}
    </div>
  );
}
