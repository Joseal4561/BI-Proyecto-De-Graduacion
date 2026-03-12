// file: Users.js
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
  ProgressBar,
  ListGroup,
  Badge
} from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axiosConfig';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

// Definición de Rangos
const RANKS = ['Director', 'Coordinador', 'Administrador'];

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [userRanks, setUserRanks] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [municipios, setMunicipios] = useState([]);
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
  
  // Form state for User Core Data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Form state for User Rank Data
  const [rankFormData, setRankFormData] = useState({
    userRankId: null,
    rank: '',
    escuelaId: '',
    municipioId: '',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      Promise.all([
        fetchData(), 
        fetchEscuelasAndMunicipios(),
        fetchUserRanks()
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('Acceso denegado. Solo los administradores pueden gestionar usuarios.');
    }
  }, [user]);

  useEffect(() => {
    if (!loading && users.length > 0 && tableRef.current) {
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
  }, [loading, users]);
  
  const fetchEscuelasAndMunicipios = async () => {
    try {
      const [escuelasRes, municipiosRes] = await Promise.all([
        api.get('/escuelas'),
        api.get('/municipios')
      ]);

      setEscuelas(Array.isArray(escuelasRes.data) ? escuelasRes.data : []);
      setMunicipios(Array.isArray(municipiosRes.data) ? municipiosRes.data : []);
    } catch (err) {
      setError('Error al cargar Escuelas o Municipios para la asignación de rangos.');
      console.error('Error fetching support data:', err);
    }
  };

  const fetchUserRanks = async () => {
    try {
      const response = await api.get('/user-ranks');
      setUserRanks(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching user ranks:', err);
      setUserRanks([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, ranksResponse] = await Promise.all([
        api.get('/users'),
        api.get('/user-ranks')
      ]);

      const usersArray = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const ranksArray = Array.isArray(ranksResponse.data) ? ranksResponse.data : [];

      const usersWithRanks = usersArray.map(u => {
        const rankData = ranksArray.find(r => r.userId === u.id);
        return {
          ...u,
          rankData: rankData || null 
        };
      });

      setUsers(usersWithRanks);
      setUserRanks(ranksArray);
    } catch (err) {
      setError('Error al cargar los usuarios o sus rangos');
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (data) => {
    setEditingData(data);
    
    setFormData({
      username: data.username,
      email: data.email,
      role: data.role,
      password: ''
    });

    if (data.rankData) {
      setRankFormData({
        userRankId: data.rankData.id,
        rank: data.rankData.rank || '',
        escuelaId: data.rankData.escuelaId || '',
        municipioId: data.rankData.municipioId || '',
      });
    } else {
      setRankFormData({
        userRankId: null,
        rank: '',
        escuelaId: '',
        municipioId: '',
      });
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingData(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setRankFormData({
      userRankId: null,
      rank: '',
      escuelaId: '',
      municipioId: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRankChange = (e) => {
    const { name, value } = e.target;
    let newRankData = { ...rankFormData, [name]: value };

    if (name === 'rank') {
      newRankData.escuelaId = '';
      newRankData.municipioId = '';
    }
    
    setRankFormData(newRankData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Prepare User Core Payload
    const userPayload = { ...formData };
    if (editingData && !userPayload.password) {
      delete userPayload.password;
    }

    try {
      let userId = editingData?.id;
      
      // 1. Create or Update User Core Data
      if (editingData) {
        await api.patch(`/users/${userId}`, userPayload);
      } else {
        const response = await api.post('/users', userPayload);
        userId = response.data.id;
      }

      // 2. Handle Rank Assignment
      const { userRankId, rank, escuelaId, municipioId } = rankFormData;
      
      // Only proceed with rank operations if a rank is selected
      if (rank && rank.trim() !== '') {
        // Prepare rank payload with proper null handling
        const rankPayload = {
          userId: userId,
          rank: rank,
          escuelaId: rank === 'Director' && escuelaId ? parseInt(escuelaId) : undefined,
          municipioId: rank === 'Coordinador' && municipioId ? parseInt(municipioId) : undefined,
        };

        // Remove undefined fields
        Object.keys(rankPayload).forEach(key => {
          if (rankPayload[key] === undefined) {
            delete rankPayload[key];
          }
        });

        if (userRankId) {
          // UPDATE existing rank
          await api.patch(`/user-ranks/${userRankId}`, rankPayload);
          setSuccess(editingData 
            ? 'Usuario y Rango actualizados exitosamente.' 
            : 'Usuario creado y Rango asignado exitosamente.');
        } else {
          // CREATE new rank
          await api.post('/user-ranks', rankPayload);
          setSuccess(editingData 
            ? 'Usuario actualizado y Rango asignado exitosamente.' 
            : 'Usuario creado y Rango asignado exitosamente.');
        }
      } else if (userRankId) {
        // If rank is cleared but an old rank exists, DELETE the rank assignment
        await api.delete(`/user-ranks/${userRankId}`);
        setSuccess('Usuario actualizado y Rango removido exitosamente.');
      } else {
        // No rank to assign and no existing rank
        setSuccess(editingData 
          ? 'Usuario actualizado exitosamente.' 
          : 'Usuario creado exitosamente (sin rango asignado).');
      }

      handleCloseModal();
      await fetchData();

    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'Error al guardar el usuario o asignar el rango');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario y su asignación de rango?')) {
      try {
        // Delete user rank first (if it exists)
        const rankToDelete = userRanks.find(r => r.userId === id);
        if (rankToDelete) {
          await api.delete(`/user-ranks/${rankToDelete.id}`);
        }
        
        // Delete core user record
        await api.delete(`/users/${id}`);

        setSuccess('Usuario eliminado exitosamente');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.message || 'Error al eliminar el usuario');
      }
    }
  };

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
        username: row.username || row.usuario || '',
        email: row.email || row.correo || '',
        password: row.password || row.contraseña || '',
        role: row.role || row.rol || 'user',
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
      if (!row.username || !row.email || !row.password) {
        errors.push(`Fila ${row.rowIndex}: Campos obligatorios (username, email, password) faltan`);
      }
      if (row.password && String(row.password).length < 6) {
        errors.push(`Fila ${row.rowIndex}: La contraseña debe tener al menos 6 caracteres`);
      }
      if (row.role && !['admin', 'user'].includes(row.role.toLowerCase())) {
        errors.push(`Fila ${row.rowIndex}: Rol inválido (debe ser 'admin' o 'user')`);
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
      const validData = fileData.filter(row => row.username && row.email && row.password);
      
      const response = await api.post('/users/bulk-upload', { data: validData });
      
      setSuccess(`Se importaron exitosamente ${response.data.imported} registros. Los rangos deben asignarse manualmente.`);
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
  
  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      
      const dataToExport = users.map(usuario => ({
        'ID': usuario.id,
        'Nombre de Usuario': usuario.username,
        'Email': usuario.email,
        'Rol Base': usuario.role === 'admin' ? 'Administrador' : 'Usuario',
        'Rango Asignado': usuario.rankData?.rank || 'N/A',
        'Asignación': usuario.rankData 
          ? usuario.rankData.rank === 'Director' 
            ? `Escuela: ${usuario.rankData.escuela?.nombre || usuario.rankData.escuelaId}`
            : usuario.rankData.rank === 'Coordinador'
              ? `Municipio: ${usuario.rankData.municipio?.nombre || usuario.rankData.municipioId}`
              : 'Global'
          : 'N/A',
        'Creado En': usuario.creadoEn 
          ? new Date(usuario.creadoEn).toLocaleDateString() 
          : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

      const maxWidth = 50;
      const columnWidths = Object.keys(dataToExport[0] || {}).map(key => ({
        wch: Math.min(
          Math.max(
            key.length,
            ...dataToExport.map(row => String(row[key] || '').length)
          ),
          maxWidth
        )
      }));
      worksheet['!cols'] = columnWidths;

      const now = new Date();
      const filename = `usuarios_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

      XLSX.writeFile(workbook, filename);
      
      setSuccess('Archivo Excel descargado exitosamente');
    } catch (error) {
      setError('Error al exportar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center p-5">
        <Alert variant="danger">
          Acceso denegado. Solo los administradores pueden gestionar usuarios.
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando usuarios y datos de asignación...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>👥 Gestión de Usuarios</h2>
          <p className="text-muted">Gestión de información de usuarios y asignación de rangos</p>
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
                ➕ Nuevo Usuario
              </Button>
              <Button
                variant="info"
                onClick={handleExportToExcel}
                disabled={users.length === 0}
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
          <h5 className="mb-0">Lista de Usuarios</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {users.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No hay usuarios registrados</p>
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
                    <th>ID</th>
                    <th>Nombre de Usuario</th>
                    <th>Email</th>
                    <th>Rol Base</th>
                    <th>Rango Asignado</th>
                    <th>Asignación</th>
                    <th>Creado En</th>
                    {user?.role === 'admin' && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.username}</td>
                      <td>{item.email}</td>
                      <td>
                        <Badge bg={item.role === 'admin' ? 'danger' : 'primary'}>
                          {item.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </td>
                      <td>
                        {item.rankData ? (
                          <Badge bg={
                            item.rankData.rank === 'Director' ? 'warning' : 
                            item.rankData.rank === 'Coordinador' ? 'info' : 
                            'secondary'
                          }>
                            {item.rankData.rank}
                          </Badge>
                        ) : (
                          <Badge bg="secondary">Sin Rango</Badge>
                        )}
                      </td>
                      <td>
                        {item.rankData?.rank === 'Director' && (
                          <span>Escuela: {item.rankData.escuela?.nombre || item.rankData.escuelaId}</span>
                        )}
                        {item.rankData?.rank === 'Coordinador' && (
                          <span>Muni: {item.rankData.municipio?.nombre || item.rankData.municipioId}</span>
                        )}
                        {item.rankData?.rank === 'Administrador' && (
                          <span>Global</span>
                        )}
                        {!item.rankData && (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>{item.creadoEn ? new Date(item.creadoEn).toLocaleDateString() : 'N/A'}</td>
                      {user?.role === 'admin' && (
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
                            onClick={() => handleDelete(item.id)}
                            disabled={item.id === user.id}
                            title={item.id === user.id ? 'No puedes eliminarte a ti mismo' : ''}
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
          <Modal.Title>Importar Usuarios desde Archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Formato requerido:</strong> El archivo debe contener las siguientes columnas:
            <ul className="mb-0 mt-2">
              <li><strong>username</strong> - Nombre de usuario</li>
              <li><strong>email</strong> - Correo electrónico</li>
              <li><strong>password</strong> - Contraseña (mínimo 6 caracteres)</li>
              <li><strong>role</strong> - Rol ('admin' o 'user') (opcional, por defecto 'user')</li>
            </ul>
            <p className="mt-2 mb-0"><strong>NOTA:</strong> La asignación de Rangos (Director, Coordinador) y la escuela/municipio deben realizarse manualmente después de la importación.</p>
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
                      <th>Nombre de Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.username}</td>
                        <td>{row.email}</td>
                        <td>{row.role}</td>
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
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingData ? 'Editar' : 'Crear'} Usuario
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de Usuario *</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Contraseña {editingData ? '(dejar en blanco para no cambiar)' : '*'}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required={!editingData}
              />
              <Form.Text className="text-muted">
                Mínimo 6 caracteres
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Rol Base *</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="user">Usuario común</option>
                <option value="admin">Gerente</option>
              </Form.Select>
            </Form.Group>

            <hr className="my-4" />
            <h5>Asignación de Rango y Alcance (Filtrado de Datos)</h5>

            <Form.Group className="mb-3">
              <Form.Label>Rango</Form.Label>
              <Form.Select
                name="rank"
                value={rankFormData.rank}
                onChange={handleRankChange}
              >
                <option value="">Seleccione un Rango</option>
                {RANKS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Define el nivel de filtrado de datos del usuario (Director = Escuela Unica | Coordinador = Municipio Unico | Administrador = todas las escuelas).
              </Form.Text>
            </Form.Group>

            {rankFormData.rank === 'Director' && (
              <Form.Group className="mb-3">
                <Form.Label>Escuela Asignada *</Form.Label>
                <Form.Select
                  name="escuelaId"
                  value={rankFormData.escuelaId}
                  onChange={handleRankChange}
                  required
                >
                  <option value="">Seleccione una Escuela</option>
                  {escuelas.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nombre} (ID: {e.id})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {rankFormData.rank === 'Coordinador' && (
              <Form.Group className="mb-3">
                <Form.Label>Municipio Asignado *</Form.Label>
                <Form.Select
                  name="municipioId"
                  value={rankFormData.municipioId}
                  onChange={handleRankChange}
                  required
                >
                  <option value="">Seleccione un Municipio</option>
                  {municipios.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} (ID: {m.id})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

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

export default Users;