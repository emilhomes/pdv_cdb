import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, Wine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await login(email, senha);
      navigate('/');
    } catch (error) {
      console.error(error);
      setErro('E-mail ou senha incorretos. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden flex items-center justify-center p-4">

      {/* Fundo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-brand-main/30 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-16 w-[480px] h-[480px] rounded-full bg-brand-glow/20 blur-3xl animate-blob [animation-delay:-6s]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-brand-light/10 blur-3xl animate-blob [animation-delay:-11s]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-brand-surface/95 backdrop-blur-xl rounded-2xl shadow-soft-lg overflow-hidden border border-white/10">

          {/* Cabeçalho */}
          <div className="relative px-8 pt-10 pb-8 text-center flex flex-col items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-darker to-brand-dark" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-main/20 blur-2xl" />

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-glow bg-gradient-to-br from-brand-light to-brand-main"
            >
              <Wine size={28} className="text-brand-dark" />
            </motion.div>
            <h1 className="relative text-2xl font-extrabold text-white tracking-tight">Central das Bebidas</h1>
            <p className="relative text-brand-light/90 mt-1.5 text-sm">Acesso restrito ao sistema</p>
          </div>

          {/* Formulário */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">

              <AnimatePresence>
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium overflow-hidden"
                  >
                    <AlertCircle size={20} className="shrink-0" />
                    <p>{erro}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wide">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-brand-dark/30" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand-main focus:border-transparent outline-none bg-brand-bg/60 transition-all duration-300"
                    placeholder="Seu e-mail de acesso"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-brand-dark/30" />
                  </div>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-xl focus:ring-2 focus:ring-brand-main focus:border-transparent outline-none bg-brand-bg/60 transition-all duration-300"
                    placeholder="Sua senha"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group w-full py-4 bg-brand-main hover:bg-brand-dark disabled:bg-gray-300 text-white rounded-xl font-bold text-base transition-colors duration-300 shadow-glow mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Autenticando...
                  </span>
                ) : (
                  <>
                    Entrar no sistema
                    <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>

            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
