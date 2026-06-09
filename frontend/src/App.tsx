import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import NuevosPaciente from './pages/NuevosPaciente';
import DetallePaciente from './pages/DetallePaciente';
import NuevaConsulta from './pages/NuevaConsulta';
import DetalleConsulta from './pages/DetalleConsulta';
import Perfil from './pages/Perfil';
import Agenda from './pages/Agenda';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/nuevo" element={<NuevosPaciente />} />
              <Route path="/pacientes/:id" element={<DetallePaciente />} />
              <Route path="/pacientes/:pacienteId/consultas/nueva" element={<NuevaConsulta />} />
              <Route path="/pacientes/:pacienteId/consultas/:consultaId" element={<DetalleConsulta />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/agenda" element={<Agenda />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
