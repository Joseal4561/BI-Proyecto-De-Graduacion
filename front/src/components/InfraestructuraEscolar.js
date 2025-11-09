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
  ListGroup,
  Tabs,
  Tab,
  Accordion
} from 'react-bootstrap';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axiosConfig';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

const InfraestructuraEscolar = () => {
  const { user } = useAuth();
  const [infraestructuras, setInfraestructuras] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [necesidadesMobiliario, setNecesidadesMobiliario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  
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
  
  // Form state - initialized with default values
  const getInitialFormData = () => ({
    escuelaId: '',
    modalidad: '',
    area: '',
    jornada: '',
    totalAulasFormales: 0,
    techoLamina: false,
    techoLosaFundida: false,
    paredesAdobe: false,
    paredesBlock: false,
    tieneDireccion: false,
    tieneCocina: false,
    tieneBodega: false,
    sanitariosLavables: 0,
    sanitariosLetrinas: 0,
    tieneSalonUsosMultiples: false,
    tieneLaboratorio: false,
    tieneMuroPerimetral: false,
    tieneCanchaPolideportiva: false,
    tieneCanchaBaloncesto: false,
    tieneCanchaFutbol: false,
    tienePiscina: false,
    circulacionDelPredio: false,
    observacionesInfraestructura: '',
    hueAMunKmAsfalto: '',
    hueAMunKmTerraceria: '',
    munAComKmAsfalto: '',
    munAComKmTerraceria: '',
    comACenKmAsfalto: '',
    munACenKmTerraceria: '',
    munACenKmVereda: '',
    servicioEnergiaElectrica: false,
    servicioAguaPotable: false,
    drenajeRedMunicipal: false,
    drenajeFosaSeptica: false,
    drenajeFosaSepticaYPozo: false,
    drenajeDesfogueARio: false,
    certezaJuridica: '',
    predioANombreDe: '',
    condicionEdificio: '',
    dañoAEdificio: '',
    esPrioritario: false,
    observaciones: '',
    cuentaConPredio: false,
    programaDeRemozamiento: false,
    servicioMasReciente: '',
    noEscritorios: '',
    noMesasHexagonales: '',
    noPizarras: '',
    noCatedras: '',
    idSolicitud: '',
    coordenadas: ''
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    fetchData();
    fetchRelationships();
  }, []);

  useEffect(() => {
    if (!loading && infraestructuras.length > 0 && tableRef.current) {
      // Destroy existing DataTable if it exists
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      // Initialize DataTable
      dataTableRef.current = $(tableRef.current).DataTable({
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
        searching: false, // Disable global search
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
        ],
        initComplete: function () {
          this.api().columns().every(function (index) {
            const column = this;
            const header = $(column.header());
            
            // Don't add search to actions column
            if (index === this.columns()[0].length - 1) return;
            
            const input = $('<input type="text" class="form-control form-control-sm mt-1" placeholder="Buscar..." />')
              .appendTo(header)
              .on('click', function(e) {
                e.stopPropagation();
              })
              .on('keyup change clear', function () {
                if (column.search() !== this.value) {
                  column.search(this.value).draw();
                }
              });
          });
        }
      });
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [loading, infraestructuras]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/infraestructura-escolar');
      const infraestructurasArray = Array.isArray(response.data) ? response.data : [];
      setInfraestructuras(infraestructurasArray);
    } catch (err) {
      setError('Error al cargar las infraestructuras escolares');
      console.error('Error fetching infraestructuras:', err);
      setInfraestructuras([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      const escuelasResponse = await api.get('/escuelas');
      const escuelasArray = Array.isArray(escuelasResponse.data) ? escuelasResponse.data : [];
      setEscuelas(escuelasArray);
      
      const necesidadesResponse = await api.get('/necesidad-mobiliario');
      const necesidadesArray = Array.isArray(necesidadesResponse.data) ? necesidadesResponse.data : [];
      setNecesidadesMobiliario(necesidadesArray);
    } catch (err) {
      console.error('Error al cargar las relaciones:', err);
      setEscuelas([]);
      setNecesidadesMobiliario([]);
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

  const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return ['true', '1', 'sí', 'si', 'yes', 'verdadero'].includes(lower);
    }
    return Boolean(value);
  };

  const processFileData = (rawData) => {
    const processed = rawData.map((row, index) => {
      const mappedRow = {
        escuelaId: findIdByName(escuelas, row.escuela || row.escuela_nombre || ''),
        modalidad: row.modalidad,
        area: row.area,
        jornada: row.jornada,
        totalAulasFormales: parseInt(row.total_aulas_formales || row.totalAulasFormales || 0) || 0,
        techoLamina: parseBoolean(row.techo_lamina || row.techoLamina),
        techoLosaFundida: parseBoolean(row.techo_losa_fundida || row.techoLosaFundida),
        paredesAdobe: parseBoolean(row.paredes_adobe || row.paredesAdobe),
        paredesBlock: parseBoolean(row.paredes_block || row.paredesBlock),
        tieneDireccion: parseBoolean(row.tiene_direccion || row.tieneDireccion),
        tieneCocina: parseBoolean(row.tiene_cocina || row.tieneCocina),
        tieneBodega: parseBoolean(row.tiene_bodega || row.tieneBodega),
        sanitariosLavables: parseInt(row.sanitarios_lavables || row.sanitariosLavables || 0) || 0,
        sanitariosLetrinas: parseInt(row.sanitarios_letrinas || row.sanitariosLetrinas || 0) || 0,
        tieneSalonUsosMultiples: parseBoolean(row.tiene_salon_usos_multiples || row.tieneSalonUsosMultiples),
        tieneLaboratorio: parseBoolean(row.tiene_laboratorio || row.tieneLaboratorio),
        tieneMuroPerimetral: parseBoolean(row.tiene_muro_perimetral || row.tieneMuroPerimetral),
        tieneCanchaPolideportiva: parseBoolean(row.tiene_cancha_polideportiva || row.tieneCanchaPolideportiva),
        tieneCanchaBaloncesto: parseBoolean(row.tiene_cancha_baloncesto || row.tieneCanchaBaloncesto),
        tieneCanchaFutbol: parseBoolean(row.tiene_cancha_futbol || row.tieneCanchaFutbol),
        tienePiscina: parseBoolean(row.tiene_piscina || row.tienePiscina),
        circulacionDelPredio: parseBoolean(row.circulacion_del_predio || row.circulacionDelPredio),
        observacionesInfraestructura: row.observaciones_infraestructura || row.observacionesInfraestructura || '',
        hueAMunKmAsfalto: parseFloat(row.hue_a_mun_km_asfalto || row.hueAMunKmAsfalto) || null,
        hueAMunKmTerraceria: parseFloat(row.hue_a_mun_km_terraceria || row.hueAMunKmTerraceria) || null,
        munAComKmAsfalto: parseFloat(row.mun_a_com_km_asfalto || row.munAComKmAsfalto) || null,
        munAComKmTerraceria: parseFloat(row.mun_a_com_km_terraceria || row.munAComKmTerraceria) || null,
        comACenKmAsfalto: parseFloat(row.com_a_cen_km_asfalto || row.comACenKmAsfalto) || null,
        munACenKmTerraceria: parseFloat(row.mun_a_cen_km_terraceria || row.munACenKmTerraceria) || null,
        munACenKmVereda: parseFloat(row.mun_a_cen_km_vereda || row.munACenKmVereda) || null,
        servicioEnergiaElectrica: parseBoolean(row.servicio_energia_electrica || row.servicioEnergiaElectrica),
        servicioAguaPotable: parseBoolean(row.servicio_agua_potable || row.servicioAguaPotable),
        drenajeRedMunicipal: parseBoolean(row.drenaje_red_municipal || row.drenajeRedMunicipal),
        drenajeFosaSeptica: parseBoolean(row.drenaje_fosa_septica || row.drenajeFosaSeptica),
        drenajeFosaSepticaYPozo: parseBoolean(row.drenaje_fosa_septica_y_pozo || row.drenajeFosaSepticaYPozo),
        drenajeDesfogueARio: parseBoolean(row.drenaje_desfogue_a_rio || row.drenajeDesfogueARio),
        certezaJuridica: row.certeza_juridica || row.certezaJuridica || '',
        predioANombreDe: row.predio_a_nombre_de || row.predioANombreDe || '',
        condicionEdificio: row.condicion_edificio || row.condicionEdificio || '',
        dañoAEdificio: row.daño_a_edificio || row.dañoAEdificio || '',
        esPrioritario: parseBoolean(row.es_prioritario || row.esPrioritario),
        observaciones: row.observaciones || '',
        cuentaConPredio: parseBoolean(row.cuenta_con_predio || row.cuentaConPredio),
        programaDeRemozamiento: parseBoolean(row.programa_de_remozamiento || row.programaDeRemozamiento),
        servicioMasReciente: row.servicio_mas_reciente || row.servicioMasReciente || '',
        noEscritorios: parseInt(row.no_escritorios || row.noEscritorios) || null,
        noMesasHexagonales: parseInt(row.no_mesas_hexagonales || row.noMesasHexagonales) || null,
        noPizarras: parseInt(row.no_pizarras || row.noPizarras) || null,
        noCatedras: parseInt(row.no_catedras || row.noCatedras) || null,
        idSolicitud: parseInt(row.id_solicitud || row.idSolicitud) || null,
        coordenadas: row.coordenadas || '',
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
    data.forEach((row) => {
      if (!row.escuelaId) {
        errors.push(`Fila ${row.rowIndex}: Escuela no encontrada o no especificada`);
      }
      
      if (row.modalidad && !['Monolingüe', 'Bilingüe'].includes(row.modalidad)) {
        errors.push(`Fila ${row.rowIndex}: Modalidad debe ser 'Monolingüe' o 'Bilingüe'`);
      }
      
      if (row.area && !['Urbana', 'Rural'].includes(row.area)) {
        errors.push(`Fila ${row.rowIndex}: Área debe ser 'Urbana' o 'Rural'`);
      }
      
      if (row.condicionEdificio && !['Bueno', 'Malo'].includes(row.condicionEdificio)) {
        errors.push(`Fila ${row.rowIndex}: Condición de edificio debe ser 'Bueno' o 'Malo'`);
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
      
      const response = await api.post('/infraestructura-escolar/bulk-upload', { data: validData });
      
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
      // Clean up empty strings to null for numeric fields
      const cleanedData = { ...formData };
      const numericFields = ['hueAMunKmAsfalto', 'hueAMunKmTerraceria', 'munAComKmAsfalto', 
                             'munAComKmTerraceria', 'comACenKmAsfalto', 'munACenKmTerraceria', 
                             'munACenKmVereda', 'noEscritorios', 'noMesasHexagonales', 
                             'noPizarras', 'noCatedras', 'idSolicitud'];
      
      numericFields.forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === null) {
          cleanedData[field] = null;
        }
      });

      if (editingData) {
        await api.patch(`/infraestructura-escolar/${editingData.idInfraestructura}`, cleanedData);
        setSuccess('Infraestructura escolar actualizada exitosamente');
      } else {
        await api.post('/infraestructura-escolar', cleanedData);
        setSuccess('Infraestructura escolar creada exitosamente');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la infraestructura escolar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        await api.delete(`/infraestructura-escolar/${id}`);
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
      escuelaId: data.escuela?.id || data.escuelaId || '',
      modalidad: data.modalidad || '',
      area: data.area || '',
      jornada: data.jornada || '',
      totalAulasFormales: data.totalAulasFormales || 0,
      techoLamina: data.techoLamina || false,
      techoLosaFundida: data.techoLosaFundida || false,
      paredesAdobe: data.paredesAdobe || false,
      paredesBlock: data.paredesBlock || false,
      tieneDireccion: data.tieneDireccion || false,
      tieneCocina: data.tieneCocina || false,
      tieneBodega: data.tieneBodega || false,
      sanitariosLavables: data.sanitariosLavables || 0,
      sanitariosLetrinas: data.sanitariosLetrinas || 0,
      tieneSalonUsosMultiples: data.tieneSalonUsosMultiples || false,
      tieneLaboratorio: data.tieneLaboratorio || false,
      tieneMuroPerimetral: data.tieneMuroPerimetral || false,
      tieneCanchaPolideportiva: data.tieneCanchaPolideportiva || false,
      tieneCanchaBaloncesto: data.tieneCanchaBaloncesto || false,
      tieneCanchaFutbol: data.tieneCanchaFutbol || false,
      tienePiscina: data.tienePiscina || false,
      circulacionDelPredio: data.circulacionDelPredio || false,
      observacionesInfraestructura: data.observacionesInfraestructura || '',
      hueAMunKmAsfalto: data.hueAMunKmAsfalto || '',
      hueAMunKmTerraceria: data.hueAMunKmTerraceria || '',
      munAComKmAsfalto: data.munAComKmAsfalto || '',
      munAComKmTerraceria: data.munAComKmTerraceria || '',
      comACenKmAsfalto: data.comACenKmAsfalto || '',
      munACenKmTerraceria: data.munACenKmTerraceria || '',
      munACenKmVereda: data.munACenKmVereda || '',
      servicioEnergiaElectrica: data.servicioEnergiaElectrica || false,
      servicioAguaPotable: data.servicioAguaPotable || false,
      drenajeRedMunicipal: data.drenajeRedMunicipal || false,
      drenajeFosaSeptica: data.drenajeFosaSeptica || false,
      drenajeFosaSepticaYPozo: data.drenajeFosaSepticaYPozo || false,
      drenajeDesfogueARio: data.drenajeDesfogueARio || false,
      certezaJuridica: data.certezaJuridica || '',
      predioANombreDe: data.predioANombreDe || '',
      condicionEdificio: data.condicionEdificio || '',
      dañoAEdificio: data.dañoAEdificio || '',
      esPrioritario: data.esPrioritario || false,
      observaciones: data.observaciones || '',
      cuentaConPredio: data.cuentaConPredio || false,
      programaDeRemozamiento: data.programaDeRemozamiento || false,
      servicioMasReciente: data.servicioMasReciente || '',
      noEscritorios: data.noEscritorios || '',
      noMesasHexagonales: data.noMesasHexagonales || '',
      noPizarras: data.noPizarras || '',
      noCatedras: data.noCatedras || '',
      idSolicitud: data.idSolicitud || '',
      coordenadas: data.coordenadas || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingData(null);
    setFormData(getInitialFormData());
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;

    if (type === 'checkbox') {
      newValue = checked;
    } else if (['escuelaId', 'totalAulasFormales', 'sanitariosLavables', 'sanitariosLetrinas', 
                'noEscritorios', 'noMesasHexagonales', 'noPizarras', 'noCatedras', 'idSolicitud'].includes(name)) {
      newValue = value ? parseInt(value, 10) : '';
    } else if (['hueAMunKmAsfalto', 'hueAMunKmTerraceria', 'munAComKmAsfalto', 
                'munAComKmTerraceria', 'comACenKmAsfalto', 'munACenKmTerraceria', 'munACenKmVereda'].includes(name)) {
      newValue = value ? parseFloat(value) : '';
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleExportToExcel = async () => {
  try {
    setLoading(true);
    
    const dataToExport = infraestructuras.map(infra => ({
      'Escuela': infra.escuela?.nombre || 'N/A',
      'Modalidad': infra.modalidad || 'N/A',
      'Área': infra.area || 'N/A',
      'Jornada': infra.jornada || 'N/A',
      'Coordenadas': infra.coordenadas || 'N/A',
      'Total Aulas': infra.totalAulasFormales || 0,
      'Techo Lámina': infra.techoLamina ? 'Sí' : 'No',
      'Techo Losa Fundida': infra.techoLosaFundida ? 'Sí' : 'No',
      'Paredes Adobe': infra.paredesAdobe ? 'Sí' : 'No',
      'Paredes Block': infra.paredesBlock ? 'Sí' : 'No',
      'Tiene Dirección': infra.tieneDireccion ? 'Sí' : 'No',
      'Tiene Cocina': infra.tieneCocina ? 'Sí' : 'No',
      'Tiene Bodega': infra.tieneBodega ? 'Sí' : 'No',
      'Sanitarios Lavables': infra.sanitariosLavables || 0,
      'Sanitarios Letrinas': infra.sanitariosLetrinas || 0,
      'Salón Usos Múltiples': infra.tieneSalonUsosMultiples ? 'Sí' : 'No',
      'Tiene Laboratorio': infra.tieneLaboratorio ? 'Sí' : 'No',
      'Muro Perimetral': infra.tieneMuroPerimetral ? 'Sí' : 'No',
      'Cancha Polideportiva': infra.tieneCanchaPolideportiva ? 'Sí' : 'No',
      'Cancha Baloncesto': infra.tieneCanchaBaloncesto ? 'Sí' : 'No',
      'Cancha Fútbol': infra.tieneCanchaFutbol ? 'Sí' : 'No',
      'Tiene Piscina': infra.tienePiscina ? 'Sí' : 'No',
      'Circulación Predio': infra.circulacionDelPredio ? 'Sí' : 'No',
      'Energía Eléctrica': infra.servicioEnergiaElectrica ? 'Sí' : 'No',
      'Agua Potable': infra.servicioAguaPotable ? 'Sí' : 'No',
      'Drenaje Municipal': infra.drenajeRedMunicipal ? 'Sí' : 'No',
      'Fosa Séptica': infra.drenajeFosaSeptica ? 'Sí' : 'No',
      'Fosa Séptica y Pozo': infra.drenajeFosaSepticaYPozo ? 'Sí' : 'No',
      'Desfogue a Río': infra.drenajeDesfogueARio ? 'Sí' : 'No',
      'Servicio Más Reciente': infra.servicioMasReciente || 'N/A',
      'Certeza Jurídica': infra.certezaJuridica || 'N/A',
      'Predio a Nombre De': infra.predioANombreDe || 'N/A',
      'Condición Edificio': infra.condicionEdificio || 'N/A',
      'Cuenta con Predio': infra.cuentaConPredio ? 'Sí' : 'No',
      'Es Prioritario': infra.esPrioritario ? 'Sí' : 'No',
      'Programa Remozamiento': infra.programaDeRemozamiento ? 'Sí' : 'No',
      'Escritorios': infra.noEscritorios || 0,
      'Mesas Hexagonales': infra.noMesasHexagonales || 0,
      'Pizarras': infra.noPizarras || 0,
      'Cátedras': infra.noCatedras || 0,
      'Observaciones Infraestructura': infra.observacionesInfraestructura || 'N/A',
      'Observaciones Generales': infra.observaciones || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Infraestructura');

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
    const filename = `infraestructura_escolar_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

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
        <p className="mt-2">Cargando infraestructuras escolares...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>Gestión de Infraestructura Escolar</h2>
          <p className="text-muted">Registro detallado de infraestructura y servicios por escuela</p>
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
                ➕ Nueva Infraestructura
              </Button>
              <Button
                variant="info"
                onClick={handleExportToExcel}
                disabled={infraestructuras.length === 0}
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
          <h5 className="mb-0">Lista de Infraestructura Escolar</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {infraestructuras.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">No hay registros de infraestructura escolar</p>
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
                .bg-general { background-color: #e3f2fd !important; }
                .bg-infraestructura { background-color: #f3e5f5 !important; }
                .bg-servicios { background-color: #e8f5e9 !important; }
                .bg-legal { background-color: #fff3e0 !important; }
                .bg-mobiliario { background-color: #fce4ec !important; }
                .bg-acciones { background-color: #f5f5f5 !important; }
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
                    {/* Datos Generales */}
                    <th className="bg-general">Escuela</th>
                    <th className="bg-general">Modalidad</th>
                    <th className="bg-general">Área</th>
                    <th className="bg-general">Jornada</th>
                    <th className="bg-general">Coordenadas</th>
                    
                    {/* Infraestructura */}
                    <th className="bg-infraestructura">Total Aulas</th>
                    <th className="bg-infraestructura">Techo Lámina</th>
                    <th className="bg-infraestructura">Techo Losa</th>
                    <th className="bg-infraestructura">Paredes Adobe</th>
                    <th className="bg-infraestructura">Paredes Block</th>
                    <th className="bg-infraestructura">Dirección</th>
                    <th className="bg-infraestructura">Cocina</th>
                    <th className="bg-infraestructura">Bodega</th>
                    <th className="bg-infraestructura">Sanitarios Lav.</th>
                    <th className="bg-infraestructura">Letrinas</th>
                    <th className="bg-infraestructura">Salón Usos Mult.</th>
                    <th className="bg-infraestructura">Laboratorio</th>
                    <th className="bg-infraestructura">Muro Perimetral</th>
                    <th className="bg-infraestructura">Cancha Polid.</th>
                    <th className="bg-infraestructura">Cancha Balon.</th>
                    <th className="bg-infraestructura">Cancha Fútbol</th>
                    <th className="bg-infraestructura">Piscina</th>
                    <th className="bg-infraestructura">Circulación</th>
                    
                    {/* Servicios */}
                    <th className="bg-servicios">Electricidad</th>
                    <th className="bg-servicios">Agua Potable</th>
                    <th className="bg-servicios">Dren. Municipal</th>
                    <th className="bg-servicios">Fosa Séptica</th>
                    <th className="bg-servicios">Fosa+Pozo</th>
                    <th className="bg-servicios">Desfogue Río</th>
                    <th className="bg-servicios">Servicio Reciente</th>
                    
                    {/* Legal */}
                    <th className="bg-legal">Certeza Jurídica</th>
                    <th className="bg-legal">Predio Nombre</th>
                    <th className="bg-legal">Condición Edif.</th>
                    <th className="bg-legal">Cuenta Predio</th>
                    <th className="bg-legal">Prioritario</th>
                    <th className="bg-legal">Remozamiento</th>
                    
                    {/* Mobiliario */}
                    <th className="bg-mobiliario">Escritorios</th>
                    <th className="bg-mobiliario">Mesas Hex.</th>
                    <th className="bg-mobiliario">Pizarras</th>
                    <th className="bg-mobiliario">Cátedras</th>
                    
                    {/* Acciones */}
                    {user?.role === 'admin' && <th className="bg-acciones">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {infraestructuras.map((item) => (
                    <tr key={item.idInfraestructura}>
                      {/* Datos Generales */}
                      <td>{item.escuela?.nombre || 'N/A'}</td>
                      <td>
                        {item.modalidad ? (
                          <Badge bg={item.modalidad === 'Bilingüe' ? 'info' : 'secondary'} className="text-wrap">
                            {item.modalidad}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {item.area ? (
                          <Badge bg={item.area === 'Urbana' ? 'primary' : 'success'}>
                            {item.area}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                      <td>{item.jornada || 'N/A'}</td>
                      <td>{item.coordenadas || 'N/A'}</td>
                      
                      {/* Infraestructura */}
                      <td className="text-center">{item.totalAulasFormales || 0}</td>
                      <td className="text-center">{item.techoLamina ? '✅' : '❌'}</td>
                      <td className="text-center">{item.techoLosaFundida ? '✅' : '❌'}</td>
                      <td className="text-center">{item.paredesAdobe ? '✅' : '❌'}</td>
                      <td className="text-center">{item.paredesBlock ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneDireccion ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneCocina ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneBodega ? '✅' : '❌'}</td>
                      <td className="text-center">{item.sanitariosLavables || 0}</td>
                      <td className="text-center">{item.sanitariosLetrinas || 0}</td>
                      <td className="text-center">{item.tieneSalonUsosMultiples ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneLaboratorio ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneMuroPerimetral ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneCanchaPolideportiva ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneCanchaBaloncesto ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tieneCanchaFutbol ? '✅' : '❌'}</td>
                      <td className="text-center">{item.tienePiscina ? '✅' : '❌'}</td>
                      <td className="text-center">{item.circulacionDelPredio ? '✅' : '❌'}</td>
                      
                      {/* Servicios */}
                      <td className="text-center">{item.servicioEnergiaElectrica ? '⚡' : '❌'}</td>
                      <td className="text-center">{item.servicioAguaPotable ? '💧' : '❌'}</td>
                      <td className="text-center">{item.drenajeRedMunicipal ? '✅' : '❌'}</td>
                      <td className="text-center">{item.drenajeFosaSeptica ? '✅' : '❌'}</td>
                      <td className="text-center">{item.drenajeFosaSepticaYPozo ? '✅' : '❌'}</td>
                      <td className="text-center">{item.drenajeDesfogueARio ? '✅' : '❌'}</td>
                      <td>{item.servicioMasReciente || 'N/A'}</td>
                      
                      {/* Legal */}
                      <td>{item.certezaJuridica || 'N/A'}</td>
                      <td>{item.predioANombreDe || 'N/A'}</td>
                      <td>
                        {item.condicionEdificio ? (
                          <Badge bg={item.condicionEdificio === 'Bueno' ? 'success' : 'danger'}>
                            {item.condicionEdificio}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                      <td className="text-center">{item.cuentaConPredio ? '✅' : '❌'}</td>
                      <td className="text-center">
                        {item.esPrioritario ? (
                          <Badge bg="danger">SÍ</Badge>
                        ) : (
                          <Badge bg="secondary">No</Badge>
                        )}
                      </td>
                      <td className="text-center">{item.programaDeRemozamiento ? '✅' : '❌'}</td>
                      
                      {/* Mobiliario */}
                      <td className="text-center">{item.noEscritorios || 0}</td>
                      <td className="text-center">{item.noMesasHexagonales || 0}</td>
                      <td className="text-center">{item.noPizarras || 0}</td>
                      <td className="text-center">{item.noCatedras || 0}</td>
                      
                      {/* Acciones */}
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
                            onClick={() => handleDelete(item.idInfraestructura)}
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
          <Modal.Title>Importar Infraestructura Escolar desde Archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <strong>Formato requerido:</strong> El archivo debe contener la columna obligatoria:
            <ul className="mb-0 mt-2">
              <li><strong>escuela</strong> - Nombre de la escuela (obligatorio)</li>
              <li>Y opcionalmente cualquier combinación de los 50+ campos de infraestructura</li>
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
                      <th>Modalidad</th>
                      <th>Área</th>
                      <th>Aulas</th>
                      <th>Condición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index}>
                        <td>{escuelas.find(e => e.id === row.escuelaId)?.nombre || 'NO ENCONTRADA'}</td>
                        <td>{row.modalidad || 'N/A'}</td>
                        <td>{row.area || 'N/A'}</td>
                        <td>{row.totalAulasFormales}</td>
                        <td>{row.condicionEdificio || 'N/A'}</td>
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
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingData ? 'Editar' : 'Crear'} Infraestructura Escolar
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Tabs defaultActiveKey="general" className="mb-3">
              {/* Tab 1: Datos Generales */}
              <Tab eventKey="general" title="Datos Generales">
                <Row>
                  <Col md={12}>
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
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Modalidad</Form.Label>
                      <Form.Select
                        name="modalidad"
                        value={formData.modalidad}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Monolingüe">Monolingüe</option>
                        <option value="Bilingüe">Bilingüe</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Área</Form.Label>
                      <Form.Select
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Urbana">Urbana</option>
                        <option value="Rural">Rural</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Jornada</Form.Label>
                      <Form.Control
                        type="text"
                        name="jornada"
                        value={formData.jornada}
                        onChange={handleChange}
                        placeholder="Ej: Matutina, Vespertina"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Coordenadas GPS</Form.Label>
                      <Form.Control
                        type="text"
                        name="coordenadas"
                        value={formData.coordenadas}
                        onChange={handleChange}
                        placeholder="Ej: 14.6349, -90.5069"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Aulas Formales</Form.Label>
                      <Form.Control
                        type="number"
                        name="totalAulasFormales"
                        value={formData.totalAulasFormales}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              {/* Tab 2: Infraestructura */}
              <Tab eventKey="infraestructura" title="Infraestructura">
                <h6 className="mb-3">Techos</h6>
                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="techoLamina"
                      checked={formData.techoLamina}
                      onChange={handleChange}
                      label="Techo de Lámina"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="techoLosaFundida"
                      checked={formData.techoLosaFundida}
                      onChange={handleChange}
                      label="Techo de Losa Fundida"
                      className="mb-2"
                    />
                  </Col>
                </Row>

                <h6 className="mb-3 mt-3">Paredes</h6>
                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="paredesAdobe"
                      checked={formData.paredesAdobe}
                      onChange={handleChange}
                      label="Paredes de Adobe"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="paredesBlock"
                      checked={formData.paredesBlock}
                      onChange={handleChange}
                      label="Paredes de Block"
                      className="mb-2"
                    />
                  </Col>
                </Row>

                <h6 className="mb-3 mt-3">Instalaciones</h6>
                <Row>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneDireccion"
                      checked={formData.tieneDireccion}
                      onChange={handleChange}
                      label="Tiene Dirección"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneCocina"
                      checked={formData.tieneCocina}
                      onChange={handleChange}
                      label="Tiene Cocina"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneBodega"
                      checked={formData.tieneBodega}
                      onChange={handleChange}
                      label="Tiene Bodega"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneSalonUsosMultiples"
                      checked={formData.tieneSalonUsosMultiples}
                      onChange={handleChange}
                      label="Salón Usos Múltiples"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneLaboratorio"
                      checked={formData.tieneLaboratorio}
                      onChange={handleChange}
                      label="Tiene Laboratorio"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneMuroPerimetral"
                      checked={formData.tieneMuroPerimetral}
                      onChange={handleChange}
                      label="Muro Perimetral"
                      className="mb-2"
                    />
                  </Col>
                </Row>

                <h6 className="mb-3 mt-3">Sanitarios</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sanitarios Lavables</Form.Label>
                      <Form.Control
                        type="number"
                        name="sanitariosLavables"
                        value={formData.sanitariosLavables}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sanitarios Letrinas</Form.Label>
                      <Form.Control
                        type="number"
                        name="sanitariosLetrinas"
                        value={formData.sanitariosLetrinas}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="mb-3 mt-3">Áreas Deportivas</h6>
                <Row>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneCanchaPolideportiva"
                      checked={formData.tieneCanchaPolideportiva}
                      onChange={handleChange}
                      label="Cancha Polideportiva"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneCanchaBaloncesto"
                      checked={formData.tieneCanchaBaloncesto}
                      onChange={handleChange}
                      label="Cancha de Baloncesto"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tieneCanchaFutbol"
                      checked={formData.tieneCanchaFutbol}
                      onChange={handleChange}
                      label="Cancha de Fútbol"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="tienePiscina"
                      checked={formData.tienePiscina}
                      onChange={handleChange}
                      label="Tiene Piscina"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      name="circulacionDelPredio"
                      checked={formData.circulacionDelPredio}
                      onChange={handleChange}
                      label="Circulación del Predio"
                      className="mb-2"
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Observaciones de Infraestructura</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observacionesInfraestructura"
                    value={formData.observacionesInfraestructura}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Tab>

              {/* Tab 3: Acceso y Servicios */}
              <Tab eventKey="servicios" title="Acceso y Servicios">
                <h6 className="mb-3">Distancias (km)</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Huehuetenango a Municipio (Asfalto)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="hueAMunKmAsfalto"
                        value={formData.hueAMunKmAsfalto}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Huehuetenango a Municipio (Terracería)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="hueAMunKmTerraceria"
                        value={formData.hueAMunKmTerraceria}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Municipio a Comunidad (Asfalto)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="munAComKmAsfalto"
                        value={formData.munAComKmAsfalto}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Municipio a Comunidad (Terracería)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="munAComKmTerraceria"
                        value={formData.munAComKmTerraceria}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Comunidad a Centro (Asfalto)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="comACenKmAsfalto"
                        value={formData.comACenKmAsfalto}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Municipio a Centro (Terracería)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="munACenKmTerraceria"
                        value={formData.munACenKmTerraceria}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Municipio a Centro (Vereda)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="munACenKmVereda"
                        value={formData.munACenKmVereda}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="mb-3 mt-3">Servicios Básicos</h6>
                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="servicioEnergiaElectrica"
                      checked={formData.servicioEnergiaElectrica}
                      onChange={handleChange}
                      label="Energía Eléctrica"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="servicioAguaPotable"
                      checked={formData.servicioAguaPotable}
                      onChange={handleChange}
                      label="Agua Potable"
                      className="mb-2"
                    />
                  </Col>
                </Row>

                <h6 className="mb-3 mt-3">Drenaje</h6>
                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="drenajeRedMunicipal"
                      checked={formData.drenajeRedMunicipal}
                      onChange={handleChange}
                      label="Red Municipal"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="drenajeFosaSeptica"
                      checked={formData.drenajeFosaSeptica}
                      onChange={handleChange}
                      label="Fosa Séptica"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="drenajeFosaSepticaYPozo"
                      checked={formData.drenajeFosaSepticaYPozo}
                      onChange={handleChange}
                      label="Fosa Séptica y Pozo"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="drenajeDesfogueARio"
                      checked={formData.drenajeDesfogueARio}
                      onChange={handleChange}
                      label="Desfogue a Río"
                      className="mb-2"
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3 mt-3">
                  <Form.Label>Servicio Más Reciente</Form.Label>
                  <Form.Control
                    type="text"
                    name="servicioMasReciente"
                    value={formData.servicioMasReciente}
                    onChange={handleChange}
                    maxLength="15"
                  />
                </Form.Group>
              </Tab>

              {/* Tab 4: Aspecto Legal */}
              <Tab eventKey="legal" title="Aspecto Legal">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Certeza Jurídica</Form.Label>
                      <Form.Control
                        type="text"
                        name="certezaJuridica"
                        value={formData.certezaJuridica}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Predio a Nombre De</Form.Label>
                      <Form.Control
                        type="text"
                        name="predioANombreDe"
                        value={formData.predioANombreDe}
                        onChange={handleChange}
                        maxLength="100"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Condición del Edificio</Form.Label>
                      <Form.Select
                        name="condicionEdificio"
                        value={formData.condicionEdificio}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Malo">Malo</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="cuentaConPredio"
                      checked={formData.cuentaConPredio}
                      onChange={handleChange}
                      label="Cuenta con Predio"
                      className="mt-4"
                    />
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Daño al Edificio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="dañoAEdificio"
                    value={formData.dañoAEdificio}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="esPrioritario"
                      checked={formData.esPrioritario}
                      onChange={handleChange}
                      label="Es Prioritario"
                      className="mb-2"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Check
                      type="checkbox"
                      name="programaDeRemozamiento"
                      checked={formData.programaDeRemozamiento}
                      onChange={handleChange}
                      label="Programa de Remozamiento"
                      className="mb-2"
                    />
                  </Col>
                </Row>
              </Tab>

              {/* Tab 5: Mobiliario */}
              <Tab eventKey="mobiliario" title="Mobiliario">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Escritorios</Form.Label>
                      <Form.Control
                        type="number"
                        name="noEscritorios"
                        value={formData.noEscritorios}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Mesas Hexagonales</Form.Label>
                      <Form.Control
                        type="number"
                        name="noMesasHexagonales"
                        value={formData.noMesasHexagonales}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Pizarras</Form.Label>
                      <Form.Control
                        type="number"
                        name="noPizarras"
                        value={formData.noPizarras}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Cátedras</Form.Label>
                      <Form.Control
                        type="number"
                        name="noCatedras"
                        value={formData.noCatedras}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Solicitud de Mobiliario Relacionada</Form.Label>
                  <Form.Select
                    name="idSolicitud"
                    value={formData.idSolicitud}
                    onChange={handleChange}
                  >
                    <option value="">Ninguna</option>
                    {necesidadesMobiliario.map(n => (
                      <option key={n.idNecesidad} value={n.idNecesidad}>
                        {n.escuela?.nombre} - {new Date(n.fechaReporte).toLocaleDateString()}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Tab>

              {/* Tab 6: Observaciones */}
              <Tab eventKey="observaciones" title="Observaciones">
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones Generales</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Ingrese cualquier observación adicional..."
                  />
                </Form.Group>
              </Tab>
            </Tabs>
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

export default InfraestructuraEscolar;