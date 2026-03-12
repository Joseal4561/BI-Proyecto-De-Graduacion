import React, { useState, useEffect, useRef } from 'react';
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
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

const Solicitudes = () => {
  const { user } = useAuth();
  const [necesidades, setNecesidades] = useState([]);
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
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    escuelaId: '',
    necesidadEscritorios: 0,
    necesidadMesasHexagonales: 0,
    necesidadPizarras: 0,
    necesidadCatedras: 0,
    fecha_Reporte: '',
    estado: 'pendiente'
  });

  useEffect(() => {
    fetchData();
    fetchEscuelas();
  }, []);

  useEffect(() => {
    if (!loading && necesidades.length > 0 && tableRef.current) {
      // Destroy existing DataTable if it exists
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      // Initialize DataTable
      dataTableRef.current = $(tableRef.current).DataTable({
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
        searching: true,
        language: {
          lengthMenu: "Mostrar _MENU_ registros",
          info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
          infoEmpty: "Mostrando 0 a 0 de 0 registros",
          infoFiltered: "(filtrado de _MAX_ registros totales)",
          paginate: {
            first: "Primero",
            last: "Último",
            next: "Siguiente",
            previous: "Anterior"
          },
          zeroRecords: "No se encontraron registros coincidentes"
        },
        order: [[0, 'asc']],
        columnDefs: [
          { orderable: false, targets: -1 } // Disable ordering on actions column
        ]
      });
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [loading, necesidades]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/necesidad-mobiliario');
      const necesidadesArray = Array.isArray(response.data) ? response.data : [];
      setNecesidades(necesidadesArray);
    } catch (err) {
      setError('Error al cargar las necesidades de mobiliario');
      console.error('Error fetching necesidades:', err);
      setNecesidades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEscuelas = async () => {
    try {
      const response = await api.get('/escuelas');
      const escuelasArray = Array.isArray(response.data) ? response.data : [];
      setEscuelas(escuelasArray);
    } catch (err) {
      console.error('Error al cargar las escuelas:', err);
      setEscuelas([]);
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
        escuelaId: findIdByName(escuelas, row.escuela || row.escuela_nombre || ''),
        necesidadEscritorios: parseInt(row.necesidad_escritorios || row.escritorios || 0) || 0,
        necesidadMesasHexagonales: parseInt(row.necesidad_mesas_hexagonales || row.mesas_hexagonales || 0) || 0,
        necesidadPizarras: parseInt(row.necesidad_pizarras || row.pizarras || 0) || 0,
        necesidadCatedras: parseInt(row.necesidad_catedras || row.catedras || 0) || 0,
        fecha_Reporte: row.fecha_reporte || row.fecha || '',
        estado: row.estado || row.status || 'pendiente',
        rowIndex: index + 2
      };
      return mappedRow;
    });
    
    const errors = validateFileData(processed);
    setValidationErrors(errors);
    
    return processed;
  };

  const findIdByName = (list, name) => {
    if (!name || !Array.isArray(list)) return null;
    
    const item = list.find(item => 
      item.nombre?.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(item.nombre?.toLowerCase())
    );
    return item ? item.id : null;
  };

  const validateFileData = (data) => {
    const errors = [];
    const validEstados = ['pendiente', 'en revision', 'aprobada', 'desaprobada', 'en proceso', 'completada'];
    data.forEach((row) => {
      if (!row.escuelaId) {
        errors.push(`Fila ${row.rowIndex}: Escuela no encontrada o no especificada`);
      }
      
      const numericFields = [
        { key: 'necesidadEscritorios', name: 'Escritorios' },
        { key: 'necesidadMesasHexagonales', name: 'Mesas Hexagonales' },
        { key: 'necesidadPizarras', name: 'Pizarras' },
        { key: 'necesidadCatedras', name: 'Cátedras' }
      ];
      
      numericFields.forEach(field => {
        if (isNaN(row[field.key]) || row[field.key] < 0) {
          errors.push(`Fila ${row.rowIndex}: ${field.name} debe ser un número válido mayor o igual a 0`);
        }
      });

      if (row.estado && !validEstados.includes(row.estado)) {
        errors.push(`Fila ${row.rowIndex}: estado debe ser uno de: ${validEstados.join(', ')}`);
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
      const validData = fileData.filter(row => row.escuelaId);
      
      const response = await api.post('/necesidad-mobiliario/bulk-upload', { data: validData });
      
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
        await api.patch(`/necesidad-mobiliario/${editingData.idNecesidad}`, formData);
        setSuccess('Necesidad de mobiliario actualizada exitosamente');
      } else {
        await api.post('/necesidad-mobiliario', formData);
        setSuccess('Necesidad de mobiliario creada exitosamente');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la necesidad de mobiliario');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await api.delete(`/necesidad-mobiliario/${id}`);
        setSuccess('Registro eliminado exitosamente');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar el registro');
      }
    }
  };

  const handleEdit = (data) => {
    setEditingData(data);
    const rawFecha = data.fechaReporte || data.fecha_reporte || data.fecha_Reporte || data.fecha || '';
    setFormData({
      escuelaId: data.escuela?.id || data.escuelaId || '',
      necesidadEscritorios: data.necesidadEscritorios || 0,
      necesidadMesasHexagonales: data.necesidadMesasHexagonales || 0,
      necesidadPizarras: data.necesidadPizarras || 0,
      necesidadCatedras: data.necesidadCatedras || 0,
      fecha_Reporte: rawFecha ? new Date(rawFecha).toISOString().split('T')[0] : '',
      estado: data.estado || 'pendiente'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingData(null);
    setFormData({
      escuelaId: '',
      necesidadEscritorios: 0,
      necesidadMesasHexagonales: 0,
      necesidadPizarras: 0,
      necesidadCatedras: 0,
      fecha_Reporte: '',
      estado: 'pendiente'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Parse to integer for numeric fields
    if (['escuelaId', 'necesidadEscritorios', 'necesidadMesasHexagonales', 'necesidadPizarras', 'necesidadCatedras'].includes(name)) {
      newValue = value ? parseInt(value, 10) : 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const getTotalNecesidad = (item) => {
    return (item.necesidadEscritorios || 0) + 
           (item.necesidadMesasHexagonales || 0) + 
           (item.necesidadPizarras || 0) + 
           (item.necesidadCatedras || 0);
  };

  const handleExportToExcel = async () => {
  try {
    setLoading(true);
    
    const dataToExport = necesidades.map(necesidad => ({
      'Escuela': necesidad.escuela?.nombre || 'N/A',
      'Escritorios': necesidad.necesidadEscritorios || 0,
      'Mesas Hexagonales': necesidad.necesidadMesasHexagonales || 0,
      'Pizarras': necesidad.necesidadPizarras || 0,
      'Cátedras': necesidad.necesidadCatedras || 0,
      'Total': getTotalNecesidad(necesidad),
      'Fecha Reporte': (necesidad.fechaReporte || necesidad.fecha_reporte || necesidad.fecha_Reporte || necesidad.fecha)
        ? new Date(necesidad.fechaReporte || necesidad.fecha_reporte || necesidad.fecha_Reporte || necesidad.fecha).toLocaleDateString()
        : 'N/A',
      'Estado': necesidad.estado || 'pendiente'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Necesidades Mobiliario');

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
    const filename = `necesidades_mobiliario_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

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
        <p className="mt-2">Cargando necesidades de mobiliario...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Necesidades de Mobiliario</h2>
          <p className="text-muted">Registro de necesidades de mobiliario por escuela</p>
        </Col>
        <Col xs="auto">
          {(user?.role === 'admin' || user?.role === 'user') && (
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
                ➕ Nueva Necesidad
              </Button>
              <Button
                variant="info"
                onClick={handleExportToExcel}
                disabled={necesidades.length === 0}
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
          <h5 className="mb-0">Lista de Necesidades de Mobiliario</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {necesidades.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No hay necesidades de mobiliario registradas</p>
            </div>
          ) : (
            <div className="table-responsive p-3">
              <style>{`
                .table thead th {
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  vertical-align: top;
                  white-space: nowrap;
                  font-size: 0.85rem;
                  padding: 0.5rem;
                }
                .table tbody td {
                  font-size: 0.85rem;
                  padding: 0.5rem;
                  vertical-align: middle;
                }
                .dataTables_wrapper .dataTables_filter {
                  float: right;
                  text-align: right;
                  margin-bottom: 1rem;
                }
                .dataTables_wrapper .dataTables_length {
                  float: left;
                  margin-bottom: 1rem;
                }
                .dataTables_wrapper .dataTables_info {
                  padding-top: 1rem;
                }
                .dataTables_wrapper .dataTables_paginate {
                  padding-top: 1rem;
                }
              `}</style>
              <table ref={tableRef} className="table table-striped table-hover table-sm" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Escuela</th>
                    <th>Escritorios</th>
                    <th>Mesas Hex.</th>
                    <th>Pizarras</th>
                    <th>Cátedras</th>
                    <th>Total</th>
                    <th>Fecha Reporte</th>
                    <th>Estado</th>
                    {(user?.role === 'admin' || user?.role === 'user') && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {necesidades.map((item) => (
                    <tr key={item.idNecesidad}>
                      <td>{item.escuela?.nombre || 'N/A'}</td>
                      <td>
                        <Badge bg={item.necesidadEscritorios > 0 ? 'warning' : 'secondary'}>
                          {item.necesidadEscritorios}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.necesidadMesasHexagonales > 0 ? 'warning' : 'secondary'}>
                          {item.necesidadMesasHexagonales}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.necesidadPizarras > 0 ? 'warning' : 'secondary'}>
                          {item.necesidadPizarras}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={item.necesidadCatedras > 0 ? 'warning' : 'secondary'}>
                          {item.necesidadCatedras}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getTotalNecesidad(item) > 0 ? 'danger' : 'success'}>
                          {getTotalNecesidad(item)}
                        </Badge>
                      </td>
                      <td>{(item.fechaReporte || item.fecha_reporte || item.fecha_Reporte || item.fecha)
                        ? new Date(item.fechaReporte || item.fecha_reporte || item.fecha_Reporte || item.fecha).toLocaleDateString()
                        : 'N/A'}</td>
                      <td>
                        <Badge bg={item.estado === 'pendiente' ? 'secondary' : item.estado === 'en revision' ? 'info' : item.estado === 'aprobada' ? 'success' : item.estado === 'desaprobada' ? 'danger' : item.estado === 'en proceso' ? 'warning' : 'success'}>
                          {item.estado || 'N/A'}
                        </Badge>
                      </td>
                      {(user?.role === 'admin' || user?.role === 'user') && (
                        <td className="text-nowrap">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEdit(item)}
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.idNecesidad)}
                          >
                            🗑️
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* File Upload Modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Importar Necesidades de Mobiliario desde Archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Formato requerido:</strong> El archivo debe contener las siguientes columnas:
            <ul className="mb-0 mt-2">
              <li><strong>escuela</strong> - Nombre de la escuela</li>
              <li><strong>necesidad_escritorios</strong> - Cantidad de escritorios necesarios (número)</li>
              <li><strong>necesidad_mesas_hexagonales</strong> - Cantidad de mesas hexagonales (número)</li>
              <li><strong>necesidad_pizarras</strong> - Cantidad de pizarras (número)</li>
              <li><strong>necesidad_catedras</strong> - Cantidad de cátedras (número)</li>
              <li><strong>fecha_reporte</strong> - Fecha del reporte (opcional)</li>
              <li><strong>estado</strong> - Estado de la solicitud (opcional: pendiente, en revision, aprobada, desaprobada, en proceso, completada)</li>
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
                      <th>Escuela</th>
                      <th>Escritorios</th>
                      <th>Mesas Hex.</th>
                      <th>Pizarras</th>
                      <th>Cátedras</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{escuelas.find(e => e.id === row.escuelaId)?.nombre || 'NO ENCONTRADO'}</td>
                        <td>{row.necesidadEscritorios}</td>
                        <td>{row.necesidadMesasHexagonales}</td>
                        <td>{row.necesidadPizarras}</td>
                        <td>{row.necesidadCatedras}</td>
                        <td>{row.fecha_Reporte || 'N/A'}</td>
                        <td>{row.estado || 'pendiente'}</td>
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
            {editingData ? 'Editar' : 'Crear'} Necesidad de Mobiliario
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Escuela *</Form.Label>
              <Form.Select
                name="escuelaId"
                value={formData.escuelaId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una escuela</option>
                {escuelas.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Necesidad de Escritorios</Form.Label>
                  <Form.Control
                    type="number"
                    name="necesidadEscritorios"
                    value={formData.necesidadEscritorios}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Necesidad de Mesas Hexagonales</Form.Label>
                  <Form.Control
                    type="number"
                    name="necesidadMesasHexagonales"
                    value={formData.necesidadMesasHexagonales}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Necesidad de Pizarras</Form.Label>
                  <Form.Control
                    type="number"
                    name="necesidadPizarras"
                    value={formData.necesidadPizarras}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Necesidad de Cátedras</Form.Label>
                  <Form.Control
                    type="number"
                    name="necesidadCatedras"
                    value={formData.necesidadCatedras}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Reporte</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_Reporte"
                    value={formData.fecha_Reporte}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en revision">En Revisión</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="desaprobada">Desaprobada</option>
                    <option value="en proceso">En Proceso</option>
                    <option value="completada">Completada</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
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

export default Solicitudes;