import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, ListChecks, LogOut, Vote } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout({ children }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() {
    sair();
    navigate('/login');
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col p-4">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="bg-brand-600 text-white p-2 rounded-lg"><Vote size={18} /></div>
          <span className="font-bold text-gray-800 text-sm leading-tight">Pesquisa<br />Eleitoral</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <NavLink to="/dashboard" end className={linkClass}>
            <BarChart3 size={18} /> Analytics
          </NavLink>
          <NavLink to="/dashboard/perguntas" className={linkClass}>
            <ListChecks size={18} /> Perguntas
          </NavLink>
        </nav>
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-400 px-2 mb-2">Logado como</p>
          <p className="text-sm font-medium text-gray-700 px-2 mb-3">{usuario?.nome}</p>
          <button onClick={handleSair} className="flex items-center gap-2 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
