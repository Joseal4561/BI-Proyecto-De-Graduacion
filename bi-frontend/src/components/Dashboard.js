import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRegistros: 0,
    totalEscuelas: 0,
    promedioAlumnos: 0,
    tasaDesercionPromedio: 0
  });
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch datos educativos
      const datosResponse = await axios.get('http://localhost:3001/datos-educativos');
      const datos = datosResponse.data;
      
      // Fetch escuelas
      const escuelasResponse = await axios.get('http://localhost:3001/escuelas');
      const escuelas = escuelasResponse.data;

      // Calculate statistics
      const totalRegistros = datos.length;
      const totalEscuelas = escuelas.length;
      const promedioAlumnos = datos.length > 0 
        ? Math.round(datos.reduce((sum, item) => sum + item.cantidadAlumnos, 0) / datos.length)
        : 0;
      const tasaDesercionPromedio = datos.length > 0
        ? (datos.reduce((sum, item) => sum + parseFloat(item.tasaDesercion), 0) / datos.length).toFixed(2)
        : 0;

      setStats({
        totalRegistros,
        totalEscuelas,
        promedioAlumnos,
        tasaDesercionPromedio
      });

      // Get recent data (last 5 records)
      setRecentData(datos.slice(0, 5));

    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Dashboard</h2>
          <p className="text-muted">
            Bienvenido, {user?.username} ({user?.role})
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-primary">
            <Card.Body className="text-center">
              <div className="text-primary mb-2" style={{ fontSize: '2rem' }}>📊</div>
              <h4 className="text-primary">{stats.totalRegistros}</h4>
              <p className="text-muted mb-0">Total Registros</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-success">
            <Card.Body className="text-center">
              <div className="text-success mb-2" style={{ fontSize: '2rem' }}>🏫</div>
              <h4 className="text-success">{stats.totalEscuelas}</h4>
              <p className="text-muted mb-0">Total Escuelas</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-info">
            <Card.Body className="text-center">
              <div className="text-info mb-2" style={{ fontSize: '2rem' }}>👥</div>
              <h4 className="text-info">{stats.promedioAlumnos}</h4>
              <p className="text-muted mb-0">Promedio Alumnos</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-warning">
            <Card.Body className="text-center">
              <div className="text-warning mb-2" style={{ fontSize: '2rem' }}>📉</div>
              <h4 className="text-warning">{stats.tasaDesercionPromedio}%</h4>
              <p className="text-muted mb-0">Tasa Deserción Prom.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Data */}
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Registros Recientes</h5>
            </Card.Header>
            <Card.Body>
              {recentData.length === 0 ? (
                <p className="text-muted text-center py-4">No hay registros disponibles</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Escuela</th>
                        <th>Año</th>
                        <th>Semestre</th>
                        <th>Alumnos</th>
                        <th>Tasa Deserción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentData.map((item) => (
                        <tr key={item.id}>
                          <td>{item.escuela?.nombre || 'N/A'}</td>
                          <td>{item.anio}</td>
                          <td>{item.semestre}° Sem</td>
                          <td>{item.cantidadAlumnos}</td>
                          <td>
                            <span className={`badge ${parseFloat(item.tasaDesercion) > 10 ? 'bg-danger' : 'bg-success'}`}>
                              {item.tasaDesercion}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Accesos Rápidos</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => window.location.href = '/datos-educativos'}
                >
                  📚 Ver Datos Educativos
                </button>
                
                <button 
                  className="btn btn-outline-success"
                  onClick={() => window.location.href = '/escuelas'}
                >
                  🏫 Ver Escuelas
                </button>
                
                <button 
                  className="btn btn-outline-info"
                  onClick={() => window.location.href = '/reportes'}
                >
                  📈 Ver Reportes
                </button>
                
                {user?.role === 'admin' && (
                  <button 
                    className="btn btn-outline-warning"
                    onClick={() => window.location.href = '/usuarios'}
                  >
                    👥 Gestionar Usuarios
                  </button>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">Información del Sistema</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-2"><strong>Usuario:</strong> {user?.username}</p>
              <p className="mb-2"><strong>Rol:</strong> {user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
              <p className="mb-2"><strong>Permisos:</strong></p>
              <ul className="mb-0">
                <li>Lectura de datos ✅</li>
                {user?.role === 'admin' && (
                  <>
                    <li>Crear registros ✅</li>
                    <li>Editar registros ✅</li>
                    <li>Eliminar registros ✅</li>
                  </>
                )}
                {user?.role === 'user' && (
                  <>
                    <li>Crear registros ❌</li>
                    <li>Editar registros ❌</li>
                    <li>Eliminar registros ❌</li>
                  </>
                )}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;