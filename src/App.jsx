import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';

// Componentes e Páginas
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Financeiro from './pages/Financeiro';
import Fornecedores from './pages/Fornecedores';
import Relatorios from './pages/Relatorios';

// ---------------------------------------------------------
// ROTEADOR INTELIGENTE (Decide a tela inicial de cada um)
// ---------------------------------------------------------
function RotaInicial() {
  const { usuario } = useContext(AuthContext);
  
  // Se for admin, vai pro Dashboard. Se for funcionário, vai pro Caixa (PDV)
  if (usuario?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/pdv" replace />;
}

// ---------------------------------------------------------
// COMPONENTE DE PROTEÇÃO DE ROTA E PERMISSÕES
// ---------------------------------------------------------
function RotaPrivada({ children, rolesPermitidas }) {
  const { logado, loadingAuth, usuario } = useContext(AuthContext);

  if (loadingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-brand-main font-bold text-xl animate-pulse">
          Carregando sistema...
        </div>
      </div>
    );
  }

  // Se não estiver logado, chuta pro Login
  if (!logado) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige ser 'admin' e o usuário for 'funcionario', barra e manda pro Caixa
  if (rolesPermitidas && !rolesPermitidas.includes(usuario?.role)) {
    alert("Acesso Negado: Área restrita aos administradores da loja.");
    return <Navigate to="/pdv" replace />; 
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Layout />
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// APLICATIVO PRINCIPAL
// ---------------------------------------------------------
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          
          <Route path="/login" element={<Login />} />

          {/* Rota Raiz (Passa pelo roteador inteligente) */}
          <Route path="/" element={<RotaPrivada><RotaInicial /></RotaPrivada>} />

          {/* ROTAS OPERACIONAIS (Acesso liberado para Admin e Funcionário) */}
          <Route path="/pdv" element={<RotaPrivada><PDV /></RotaPrivada>} />
          <Route path="/clientes" element={<RotaPrivada><Clientes /></RotaPrivada>} />
          <Route path="/produtos" element={<RotaPrivada><Produtos /></RotaPrivada>} />

          {/* ROTAS GERENCIAIS (Acesso EXCLUSIVO para Admin) */}
          <Route path="/dashboard" element={<RotaPrivada rolesPermitidas={['admin']}><Dashboard /></RotaPrivada>} />
          <Route path="/financeiro" element={<RotaPrivada rolesPermitidas={['admin']}><Financeiro /></RotaPrivada>} />
          <Route path="/fornecedores" element={<RotaPrivada rolesPermitidas={['admin']}><Fornecedores /></RotaPrivada>} />
          <Route path="/relatorios" element={<RotaPrivada rolesPermitidas={['admin']}><Relatorios /></RotaPrivada>} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}