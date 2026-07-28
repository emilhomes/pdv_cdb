import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  CircleDollarSign, 
  BarChart3
} from 'lucide-react'; // Removi o ícone "Cloud" da importação

import logoImg from '../../assets/logo.png'; 

export default function Layout() {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Balcão / PDV', path: '/pdv', icon: <ShoppingCart size={20} /> },
    { name: 'Produtos', path: '/produtos', icon: <Package size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Fornecedores', path: '/fornecedores', icon: <Truck size={20} /> },
    { name: 'Financeiro', path: '/financeiro', icon: <CircleDollarSign size={20} /> },
    { name: 'Relatórios', path: '/relatorios', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      
      {/* Sidebar Lateral */}
      {/* Removi o justify-between já que não teremos mais o rodapé da nuvem */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div>
          {/* Área da Logo - Ajustada para maior destaque */}
          <div className="flex items-center justify-center px-4 py-8 border-b border-gray-100">
            <img 
              src={logoImg} 
              alt="Central das Bebidas" 
              className="w-48 h-auto object-contain" // Definindo uma largura maior (w-48) para a logo crescer
            />
          </div>

          {/* Navegação */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? 'bg-brand-main text-white' 
                      : 'text-gray-500 hover:bg-brand-light/20 hover:text-brand-dark' 
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Área de Conteúdo Principal (Direita) */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet /> 
      </main>
    </div>
  );
}