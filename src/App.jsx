import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos'
import PDV from './pages/PDV';
import Fornecedores from './pages/Fornecedores';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* A rota pai é o Layout (Sidebar). As rotas filhas renderizam do lado direito. */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="pdv" element={<PDV />} />
          <Route path="fornecedores" element={<Fornecedores />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;