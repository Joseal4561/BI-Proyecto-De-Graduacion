import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DatosEducativos from './components/DatosEducativos';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Placeholder components for routes not yet implemented
const Escuelas = () => (
  <div>
    <h2>Escuelas</h2>
    <div className="alert alert-info">
      <h4>🚧 En Desarrollo</h4>
      <p>Esta sección estará disponible en la siguiente fase del proyecto.</p>
      <p>Aquí podrás gestionar las escuelas del sistema.</p>
    </div>
  </div>
);

const Reportes = () => (
  <div>
    <h2>Reportes</h2>
    <div className="alert alert-info">
      <h4>🚧 En Desarrollo</h4>
      <p>Esta sección estará disponible en la siguiente fase del proyecto.</p>
      <p>Aquí podrás generar reportes y visualizar gráficos de los datos educativos.</p>
    </div>
  </div>
);

const Usuarios = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return (
      <div className="alert alert-danger">
        <h4>Acceso Denegado</h4>
        <p>No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2>Usuarios</h2>
      <div className="alert alert-info">
        <h4>🚧 En Desarrollo</h4>
        <p>Esta sección estará disponible en la siguiente fase del proyecto.</p>
        <p>Aquí podrás gestionar los usuarios del sistema.</p>
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/datos-educativos" 
        element={
          <ProtectedRoute>
            <Layout>
              <DatosEducativos />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/escuelas" 
        element={
          <ProtectedRoute>
            <Layout>
              <Escuelas />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/reportes" 
        element={
          <ProtectedRoute>
            <Layout>
              <Reportes />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/usuarios" 
        element={
          <ProtectedRoute>
            <Layout>
              <Usuarios />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-5">
                <h2>404 - Página no encontrada</h2>
                <p>La página que buscas no existe.</p>
              </div>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;