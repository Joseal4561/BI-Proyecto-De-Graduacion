import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Alert, 
  Row, 
  Col, 
  Card,
  Spinner,
  Badge,
  Container,
  ProgressBar
} from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 
import api from '../utils/axiosConfig';

const FurniturePrediction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historial, setHistorial] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  const [formData, setFormData] = useState({
    escuela_id: '',
    periods_ahead: 6,
    descripcion: ''
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchHistorial();
    }
  }, [user]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/predicciones-ia');
      // Filter only furniture predictions
      const furnitureData = response.data.filter(
        item => item.parametrosEntrada?.model_type === 'furniture'
      );
      setHistorial(furnitureData);
    } catch (err) {
      console.error('Error al cargar el historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setPredictionResult(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setPredictionResult(null);

    try {
      const response = await api.post('/api/ai/predict/furniture', {
        escuela_id: parseInt(formData.escuela_id),
        periods_ahead: parseInt(formData.periods_ahead)
      });

      // Response structure: { success: true, data: { status, prediction_data, ... }, model_type, timestamp }
      setPredictionResult(response.data);
      setSuccess('Predicción de necesidades de mobiliario realizada exitosamente');
      
      // Save to history if admin
      if (user?.role === 'admin') {
        await saveToHistory(formData, response.data);
        fetchHistorial();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al realizar la predicción de mobiliario');
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (inputData, result) => {
    try {
      await api.post('/api/predicciones-ia', {
        parametrosEntrada: { ...inputData, model_type: 'furniture' },
        resultadoPrediccion: result,
        usuarioId: user?.id
      });
    } catch (err) {
      console.error('Error al guardar en historial:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await api.delete(`/api/predicciones-ia/${id}`);
        setSuccess('Registro eliminado exitosamente');
        fetchHistorial();
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar el registro');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      escuela_id: '',
      periods_ahead: 6,
      descripcion: ''
    });
    setPredictionResult(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFurnitureLabel = (type) => {
    const labels = {
      'necesidad_catedras': 'Cátedras',
      'necesidad_escritorios': 'Escritorios',
      'necesidad_mesas_exagonales': 'Mesas Hexagonales',
      'necesidad_pizzaras': 'Pizarras'
    };
    return labels[type] || type;
  };

  const formatPredictionResult = (result) => {
    // Controller returns: { success: true, data: { status, prediction_data, ... }, model_type, timestamp }
    // We need to access result.data.prediction_data
    if (!result?.data?.prediction_data) return null;
    
    const { prediction_data } = result.data;
    
    if (prediction_data.error) {
      return (
        <Card className="mt-3">
          <Card.Header className="bg-danger text-white">
            <h6 className="mb-0">❌ Error en Predicción</h6>
          </Card.Header>
          <Card.Body>
            <Alert variant="danger">
              <strong>Error:</strong> {prediction_data.error}
              <br />
              <small>Por favor, verifique que los modelos estén entrenados correctamente.</small>
            </Alert>
          </Card.Body>
        </Card>
      );
    }

    const { predictions_by_furniture_type, overall_confidence, summary } = prediction_data;

    return (
      <div className="mt-3">
        {/* Overall Summary Card */}
        <Card className="mb-3">
          <Card.Header className="bg-primary text-white">
            <h6 className="mb-0">📊 Resumen de Predicción</h6>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <strong>Escuela ID:</strong> {prediction_data.escuela_id}
              </Col>
              <Col md={6}>
                <strong>Períodos Predichos:</strong> {prediction_data.periods_predicted} meses
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <strong>Confianza General:</strong>
                <ProgressBar 
                  now={overall_confidence * 100} 
                  label={`${(overall_confidence * 100).toFixed(1)}%`}
                  variant={overall_confidence > 0.8 ? 'success' : overall_confidence > 0.6 ? 'warning' : 'danger'}
                  className="mt-2"
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Next Month Summary */}
        <Card className="mb-3">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">📅 Próximo Mes</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(summary.next_month || {}).map(([type, value]) => (
                <Col md={6} key={type} className="mb-2">
                  <strong>{getFurnitureLabel(type)}:</strong> {value} unidades
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Detailed Predictions by Furniture Type */}
        {Object.entries(predictions_by_furniture_type).map(([furnitureType, predData]) => {
          if (predData.error) {
            return (
              <Alert key={furnitureType} variant="warning" className="mb-3">
                <strong>{getFurnitureLabel(furnitureType)}:</strong> {predData.error}
              </Alert>
            );
          }

          const { predictions, confidence, trend_analysis, model_info } = predData;

          return (
            <Card key={furnitureType} className="mb-3">
              <Card.Header className="bg-light">
                <Row>
                  <Col md={8}>
                    <h6 className="mb-0">{getFurnitureLabel(furnitureType)}</h6>
                  </Col>
                  <Col md={4} className="text-end">
                    <Badge bg="info">
                      Confianza: {(confidence * 100).toFixed(1)}%
                    </Badge>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                {/* Trend Analysis */}
                <Alert 
                  variant={trend_analysis.growth_rate > 0 ? 'warning' : 'success'} 
                  className="mb-3"
                >
                  <strong>Tendencia:</strong> {trend_analysis.trend_direction === 'increasing' ? '📈 Aumento' : trend_analysis.trend_direction === 'decreasing' ? '📉 Disminución' : '➡️ Estable'}
                  {' '}({trend_analysis.growth_rate > 0 ? '+' : ''}{trend_analysis.growth_rate.toFixed(2)}%)
                  <br />
                  <small>
                    Promedio predicho: {trend_analysis.average_predicted} unidades/mes | 
                    Total: {trend_analysis.total_predicted} unidades
                  </small>
                </Alert>

                {/* Predictions Table */}
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Período</th>
                        <th>Predicción</th>
                        <th>Rango de Confianza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.slice(0, 6).map((pred) => (
                        <tr key={pred.period}>
                          <td>Mes {pred.period}</td>
                          <td><strong>{pred.predicted_value}</strong> unidades</td>
                          <td>
                            <small>
                              {pred.confidence_interval.lower} - {pred.confidence_interval.upper}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Model Info */}
                <div className="mt-2">
                  <small className="text-muted">
                    Modelo ARIMA {model_info.order} | 
                    AIC: {typeof model_info.aic === 'number' ? model_info.aic.toFixed(2) : model_info.aic} | 
                    Promedio histórico: {model_info.historical_avg}
                  </small>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>🪑 Predicción de Necesidades de Mobiliario</h2>
          <p className="text-muted">Predicción basada en ARIMA para planificación de recursos</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleOpenModal}>
            📊 Nueva Predicción
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* History Table */}
      {user?.role === 'admin' && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Historial de Predicciones</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-4">
                <Spinner animation="border" />
                <p className="mt-2">Cargando historial...</p>
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted">No hay predicciones registradas</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Escuela ID</th>
                      <th>Períodos</th>
                      <th>Descripción</th>
                      <th>Confianza</th>
                      <th>Usuario</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.creadoEn).toLocaleDateString()}</td>
                        <td>{item.parametrosEntrada?.escuela_id || 'N/A'}</td>
                        <td>{item.parametrosEntrada?.periods_ahead || 6} meses</td>
                        <td>{item.parametrosEntrada?.descripcion || 'Sin descripción'}</td>
                        <td>
                          <Badge bg="info">
                            {item.resultadoPrediccion?.data?.prediction_data?.overall_confidence ? 
                              `${(item.resultadoPrediccion.data.prediction_data.overall_confidence * 100).toFixed(1)}%` : 
                              'N/A'
                            }
                          </Badge>
                        </td>
                        <td>{item.usuario?.username || 'N/A'}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            🗑️
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Prediction Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>📊 Predicción de Necesidades de Mobiliario</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            
              

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ID de Escuela *</Form.Label>
                  <Form.Control
                    type="number"
                    name="escuela_id"
                    value={formData.escuela_id}
                    onChange={handleChange}
                    placeholder="Ej: 34"
                    min="1"
                    required
                  />
                  <Form.Text className="text-muted">
                    Identificador de la escuela para contexto
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Períodos a Predecir (meses) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="periods_ahead"
                    value={formData.periods_ahead}
                    onChange={handleChange}
                    placeholder="Ej: 6"
                    min="1"
                    max="24"
                    required
                  />
                  <Form.Text className="text-muted">
                    Número de meses futuros (1-24)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Descripción (Opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Contexto adicional sobre la predicción..."
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Results */}
            {predictionResult && formatPredictionResult(predictionResult)}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Procesando...
                </>
              ) : (
                '📊 Generar Predicción'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FurniturePrediction;
