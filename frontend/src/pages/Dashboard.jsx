import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, Users, MapPin, ClipboardList, Filter } from 'lucide-react';
import AdminLayout from '../components/AdminLayout.jsx';
import { api } from '../api.js';

const CORES = ['#4f46e5', '#059669', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#db2777'];

export default function Dashboard() {
  const [pesquisas, setPesquisas] = useState([]);
  const [pesquisaId, setPesquisaId] = useState(null);
  const [dados, setDados] = useState(null);
  const [filtros, setFiltros] = useState({ bairro: '', pesquisador_id: '', de: '', ate: '' });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.listarPesquisas().then(lista => {
      setPesquisas(lista);
      if (lista.length) setPesquisaId(lista[0].id);
    });
  }, []);

  useEffect(() => {
    if (pesquisaId) carregarAnalise();
  }, [pesquisaId, filtros]);

  async function carregarAnalise() {
    setCarregando(true);
    const filtrosLimpos = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
    const resultado = await api.obterAnalise(pesquisaId, filtrosLimpos);
    setDados(resultado);
    setCarregando(false);
  }

  const bairros = useMemo(() => dados?.porBairro.map(n => n.bairro) || [], [dados]);

  if (carregando && !dados) return <AdminLayout><p className="text-gray-500">Carregando métricas...</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel de Analytics</h1>
            <p className="text-sm text-gray-500">Métricas em tempo real da pesquisa selecionada.</p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={pesquisaId || ''} onChange={e => setPesquisaId(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {pesquisas.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
            <a href={api.urlExportacao(pesquisaId)} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Download size={16} /> Exportar CSV
            </a>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-1 text-gray-400 text-sm mr-1"><Filter size={16} /> Filtros:</div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bairro</label>
            <select value={filtros.bairro} onChange={e => setFiltros({ ...filtros, bairro: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm min-w-[140px]">
              <option value="">Todos</option>
              {bairros.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">De</label>
            <input type="date" value={filtros.de} onChange={e => setFiltros({ ...filtros, de: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Até</label>
            <input type="date" value={filtros.ate} onChange={e => setFiltros({ ...filtros, ate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          {(filtros.bairro || filtros.de || filtros.ate) && (
            <button onClick={() => setFiltros({ bairro: '', pesquisador_id: '', de: '', ate: '' })}
              className="text-sm text-brand-600 font-medium">Limpar</button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CartaoKpi icon={<ClipboardList size={20} />} rotulo="Formulários Aplicados" valor={dados?.totalFormularios ?? 0} />
          <CartaoKpi icon={<Users size={20} />} rotulo="Pesquisadores Ativos" valor={dados?.porPesquisador.length ?? 0} />
          <CartaoKpi icon={<MapPin size={20} />} rotulo="Bairros Cobertos" valor={dados?.porBairro.length ?? 0} />
        </div>

        {/* Distribuição por pesquisador e bairro */}
        <div className="grid md:grid-cols-2 gap-4">
          <CartaoGrafico titulo="Formulários por Pesquisador">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dados?.porPesquisador || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="pesquisador" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CartaoGrafico>

          <CartaoGrafico titulo="Distribuição por Bairro">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dados?.porBairro || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="bairro" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#059669" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CartaoGrafico>
        </div>

        {/* Gráficos dinâmicos por pergunta */}
        <h2 className="text-lg font-semibold text-gray-800 pt-2">Resultados por Pergunta</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {dados?.resultadosPorPergunta.map(p => (
            <CartaoGrafico key={p.pergunta_id} titulo={p.texto}>
              {p.tipo === 'texto_livre' || p.tipo === 'demografica' ? (
                <div className="max-h-64 overflow-y-auto space-y-2 text-sm text-gray-600 pr-2">
                  {p.respostas.length === 0 && <p className="text-gray-400 text-sm">Nenhuma resposta registrada.</p>}
                  {p.respostas.map((r, i) => (
                    <p key={i} className="border-b border-gray-100 pb-1.5">{r}</p>
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={p.alternativas} dataKey="total" nameKey="texto"
                      cx="50%" cy="50%" outerRadius={80}
                      label={({ texto, percentual }) => `${texto}: ${percentual}%`}
                    >
                      {p.alternativas.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                    </Pie>
                    <Tooltip formatter={(valor, nome, props) => [`${valor} (${props.payload.percentual}%)`, nome]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CartaoGrafico>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function CartaoKpi({ icon, rotulo, valor }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      <div className="bg-brand-50 text-brand-600 p-3 rounded-lg">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{valor}</p>
        <p className="text-xs text-gray-500">{rotulo}</p>
      </div>
    </div>
  );
}

function CartaoGrafico({ titulo, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{titulo}</h3>
      {children}
    </div>
  );
}
