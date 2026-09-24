import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { entrar } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const usuario = await entrar(email, senha);
      navigate(usuario.papel === 'admin' ? '/dashboard' : '/coleta', { replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-brand-600 text-white p-3 rounded-full mb-3">
            <Vote size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Pesquisa Eleitoral</h1>
          <p className="text-sm text-gray-500">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password" required value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}

          <button
            type="submit" disabled={carregando}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {carregando && <Loader2 className="animate-spin" size={18} />}
            Entrar
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
          Admin: admin@pesquisa.com / admin123<br />
          Pesquisador: pesquisador@pesquisa.com / pesq123
        </div>
      </div>
    </div>
  );
}
