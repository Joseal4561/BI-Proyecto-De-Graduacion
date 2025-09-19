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

const Escuelas = () => {
  const { user } = useAuth();
  const [escuelas, setEscuelas] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [tiposEscuela, setTiposEscuela] = useState([]);
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
    nombre: '',
    direccion: '',
    telefono: '',
    fecha_Fundacion: '',
    municipioId: '',
    tipoId: ''
  });

  useEffect(() => {
    fetchData();
    fetchRelationships();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/escuelas');
      setEscuelas(response.data);
    } catch (err) {
      setError('Error al cargar las escuelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      const municipiosResponse = await axios.get('http://localhost:3000/municipios');
      setMunicipios(municipiosResponse.data);
      const tiposEscuelaResponse = await axios.get('http://localhost:3000/tipos-escuelas');
      setTiposEscuela(tiposEscuelaResponse.data);
    } catch (err) {
      console.error('Error al cargar las relaciones:', err);
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
          setPreviewData(processedData.slice(0, 5));
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
          setPreviewData(processedData.slice(0, 5));
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
      const mappedRow = {
        nombre: row.nombre || row.name,
        direccion: row.direccion || row.address || '',
        telefono: row.telefono || row.phone || '',
        fecha_Fundacion: row.fecha_Fundacion || row.foundation_date || '',
        municipioId: findIdByName(municipios, row.municipio || row.municipio_nombre),
        tipoId: findIdByName(tiposEscuela, row.tipo || row.tipo_nombre),
        rowIndex: index + 1
      };
      return mappedRow;
    });
    
    const errors = validateFileData(processed);
    setValidationErrors(errors);
    
    return processed;
  };

  const findIdByName = (list, name) => {
    const item = list.find(item => 
      item.nombre.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(item.nombre.toLowerCase())
    );
    return item ? item.id : null;
  };

  const validateFileData = (data) => {
    const errors = [];
    data.forEach((row) => {
      if (!row.nombre) {
        errors.push(`Fila ${row.rowIndex}: Nombre es obligatorio`);
      }
      if (!row.municipioId) {
        errors.push(`Fila ${row.rowIndex}: Municipio no encontrado o no especificado`);
      }
      if (!row.tipoId) {
        errors.push(`Fila ${row.rowIndex}: Tipo de escuela no encontrado o no especificado`);
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
      const validData = fileData.filter(row => row.nombre && row.municipioId && row.tipoId);
      
      const response = await axios.post('http://localhost:3000/escuelas/bulk-upload', { data: validData });
      
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

  // Rest of your existing functions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingData) {
        await axios.patch(`http://localhost:3000/escuelas/${editingData.id}`, formData);
        setSuccess('Escuela actualizada exitosamente');
      } else {
        await axios.post('http://localhost:3000/escuelas', formData);
        setSuccess('Escuela creada exitosamente');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la escuela');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await axios.delete(`http://localhost:3000/escuelas/${id}`);
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
      nombre: data.nombre,
      direccion: data.direccion || '',
      telefono: data.telefono || '',
      fecha_Fundacion: data.fecha_Fundacion ? new Date(data.fecha_Fundacion).toISOString().split('T')[0] : '',
      municipioId: data.municipio.id,
      tipoId: data.tipo.id
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingData(null);
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      fecha_Fundacion: '',
      municipioId: '',
      tipoId: ''
    });
  };

const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;


    if (name === 'municipioId' || name === 'tipoId') {
      newValue = parseInt(value, 10);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando escuelas...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Escuelas</h2>
          <p className="text-muted">Gestión de información de escuelas</p>
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
                ➕ Nueva Escuela
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Lista de Escuelas</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {escuelas.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No hay escuelas registradas</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>Municipio</th>
                    <th>Tipo</th>
                    <th>Fundada</th>
                    {user?.role === 'admin' && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {escuelas.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
                      <td>{item.direccion || 'N/A'}</td>
                      <td>{item.municipio?.nombre || 'N/A'}</td>
                      <td>{item.tipo?.nombre || 'N/A'}</td>
                      <td>{item.fecha_Fundacion ? new Date(item.fecha_Fundacion).toLocaleDateString() : 'N/A'}</td>
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
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Importar Escuelas desde Archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Formato requerido:</strong> El archivo debe contener las siguientes columnas:
            <ul className="mb-0 mt-2">
              <li><strong>nombre</strong> - Nombre de la escuela</li>
              <li><strong>direccion</strong> - Dirección (opcional)</li>
              <li><strong>telefono</strong> - Teléfono (opcional)</li>
              <li><strong>fecha_Fundacion</strong> - Fecha de fundación (opcional)</li>
              <li><strong>municipio</strong> - Nombre del municipio</li>
              <li><strong>tipo</strong> - Nombre del tipo de escuela</li>
            </ul>
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar archivo (CSV o Excel)</Form.Label>
            <Form.Control type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} />
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
                      <th>Nombre</th>
                      <th>Dirección</th>
                      <th>Teléfono</th>
                      <th>Fundación</th>
                      <th>Municipio</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.nombre}</td>
                        <td>{row.direccion || 'N/A'}</td>
                        <td>{row.telefono || 'N/A'}</td>
                        <td>{row.fecha_Fundacion || 'N/A'}</td>
                        <td>{municipios.find(m => m.id === row.municipioId)?.nombre || 'NO ENCONTRADO'}</td>
                        <td>{tiposEscuela.find(t => t.id === row.tipoId)?.nombre || 'NO ENCONTRADO'}</td>
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
            {editingData ? 'Editar' : 'Crear'} Escuela
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Fundación</Form.Label>
              <Form.Control
                type="date"
                name="fecha_Fundacion"
                value={formData.fecha_Fundacion}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Municipio *</Form.Label>
              <Form.Select
                name="municipioId"
                value={formData.municipioId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un municipio</option>
                {municipios.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Escuela *</Form.Label>
              <Form.Select
                name="tipoId"
                value={formData.tipoId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un tipo</option>
                {tiposEscuela.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Form.Select>
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

export default Escuelas;