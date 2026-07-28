import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase'; // Verifique se o caminho está correto para o seu Dashboard.jsx
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, PackageOpen, 
  AlertTriangle, ShoppingCart, Users, Receipt 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

// Cores para o Gráfico de Pizza
const CORES_PAGAMENTO = {
  'Dinheiro': '#10B981', // Verde
  'Pix': '#3B82F6',      // Azul
  'Cartão': '#F59E0B',   // Amarelo
  'Fiado': '#EF4444'     // Vermelho
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Estados dos Dados
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [despesas, setDespesas] = useState([]);

  useEffect(() => {
    // Buscando todos os dados necessários em tempo real
    const unsubVendas = onSnapshot(collection(db, "vendas"), (snap) => setVendas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubProdutos = onSnapshot(collection(db, "produtos"), (snap) => setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubClientes = onSnapshot(collection(db, "clientes"), (snap) => setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDespesas = onSnapshot(collection(db, "contas_pagar"), (snap) => setDespesas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    setLoading(false);
    return () => { unsubVendas(); unsubProdutos(); unsubClientes(); unsubDespesas(); };
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;

  // ==========================================
  // CÁLCULOS DAS MÉTRICAS
  // ==========================================
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Filtros de Vendas
  const vendasHoje = vendas.filter(v => new Date(v.data) >= hoje);
  const vendasOntem = vendas.filter(v => {
    const dataVenda = new Date(v.data);
    return dataVenda >= ontem && dataVenda < hoje;
  });
  const vendasMes = vendas.filter(v => new Date(v.data) >= inicioMes);

  // Totais
  const faturamentoHoje = vendasHoje.reduce((acc, v) => acc + (v.total || 0), 0);
  const faturamentoOntem = vendasOntem.reduce((acc, v) => acc + (v.total || 0), 0);
  const faturamentoMes = vendasMes.reduce((acc, v) => acc + (v.total || 0), 0);
  
  // Ticket Médio (Faturamento do Mês / Número de Vendas)
  const ticketMedio = vendasMes.length > 0 ? (faturamentoMes / vendasMes.length) : 0;

  // Fiado Total (Capital na rua)
  const totalFiado = clientes.reduce((acc, c) => acc + (c.saldoDevedor || 0), 0);

  // Comparativo percentual com ontem
  let crescimentoHoje = 0;
  if (faturamentoOntem > 0) {
    crescimentoHoje = ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100;
  }

  // ==========================================
  // DADOS PARA OS GRÁFICOS
  // ==========================================
  
  // Gráfico 1: Formas de Pagamento (Mês)
  const pagamentosMap = vendasMes.reduce((acc, v) => {
    if (v.tipo === 'pagamento') return acc; // Ignora recebimento de fiado para não duplicar receita de mercadoria
    const forma = v.formaPagamento || 'Outro';
    acc[forma] = (acc[forma] || 0) + v.total;
    return acc;
  }, {});
  const dadosPagamento = Object.keys(pagamentosMap).map(key => ({ nome: key, valor: pagamentosMap[key] }));

  // Gráfico 2: Receita x Despesa (Últimos 6 meses)
  // Lógica simplificada agrupando por mês
  const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dadosFinanceirosMap = {};
  
  // Preenche os últimos 6 meses com 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    dadosFinanceirosMap[`${d.getFullYear()}-${d.getMonth()}`] = { 
      nome: mesesAbreviados[d.getMonth()], Receita: 0, Despesa: 0, ordem: d.getTime() 
    };
  }

  vendas.forEach(v => {
    const d = new Date(v.data);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (dadosFinanceirosMap[key] && v.tipo !== 'pagamento') {
      dadosFinanceirosMap[key].Receita += v.total;
    }
  });

  despesas.forEach(d => {
    if (d.status === 'pago') { // Só contabiliza despesas já pagas
      const dataDesp = new Date(d.dataVencimento);
      const key = `${dataDesp.getFullYear()}-${dataDesp.getMonth()}`;
      if (dadosFinanceirosMap[key]) {
        dadosFinanceirosMap[key].Despesa += d.valor;
      }
    }
  });

  const dadosFinanceiros = Object.values(dadosFinanceirosMap).sort((a, b) => a.ordem - b.ordem);

  // ==========================================
  // LISTAS DE RODAPÉ
  // ==========================================
  
  // Alerta de Estoque
  const estoqueBaixo = produtos.filter(p => p.estoqueAtual <= (p.estoqueMinimo || 5))
                               .sort((a, b) => a.estoqueAtual - b.estoqueAtual)
                               .slice(0, 5); // Pega os 5 piores

  // Mais Vendidos do Mês
  const rankingVendas = {};
  vendasMes.forEach(v => {
    if (v.itens) {
      v.itens.forEach(item => {
        rankingVendas[item.nome] = (rankingVendas[item.nome] || 0) + item.quantidade;
      });
    }
  });
  const maisVendidos = Object.keys(rankingVendas)
    .map(nome => ({ nome, quantidade: rankingVendas[nome] }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5); // Top 5

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Visão Geral</h1>
          <p className="text-gray-600">Acompanhe o desempenho da loja em tempo real.</p>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Faturamento Hoje */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Vendas Hoje</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ {faturamentoHoje.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className={`font-bold ${crescimentoHoje >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {crescimentoHoje > 0 ? '+' : ''}{crescimentoHoje.toFixed(1)}%
            </span>
            <span className="text-gray-500">em relação a ontem</span>
          </div>
        </div>

        {/* Faturamento Mês */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Faturamento (Mês)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ {faturamentoMes.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={24} /></div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Total acumulado no mês atual</p>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Ticket Médio</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">R$ {ticketMedio.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Receipt size={24} /></div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Média gasta por cliente no mês</p>
        </div>

        {/* Total Fiado */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">A Receber (Fiado)</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">R$ {totalFiado.toFixed(2).replace('.', ',')}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Users size={24} /></div>
          </div>
          <p className="mt-4 text-sm text-gray-500">Capital na rua pendente de acerto</p>
        </div>

      </div>

      {/* ÁREA DOS GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico: Receita x Despesa (Ocupa 2 colunas) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 lg:col-span-2">
          <h2 className="text-lg font-bold text-brand-dark mb-6">Receita vs. Despesas (Últimos 6 meses)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFinanceiros} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `R$${value}`} />
                <Tooltip cursor={{fill: '#F3F4F6'}} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Receita" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico: Formas de Pagamento (Ocupa 1 coluna) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h2 className="text-lg font-bold text-brand-dark mb-2">Formas de Pagamento</h2>
          <p className="text-sm text-gray-500 mb-6">Distribuição das vendas no mês</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosPagamento}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {dadosPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PAGAMENTO[entry.nome] || '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                <Legend iconType="circle" verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ÁREA DAS LISTAS (Alerta de Estoque e Mais Vendidos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alerta de Estoque */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <AlertTriangle className="text-orange-500" />
            <h2 className="text-lg font-bold text-brand-dark">Alerta de Estoque</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium text-right">Qtd Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estoqueBaixo.length === 0 ? (
                  <tr><td colSpan="2" className="p-5 text-center text-gray-500">Estoque regular.</td></tr>
                ) : (
                  estoqueBaixo.map(prod => (
                    <tr key={prod.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{prod.nome}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="px-3 py-1 bg-red-100 text-red-600 font-bold rounded-full text-sm">
                          {prod.estoqueAtual} un
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Mais Vendidos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <PackageOpen className="text-brand-main" />
            <h2 className="text-lg font-bold text-brand-dark">Top 5 Mais Vendidos (Mês)</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="px-5 py-3 font-medium">Produto</th>
                  <th className="px-5 py-3 font-medium text-right">Qtd Vendida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maisVendidos.length === 0 ? (
                  <tr><td colSpan="2" className="p-5 text-center text-gray-500">Nenhuma venda registrada neste mês.</td></tr>
                ) : (
                  maisVendidos.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800 flex items-center gap-2">
                        <span className="text-gray-400 font-bold">#{index + 1}</span> {item.nome}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-gray-600">
                        {item.quantidade} un
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}