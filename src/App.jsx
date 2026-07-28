import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* A rota pai é o Layout (Sidebar). As rotas filhas renderizam do lado direito. */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          {/* Você pode adicionar as outras telas aqui depois: */}
          {/* <Route path="pdv" element={<Pdv />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;