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
  ButtonGroup
} from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 

const AIPrediction = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historial, setHistorial] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [modelType, setModelType] = useState(''); 
  

  const [enrollmentData, setEnrollmentData] = useState({
    cantidad_alumnos: '',
    numero_inscripciones: '',
    anio: new Date().getFullYear(),
    descripcion: ''
  });

 
  const [dropoutData, setDropoutData] = useState({
    cantidad_alumnos: '',
    numero_inscripciones: '',
    numero_maestros: '',
    promedio_calificaciones: '',
    es_urbana: true,
    descripcion: ''
  });

  const [predictionResult, setPredictionResult] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchHistorial();
    }
  }, [user]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/predicciones-ia');
      setHistorial(response.data);
    } catch (err) {
      console.error('Error al cargar el historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type) => {
    setModelType(type);
    setShowModal(true);
    setPredictionResult(null);
    setError('');
    setSuccess('');
  };

  const handleSubmitEnrollment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setPredictionResult(null);

    try {
      const response = await axios.post('http://localhost:3000/api/ai/predict/enrollment', {
        cantidad_alumnos: parseFloat(enrollmentData.cantidad_alumnos),
        numero_inscripciones: parseFloat(enrollmentData.numero_inscripciones),
        anio: parseInt(enrollmentData.anio)
      });

      setPredictionResult(response.data);
      setSuccess('Predicción de inscripciones realizada exitosamente');
      
   
      if (user?.role === 'admin') {
        await saveToHistory('enrollment', enrollmentData, response.data);
        fetchHistorial();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al realizar la predicción de inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDropout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setPredictionResult(null);

    try {
      const response = await axios.post('http://localhost:3000/api/ai/predict/dropout', {
        cantidad_alumnos: parseFloat(dropoutData.cantidad_alumnos),
        numero_inscripciones: parseFloat(dropoutData.numero_inscripciones),
        numero_maestros: parseFloat(dropoutData.numero_maestros),
        promedio_calificaciones: parseFloat(dropoutData.promedio_calificaciones),
        es_urbana: dropoutData.es_urbana
      });

      setPredictionResult(response.data);
      setSuccess('Predicción de riesgo de deserción realizada exitosamente');
      
    
      if (user?.role === 'admin') {
        await saveToHistory('dropout', dropoutData, response.data);
        fetchHistorial();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al realizar la predicción de deserción');
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (type, inputData, result) => {
    try {
      await axios.post('http://localhost:3000/api/predicciones-ia', {
        parametrosEntrada: { ...inputData, model_type: type },
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
        await axios.delete(`http://localhost:3000/api/predicciones-ia/${id}`);
        setSuccess('Registro eliminado exitosamente');
        fetchHistorial();
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar el registro');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModelType('');
    setEnrollmentData({
      cantidad_alumnos: '',
      numero_inscripciones: '',
      anio: new Date().getFullYear(),
      descripcion: ''
    });
    setDropoutData({
      cantidad_alumnos: '',
      numero_inscripciones: '',
      numero_maestros: '',
      promedio_calificaciones: '',
      es_urbana: true,
      descripcion: ''
    });
    setPredictionResult(null);
    setError('');
    setSuccess('');
  };

  const handleEnrollmentChange = (e) => {
    const { name, value } = e.target;
    setEnrollmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDropoutChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDropoutData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatEnrollmentResult = (result) => {
  if (!result?.data?.prediction_data) return null;
  
  const { prediction_data } = result.data;
  
 
  if (prediction_data.error) {
    return (
      <Card className="mt-3">
        <Card.Header className="bg-danger text-white">
          <h6 className="mb-0"> Error en Predicción ARIMA</h6>
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
  
  const { predictions, confidence, trend_analysis } = prediction_data;
  
  
  if (!predictions || !trend_analysis) {
    return (
      <Card className="mt-3">
        <Card.Header className="bg-warning text-white">
          <h6 className="mb-0"> Datos Incompletos</h6>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            La predicción se completó pero faltan algunos datos. Por favor, intente nuevamente.
          </Alert>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className="mt-3">
      <Card.Header className="bg-primary text-white">
        <h6 className="mb-0"> Predicción de Inscripciones (ARIMA)</h6>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={6}>
            <strong>Confianza del Modelo:</strong>
            <Badge bg="info" className="ms-2">
              {(confidence * 100).toFixed(2)}%
            </Badge>
          </Col>
          <Col md={6}>
            <strong>Tasa de Crecimiento:</strong>
            <Badge bg={trend_analysis.growth_rate > 0 ? 'success' : 'warning'} className="ms-2">
              {trend_analysis.growth_rate}%
            </Badge>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Card className="mb-2">
              <Card.Header className="bg-light">
                <strong>Próximo Semestre</strong>
              </Card.Header>
              <Card.Body>
                <p className="mb-1">
                  <strong>Estudiantes:</strong> {predictions.next_semester?.cantidad_alumnos || 'N/A'}
                </p>
                <p className="mb-0">
                  <strong>Inscripciones:</strong> {predictions.next_semester?.numero_inscripciones || 'N/A'}
                </p>
                {predictions.next_semester?.confidence_interval && (
                  <small className="text-muted">
                    Rango: {predictions.next_semester.confidence_interval.students_lower} - {predictions.next_semester.confidence_interval.students_upper}
                  </small>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="mb-2">
              <Card.Header className="bg-light">
                <strong>Próximo Año</strong>
              </Card.Header>
              <Card.Body>
                <p className="mb-1">
                  <strong>Estudiantes:</strong> {predictions.next_year?.cantidad_alumnos || 'N/A'}
                </p>
                <p className="mb-0">
                  <strong>Inscripciones:</strong> {predictions.next_year?.numero_inscripciones || 'N/A'}
                </p>
                {predictions.next_year?.confidence_interval && (
                  <small className="text-muted">
                    Rango: {predictions.next_year.confidence_interval.students_lower} - {predictions.next_year.confidence_interval.students_upper}
                  </small>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Alert variant="info" className="mt-3">
          <strong>Análisis de Tendencia:</strong><br />
          El modelo predice un crecimiento del {trend_analysis.growth_rate}% 
          {trend_analysis.seasonal_adjustment !== undefined && 
            ` con ajuste estacional del ${trend_analysis.seasonal_adjustment}%.`
          }
          <br />
          <small className="text-muted">
            Tendencia: {trend_analysis.trend_direction || 'estable'}
          </small>
        </Alert>
      </Card.Body>
    </Card>
  );
};

  const formatDropoutResult = (result) => {
    if (!result?.data?.prediction_data) return null;
    
    const { prediction_data } = result.data;
    const { risk_level, risk_color, risk_score, estimated_dropout_rate, confidence, risk_factors, feature_analysis } = prediction_data;
    
    return (
      <Card className="mt-3">
        <Card.Header className={`bg-${risk_color} text-white`}>
          <h6 className="mb-0">⚠️ Predicción de Riesgo de Deserción</h6>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <strong>Nivel de Riesgo:</strong>
              <Badge bg={risk_color} className="ms-2 fs-6">
                {risk_level}
              </Badge>
            </Col>
            <Col md={4}>
              <strong>Tasa Estimada:</strong>
              <Badge bg="secondary" className="ms-2">
                {estimated_dropout_rate}%
              </Badge>
            </Col>
            <Col md={4}>
              <strong>Confianza:</strong>
              <Badge bg="info" className="ms-2">
                {(confidence * 100).toFixed(2)}%
              </Badge>
            </Col>
          </Row>
          
          {risk_factors.length > 0 && (
            <Row className="mb-3">
              <Col xs={12}>
                <strong>Factores de Riesgo Identificados:</strong>
                <ul className="mt-2">
                  {risk_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </Col>
            </Row>
          )}
          
          <Row>
            <Col xs={12}>
              <strong>Análisis de Características:</strong>
              <div className="mt-2">
                <Row>
                  <Col md={6}>
                    <small>
                      <strong>Ratio Estudiante-Maestro:</strong> {feature_analysis.student_teacher_ratio}
                    </small>
                  </Col>
                  <Col md={6}>
                    <small>
                      <strong>Tasa de Inscripción:</strong> {(feature_analysis.enrollment_rate * 100).toFixed(1)}%
                    </small>
                  </Col>
                </Row>
                <Row className="mt-1">
                  <Col md={6}>
                    <small>
                      <strong>Categoría de Calificaciones:</strong> {feature_analysis.grade_category}
                    </small>
                  </Col>
                  <Col md={6}>
                    <small>
                      <strong>Tamaño de Escuela:</strong> {feature_analysis.school_size_category}
                    </small>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
          
          <Alert variant={risk_color === 'danger' ? 'danger' : risk_color === 'warning' ? 'warning' : 'success'} className="mt-3">
            <strong>Recomendación:</strong><br />
            {risk_level === 'ALTO' && 'Se requiere intervención inmediata. Considere programas de apoyo estudiantil y seguimiento individualizado.'}
            {risk_level === 'MEDIO' && 'Monitoreo requerido. Implemente estrategias preventivas y apoyo académico adicional.'}
            {risk_level === 'BAJO' && 'Situación favorable. Mantenga las prácticas actuales y monitoreo rutinario.'}
          </Alert>
        </Card.Body>
      </Card>
    );
  };

  const getModelTypeFromHistorial = (item) => {
    return item.parametrosEntrada?.model_type || 'legacy';
  };

  const formatHistorialResult = (item) => {
    const modelType = getModelTypeFromHistorial(item);
    const result = item.resultadoPrediccion?.data;
    
    if (!result) return 'N/A';
    
    if (modelType === 'enrollment') {
      const predictions = result.prediction_data?.predictions;
      return predictions ? 
        `Próx. Sem: ${predictions.next_semester?.cantidad_alumnos || 'N/A'} est.` : 
        'N/A';
    } else if (modelType === 'dropout') {
      const riskLevel = result.prediction_data?.risk_level;
      const estimatedRate = result.prediction_data?.estimated_dropout_rate;
      return riskLevel ? 
        `${riskLevel} (${estimatedRate}%)` : 
        'N/A';
    }
    
    return result.prediction || 'N/A';
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>Predicción con Inteligencia Artificial</h2>
          <p className="text-muted">Análisis predictivo basado en datos educativos</p>
        </Col>
        <Col xs="auto">
          <ButtonGroup>
            <Button
              variant="primary"
              onClick={() => handleOpenModal('enrollment')}
            >
              📈 Predicción de Inscripciones
            </Button>
            <Button
              variant="warning"
              onClick={() => handleOpenModal('dropout')}
            >
              ⚠️ Riesgo de Deserción
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

   
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
                      <th>Modelo</th>
                      <th>Descripción</th>
                      <th>Parámetros</th>
                      <th>Resultado</th>
                      <th>Confianza</th>
                      <th>Usuario</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((item) => {
                      const modelType = getModelTypeFromHistorial(item);
                      return (
                        <tr key={item.id}>
                          <td>{new Date(item.creadoEn).toLocaleDateString()}</td>
                          <td>
                            <Badge bg={modelType === 'enrollment' ? 'primary' : modelType === 'dropout' ? 'warning' : 'secondary'}>
                              {modelType === 'enrollment' ? 'Inscripciones' : 
                               modelType === 'dropout' ? 'Deserción' : 'Legacy'}
                            </Badge>
                          </td>
                          <td>{item.parametrosEntrada?.descripcion || 'Sin descripción'}</td>
                          <td>
                            <small>
                              {modelType === 'enrollment' ? 
                                `A:${item.parametrosEntrada?.cantidad_alumnos}, I:${item.parametrosEntrada?.numero_inscripciones}` :
                                modelType === 'dropout' ?
                                `A:${item.parametrosEntrada?.cantidad_alumnos}, M:${item.parametrosEntrada?.numero_maestros}, G:${item.parametrosEntrada?.promedio_calificaciones}` :
                                `A:${item.parametrosEntrada?.cantidadAlumnos || item.parametrosEntrada?.cantidad_alumnos}`
                              }
                            </small>
                          </td>
                          <td>
                            <small>{formatHistorialResult(item)}</small>
                          </td>
                          <td>
                            <Badge bg="info">
                              {item.resultadoPrediccion?.data?.prediction_data?.confidence ? 
                                `${(item.resultadoPrediccion.data.prediction_data.confidence * 100).toFixed(1)}%` :
                                item.resultadoPrediccion?.data?.confidence ? 
                                `${(item.resultadoPrediccion.data.confidence * 100).toFixed(1)}%` : 
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
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Prediction Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modelType === 'enrollment' ? ' Predicción de Inscripciones (ARIMA)' : 
             modelType === 'dropout' ? ' Predicción de Riesgo de Deserción' : 
             'Realizar Predicción IA'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={modelType === 'enrollment' ? handleSubmitEnrollment : handleSubmitDropout}>
          <Modal.Body>
            {modelType === 'enrollment' && (
              <>
                <Alert variant="info">
                  <strong> Modelo ARIMA:</strong><br />
                  Este modelo utiliza análisis de series temporales para predecir el número de estudiantes e inscripciones 
                  en futuros períodos basándose en tendencias históricas.
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cantidad de Alumnos Actual *</Form.Label>
                      <Form.Control
                        type="number"
                        name="cantidad_alumnos"
                        value={enrollmentData.cantidad_alumnos}
                        onChange={handleEnrollmentChange}
                        placeholder="Ej: 250"
                        min="1"
                        required
                      />
                      <Form.Text className="text-muted">
                        Número total de estudiantes actualmente
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Inscripciones Actual *</Form.Label>
                      <Form.Control
                        type="number"
                        name="numero_inscripciones"
                        value={enrollmentData.numero_inscripciones}
                        onChange={handleEnrollmentChange}
                        placeholder="Ej: 230"
                        min="0"
                        required
                      />
                      <Form.Text className="text-muted">
                        Total de inscripciones registradas
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Año de Referencia *</Form.Label>
                      <Form.Control
                        type="number"
                        name="anio"
                        value={enrollmentData.anio}
                        onChange={handleEnrollmentChange}
                        min="2020"
                        max="2030"
                        required
                      />
                      <Form.Text className="text-muted">
                        Año base para la predicción
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descripción (Opcional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="descripcion"
                        value={enrollmentData.descripcion}
                        onChange={handleEnrollmentChange}
                        placeholder="Descripción del contexto..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            {modelType === 'dropout' && (
              <>
                <Alert variant="warning">
                  <strong>⚠️ Modelo de Árbol de Decisión:</strong><br />
                  Este modelo evalúa múltiples factores educativos para determinar el riesgo de deserción 
                  y proporciona recomendaciones específicas.
                </Alert>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cantidad de Alumnos *</Form.Label>
                      <Form.Control
                        type="number"
                        name="cantidad_alumnos"
                        value={dropoutData.cantidad_alumnos}
                        onChange={handleDropoutChange}
                        placeholder="Ej: 180"
                        min="1"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Inscripciones *</Form.Label>
                      <Form.Control
                        type="number"
                        name="numero_inscripciones"
                        value={dropoutData.numero_inscripciones}
                        onChange={handleDropoutChange}
                        placeholder="Ej: 170"
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Maestros *</Form.Label>
                      <Form.Control
                        type="number"
                        name="numero_maestros"
                        value={dropoutData.numero_maestros}
                        onChange={handleDropoutChange}
                        placeholder="Ej: 12"
                        min="1"
                        required
                      />
                      <Form.Text className="text-muted">
                        Total de docentes activos
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Promedio de Calificaciones *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        name="promedio_calificaciones"
                        value={dropoutData.promedio_calificaciones}
                        onChange={handleDropoutChange}
                        placeholder="Ej: 7.8"
                        min="0"
                        max="10"
                        required
                      />
                      <Form.Text className="text-muted">
                        Promedio general de calificaciones (0-10)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="es_urbana"
                        checked={dropoutData.es_urbana}
                        onChange={handleDropoutChange}
                        label="Escuela ubicada en zona urbana"
                      />
                      <Form.Text className="text-muted">
                        Marque si la escuela está en zona urbana (vs. rural)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Descripción (Opcional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="descripcion"
                        value={dropoutData.descripcion}
                        onChange={handleDropoutChange}
                        placeholder="Contexto adicional..."
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            
            {predictionResult && (
              modelType === 'enrollment' ? 
                formatEnrollmentResult(predictionResult) : 
                formatDropoutResult(predictionResult)
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              variant={modelType === 'enrollment' ? 'primary' : 'warning'} 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {modelType === 'enrollment' ? ' Predecir Inscripciones' : ' Evaluar Riesgo'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AIPrediction;