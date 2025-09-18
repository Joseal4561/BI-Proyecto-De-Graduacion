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
  ProgressBar,
  ListGroup
} from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingData, setEditingData] = useState(null);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  
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
      const response = await axios.get('http://localhost:3000/datos-educativos');
      setDatos(response.data);
    } catch (err) {
      setError('Error al cargar los datos educativos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEscuelas = async () => {
    try {
      const response = await axios.get('http://localhost:3000/escuelas');
      setEscuelas(response.data);
    } catch (err) {
      console.error('Error al cargar escuelas:', err);
    }
  };

  // File handling functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setFileData([]);
    setValidationErrors([]);
    setPreviewData([]);
    
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setUploadProgress(10);
    
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv') {
        await processCSV(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        await processExcel(file);
      } else {
        setError('Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
        return;
      }
      
      setUploadProgress(100);
    } catch (error) {
      setError('Error procesando el archivo: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          setUploadProgress(50);
          const processedData = processFileData(results.data);
          setFileData(processedData);
          setPreviewData(processedData.slice(0, 5)); // Show first 5 rows
          setUploadProgress(80);
          resolve(processedData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const processExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          setUploadProgress(30);
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          setUploadProgress(50);
          const processedData = processFileData(jsonData);
          setFileData(processedData);
          setPreviewData(processedData.slice(0, 5)); // Show first 5 rows
          setUploadProgress(80);
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processFileData = (rawData) => {
    const processed = rawData.map((row, index) => {
      // Map column names to match your entity structure
      const mappedRow = {
        escuelaId: findEscuelaId(row.escuela || row.nombre_escuela || row.school || ''),
        anio: parseInt(row.anio || row.año || row.year || new Date().getFullYear()),
        semestre: String(row.semestre || row.semester || '1'),
        cantidadAlumnos: parseInt(row.cantidad_alumnos || row.alumnos || row.students || 0),
        numeroInscripciones: parseInt(row.numero_inscripciones || row.inscripciones || row.enrollments || 0),
        tasaDesercion: parseFloat(row.tasa_desercion || row.desercion || row.dropout_rate || 0),
        tasaPromocion: parseFloat(row.tasa_promocion || row.promocion || row.promotion_rate || null),
        numeroMaestros: parseInt(row.numero_maestros || row.maestros || row.teachers || null),
        promedioCalificaciones: parseFloat(row.promedio_calificaciones || row.promedio || row.average_grade || null),
        esUrbana: parseBoolean(row.es_urbana || row.urbana || row.urban || true),
        rowIndex: index + 1
      };
      
      return mappedRow;
    });
    
    // Validate data
    const errors = validateFileData(processed);
    setValidationErrors(errors);
    
    return processed;
  };

  const findEscuelaId = (escuelaNombre) => {
    const escuela = escuelas.find(e => 
      e.nombre.toLowerCase().includes(escuelaNombre.toLowerCase()) ||
      escuelaNombre.toLowerCase().includes(e.nombre.toLowerCase())
    );
    return escuela ? escuela.id : null;
  };

  const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return ['true', '1', 'sí', 'si', 'yes', 'urbana'].includes(lower);
    }
    return Boolean(value);
  };

  const validateFileData = (data) => {
    const errors = [];
    
    data.forEach((row, index) => {
      if (!row.escuelaId) {
        errors.push(`Fila ${row.rowIndex}: Escuela no encontrada o no especificada`);
      }
      if (!row.anio || row.anio < 2000 || row.anio > 2100) {
        errors.push(`Fila ${row.rowIndex}: Año inválido`);
      }
      if (!['1', '2'].includes(row.semestre)) {
        errors.push(`Fila ${row.rowIndex}: Semestre debe ser 1 o 2`);
      }
      if (row.cantidadAlumnos < 0) {
        errors.push(`Fila ${row.rowIndex}: Cantidad de alumnos no puede ser negativa`);
      }
      if (row.numeroInscripciones < 0) {
        errors.push(`Fila ${row.rowIndex}: Número de inscripciones no puede ser negativo`);
      }
      if (row.tasaDesercion < 0 || row.tasaDesercion > 100) {
        errors.push(`Fila ${row.rowIndex}: Tasa de deserción debe estar entre 0 y 100`);
      }
    });
    
    return errors;
  };

  const handleFileUpload = async () => {
    if (validationErrors.length > 0) {
      setError('Por favor corrija los errores de validación antes de continuar');
      return;
    }

    setIsProcessing(true);
    try {
      // Filter out invalid rows
      const validData = fileData.filter(row => row.escuelaId);
      
      const response = await axios.post('http://localhost:3000/datos-educativos/bulk-upload', {
        data: validData
      });
      
      setSuccess(`Se importaron exitosamente ${response.data.imported} registros`);
      handleCloseUploadModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al importar los datos');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setFileData([]);
    setValidationErrors([]);
    setPreviewData([]);
    setUploadProgress(0);
  };

  // Rest of your existing functions...
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingData) {
        await axios.patch(`http://localhost:3000/datos-educativos/${editingData.id}`, formData);
        setSuccess('Datos actualizados exitosamente');
      } else {
        await axios.post('http://localhost:3000/datos-educativos', formData);
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
        await axios.delete(`http://localhost:3000/datos-educativos/${id}`);
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
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={() => setShowUploadModal(true)}
              >
                📁 Importar Archivo
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowModal(true)}
              >
                ➕ Nuevo Registro
              </Button>
            </div>
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

      {/* File Upload Modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Importar Datos desde Archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Formato requerido:</strong> El archivo debe contener las siguientes columnas:
            <ul className="mb-0 mt-2">
              <li><strong>escuela</strong> - Nombre de la escuela</li>
              <li><strong>anio</strong> - Año (2000-2100)</li>
              <li><strong>semestre</strong> - 1 o 2</li>
              <li><strong>cantidad_alumnos</strong> - Número de alumnos</li>
              <li><strong>numero_inscripciones</strong> - Número de inscripciones</li>
              <li><strong>tasa_desercion</strong> - Tasa de deserción (0-100)</li>
              <li><strong>tasa_promocion</strong> - Tasa de promoción (opcional)</li>
              <li><strong>numero_maestros</strong> - Número de maestros (opcional)</li>
              <li><strong>promedio_calificaciones</strong> - Promedio de calificaciones (opcional)</li>
              <li><strong>es_urbana</strong> - true/false o urbana/rural</li>
            </ul>
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar archivo (CSV o Excel)</Form.Label>
            <Form.Control
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
          </Form.Group>

          {isProcessing && (
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span>Procesando archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar now={uploadProgress} />
            </div>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="warning">
              <strong>Errores de validación encontrados:</strong>
              <ListGroup className="mt-2">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <ListGroup.Item key={index} variant="warning">
                    {error}
                  </ListGroup.Item>
                ))}
                {validationErrors.length > 10 && (
                  <ListGroup.Item variant="warning">
                    ... y {validationErrors.length - 10} errores más
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Alert>
          )}

          {previewData.length > 0 && (
            <div>
              <h6>Vista previa (primeras 5 filas):</h6>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Escuela</th>
                      <th>Año</th>
                      <th>Semestre</th>
                      <th>Alumnos</th>
                      <th>Inscripciones</th>
                      <th>Deserción</th>
                      <th>Promoción</th>
                      <th>Maestros</th>
                      <th>Promedio</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{escuelas.find(e => e.id === row.escuelaId)?.nombre || 'NO ENCONTRADA'}</td>
                        <td>{row.anio}</td>
                        <td>{row.semestre}</td>
                        <td>{row.cantidadAlumnos}</td>
                        <td>{row.numeroInscripciones}</td>
                        <td>{row.tasaDesercion}%</td>
                        <td>{row.tasaPromocion || 'N/A'}</td>
                        <td>{row.numeroMaestros || 'N/A'}</td>
                        <td>{row.promedioCalificaciones || 'N/A'}</td>
                        <td>{row.esUrbana ? 'Urbana' : 'Rural'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {fileData.length > 0 && (
                <Alert variant="info">
                  Se procesaron {fileData.length} filas del archivo.
                  {validationErrors.length === 0 ? 
                    ' Todos los datos son válidos.' : 
                    ` ${validationErrors.length} filas tienen errores.`
                  }
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseUploadModal}>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleFileUpload}
            disabled={!selectedFile || validationErrors.length > 0 || isProcessing}
          >
            {isProcessing ? <Spinner animation="border" size="sm" /> : 'Importar Datos'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Original Manual Entry Modal */}
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