import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminPerguntas from './pages/AdminPerguntas.jsx';
import Coleta from './pages/Coleta.jsx';

function RotaProtegida({ papel, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (papel && usuario.papel !== papel) {
    return <Navigate to={usuario.papel === 'admin' ? '/dashboard' : '/coleta'} replace />;
  }
  return children;
}

export default function App() {
  const { usuario } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          usuario ? <Navigate to={usuario.papel === 'admin' ? '/dashboard' : '/coleta'} replace /> : <Login />
        } />
        <Route path="/dashboard" element={
          <RotaProtegida papel="admin"><Dashboard /></RotaProtegida>
        } />
        <Route path="/dashboard/perguntas" element={
          <RotaProtegida papel="admin"><AdminPerguntas /></RotaProtegida>
        } />
        <Route path="/coleta" element={
          <RotaProtegida papel="pesquisador"><Coleta /></RotaProtegida>
        } />
        <Route path="*" element={<Navigate to={usuario ? (usuario.papel === 'admin' ? '/dashboard' : '/coleta') : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
