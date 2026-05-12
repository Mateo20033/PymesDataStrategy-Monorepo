import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login    from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload   from './pages/Upload';
import Chatbot  from './pages/Chatbot';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* Protegidas — requieren JWT */}
        <Route element={<PrivateRoute />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload"    element={<Upload />} />
          <Route path="/chatbot"   element={<Chatbot />} />
        </Route>

        {/* Cualquier ruta desconocida → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
