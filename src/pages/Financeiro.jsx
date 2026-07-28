import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  TrendingUp, TrendingDown, Plus, X, CheckCircle, 
  Calendar, DollarSign, Building2, Trash2 
} from 'lucide-react';

export default function Financeiro() {
  const [abaAtiva, setAbaAtiva] = useState('receber'); // 'receber' ou 'pagar'
  
  // Dados do Firebase
  const [contasReceber, setContasReceber] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);

  // Estados do Modal de Contas a Pagar
  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar Dados (Vendas/Recebimentos, Contas a Pagar e Fornecedores)
  useEffect(() => {
    // 1. Contas a Receber (Vendas do PDV e Pagamentos de Fiado)
    const unsubReceber = onSnapshot(query(collection(db, "vendas"), orderBy("data", "desc")), (snap) => {
      setContasReceber(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Contas a Pagar (Despesas da Loja)
    const unsubPagar = onSnapshot(query(collection(db, "contas_pagar"), orderBy("dataVencimento", "asc")), (snap) => {
      setContasPagar(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Fornecedores (Para o select de nova conta)
    const unsubFornecedores = onSnapshot(query(collection(db, "fornecedores"), orderBy("nome", "asc")), (snap) => {
      setFornecedores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubReceber(); unsubPagar(); unsubFornecedores(); };
  }, []);

  // Totalizadores
  const totalReceber = contasReceber.reduce((acc, conta) => acc + (conta.total || 0), 0);
  const totalPagarPendente = contasPagar.filter(c => c.status === 'pendente').reduce((acc, conta) => acc + (conta.valor || 0), 0);

  // Funções de Contas a Pagar
  const resetFormulario = () => {
    setDescricao(''); setValor(''); setDataVencimento(''); setFornecedorId('');
    setModalAberto(false);
  };

  const handleSalvarConta = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fornecedorSelecionado = fornecedores.find(f => f.id === fornecedorId);

    try {
      await addDoc(collection(db, "contas_pagar"), {
        descricao,
        valor: parseFloat(valor),
        dataVencimento,
        fornecedorId: fornecedorId || null,
        fornecedorNome: fornecedorSelecionado ? fornecedorSelecionado.nome : 'Sem Fornecedor',
        status: 'pendente',
        dataCadastro: new Date().toISOString()
      });
      resetFormulario();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      alert("Erro ao salvar a conta a pagar.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarComoPago = async (id) => {
    try {
      await updateDoc(doc(db, "contas_pagar", id), { status: 'pago' });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleExcluirConta = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await deleteDoc(doc(db, "contas_pagar", id));
      } catch (error) {
        console.error("Erro ao excluir conta:", error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Financeiro</h1>
        <p className="text-gray-600">Acompanhe as entradas de caixa e gerencie seus pagamentos.</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-full">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Entradas (Registradas)</p>
            <p className="text-3xl font-bold text-green-600">R$ {totalReceber.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-100 text-red-600 rounded-full">
            <TrendingDown size={32} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">A Pagar (Pendentes)</p>
            <p className="text-3xl font-bold text-red-600">R$ {totalPagarPendente.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      </div>

      {/* Controle de Abas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setAbaAtiva('receber')}
            className={`flex-1 py-4 text-center font-bold text-lg transition-colors border-b-4 ${
              abaAtiva === 'receber' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            Contas a Receber (Entradas)
          </button>
          <button 
            onClick={() => setAbaAtiva('pagar')}
            className={`flex-1 py-4 text-center font-bold text-lg transition-colors border-b-4 ${
              abaAtiva === 'pagar' ? 'border-red-500 text-red-600 bg-red-50/50' : 'border-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            Contas a Pagar (Saídas)
          </button>
        </div>

        {/* CONTEÚDO: CONTAS A RECEBER */}
        {abaAtiva === 'receber' && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Histórico de Entradas Automáticas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Data e Hora</th>
                    <th className="px-6 py-4 font-medium">Tipo / Descrição</th>
                    <th className="px-6 py-4 font-medium">Forma de Pgto</th>
                    <th className="px-6 py-4 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contasReceber.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Nenhuma entrada registrada ainda.</td></tr>
                  ) : (
                    contasReceber.map((conta) => (
                      <tr key={conta.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-600">{new Date(conta.data).toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{conta.tipo === 'pagamento' ? 'Recebimento de Fiado' : 'Venda (PDV)'}</p>
                          <p className="text-xs text-gray-500">{conta.descricao || `${conta.itens?.length || 0} itens vendidos`}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wide">
                            {conta.formaPagamento || 'Fiado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          + R$ {conta.total?.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO: CONTAS A PAGAR */}
        {abaAtiva === 'pagar' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Contas e Boletos a Pagar</h2>
              <button 
                onClick={() => setModalAberto(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={18} /> Nova Despesa
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="px-6 py-4 font-medium">Vencimento</th>
                    <th className="px-6 py-4 font-medium">Descrição / Fornecedor</th>
                    <th className="px-6 py-4 font-medium">Valor</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contasPagar.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhuma despesa registrada.</td></tr>
                  ) : (
                    contasPagar.map((conta) => {
                      const dataVenc = new Date(conta.dataVencimento + 'T12:00:00'); // Evita fuso horário bugado
                      const vencida = conta.status === 'pendente' && dataVenc < new Date().setHours(0,0,0,0);

                      return (
                        <tr key={conta.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${vencida ? 'text-red-600' : 'text-gray-600'}`}>
                              {dataVenc.toLocaleDateString('pt-BR')}
                            </span>
                            {vencida && <span className="block text-xs font-bold text-red-500 uppercase">Vencida</span>}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800 line-clamp-1">{conta.descricao}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Building2 size={12}/> {conta.fornecedorNome}
                            </p>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            R$ {conta.valor?.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {conta.status === 'pago' ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Pago</span>
                            ) : (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase">Pendente</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {conta.status === 'pendente' && (
                                <button 
                                  onClick={() => handleMarcarComoPago(conta.id)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors border border-green-200"
                                  title="Marcar como Pago"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              <button 
                                onClick={() => handleExcluirConta(conta.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Nova Conta a Pagar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-red-600 text-white">
              <h2 className="text-lg font-bold">Lançar Nova Despesa</h2>
              <button onClick={resetFormulario} className="text-white/80 hover:text-white"><X size={24} /></button>
            </div>
            
            <form id="form-conta" onSubmit={handleSalvarConta} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Descrição (Ex: Boleto Ambev, Conta de Luz)</label>
                <input type="text" required value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><DollarSign size={16}/> Valor (R$)</label>
                  <input type="number" step="0.01" min="0.01" required value={valor} onChange={(e) => setValor(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Calendar size={16}/> Vencimento</label>
                  <input type="date" required value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Building2 size={16}/> Fornecedor Vinculado (Opcional)</label>
                <select 
                  value={fornecedorId} 
                  onChange={(e) => setFornecedorId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                >
                  <option value="">-- Selecione (ou deixe em branco) --</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            </form>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={resetFormulario} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancelar</button>
              <button type="submit" form="form-conta" disabled={loading} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2">
                <CheckCircle size={18} /> {loading ? 'Salvando...' : 'Lançar Despesa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}