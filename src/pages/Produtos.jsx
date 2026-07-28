import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  Save, Package, Search, Plus, X, Barcode, DollarSign, Tags, Archive, 
  Edit, Trash2, AlertCircle, CheckCircle 
} from 'lucide-react';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Controle do Modal e Edição
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null); // Guarda o ID do produto sendo editado

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [estoqueAtual, setEstoqueAtual] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar produtos em tempo real
  useEffect(() => {
    const q = query(collection(db, "produtos"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaProdutos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProdutos(listaProdutos);
    });
    return () => unsubscribe();
  }, []);

  const produtosFiltrados = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (produto.codigoBarras && produto.codigoBarras.includes(busca))
  );

  // Limpar formulário e fechar modal
  const resetFormulario = () => {
    setNome(''); setCodigoBarras(''); setPrecoCusto(''); 
    setPrecoVenda(''); setEstoqueAtual(''); setEstoqueMinimo(''); 
    setCategoria(''); setProdutoEditando(null); setModalCadastroAberto(false);
  };

  // Preparar modal para edição
  const handleEditar = (produto) => {
    setProdutoEditando(produto.id);
    setNome(produto.nome);
    setCodigoBarras(produto.codigoBarras || '');
    setPrecoCusto(produto.precoCusto || '');
    setPrecoVenda(produto.precoVenda || '');
    setEstoqueAtual(produto.estoqueAtual || '');
    setEstoqueMinimo(produto.estoqueMinimo || '');
    setCategoria(produto.categoria || '');
    setModalCadastroAberto(true);
  };

  // Excluir Produto
  const handleExcluir = async (id, nomeProduto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${nomeProduto}"?`)) {
      try {
        await deleteDoc(doc(db, "produtos", id));
      } catch (error) {
        console.error("Erro ao excluir: ", error);
        alert("Erro ao excluir o produto.");
      }
    }
  };

  // Salvar Produto (Criação ou Edição)
  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dadosProduto = {
      nome,
      codigoBarras,
      precoCusto: parseFloat(precoCusto) || 0,
      precoVenda: parseFloat(precoVenda) || 0,
      estoqueAtual: parseInt(estoqueAtual) || 0,
      estoqueMinimo: parseInt(estoqueMinimo) || 0,
      categoria: categoria || 'Geral'
    };

    try {
      if (produtoEditando) {
        // Atualiza o documento existente
        const produtoRef = doc(db, "produtos", produtoEditando);
        await updateDoc(produtoRef, dadosProduto);
      } else {
        // Cria um novo documento
        dadosProduto.dataCadastro = new Date().toISOString();
        await addDoc(collection(db, "produtos"), dadosProduto);
      }
      resetFormulario();
    } catch (error) {
      console.error("Erro ao salvar produto: ", error);
      alert("Erro ao salvar. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular a Margem de Lucro (%)
  const calcularMargem = (custo, venda) => {
    if (!venda || venda <= 0 || !custo) return 0;
    return (((venda - custo) / venda) * 100).toFixed(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Produtos</h1>
          <p className="text-gray-600">Gestão de estoque, precificação e margens.</p>
        </div>
        <button 
          onClick={() => { resetFormulario(); setModalCadastroAberto(true); }}
          className="flex items-center gap-2 bg-brand-main hover:bg-brand-dark text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou código de barras..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none bg-white shadow-sm"
        />
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                <th className="px-6 py-4 font-medium">Produto</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium">Estoque</th>
                <th className="px-6 py-4 font-medium">Preço Custo</th>
                <th className="px-6 py-4 font-medium">Preço Venda</th>
                <th className="px-6 py-4 font-medium">Margem</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((produto) => {
                  const margem = calcularMargem(produto.precoCusto, produto.precoVenda);
                  const estoqueBaixo = produto.estoqueAtual <= (produto.estoqueMinimo || 0);

                  return (
                    <tr key={produto.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 line-clamp-1">{produto.nome}</p>
                        <p className="text-xs text-gray-500">{produto.codigoBarras || 'Sem código'}</p>
                      </td>
                      
                      {/* Coluna de Status */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center" title={estoqueBaixo ? 'Estoque Baixo!' : 'Estoque Regular'}>
                          {estoqueBaixo ? (
                            <AlertCircle size={20} className="text-red-500" />
                          ) : (
                            <CheckCircle size={20} className="text-green-500" />
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`font-semibold ${estoqueBaixo ? 'text-red-600' : 'text-gray-700'}`}>
                          {produto.estoqueAtual} un
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        R$ {produto.precoCusto?.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        R$ {produto.precoVenda?.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${margem < 20 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {margem}%
                        </span>
                      </td>

                      {/* Coluna de Ações (Editar / Excluir) */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleEditar(produto)} 
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleExcluir(produto.id, produto.nome)} 
                            className="text-gray-400 hover:text-red-600 transition-colors"
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

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-dark">
                {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={resetFormulario} className="text-gray-400 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="form-produto" onSubmit={handleSalvarProduto} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Package size={16} className="text-brand-main" /> Nome do Produto
                    </label>
                    <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Cerveja Heineken 330ml" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tags size={16} className="text-brand-main" /> Categoria
                    </label>
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Cervejas" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Barcode size={16} className="text-brand-main" /> Cód. de Barras (EAN)
                    </label>
                    <input type="text" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Bipe o leitor aqui" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Archive size={16} className="text-brand-main" /> Estoque Atual
                    </label>
                    <input type="number" required min="0" value={estoqueAtual} onChange={(e) => setEstoqueAtual(e.target.value)} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <AlertCircle size={16} className="text-brand-main" /> Estoque Mínimo
                    </label>
                    <input type="number" required min="0" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} placeholder="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign size={16} className="text-gray-500" /> Preço de Custo (R$)
                    </label>
                    <input type="number" step="0.01" min="0" required value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign size={16} className="text-green-600" /> Preço de Venda (R$)
                    </label>
                    <input type="number" step="0.01" min="0" required value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={resetFormulario} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" form="form-produto" disabled={loading} className="px-5 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                <Save size={18} /> {loading ? 'Salvando...' : (produtoEditando ? 'Atualizar Produto' : 'Salvar Produto')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}