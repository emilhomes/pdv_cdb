import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
  FileText, Download, Calendar, 
  BarChart3, Search
} from 'lucide-react';

export default function Relatorios() {
  const hoje = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(hoje);
  const [tipoRelatorio, setTipoRelatorio] = useState('caixa'); // caixa, fiado, abc, fluxo
  
  const [dados, setDados] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // BUSCA E PROCESSAMENTO DOS DADOS
  // ==========================================
  const gerarRelatorio = async () => {
    setLoading(true);
    setDados([]);
    setResumo(null);

    try {
      if (tipoRelatorio === 'caixa') {
        const q = query(
          collection(db, "vendas"),
          where("data", ">=", dataInicio + "T00:00:00"),
          where("data", "<=", dataFim + "T23:59:59")
        );
        const snapshot = await getDocs(q);
        
        const pagamentos = {};
        let totalGeral = 0;

        snapshot.docs.forEach(doc => {
          const v = doc.data();
          const forma = v.formaPagamento || 'Outro';
          pagamentos[forma] = (pagamentos[forma] || 0) + (v.total || 0);
          totalGeral += (v.total || 0);
        });

        const listaFormatada = Object.keys(pagamentos).map(forma => ({
          forma,
          total: pagamentos[forma]
        }));

        setDados(listaFormatada);
        setResumo({ total: totalGeral });
      } 
      
      else if (tipoRelatorio === 'fiado') {
        const q = query(collection(db, "clientes"), where("saldoDevedor", ">", 0));
        const snapshot = await getDocs(q);
        
        let totalFiado = 0;
        const clientesDevedores = snapshot.docs.map(doc => {
          const c = doc.data();
          const divida = c.saldoDevedor || 0;
          totalFiado += divida;
          return { nome: c.nome, telefone: c.telefone || 'Sem telefone', divida: divida };
        }).sort((a, b) => b.divida - a.divida); 

        setDados(clientesDevedores);
        setResumo({ total: totalFiado });
      }

      else if (tipoRelatorio === 'abc') {
        const q = query(
          collection(db, "vendas"),
          where("data", ">=", dataInicio + "T00:00:00"),
          where("data", "<=", dataFim + "T23:59:59")
        );
        const snapshot = await getDocs(q);
        
        const produtosGiro = {};
        snapshot.docs.forEach(doc => {
          const v = doc.data();
          if (v.itens) {
            v.itens.forEach(item => {
              if (!produtosGiro[item.nome]) {
                produtosGiro[item.nome] = { qtd: 0, receita: 0 };
              }
              produtosGiro[item.nome].qtd += (item.quantidade || 0);
              produtosGiro[item.nome].receita += (item.subtotal || 0);
            });
          }
        });

        const listaABC = Object.keys(produtosGiro).map(nome => ({
          nome,
          qtd: produtosGiro[nome].qtd,
          receita: produtosGiro[nome].receita
        })).sort((a, b) => b.receita - a.receita);

        setDados(listaABC);
      }

      else if (tipoRelatorio === 'fluxo') {
        // Busca Vendas (Entradas)
        const qVendas = query(collection(db, "vendas"), where("data", ">=", dataInicio + "T00:00:00"), where("data", "<=", dataFim + "T23:59:59"));
        const snapVendas = await getDocs(qVendas);
        let entradas = 0;
        snapVendas.docs.forEach(doc => entradas += (doc.data().total || 0));

        // Busca Despesas Pagas (Saídas)
        const qDespesas = query(collection(db, "contas_pagar"), where("status", "==", "pago"));
        const snapDespesas = await getDocs(qDespesas);
        let saidas = 0;
        snapDespesas.docs.forEach(doc => {
          const d = doc.data();
          if (d.dataVencimento >= dataInicio && d.dataVencimento <= dataFim) {
            saidas += (d.valor || 0);
          }
        });

        setDados([{ categoria: 'Entradas (Vendas e Recebimentos)', valor: entradas }, { categoria: 'Saídas (Despesas Pagas)', valor: saidas }]);
        setResumo({ saldo: entradas - saidas });
      }

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Ocorreu um erro ao buscar os dados.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EXPORTAÇÃO PARA PDF COM PROTEÇÃO DE UNDEFINED
  // ==========================================
  const exportarParaPDF = () => {
    if (dados.length === 0) return alert("Gere o relatório primeiro antes de exportar.");

    const doc = new jsPDF();
    
    // Cabeçalho do PDF
    doc.setFontSize(20);
    doc.text("Central das Bebidas", 14, 20);
    doc.setFontSize(12);
    doc.text(`Relatório: ${formatarNomeRelatorio(tipoRelatorio)}`, 14, 30);
    doc.text(`Período: ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}`, 14, 38);
    
    // Gerando a tabela baseada no tipo de relatório
    if (tipoRelatorio === 'caixa') {
      doc.autoTable({
        startY: 45,
        head: [['Forma de Pagamento', 'Total Arrecadado']],
        body: dados.map(d => [d.forma, `R$ ${(d.total || 0).toFixed(2).replace('.', ',')}`]),
        foot: [['TOTAL GERAL', `R$ ${(resumo?.total || 0).toFixed(2).replace('.', ',')}`]]
      });
    } 
    else if (tipoRelatorio === 'fiado') {
      doc.autoTable({
        startY: 45,
        head: [['Cliente', 'Telefone', 'Saldo Devedor']],
        body: dados.map(d => [d.nome, d.telefone, `R$ ${(d.divida || 0).toFixed(2).replace('.', ',')}`]),
        foot: [['TOTAL NA RUA', '', `R$ ${(resumo?.total || 0).toFixed(2).replace('.', ',')}`]]
      });
    }
    else if (tipoRelatorio === 'abc') {
      doc.autoTable({
        startY: 45,
        head: [['Produto', 'Qtd. Vendida', 'Receita Total']],
        body: dados.map(d => [d.nome, `${d.qtd} un`, `R$ ${(d.receita || 0).toFixed(2).replace('.', ',')}`]),
      });
    }
    else if (tipoRelatorio === 'fluxo') {
      doc.autoTable({
        startY: 45,
        head: [['Categoria', 'Valor']],
        body: dados.map(d => [d.categoria, `R$ ${(d.valor || 0).toFixed(2).replace('.', ',')}`]),
        foot: [['SALDO DO PERÍODO', `R$ ${(resumo?.saldo || 0).toFixed(2).replace('.', ',')}`]]
      });
    }

    doc.save(`Relatorio_${tipoRelatorio}_${dataInicio}.pdf`);
  };

  const formatarNomeRelatorio = (tipo) => {
    const nomes = {
      caixa: "Fechamento de Caixa",
      fiado: "Extrato de Inadimplência (Fiados)",
      abc: "Curva ABC (Produtos mais rentáveis)",
      fluxo: "Fluxo de Caixa (Entradas x Saídas)"
    };
    return nomes[tipo];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho da Tela */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Relatórios Gerenciais</h1>
        <p className="text-gray-600">Extraia análises detalhadas e exporte em PDF.</p>
      </div>

      {/* PAINEL DE CONTROLE (Filtros) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <FileText size={16} /> Tipo de Relatório
            </label>
            <select 
              value={tipoRelatorio} 
              onChange={(e) => setTipoRelatorio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none bg-gray-50"
            >
              <option value="caixa">Fechamento de Caixa (Por Pagamento)</option>
              <option value="fiado">Extrato de Fiado (Devedores)</option>
              <option value="abc">Curva ABC (Giro de Produtos)</option>
              <option value="fluxo">Fluxo de Caixa Mensal (Entradas x Saídas)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Calendar size={16} /> Data Inicial
            </label>
            <input 
              type="date" 
              value={dataInicio} 
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Calendar size={16} /> Data Final
            </label>
            <input 
              type="date" 
              value={dataFim} 
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-main outline-none bg-gray-50"
            />
          </div>

        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-6">
          <button 
            onClick={gerarRelatorio}
            disabled={loading}
            className="flex items-center gap-2 bg-brand-main hover:bg-brand-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <Search size={20} /> {loading ? 'Buscando...' : 'Gerar Prévia'}
          </button>
          
          <button 
            onClick={exportarParaPDF}
            disabled={dados.length === 0}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm"
          >
            <Download size={20} /> Baixar PDF
          </button>
        </div>
      </div>

      {/* ÁREA DE PRÉVIA DO RELATÓRIO COM PROTEÇÃO DE UNDEFINED */}
      {dados.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <BarChart3 size={20} /> Prévia: {formatarNomeRelatorio(tipoRelatorio)}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-200">
                <tr>
                  {tipoRelatorio === 'caixa' && <><th className="px-6 py-4">Forma de Pagamento</th><th className="px-6 py-4 text-right">Total</th></>}
                  {tipoRelatorio === 'fiado' && <><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Telefone</th><th className="px-6 py-4 text-right">Dívida</th></>}
                  {tipoRelatorio === 'abc' && <><th className="px-6 py-4">Produto</th><th className="px-6 py-4 text-center">Quantidade</th><th className="px-6 py-4 text-right">Receita Bruta</th></>}
                  {tipoRelatorio === 'fluxo' && <><th className="px-6 py-4">Movimentação</th><th className="px-6 py-4 text-right">Valor</th></>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dados.map((linha, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {tipoRelatorio === 'caixa' && <><td className="px-6 py-4 font-medium">{linha.forma}</td><td className="px-6 py-4 text-right font-bold text-green-600">R$ {(linha.total || 0).toFixed(2).replace('.', ',')}</td></>}
                    {tipoRelatorio === 'fiado' && <><td className="px-6 py-4 font-medium">{linha.nome}</td><td className="px-6 py-4 text-gray-500">{linha.telefone}</td><td className="px-6 py-4 text-right font-bold text-red-500">R$ {(linha.divida || 0).toFixed(2).replace('.', ',')}</td></>}
                    {tipoRelatorio === 'abc' && <><td className="px-6 py-4 font-medium">{linha.nome}</td><td className="px-6 py-4 text-center text-gray-600">{linha.qtd} un</td><td className="px-6 py-4 text-right font-bold text-green-600">R$ {(linha.receita || 0).toFixed(2).replace('.', ',')}</td></>}
                    {tipoRelatorio === 'fluxo' && <><td className="px-6 py-4 font-medium">{linha.categoria}</td><td className={`px-6 py-4 text-right font-bold ${linha.categoria.includes('Entradas') ? 'text-green-600' : 'text-red-500'}`}>R$ {(linha.valor || 0).toFixed(2).replace('.', ',')}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapés de Resumo (Totais) COM PROTEÇÃO DE UNDEFINED */}
          {resumo && (
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end">
              <div className="text-right">
                {tipoRelatorio === 'caixa' && <><p className="text-sm text-gray-500 uppercase font-bold">Total Arrecadado</p><p className="text-2xl font-bold text-green-600">R$ {(resumo.total || 0).toFixed(2).replace('.', ',')}</p></>}
                {tipoRelatorio === 'fiado' && <><p className="text-sm text-gray-500 uppercase font-bold">Total a Receber (Rua)</p><p className="text-2xl font-bold text-red-600">R$ {(resumo.total || 0).toFixed(2).replace('.', ',')}</p></>}
                {tipoRelatorio === 'fluxo' && <><p className="text-sm text-gray-500 uppercase font-bold">Saldo do Período</p><p className={`text-2xl font-bold ${(resumo.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {(resumo.saldo || 0).toFixed(2).replace('.', ',')}</p></>}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}