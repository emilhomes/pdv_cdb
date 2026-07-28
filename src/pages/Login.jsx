import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';

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
      // Se deu certo, vai para a tela principal
      navigate('/'); 
    } catch (error) {
      console.error(error);
      setErro('E-mail ou senha incorretos. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Cabeçalho do Login */}
        <div className="bg-brand-dark p-8 text-center flex flex-col items-center">
          {/* Substitua pela sua Logo real se quiser */}
          <div className="w-20 h-20 bg-brand-main rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-brand-dark">
             <Lock size={32} className="text-brand-dark" />
          </div>
          <h1 className="text-2xl font-bold text-white">Central das Bebidas</h1>
          <p className="text-brand-light mt-2">Acesso restrito ao sistema</p>
        </div>

        {/* Formulário */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {erro && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm font-medium">
                <AlertCircle size={20} />
                <p>{erro}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none bg-gray-50 transition-colors"
                  placeholder="Seu e-mail de acesso"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none bg-gray-50 transition-colors"
                  placeholder="Sua senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-main hover:bg-brand-dark disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-colors shadow-md mt-4"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}