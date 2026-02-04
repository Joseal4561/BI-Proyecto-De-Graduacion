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
import api from '../utils/axiosConfig';

const SolicitudesFinalizadas = () => {
  const { user } = useAuth();
  const [solicitudesFinalizadas, setSolicitudesFinalizadas] = useState([]);
  const [necesidades, setNecesidades] = useState([]);
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
    necesidad_id: '',
    estado: 'APROBADA',
    escritorios_entregados: 0,
    mesas_hexagonales_entregadas: 0,
    pizarras_entregadas: 0,
    catedras_entregadas: 0,
    fecha_finalizacion: ''
  });

  useEffect(() => {
    fetchData();
    fetchNecesidades();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/solicitud-finalizada');
      const finalizadasArray = Array.isArray(response.data) ? response.data : [];
      setSolicitudesFinalizadas(finalizadasArray);
    } catch (err) {
      setError('Error al cargar las solicitudes finalizadas');
      console.error('Error fetching solicitudes finalizadas:', err);
      setSolicitudesFinalizadas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNecesidades = async () => {
    try {
      const response = await api.get('/necesidad-mobiliario');
      const necesidadesArray = Array.isArray(response.data) ? response.data : [];
      setNecesidades(necesidadesArray);
    } catch (err) {
      console.error('Error al cargar las necesidades:', err);
      setNecesidades([]);
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
        necesidad_id: parseInt(row.necesidad_id || row.id_necesidad || 0) || 0,
        estado: (row.estado || 'APROBADA').toUpperCase(),
        escritorios_entregados: parseInt(row.escritorios_entregados || row.escritorios || 0) || 0,
        mesas_hexagonales_entregadas: parseInt(row.mesas_hexagonales_entregadas || row.mesas_hexagonales || 0) || 0,
        pizarras_entregadas: parseInt(row.pizarras_entregadas || row.pizarras || 0) || 0,
        catedras_entregadas: parseInt(row.catedras_entregadas || row.catedras || 0) || 0,
        fecha_finalizacion: row.fecha_finalizacion || row.fecha || '',
        rowIndex: index + 2
      };
      return mappedRow;
    });
    
    const errors = validateFileData(processed);
    setValidationErrors(errors);
    
    return processed;
  };

  const validateFileData = (data) => {
    const errors = [];
    data.forEach((row) => {
      if (!row.necesidad_id || row.necesidad_id === 0) {
        errors.push(`Fila ${row.rowIndex}: ID de necesidad no especificado o inválido`);
      }
      
      if (!['APROBADA', 'DENEGADA'].includes(row.estado)) {
        errors.push(`Fila ${row.rowIndex}: Estado debe ser "APROBADA" o "DENEGADA"`);
      }
      
      const numericFields = [
        { key: 'escritorios_entregados', name: 'Escritorios Entregados' },
        { key: 'mesas_hexagonales_entregadas', name: 'Mesas Hexagonales Entregadas' },
        { key: 'pizarras_entregadas', name: 'Pizarras Entregadas' },
        { key: 'catedras_entregadas', name: 'Cátedras Entregadas' }
      ];
      
      numericFields.forEach(field => {
        if (isNaN(row[field.key]) || row[field.key] < 0) {
          errors.push(`Fila ${row.rowIndex}: ${field.name} debe ser un número válido mayor o igual a 0`);
        }
      });
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
      const validData = fileData.filter(row => row.necesidad_id > 0);
      
      const response = await api.post('/solicitud-finalizada/bulk-upload', { data: validData });
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingData) {
        await api.patch(`/solicitud-finalizada/${editingData.id_finalizada}`, formData);
        setSuccess('Solicitud finalizada actualizada exitosamente');
      } else {
        await api.post('/solicitud-finalizada', formData);
        setSuccess('Solicitud finalizada creada exitosamente');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la solicitud finalizada');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await api.delete(`/solicitud-finalizada/${id}`);
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
      necesidad_id: data.necesidad_id || '',
      estado: data.estado || 'APROBADA',
      escritorios_entregados: data.escritorios_entregados || 0,
      mesas_hexagonales_entregadas: data.mesas_hexagonales_entregadas || 0,
      pizarras_entregadas: data.pizarras_entregadas || 0,
      catedras_entregadas: data.catedras_entregadas || 0,
      fecha_finalizacion: data.fecha_finalizacion ? new Date(data.fecha_finalizacion).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingData(null);
    setFormData({
      necesidad_id: '',
      estado: 'APROBADA',
      escritorios_entregados: 0,
      mesas_hexagonales_entregadas: 0,
      pizarras_entregadas: 0,
      catedras_entregadas: 0,
      fecha_finalizacion: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Parse to integer for numeric fields
    if (['necesidad_id', 'escritorios_entregados', 'mesas_hexagonales_entregadas', 'pizarras_entregadas', 'catedras_entregadas'].includes(name)) {
      newValue = value ? parseInt(value, 10) : 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const getTotalEntregado = (item) => {
    return (item.escritorios_entregados || 0) + 
           (item.mesas_hexagonales_entregadas || 0) + 
           (item.pizarras_entregadas || 0) + 
           (item.catedras_entregadas || 0);
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      
      const dataToExport = solicitudesFinalizadas.map(solicitud => ({
        'ID Necesidad': solicitud.necesidad_id || 'N/A',
        'Escuela': solicitud.necesidad?.escuela?.nombre || 'N/A',
        'Estado': solicitud.estado || 'N/A',
        'Escritorios Entregados': solicitud.escritorios_entregados || 0,
        'Mesas Hexagonales Entregadas': solicitud.mesas_hexagonales_entregadas || 0,
        'Pizarras Entregadas': solicitud.pizarras_entregadas || 0,
        'Cátedras Entregadas': solicitud.catedras_entregadas || 0,
        'Total Entregado': getTotalEntregado(solicitud),
        'Fecha Finalización': solicitud.fecha_finalizacion 
          ? new Date(solicitud.fecha_finalizacion).toLocaleDateString() 
          : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes Finalizadas');

      const maxWidth = 50;
      const columnWidths = Object.keys(dataToExport[0] || {}).map(key => ({
        wch: Math.min(
          Math.max(
            key.length,
            ...dataToExport.map(row => String(row[key]).length)
          ),
          maxWidth
        )
      }));
      worksheet['!cols'] = columnWidths;

      const now = new Date();
      const filename = `solicitudes_finalizadas_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

      XLSX.writeFile(workbook, filename);
      
      setSuccess('Archivo Excel descargado exitosamente');
    } catch (error) {
      setError('Error al exportar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando solicitudes finalizadas...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Solicitudes Finalizadas</h2>
          <p className="text-muted">Registro de solicitudes aprobadas y denegadas</p>
        </Col>
        <Col xs="auto">
          {user?.role === 'admin' && (
            <div className="d-flex gap-2">
              <Button
                variant="success"
                onClick={() => setShowUploadModal(true)}
              >
                📄 Importar Archivo
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowModal(true)}
              >
                ➕ Nueva Solicitud Finalizada
              </Button>
              <Button
                variant="info"
                onClick={handleExportToExcel}
                disabled={solicitudesFinalizadas.length === 0}
              >
                Exportar a Excel
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Lista de Solicitudes Finalizadas</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {solicitudesFinalizadas.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No hay solicitudes finalizadas registradas</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>ID Necesidad</th>
                    <th>Escuela</th>
                    <th>Estado</th>
                    <th>Escritorios</th>
                    <th>Mesas Hex.</th>
                    <th>Pizarras</th>
                    <th>Cátedras</th>
                    <th>Total</th>
                    <th>Fecha Finalización</th>
                    {user?.role === 'admin' && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFinalizadas.map((item) => (
                    <tr key={item.id_finalizada}>
                      <td>{item.necesidad_id}</td>
                      <td>{item.necesidad?.escuela?.nombre || 'N/A'}</td>
                      <td>
                        <Badge bg={item.estado === 'APROBADA' ? 'success' : 'danger'}>
                          {item.estado}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.escritorios_entregados > 0 ? 'info' : 'secondary'}>
                          {item.escritorios_entregados}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.mesas_hexagonales_entregadas > 0 ? 'info' : 'secondary'}>
                          {item.mesas_hexagonales_entregadas}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.pizarras_entregadas > 0 ? 'info' : 'secondary'}>
                          {item.pizarras_entregadas}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.catedras_entregadas > 0 ? 'info' : 'secondary'}>
                          {item.catedras_entregadas}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getTotalEntregado(item) > 0 ? 'primary' : 'secondary'}>
                          {getTotalEntregado(item)}
                        </Badge>
                      </td>
                      <td>{item.fecha_finalizacion ? new Date(item.fecha_finalizacion).toLocaleDateString() : 'N/A'}</td>
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
                            onClick={() => handleDelete(item.id_finalizada)}
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
          <Modal.Title>Importar Solicitudes Finalizadas desde Archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Formato requerido:</strong> El archivo debe contener las siguientes columnas:
            <ul className="mb-0 mt-2">
              <li><strong>necesidad_id</strong> - ID de la necesidad (número)</li>
              <li><strong>estado</strong> - Estado de la solicitud: "APROBADA" o "DENEGADA"</li>
              <li><strong>escritorios_entregados</strong> - Cantidad de escritorios entregados (número)</li>
              <li><strong>mesas_hexagonales_entregadas</strong> - Cantidad de mesas hexagonales (número)</li>
              <li><strong>pizarras_entregadas</strong> - Cantidad de pizarras (número)</li>
              <li><strong>catedras_entregadas</strong> - Cantidad de cátedras (número)</li>
              <li><strong>fecha_finalizacion</strong> - Fecha de finalización</li>
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
                      <th>ID Necesidad</th>
                      <th>Estado</th>
                      <th>Escritorios</th>
                      <th>Mesas Hex.</th>
                      <th>Pizarras</th>
                      <th>Cátedras</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.necesidad_id}</td>
                        <td>{row.estado}</td>
                        <td>{row.escritorios_entregados}</td>
                        <td>{row.mesas_hexagonales_entregadas}</td>
                        <td>{row.pizarras_entregadas}</td>
                        <td>{row.catedras_entregadas}</td>
                        <td>{row.fecha_finalizacion || 'N/A'}</td>
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

      {/* Manual Entry Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingData ? 'Editar' : 'Crear'} Solicitud Finalizada
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Necesidad de Mobiliario *</Form.Label>
              <Form.Select
                name="necesidad_id"
                value={formData.necesidad_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una necesidad</option>
                {necesidades.map(n => (
                  <option key={n.idNecesidad} value={n.idNecesidad}>
                    {n.escuela?.nombre || `ID: ${n.idNecesidad}`} - {new Date(n.fechaReporte).toLocaleDateString()}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estado *</Form.Label>
              <Form.Select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="APROBADA">APROBADA</option>
                <option value="DENEGADA">DENEGADA</option>
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Escritorios Entregados</Form.Label>
                  <Form.Control
                    type="number"
                    name="escritorios_entregados"
                    value={formData.escritorios_entregados}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mesas Hexagonales Entregadas</Form.Label>
                  <Form.Control
                    type="number"
                    name="mesas_hexagonales_entregadas"
                    value={formData.mesas_hexagonales_entregadas}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pizarras Entregadas</Form.Label>
                  <Form.Control
                    type="number"
                    name="pizarras_entregadas"
                    value={formData.pizarras_entregadas}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cátedras Entregadas</Form.Label>
                  <Form.Control
                    type="number"
                    name="catedras_entregadas"
                    value={formData.catedras_entregadas}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Fecha de Finalización *</Form.Label>
              <Form.Control
                type="date"
                name="fecha_finalizacion"
                value={formData.fecha_finalizacion}
                onChange={handleChange}
                required
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

export default SolicitudesFinalizadas;