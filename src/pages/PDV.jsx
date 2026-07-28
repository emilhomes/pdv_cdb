import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, 
  Banknote, Smartphone, User, CheckCircle 
} from 'lucide-react';

export default function PDV() {
  // Dados do Banco
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // Estados do PDV
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados do Checkout (Pagamento)
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');

  // Buscar Produtos e Clientes em tempo real
  useEffect(() => {
    const unsubProdutos = onSnapshot(query(collection(db, "produtos"), orderBy("nome")), (snap) => {
      setProdutos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubClientes = onSnapshot(query(collection(db, "clientes"), orderBy("nome")), (snap) => {
      setClientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProdutos(); unsubClientes(); };
  }, []);

  // Totalizadores
  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);

  // Ações do Carrinho
  const adicionarAoCarrinho = (produto) => {
    setCarrinho(prev => {
      const existe = prev.find(item => item.id === produto.id);
      if (existe) {
        return prev.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
    setBusca(''); // Limpa a busca após bipar/selecionar
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id) {
        const novaQtd = item.quantidade + delta;
        return novaQtd > 0 ? { ...item, quantidade: novaQtd } : item;
      }
      return item;
    }));
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(prev => prev.filter(item => item.id !== id));
  };

  // Lógica do Leitor de Código de Barras (Enter)
  const handleBuscaEnter = (e) => {
    if (e.key === 'Enter' && busca.trim() !== '') {
      const produtoBipado = produtos.find(p => p.codigoBarras === busca);
      if (produtoBipado) {
        adicionarAoCarrinho(produtoBipado);
      }
    }
  };

  // Filtragem para clique manual
  const produtosFiltrados = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (produto.codigoBarras && produto.codigoBarras.includes(busca))
  ).slice(0, 8); // Mostra no máximo 8 na tela para não poluir

  // Finalizar Venda (Transação em Lote)
  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0) return alert('O carrinho está vazio.');
    
    let cliente = null;
    
    // Validação estrita do Fiado
    if (formaPagamento === 'Fiado') {
      if (!clienteSelecionadoId) return alert('Selecione um cliente para vender no fiado.');
      
      cliente = clientes.find(c => c.id === clienteSelecionadoId);
      const disponivel = cliente.limiteCredito - cliente.saldoDevedor;
      
      if (totalCarrinho > disponivel) {
        return alert(`Venda bloqueada! O cliente possui apenas R$ ${disponivel.toFixed(2)} de limite disponível.`);
      }
    }

    setLoading(true);
    
    try {
      const batch = writeBatch(db);

      // 1. Criar o documento da Venda
      const vendaRef = doc(collection(db, "vendas"));
      batch.set(vendaRef, {
        data: new Date().toISOString(),
        total: totalCarrinho,
        formaPagamento,
        clienteId: formaPagamento === 'Fiado' ? clienteSelecionadoId : null,
        itens: carrinho.map(item => ({
          produtoId: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoVenda,
          subtotal: item.quantidade * item.precoVenda
        }))
      });

      // 2. Dar baixa no estoque dos produtos
      carrinho.forEach(item => {
        const produtoRef = doc(db, "produtos", item.id);
        const novoEstoque = (item.estoqueAtual || 0) - item.quantidade;
        batch.update(produtoRef, { estoqueAtual: novoEstoque >= 0 ? novoEstoque : 0 });
      });

      // 3. Atualizar a dívida do cliente (se for Fiado)
      if (formaPagamento === 'Fiado' && cliente) {
        const clienteRef = doc(db, "clientes", cliente.id);
        batch.update(clienteRef, { saldoDevedor: cliente.saldoDevedor + totalCarrinho });
      }

      // Executar todas as ações de uma vez
      await batch.commit();

      // Resetar PDV
      setCarrinho([]);
      setModalPagamentoAberto(false);
      setFormaPagamento('Dinheiro');
      setClienteSelecionadoId('');
      alert('Venda finalizada com sucesso!');

    } catch (error) {
      console.error("Erro ao finalizar venda: ", error);
      alert('Ocorreu um erro ao processar a venda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* LADO ESQUERDO: Busca e Lista de Produtos */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Bipe o código de barras ou digite o nome do produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleBuscaEnter}
            autoFocus
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-brand-light rounded-xl focus:ring-0 focus:border-brand-main outline-none bg-white shadow-sm transition-colors"
          />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Produtos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {produtosFiltrados.map(produto => (
              <div 
                key={produto.id} 
                onClick={() => adicionarAoCarrinho(produto)}
                className="border border-gray-100 rounded-lg p-4 cursor-pointer hover:border-brand-main hover:bg-brand-light/10 transition-all flex flex-col justify-between h-32"
              >
                <p className="font-medium text-gray-800 line-clamp-2 text-sm">{produto.nome}</p>
                <p className="font-bold text-green-600">R$ {produto.precoVenda?.toFixed(2).replace('.', ',')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LADO DIREITO: Carrinho de Compras */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <ShoppingCart size={20} className="text-brand-dark" />
          <h2 className="text-lg font-bold text-brand-dark">Carrinho</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {carrinho.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p>O carrinho está vazio</p>
            </div>
          ) : (
            carrinho.map(item => (
              <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
                <div className="flex-1 pr-2">
                  <p className="font-medium text-gray-800 text-sm line-clamp-1">{item.nome}</p>
                  <p className="text-gray-500 text-xs">R$ {item.precoVenda?.toFixed(2)} x {item.quantidade}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button onClick={() => alterarQuantidade(item.id, -1)} className="p-1 hover:bg-white rounded text-gray-600"><Minus size={14}/></button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, 1)} className="p-1 hover:bg-white rounded text-gray-600"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => removerDoCarrinho(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
          <div className="flex justify-between items-center text-xl font-bold text-brand-dark">
            <span>Total:</span>
            <span className="text-green-600">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
          </div>
          <button 
            onClick={() => setModalPagamentoAberto(true)}
            disabled={carrinho.length === 0}
            className="w-full py-4 bg-brand-main hover:bg-brand-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2"
          >
            <CheckCircle size={24} /> Fechar Venda
          </button>
        </div>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {modalPagamentoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-brand-dark">Pagamento</h2>
              <button onClick={() => setModalPagamentoAberto(false)} className="text-gray-400 hover:text-gray-700"><Trash2 size={24} className="opacity-0"/>{/* Filler para centralizar */}Fechar</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-500 font-medium">Total a Pagar</p>
                <p className="text-4xl font-bold text-green-600">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setFormaPagamento('Dinheiro')} className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${formaPagamento === 'Dinheiro' ? 'border-brand-main bg-brand-light/10 text-brand-main' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <Banknote size={24} /> <span className="font-bold">Dinheiro</span>
                </button>
                <button onClick={() => setFormaPagamento('Pix')} className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${formaPagamento === 'Pix' ? 'border-brand-main bg-brand-light/10 text-brand-main' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <Smartphone size={24} /> <span className="font-bold">Pix</span>
                </button>
                <button onClick={() => setFormaPagamento('Cartão')} className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${formaPagamento === 'Cartão' ? 'border-brand-main bg-brand-light/10 text-brand-main' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <CreditCard size={24} /> <span className="font-bold">Cartão</span>
                </button>
                <button onClick={() => setFormaPagamento('Fiado')} className={`py-3 flex flex-col items-center gap-2 rounded-xl border-2 transition-all ${formaPagamento === 'Fiado' ? 'border-brand-main bg-brand-light/10 text-brand-main' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <User size={24} /> <span className="font-bold">Fiado</span>
                </button>
              </div>

              {/* Seletor de Cliente condicional para o Fiado */}
              {formaPagamento === 'Fiado' && (
                <div className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <label className="text-sm font-bold text-orange-800 flex items-center gap-2">
                    Vincular Cliente (Controle de Limite)
                  </label>
                  <select 
                    value={clienteSelecionadoId} 
                    onChange={(e) => setClienteSelecionadoId(e.target.value)}
                    className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {clientes.map(c => {
                      const disponivel = c.limiteCredito - c.saldoDevedor;
                      return (
                        <option key={c.id} value={c.id} disabled={disponivel < totalCarrinho}>
                          {c.nome} - (Disp: R$ {disponivel.toFixed(2)})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={handleFinalizarVenda}
                disabled={loading}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition-colors flex justify-center items-center gap-2"
              >
                {loading ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}