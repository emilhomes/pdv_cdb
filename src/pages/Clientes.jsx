import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, where, increment } from 'firebase/firestore';
import { db } from '../services/firebase'; 
import { Save, User, Phone, DollarSign, Search, Plus, X, ReceiptText, Edit, Trash2, ArrowDownRight, ArrowUpRight, CheckCircle } from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Modais e Edição
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null); 
  
  // Estados do Histórico e Pagamento
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [valorPagamento, setValorPagamento] = useState('');
  const [loadingPagamento, setLoadingPagamento] = useState(false);

  // Estados do Formulário de Cadastro
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Buscar todos os clientes
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

  // 2. Buscar histórico de movimentações quando um cliente é selecionado
  useEffect(() => {
    if (!clienteSelecionado) {
      setHistorico([]);
      return;
    }

    const q = query(
      collection(db, "vendas"),
      where("clienteId", "==", clienteSelecionado.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenação feita no JavaScript para evitar erro de Index no Firebase no primeiro uso
      lista.sort((a, b) => new Date(b.data) - new Date(a.data));
      setHistorico(lista);
    });

    return () => unsubscribe();
  }, [clienteSelecionado]);

  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(busca.toLowerCase())
  );

  // Limpar formulário
  const resetFormulario = () => {
    setNome(''); setTelefone(''); setLimiteCredito('');
    setClienteEditando(null); setModalCadastroAberto(false);
  };

  // Preparar para edição
  const handleEditar = (cliente) => {
    setClienteEditando(cliente.id);
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setLimiteCredito(cliente.limiteCredito);
    setModalCadastroAberto(true);
  };

  // Excluir Cliente (Com trava de segurança)
  const handleExcluir = async (cliente) => {
    if (cliente.saldoDevedor > 0) {
      alert(`Ação Negada: O cliente "${cliente.nome}" não pode ser excluído pois possui uma dívida de R$ ${cliente.saldoDevedor.toFixed(2).replace('.', ',')}.`);
      return; 
    }

    if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      try {
        await deleteDoc(doc(db, "clientes", cliente.id));
      } catch (error) {
        console.error("Erro ao excluir cliente: ", error);
        alert("Erro ao excluir o cliente.");
      }
    }
  };

  // Salvar Cliente (Criação ou Edição)
  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dadosCliente = {
      nome,
      telefone,
      limiteCredito: parseFloat(limiteCredito)
    };

    try {
      if (clienteEditando) {
        const clienteRef = doc(db, "clientes", clienteEditando);
        await updateDoc(clienteRef, dadosCliente);
      } else {
        dadosCliente.saldoDevedor = 0.00;
        dadosCliente.status = "ativo";
        dadosCliente.dataCadastro = new Date().toISOString();
        await addDoc(collection(db, "clientes"), dadosCliente);
      }
      resetFormulario();
    } catch (error) {
      console.error("Erro ao salvar cliente: ", error);
      alert("Erro ao salvar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Processar o Recebimento de um Pagamento
  const handleReceberPagamento = async (e) => {
    e.preventDefault();
    const valor = parseFloat(valorPagamento);
    
    if (!valor || valor <= 0) return alert("Digite um valor válido.");
    if (valor > clienteSelecionado.saldoDevedor) return alert("O valor inserido é maior que a dívida atual!");

    setLoadingPagamento(true);
    try {
      // 1. Abater o valor da dívida do cliente
      const clienteRef = doc(db, "clientes", clienteSelecionado.id);
      await updateDoc(clienteRef, {
        saldoDevedor: increment(-valor) // O 'increment' com valor negativo subtrai de forma segura
      });

      // 2. Registrar essa movimentação na coleção para aparecer no histórico
      await addDoc(collection(db, "vendas"), {
        clienteId: clienteSelecionado.id,
        data: new Date().toISOString(),
        total: valor,
        tipo: 'pagamento', // Flag para diferenciar de uma compra
        descricao: 'Pagamento de Fiado'
      });

      setValorPagamento('');
      
      // Atualiza o card selecionado na tela instantaneamente
      setClienteSelecionado(prev => ({ ...prev, saldoDevedor: prev.saldoDevedor - valor }));

    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      alert("Erro ao processar o pagamento.");
    } finally {
      setLoadingPagamento(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Clientes</h1>
          <p className="text-gray-600">Gerencie os limites de fiado e histórico de compras.</p>
        </div>
        <button 
          onClick={() => { resetFormulario(); setModalCadastroAberto(true); }}
          className="flex items-center gap-2 bg-brand-main hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

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
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-brand-main transition-all cursor-pointer group relative"
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditar(cliente); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleExcluir(cliente); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center text-brand-main font-bold text-lg">
                    {inicial}
                  </div>
                  <div className="pr-12">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-main transition-colors line-clamp-1">{cliente.nome}</h3>
                    <p className="text-sm text-gray-500">{cliente.telefone}</p>
                  </div>
                </div>

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

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-dark">
                {clienteEditando ? 'Editar Cliente' : 'Novo Cadastro'}
              </h2>
              <button onClick={resetFormulario} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="form-cliente" onSubmit={handleSalvarCliente} className="space-y-4">
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
              <button type="button" onClick={resetFormulario} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" form="form-cliente" disabled={loading} className="px-5 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <Save size={18} /> {loading ? 'Salvando...' : (clienteEditando ? 'Atualizar' : 'Salvar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO COM EXTRATO E PAGAMENTO */}
      {clienteSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Cabeçalho */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-brand-dark text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ReceiptText size={20} />
                Histórico: {clienteSelecionado.nome}
              </h2>
              <button onClick={() => setClienteSelecionado(null)} className="text-white/70 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            {/* Resumo da Dívida e Formulário de Pagamento */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Dívida Atual</p>
                <p className="text-3xl font-bold text-red-500">R$ {clienteSelecionado.saldoDevedor.toFixed(2).replace('.', ',')}</p>
              </div>
              
              <form onSubmit={handleReceberPagamento} className="flex gap-3 w-full sm:w-auto">
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={clienteSelecionado.saldoDevedor}
                  required
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  placeholder="Valor pago (R$)..."
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none w-full sm:w-48 text-lg font-medium shadow-sm"
                  disabled={clienteSelecionado.saldoDevedor <= 0}
                />
                <button 
                  type="submit"
                  disabled={loadingPagamento || clienteSelecionado.saldoDevedor <= 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                >
                  <CheckCircle size={20} /> {loadingPagamento ? 'Aguarde...' : 'Receber'}
                </button>
              </form>
            </div>

            {/* Lista de Transações (Extrato) */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Extrato de Movimentações</h3>
              
              {historico.length === 0 ? (
                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                   <ReceiptText size={48} className="text-gray-300 mb-3" />
                   <p className="font-medium text-lg text-gray-600">Sem histórico</p>
                   <p className="text-sm">As vendas no fiado e pagamentos aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map(transacao => {
                    const isPagamento = transacao.tipo === 'pagamento';
                    const dataFormatada = new Date(transacao.data).toLocaleString('pt-BR');

                    return (
                      <div key={transacao.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${isPagamento ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {isPagamento ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              {isPagamento ? 'Pagamento Recebido' : 'Compra no Fiado'}
                            </p>
                            <p className="text-xs font-medium text-gray-400">{dataFormatada}</p>
                            
                            {!isPagamento && transacao.itens && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {transacao.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${isPagamento ? 'text-green-600' : 'text-red-500'}`}>
                          {isPagamento ? '-' : '+'} R$ {transacao.total?.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}