import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axiosConfig';

const DashboardInfraestructura = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInfraestructuras: 0,
    totalEscuelas: 0,
    escuelasUrbanas: 0,
    escuelasRurales: 0,
    escuelasPrioritarias: 0,
    escuelasConElectricidad: 0,
    escuelasConAgua: 0,
    escuelasBuenEstado: 0,
    escuelasMalEstado: 0,
    pedidosMobiliarioPendientes: 0,
    escuelasConRemozamiento: 0
  });
  const [escuelasPrioritarias, setEscuelasPrioritarias] = useState([]);
  const [necesidadesPendientes, setNecesidadesPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch infrastructure data
      const infraResponse = await api.get('/infraestructura-escolar');
      const infraestructuras = Array.isArray(infraResponse.data) ? infraResponse.data : [];
      
      // Fetch schools data
      const escuelasResponse = await api.get('/escuelas');
      const escuelas = Array.isArray(escuelasResponse.data) ? escuelasResponse.data : [];

      // Fetch necesidades mobiliario
      const necesidadesResponse = await api.get('/necesidad-mobiliario');
      const necesidades = Array.isArray(necesidadesResponse.data) ? necesidadesResponse.data : [];

      // Calculate statistics
      const totalInfraestructuras = infraestructuras.length;
      const totalEscuelas = escuelas.length;
      
      // Count by area
      const escuelasUrbanas = infraestructuras.filter(i => i.area === 'Urbana').length;
      const escuelasRurales = infraestructuras.filter(i => i.area === 'Rural').length;
      
      // Count prioritarias
      const escuelasPrioritarias = infraestructuras.filter(i => i.esPrioritario).length;
      
      // Count with services
      const escuelasConElectricidad = infraestructuras.filter(i => i.servicioEnergiaElectrica).length;
      const escuelasConAgua = infraestructuras.filter(i => i.servicioAguaPotable).length;
      
      // Count by building condition
      const escuelasBuenEstado = infraestructuras.filter(i => i.condicionEdificio === 'Bueno').length;
      const escuelasMalEstado = infraestructuras.filter(i => i.condicionEdificio === 'Malo').length;
      
      // Count pending furniture requests
      const pedidosMobiliarioPendientes = necesidades.filter(n => {
        const total = (n.necesidadEscritorios || 0) + 
                     (n.necesidadMesasHexagonales || 0) + 
                     (n.necesidadPizarras || 0) + 
                     (n.necesidadCatedras || 0);
        return total > 0;
      }).length;
      
      // Count schools with remodeling program
      const escuelasConRemozamiento = infraestructuras.filter(i => i.programaDeRemozamiento).length;

      setStats({
        totalInfraestructuras,
        totalEscuelas,
        escuelasUrbanas,
        escuelasRurales,
        escuelasPrioritarias,
        escuelasConElectricidad,
        escuelasConAgua,
        escuelasBuenEstado,
        escuelasMalEstado,
        pedidosMobiliarioPendientes,
        escuelasConRemozamiento
      });

      // Get priority schools
      const prioritarias = infraestructuras
        .filter(i => i.esPrioritario)
        .slice(0, 5);
      setEscuelasPrioritarias(prioritarias);

      // Get pending needs with totals
      const pendientes = necesidades
        .map(n => ({
          ...n,
          total: (n.necesidadEscritorios || 0) + 
                 (n.necesidadMesasHexagonales || 0) + 
                 (n.necesidadPizarras || 0) + 
                 (n.necesidadCatedras || 0)
        }))
        .filter(n => n.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setNecesidadesPendientes(pendientes);

    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
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
          <h2>Dashboard de Infraestructura Escolar</h2>
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

      {/* Main Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-primary">
            <Card.Body className="text-center">
              <div className="text-primary mb-2" style={{ fontSize: '2rem' }}>🏫</div>
              <h4 className="text-primary">{stats.totalEscuelas}</h4>
              <p className="text-muted mb-0">Total Escuelas</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-info">
            <Card.Body className="text-center">
              <div className="text-info mb-2" style={{ fontSize: '2rem' }}>📋</div>
              <h4 className="text-info">{stats.totalInfraestructuras}</h4>
              <p className="text-muted mb-0">Infraestructuras Registradas</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-danger">
            <Card.Body className="text-center">
              <div className="text-danger mb-2" style={{ fontSize: '2rem' }}>⚠️</div>
              <h4 className="text-danger">{stats.escuelasPrioritarias}</h4>
              <p className="text-muted mb-0">Escuelas Prioritarias</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-warning">
            <Card.Body className="text-center">
              <div className="text-warning mb-2" style={{ fontSize: '2rem' }}>📦</div>
              <h4 className="text-warning">{stats.pedidosMobiliarioPendientes}</h4>
              <p className="text-muted mb-0">Pedidos Mobiliario Pendientes</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Distribution Cards */}
      <Row className="mb-4">
        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">📍 Distribución por Área</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Urbanas</span>
                  <strong>{stats.escuelasUrbanas}</strong>
                </div>
                <ProgressBar 
                  now={getPercentage(stats.escuelasUrbanas, stats.totalInfraestructuras)} 
                  variant="primary"
                  label={`${getPercentage(stats.escuelasUrbanas, stats.totalInfraestructuras)}%`}
                />
              </div>
              
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Rurales</span>
                  <strong>{stats.escuelasRurales}</strong>
                </div>
                <ProgressBar 
                  now={getPercentage(stats.escuelasRurales, stats.totalInfraestructuras)} 
                  variant="success"
                  label={`${getPercentage(stats.escuelasRurales, stats.totalInfraestructuras)}%`}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">🔌 Servicios Básicos</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Con Electricidad</span>
                  <strong>{stats.escuelasConElectricidad}</strong>
                </div>
                <ProgressBar 
                  now={getPercentage(stats.escuelasConElectricidad, stats.totalInfraestructuras)} 
                  variant="warning"
                  label={`${getPercentage(stats.escuelasConElectricidad, stats.totalInfraestructuras)}%`}
                />
              </div>
              
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Con Agua Potable</span>
                  <strong>{stats.escuelasConAgua}</strong>
                </div>
                <ProgressBar 
                  now={getPercentage(stats.escuelasConAgua, stats.totalInfraestructuras)} 
                  variant="info"
                  label={`${getPercentage(stats.escuelasConAgua, stats.totalInfraestructuras)}%`}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card className="h-100">
            <Card.Header>
              <h6 className="mb-0">🏗️ Condición del Edificio</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Buen Estado</span>
                  <strong>{stats.escuelasBuenEstado}</strong>
                </div>
                <ProgressBar 
                  now={getPercentage(stats.escuelasBuenEstado, stats.totalInfraestructuras)} 
                  variant="success"
                  label={`${getPercentage(stats.escuelasBuenEstado, stats.totalInfraestructuras)}%`}
                />
              </div>
              
              <div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Mal Estado</span>
                  <strong>{stats.escuelasMalEstado}</strong>
                </div>
                <ProgressBar 
                  now={getPercentage(stats.escuelasMalEstado, stats.totalInfraestructuras)} 
                  variant="danger"
                  label={`${getPercentage(stats.escuelasMalEstado, stats.totalInfraestructuras)}%`}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Information */}
      <Row>
        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">⚠️ Escuelas Prioritarias</h5>
            </Card.Header>
            <Card.Body>
              {escuelasPrioritarias.length === 0 ? (
                <p className="text-muted text-center py-4">No hay escuelas marcadas como prioritarias</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Escuela</th>
                        <th>Área</th>
                        <th>Condición</th>
                        <th>Servicios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escuelasPrioritarias.map((item) => (
                        <tr key={item.idInfraestructura}>
                          <td>{item.escuela?.nombre || 'N/A'}</td>
                          <td>
                            <Badge bg={item.area === 'Urbana' ? 'primary' : 'success'}>
                              {item.area || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={item.condicionEdificio === 'Bueno' ? 'success' : 'danger'}>
                              {item.condicionEdificio || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            {item.servicioEnergiaElectrica && <span className="me-1">⚡</span>}
                            {item.servicioAguaPotable && <span className="me-1">💧</span>}
                            {!item.servicioEnergiaElectrica && !item.servicioAguaPotable && (
                              <Badge bg="secondary">Sin servicios</Badge>
                            )}
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

        <Col lg={6} className="mb-3">
          <Card>
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">📦 Necesidades de Mobiliario Pendientes</h5>
            </Card.Header>
            <Card.Body>
              {necesidadesPendientes.length === 0 ? (
                <p className="text-muted text-center py-4">No hay pedidos pendientes de mobiliario</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Escuela</th>
                        <th>Escritorios</th>
                        <th>Mesas</th>
                        <th>Pizarras</th>
                        <th>Cátedras</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {necesidadesPendientes.map((item) => (
                        <tr key={item.idNecesidad}>
                          <td>{item.escuela?.nombre || 'N/A'}</td>
                          <td>
                            {item.necesidadEscritorios > 0 ? (
                              <Badge bg="warning">{item.necesidadEscritorios}</Badge>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            {item.necesidadMesasHexagonales > 0 ? (
                              <Badge bg="warning">{item.necesidadMesasHexagonales}</Badge>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            {item.necesidadPizarras > 0 ? (
                              <Badge bg="warning">{item.necesidadPizarras}</Badge>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            {item.necesidadCatedras > 0 ? (
                              <Badge bg="warning">{item.necesidadCatedras}</Badge>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            <Badge bg="danger">{item.total}</Badge>
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
      </Row>

      {/* Quick Actions and System Info */}
      <Row>
        <Col lg={8} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">📊 Resumen Adicional</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h3 className="text-info">{stats.escuelasConRemozamiento}</h3>
                    <p className="mb-0 small">Escuelas con Programa de Remozamiento</p>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h3 className="text-success">
                      {getPercentage(stats.escuelasConElectricidad, stats.totalInfraestructuras)}%
                    </h3>
                    <p className="mb-0 small">Cobertura de Electricidad</p>
                  </div>
                </Col>
                <Col md={4} className="mb-3">
                  <div className="text-center p-3 bg-light rounded">
                    <h3 className="text-primary">
                      {getPercentage(stats.escuelasConAgua, stats.totalInfraestructuras)}%
                    </h3>
                    <p className="mb-0 small">Cobertura de Agua Potable</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card>
            <Card.Header>
              <h5 className="mb-0">🚀 Accesos Rápidos</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => window.location.href = '/infraestructura-escolar'}
                >
                  🏗️ Ver Infraestructuras
                </button>
                
                <button 
                  className="btn btn-outline-warning"
                  onClick={() => window.location.href = '/necesidad-mobiliario'}
                >
                  📦 Ver Necesidades Mobiliario
                </button>
                
                <button 
                  className="btn btn-outline-success"
                  onClick={() => window.location.href = '/escuelas'}
                >
                  🏫 Ver Escuelas
                </button>
                
                {user?.role === 'admin' && (
                  <button 
                    className="btn btn-outline-danger"
                    onClick={() => window.location.href = '/reportes'}
                  >
                    📈 Generar Reportes
                  </button>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">ℹ️ Información del Sistema</h5>
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
                    <li>Importar archivos ✅</li>
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

export default DashboardInfraestructura;