import React from 'react'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CreateEnvironmentPage from './pages/CreateEnvironmentPage';
import EnvironmentCreatedPage from './pages/EnvironmentCreatedPage';
import AddUsersPage from './pages/AddusersPage';
import EnvironmentUserListPage from './pages/EnvironmentUserListPage';
import SimulationPage from './pages/SimulationPage'; // ✅ Nova importação
import AdminBackendPage from './pages/AdminBackendPage';
import PreferencesPage from './pages/PreferencesPage';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create" element={<CreateEnvironmentPage />} />
        <Route path="/environment-created" element={<EnvironmentCreatedPage />} />
        <Route path="/add" element={<AddUsersPage />} />
        <Route path="/user-list" element={<EnvironmentUserListPage />} />
        <Route path="/start-simulation" element={<SimulationPage />} /> 
        <Route path="/admin" element={<AdminBackendPage />} />
        <Route path="/preferences" element={<PreferencesPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;