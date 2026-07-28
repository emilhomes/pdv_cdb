import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase'; 
import { Save, Truck, Phone, FileText, Search, Plus, X, Edit, Trash2, Tags } from 'lucide-react';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Controle do Modal
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar fornecedores
  useEffect(() => {
    const q = query(collection(db, "fornecedores"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFornecedores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (f.categoria && f.categoria.toLowerCase().includes(busca.toLowerCase()))
  );

  // Limpar formulário
  const resetFormulario = () => {
    setNome(''); setCnpj(''); setTelefone(''); setCategoria('');
    setFornecedorEditando(null); setModalCadastroAberto(false);
  };

  // Preparar para edição
  const handleEditar = (fornecedor) => {
    setFornecedorEditando(fornecedor.id);
    setNome(fornecedor.nome);
    setCnpj(fornecedor.cnpj || '');
    setTelefone(fornecedor.telefone || '');
    setCategoria(fornecedor.categoria || '');
    setModalCadastroAberto(true);
  };

  // Excluir
  const handleExcluir = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${nome}"?`)) {
      try {
        await deleteDoc(doc(db, "fornecedores", id));
      } catch (error) {
        console.error("Erro ao excluir: ", error);
        alert("Erro ao excluir fornecedor.");
      }
    }
  };

  // Salvar
  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = { nome, cnpj, telefone, categoria };

    try {
      if (fornecedorEditando) {
        await updateDoc(doc(db, "fornecedores", fornecedorEditando), dados);
      } else {
        await addDoc(collection(db, "fornecedores"), { ...dados, dataCadastro: new Date().toISOString() });
      }
      resetFormulario();
    } catch (error) {
      console.error("Erro ao salvar: ", error);
      alert("Erro de conexão ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Fornecedores</h1>
          <p className="text-gray-600">Gestão de parceiros para vinculação no Contas a Pagar.</p>
        </div>
        <button 
          onClick={() => { resetFormulario(); setModalCadastroAberto(true); }}
          className="flex items-center gap-2 bg-brand-main hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={20} /> Novo Fornecedor
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none bg-white shadow-sm"
        />
      </div>

      {/* Grid de Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        {fornecedoresFiltrados.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
            Nenhum fornecedor encontrado.
          </div>
        ) : (
          fornecedoresFiltrados.map((fornecedor) => (
            <div key={fornecedor.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-brand-main transition-all group relative">
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditar(fornecedor)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="Editar">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleExcluir(fornecedor.id, fornecedor.nome)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl" title="Excluir">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Truck size={24} />
                </div>
                <div className="pr-12">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{fornecedor.nome}</h3>
                  <span className="inline-block px-2 py-1 mt-1 bg-gray-100 text-gray-600 text-xs rounded-xl font-medium">
                    {fornecedor.categoria || 'Geral'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2"><Phone size={14} /> {fornecedor.telefone || 'Não informado'}</div>
                <div className="flex items-center gap-2"><FileText size={14} /> {fornecedor.cnpj || 'Sem documento'}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Cadastro */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-dark">{fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
              <button onClick={resetFormulario} className="text-gray-400 hover:text-gray-700"><X size={24} /></button>
            </div>
            
            <form id="form-fornecedor" onSubmit={handleSalvar} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Truck size={16} className="text-brand-main" /> Nome / Razão Social</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none" placeholder="Ex: Ambev S.A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><FileText size={16} className="text-brand-main" /> CNPJ / CPF</label>
                  <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Phone size={16} className="text-brand-main" /> Telefone</label>
                  <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><Tags size={16} className="text-brand-main" /> Categoria</label>
                <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-main outline-none" placeholder="Ex: Bebidas, Descartáveis..." />
              </div>
            </form>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={resetFormulario} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl">Cancelar</button>
              <button type="submit" form="form-fornecedor" disabled={loading} className="px-5 py-2 bg-brand-main hover:bg-brand-dark text-white rounded-xl font-medium flex items-center gap-2">
                <Save size={18} /> {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}