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
  Badge
} from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const DatosEducativos = () => {
  const { user } = useAuth();
  const [datos, setDatos] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    escuelaId: '',
    anio: new Date().getFullYear(),
    semestre: '1',
    cantidadAlumnos: '',
    numeroInscripciones: '',
    tasaDesercion: '',
    tasaPromocion: '',
    numeroMaestros: '',
    promedioCalificaciones: '',
    esUrbana: true
  });

  useEffect(() => {
    fetchData();
    fetchEscuelas();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/datos-educativos');
      setDatos(response.data);
    } catch (err) {
      setError('Error al cargar los datos educativos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEscuelas = async () => {
    try {
      const response = await axios.get('http://localhost:3001/escuelas');
      setEscuelas(response.data);
    } catch (err) {
      console.error('Error al cargar escuelas:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingData) {
        await axios.patch(`http://localhost:3001/datos-educativos/${editingData.id}`, formData);
        setSuccess('Datos actualizados exitosamente');
      } else {
        await axios.post('http://localhost:3001/datos-educativos', formData);
        setSuccess('Datos creados exitosamente');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los datos');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await axios.delete(`http://localhost:3001/datos-educativos/${id}`);
        setSuccess('Registro eliminado exitosamente');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar el registro');
      }
    }
  };

  const handleEdit = (data) => {
    setEditingData(data);
    setFormData({
      escuelaId: data.escuelaId,
      anio: data.anio,
      semestre: data.semestre,
      cantidadAlumnos: data.cantidadAlumnos,
      numeroInscripciones: data.numeroInscripciones,
      tasaDesercion: data.tasaDesercion,
      tasaPromocion: data.tasaPromocion || '',
      numeroMaestros: data.numeroMaestros || '',
      promedioCalificaciones: data.promedioCalificaciones || '',
      esUrbana: data.esUrbana
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingData(null);
    setFormData({
      escuelaId: '',
      anio: new Date().getFullYear(),
      semestre: '1',
      cantidadAlumnos: '',
      numeroInscripciones: '',
      tasaDesercion: '',
      tasaPromocion: '',
      numeroMaestros: '',
      promedioCalificaciones: '',
      esUrbana: true
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando datos educativos...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Datos Educativos</h2>
          <p className="text-muted">Gestión de información educativa por escuela</p>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
            >
              ➕ Nuevo Registro
            </Button>
          )}
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Lista de Datos Educativos</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {datos.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No hay datos educativos registrados</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Escuela</th>
                    <th>Año</th>
                    <th>Semestre</th>
                    <th>Alumnos</th>
                    <th>Inscripciones</th>
                    <th>Tasa Deserción</th>
                    <th>Tasa Promoción</th>
                    <th>Maestros</th>
                    <th>Promedio</th>
                    <th>Tipo</th>
                    {user?.role === 'admin' && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {datos.map((item) => (
                    <tr key={item.id}>
                      <td>{item.escuela?.nombre || 'N/A'}</td>
                      <td>{item.anio}</td>
                      <td>
                        <Badge bg={item.semestre === '1' ? 'primary' : 'success'}>
                          {item.semestre}° Sem
                        </Badge>
                      </td>
                      <td>{item.cantidadAlumnos}</td>
                      <td>{item.numeroInscripciones}</td>
                      <td>{item.tasaDesercion}%</td>
                      <td>{item.tasaPromocion ? `${item.tasaPromocion}%` : 'N/A'}</td>
                      <td>{item.numeroMaestros || 'N/A'}</td>
                      <td>{item.promedioCalificaciones || 'N/A'}</td>
                      <td>
                        <Badge bg={item.esUrbana ? 'info' : 'secondary'}>
                          {item.esUrbana ? 'Urbana' : 'Rural'}
                        </Badge>
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(item)}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            🗑️
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingData ? 'Editar' : 'Crear'} Datos Educativos
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Escuela *</Form.Label>
                  <Form.Select
                    name="escuelaId"
                    value={formData.escuelaId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione una escuela</option>
                    {escuelas.map(escuela => (
                      <option key={escuela.id} value={escuela.id}>
                        {escuela.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Año *</Form.Label>
                  <Form.Control
                    type="number"
                    name="anio"
                    value={formData.anio}
                    onChange={handleChange}
                    min="2000"
                    max="2100"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Semestre *</Form.Label>
                  <Form.Select
                    name="semestre"
                    value={formData.semestre}
                    onChange={handleChange}
                    required
                  >
                    <option value="1">1° Semestre</option>
                    <option value="2">2° Semestre</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cantidad de Alumnos *</Form.Label>
                  <Form.Control
                    type="number"
                    name="cantidadAlumnos"
                    value={formData.cantidadAlumnos}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Inscripciones *</Form.Label>
                  <Form.Control
                    type="number"
                    name="numeroInscripciones"
                    value={formData.numeroInscripciones}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tasa de Deserción (%) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="tasaDesercion"
                    value={formData.tasaDesercion}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tasa de Promoción (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="tasaPromocion"
                    value={formData.tasaPromocion}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Maestros</Form.Label>
                  <Form.Control
                    type="number"
                    name="numeroMaestros"
                    value={formData.numeroMaestros}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Promedio de Calificaciones</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="promedioCalificaciones"
                    value={formData.promedioCalificaciones}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="esUrbana"
                checked={formData.esUrbana}
                onChange={handleChange}
                label="Escuela Urbana"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingData ? 'Actualizar' : 'Crear'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default DatosEducativos;