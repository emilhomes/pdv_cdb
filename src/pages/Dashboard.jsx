import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase'; // O caminho para o arquivo que criamos

export default function Dashboard() {

  // Função que envia o dado para o Firebase
  const testarConexao = async () => {
    try {
      // Tenta adicionar um documento na coleção chamada "teste_conexao"
      const docRef = await addDoc(collection(db, "teste_conexao"), {
        mensagem: "Conexão com o Firebase funcionando perfeitamente!",
        data: new Date().toISOString(),
        sistema: "PDV Central das Bebidas"
      });
      
      alert(`Sucesso! Dado salvo com o ID: ${docRef.id}`);
      console.log("Documento escrito com ID: ", docRef.id);
      
    } catch (e) {
      alert("Erro ao conectar! Abra o console (F12) para ver os detalhes.");
      console.error("Erro ao adicionar documento: ", e);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-brand-dark">Dashboard</h1>
      <p className="text-gray-600 mb-8">Visão geral da loja...</p>

      {/* Botão de Teste */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-md">
        <h2 className="text-lg font-medium mb-2">Teste de Banco de Dados</h2>
        <p className="text-sm text-gray-500 mb-4">
          Clique no botão abaixo para verificar se o frontend consegue escrever no Firestore.
        </p>
        <button 
          onClick={testarConexao}
          className="bg-brand-main hover:bg-brand-dark text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Testar Conexão Firebase
        </button>
      </div>
    </div>
  );
}