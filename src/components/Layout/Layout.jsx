import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  Truck, DollarSign, FileText, LogOut 
} from 'lucide-react';

import logoImg from '../../assets/logo.png';

export default function Layout() {
  const { usuario, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: 'Balcão / PDV', path: '/pdv', icon: <ShoppingCart size={20} />, adminOnly: false },
    { label: 'Produtos', path: '/produtos', icon: <Package size={20} />, adminOnly: false },
    { label: 'Clientes', path: '/clientes', icon: <Users size={20} />, adminOnly: false },
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, adminOnly: true },
    { label: 'Financeiro', path: '/financeiro', icon: <DollarSign size={20} />, adminOnly: true },
    { label: 'Fornecedores', path: '/fornecedores', icon: <Truck size={20} />, adminOnly: true },
    { label: 'Relatórios', path: '/relatorios', icon: <FileText size={20} />, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-white flex flex-col justify-between border-r border-gray-200 shadow-sm">
      
      {/* TOPO: Logo Imagem e Perfil */}
      <div>
        <div className="p-6 border-b border-gray-100 flex flex-col items-center justify-center text-center">
          <img 
            src={logoImg} 
            alt="Central das Bebidas" 
            className="h-16 w-auto object-contain mb-2" 
          />
          <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">
            Perfil: <span className="text-brand-dark font-bold">{usuario?.role || '...'}</span>
          </p>
        </div>

        {/* NAVEGAÇÃO / LINKS */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            if (item.adminOnly && usuario?.role !== 'admin') return null;

            const ativo = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  ativo 
                    ? 'bg-brand-main text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* RODAPÉ: Informações do Usuário + Botão de Sair */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="mb-3 px-2">
          <p className="text-sm font-bold text-gray-800 truncate">{usuario?.nome || 'Usuário'}</p>
          <p className="text-xs text-gray-500 truncate">{usuario?.email}</p>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>

    </aside>
  );
}