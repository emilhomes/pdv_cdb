import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase'; 
import { Save, User, Phone, DollarSign, Search, Plus, X, ReceiptText } from 'lucide-react';

export default function Clientes() {
  // Estados do Banco e Busca
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Estados dos Modais
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null); // Controla o modal de histórico

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar clientes no Firebase
  useEffect(() => {
    const q = query(collection(db, "clientes"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaClientes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(listaClientes);
    });
    return () => unsubscribe();
  }, []);

  // Filtrar clientes pela barra de pesquisa
  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Cadastrar Cliente
  const handleCadastrarCliente = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "clientes"), {
        nome: nome,
        telefone: telefone,
        limiteCredito: parseFloat(limiteCredito),
        saldoDevedor: 0.00,
        status: "ativo",
        dataCadastro: new Date().toISOString()
      });

      setNome('');
      setTelefone('');
      setLimiteCredito('');
      setModalCadastroAberto(false); // Fecha o modal após sucesso
      
    } catch (error) {
      console.error("Erro ao cadastrar cliente: ", error);
      alert("Erro ao cadastrar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho e Botão de Novo Cliente */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Clientes</h1>
          <p className="text-gray-600">Gerencie os limites de fiado e histórico de compras.</p>
        </div>
        <button 
          onClick={() => setModalCadastroAberto(true)}
          className="flex items-center gap-2 bg-brand-main hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar cliente por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none bg-white shadow-sm"
        />
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {clientesFiltrados.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
            Nenhum cliente encontrado.
          </div>
        ) : (
          clientesFiltrados.map((cliente) => {
            const limite = cliente.limiteCredito || 0;
            const devedor = cliente.saldoDevedor || 0;
            const disponivel = limite - devedor;
            const inicial = cliente.nome.charAt(0).toUpperCase();

            return (
              <div 
                key={cliente.id} 
                onClick={() => setClienteSelecionado(cliente)}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-brand-main transition-all cursor-pointer group"
              >
                {/* Topo do Card: Ícone e Nome */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center text-brand-main font-bold text-lg">
                    {inicial}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-main transition-colors line-clamp-1">{cliente.nome}</h3>
                    <p className="text-sm text-gray-500">{cliente.telefone}</p>
                  </div>
                </div>

                {/* Valores Financeiros */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Limite Total</p>
                    <p className="font-medium text-gray-800">R$ {limite.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Dívida Atual</p>
                    <p className="font-medium text-red-500">R$ {devedor.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                   <span className="text-sm text-gray-500">Disponível:</span>
                   <span className={`font-semibold ${disponivel <= (limite * 0.1) ? 'text-red-600' : 'text-green-600'}`}>
                     R$ {disponivel.toFixed(2).replace('.', ',')}
                   </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CADASTRO */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-dark">Novo Cadastro</h2>
              <button onClick={() => setModalCadastroAberto(false)} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="form-cliente" onSubmit={handleCadastrarCliente} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User size={16} className="text-brand-main" /> Nome Completo
                  </label>
                  <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone size={16} className="text-brand-main" /> Telefone
                  </label>
                  <input type="text" required value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign size={16} className="text-brand-main" /> Limite de Fiado (R$)
                  </label>
                  <input type="number" step="0.01" min="0" required value={limiteCredito} onChange={(e) => setLimiteCredito(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setModalCadastroAberto(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" form="form-cliente" disabled={loading} className="px-5 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <Save size={18} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO (Em Branco por enquanto) */}
      {clienteSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-brand-main text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ReceiptText size={20} />
                Histórico: {clienteSelecionado.nome}
              </h2>
              <button onClick={() => setClienteSelecionado(null)} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 h-64 bg-gray-50">
               <ReceiptText size={48} className="text-gray-300" />
               <h3 className="text-lg font-medium text-gray-700">Ainda não há vendas vinculadas.</h3>
               <p className="text-gray-500 max-w-md">
                 O histórico de compras no fiado e o botão de receber pagamentos aparecerão aqui assim que o módulo de vendas for integrado.
               </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}