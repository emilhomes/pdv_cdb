import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    { label: 'Balcão / PDV', path: '/pdv', icon: <ShoppingCart size={19} />, adminOnly: false },
    { label: 'Produtos', path: '/produtos', icon: <Package size={19} />, adminOnly: false },
    { label: 'Clientes', path: '/clientes', icon: <Users size={19} />, adminOnly: false },
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={19} />, adminOnly: true },
    { label: 'Financeiro', path: '/financeiro', icon: <DollarSign size={19} />, adminOnly: true },
    { label: 'Fornecedores', path: '/fornecedores', icon: <Truck size={19} />, adminOnly: true },
    { label: 'Relatórios', path: '/relatorios', icon: <FileText size={19} />, adminOnly: true },
  ];

  return (
    <aside className="w-64 shrink-0 bg-brand-surface flex flex-col justify-between border-r border-black/5 relative z-10">

      {/* TOPO: Logo e Perfil */}
      <div>
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ rotate: -3, scale: 1.04 }}
            src={logoImg}
            alt="Central das Bebidas"
            className="h-16 w-auto object-contain mb-3 drop-shadow-sm"
          />
          <p className="text-[11px] text-brand-dark/40 uppercase font-semibold tracking-widest">
            Perfil <span className="text-brand-main font-bold">· {usuario?.role || '...'}</span>
          </p>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item, i) => {
            if (item.adminOnly && usuario?.role !== 'admin') return null;

            const ativo = isActive(item.path);

            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300 ${
                    ativo
                      ? 'bg-brand-dark text-white shadow-[0_10px_24px_-8px_rgba(23,17,10,0.45)]'
                      : 'text-brand-dark/55 hover:bg-brand-main/10 hover:text-brand-dark'
                  }`}
                >
                  <span className={`transition-transform duration-300 ${ativo ? 'text-brand-glow' : 'group-hover:scale-110 group-hover:text-brand-main'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {ativo && (
                    <motion.span
                      layoutId="active-dot"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-main"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* RODAPÉ */}
      <div className="p-4">
        <div className="rounded-2xl bg-brand-bg/70 p-3 mb-2">
          <p className="text-sm font-bold text-brand-dark truncate">{usuario?.nome || 'Usuário'}</p>
          <p className="text-xs text-brand-dark/40 truncate">{usuario?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-2xl transition-colors duration-300 font-medium text-sm cursor-pointer"
        >
          <LogOut size={17} />
          <span>Sair do sistema</span>
        </button>
      </div>

    </aside>
  );
}
