import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Alert, 
  Spinner, 
  Form, 
  Button,
  ButtonGroup
} from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import api from '../utils/axiosConfig';
import { useAuth } from '../contexts/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportesInfraestructura = () => {
  const { user } = useAuth();
  const [datos, setDatos] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedModalidad, setSelectedModalidad] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedEscuela, setSelectedEscuela] = useState('');
  const [selectedCondicion, setSelectedCondicion] = useState('');
  const [chartType, setChartType] = useState('infrastructure'); // infrastructure, services, sports, comparison, condition

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [datos, selectedModalidad, selectedArea, selectedEscuela, selectedCondicion]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch infraestructura and escuelas
      const [infraResponse, escuelasResponse] = await Promise.all([
        api.get('/infraestructura-escolar'),
        api.get('/escuelas')
      ]);
      
      // Ensure responses are arrays
      const infraArray = Array.isArray(infraResponse.data) ? infraResponse.data : [];
      const escuelasArray = Array.isArray(escuelasResponse.data) ? escuelasResponse.data : [];
      
      setDatos(infraArray);
      setEscuelas(escuelasArray);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos de infraestructura');
      setDatos([]);
      setEscuelas([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...datos];

    if (selectedModalidad) {
      filtered = filtered.filter(item => item.modalidad === selectedModalidad);
    }

    if (selectedArea) {
      filtered = filtered.filter(item => item.area === selectedArea);
    }

    if (selectedEscuela) {
      filtered = filtered.filter(item => item.escuelaId?.toString() === selectedEscuela);
    }

    if (selectedCondicion) {
      filtered = filtered.filter(item => item.condicionEdificio === selectedCondicion);
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setSelectedModalidad('');
    setSelectedArea('');
    setSelectedEscuela('');
    setSelectedCondicion('');
  };

  // Chart Data Generators
  const getInfrastructureChartData = () => {
    const schoolData = {};
    
    filteredData.forEach(item => {
      const schoolName = item.escuela?.nombre || `Escuela ${item.escuelaId}`;
      if (!schoolData[schoolName]) {
        schoolData[schoolName] = {
          aulas: 0,
          sanitarios: 0,
          count: 0
        };
      }
      schoolData[schoolName].aulas += item.totalAulasFormales || 0;
      schoolData[schoolName].sanitarios += (item.sanitariosLavables || 0) + (item.sanitariosLetrinas || 0);
      schoolData[schoolName].count += 1;
    });

    const labels = Object.keys(schoolData);
    const aulasData = labels.map(school => schoolData[school].aulas / schoolData[school].count);
    const sanitariosData = labels.map(school => schoolData[school].sanitarios / schoolData[school].count);

    return {
      labels,
      datasets: [
        {
          label: 'Promedio de Aulas Formales',
          data: aulasData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Promedio de Sanitarios',
          data: sanitariosData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getServicesChartData = () => {
    const electricidad = filteredData.filter(item => item.servicioEnergiaElectrica).length;
    const agua = filteredData.filter(item => item.servicioAguaPotable).length;
    const drenaje = filteredData.filter(item => 
      item.drenajeRedMunicipal || item.drenajeFosaSeptica || 
      item.drenajeFosaSepticaYPozo || item.drenajeDesfogueARio
    ).length;
    const sinServicios = filteredData.length - Math.max(electricidad, agua, drenaje);

    return {
      labels: ['Electricidad', 'Agua Potable', 'Sistema de Drenaje', 'Sin Servicios Básicos'],
      datasets: [
        {
          data: [electricidad, agua, drenaje, sinServicios],
          backgroundColor: [
            'rgba(255, 206, 86, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getSportsChartData = () => {
    const polideportiva = filteredData.filter(item => item.tieneCanchaPolideportiva).length;
    const baloncesto = filteredData.filter(item => item.tieneCanchaBaloncesto).length;
    const futbol = filteredData.filter(item => item.tieneCanchaFutbol).length;
    const piscina = filteredData.filter(item => item.tienePiscina).length;
    const ninguna = filteredData.filter(item => 
      !item.tieneCanchaPolideportiva && !item.tieneCanchaBaloncesto && 
      !item.tieneCanchaFutbol && !item.tienePiscina
    ).length;

    return {
      labels: ['Cancha Polideportiva', 'Cancha Baloncesto', 'Cancha Fútbol', 'Piscina', 'Sin Instalaciones Deportivas'],
      datasets: [
        {
          label: 'Número de Escuelas',
          data: [polideportiva, baloncesto, futbol, piscina, ninguna],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getModalidadAreaChartData = () => {
    const modalidades = ['Monolingüe', 'Bilingüe'];
    const areas = ['Urbana', 'Rural'];
    
    const datasets = areas.map(area => {
      const data = modalidades.map(modalidad => {
        return filteredData.filter(item => 
          item.modalidad === modalidad && item.area === area
        ).length;
      });

      return {
        label: area,
        data,
        backgroundColor: area === 'Urbana' ? 'rgba(54, 162, 235, 0.6)' : 'rgba(75, 192, 192, 0.6)',
        borderColor: area === 'Urbana' ? 'rgba(54, 162, 235, 1)' : 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      };
    });

    return {
      labels: modalidades,
      datasets
    };
  };

  const getConditionChartData = () => {
    const bueno = filteredData.filter(item => item.condicionEdificio === 'Bueno').length;
    const malo = filteredData.filter(item => item.condicionEdificio === 'Malo').length;
    const noEspecificado = filteredData.filter(item => !item.condicionEdificio).length;

    return {
      labels: ['Bueno', 'Malo', 'No Especificado'],
      datasets: [
        {
          data: [bueno, malo, noEspecificado],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(201, 203, 207, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(201, 203, 207, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getFacilitiesChartData = () => {
    const facilities = [
      { label: 'Dirección', key: 'tieneDireccion' },
      { label: 'Cocina', key: 'tieneCocina' },
      { label: 'Bodega', key: 'tieneBodega' },
      { label: 'Salón Usos Múltiples', key: 'tieneSalonUsosMultiples' },
      { label: 'Laboratorio', key: 'tieneLaboratorio' },
      { label: 'Muro Perimetral', key: 'tieneMuroPerimetral' }
    ];

    const data = facilities.map(facility => 
      filteredData.filter(item => item[facility.key]).length
    );

    return {
      labels: facilities.map(f => f.label),
      datasets: [
        {
          label: 'Número de Escuelas',
          data,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: getChartTitle(),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: getChartTitle(),
      },
    },
  };

  function getChartTitle() {
    switch (chartType) {
      case 'infrastructure':
        return 'Infraestructura por Escuela';
      case 'services':
        return 'Cobertura de Servicios Básicos';
      case 'sports':
        return 'Instalaciones Deportivas';
      case 'comparison':
        return 'Distribución por Modalidad y Área';
      case 'condition':
        return 'Condición de Edificios';
      case 'facilities':
        return 'Instalaciones Disponibles';
      default:
        return 'Reporte de Infraestructura Escolar';
    }
  }

  const renderChart = () => {
    if (filteredData.length === 0) {
      return (
        <div className="text-center py-5">
          <p className="text-muted">No hay datos disponibles para mostrar el gráfico</p>
        </div>
      );
    }

    switch (chartType) {
      case 'infrastructure':
        return <Bar data={getInfrastructureChartData()} options={chartOptions} />;
      case 'services':
        return <Doughnut data={getServicesChartData()} options={pieChartOptions} />;
      case 'sports':
        return <Bar data={getSportsChartData()} options={chartOptions} />;
      case 'comparison':
        return <Bar data={getModalidadAreaChartData()} options={chartOptions} />;
      case 'condition':
        return <Pie data={getConditionChartData()} options={pieChartOptions} />;
      case 'facilities':
        return <Bar data={getFacilitiesChartData()} options={chartOptions} />;
      default:
        return <Bar data={getInfrastructureChartData()} options={chartOptions} />;
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando datos de infraestructura...</p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .sidebar,
          [style*="width: 250px"],
          .bg-dark.text-white.vh-100 {
            display: none !important;
          }
          body > div > div:first-child {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            width: 100% !important;
          }
          .card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <Row className="mb-4 no-print">
        <Col>
          <h2>📊 Reportes de Infraestructura Escolar</h2>
          <p className="text-muted">Análisis visual de infraestructura y servicios</p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={printReport}>
            🖨️ Imprimir Reporte
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="no-print">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4 no-print">
        <Card.Header>
          <h5 className="mb-0">🔍 Filtros</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Modalidad</Form.Label>
                <Form.Select
                  value={selectedModalidad}
                  onChange={(e) => setSelectedModalidad(e.target.value)}
                >
                  <option value="">Todas las modalidades</option>
                  <option value="Monolingüe">Monolingüe</option>
                  <option value="Bilingüe">Bilingüe</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Área</Form.Label>
                <Form.Select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  <option value="Urbana">Urbana</option>
                  <option value="Rural">Rural</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Condición Edificio</Form.Label>
                <Form.Select
                  value={selectedCondicion}
                  onChange={(e) => setSelectedCondicion(e.target.value)}
                >
                  <option value="">Todas las condiciones</option>
                  <option value="Bueno">Bueno</option>
                  <option value="Malo">Malo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Escuela</Form.Label>
                <Form.Select
                  value={selectedEscuela}
                  onChange={(e) => setSelectedEscuela(e.target.value)}
                >
                  <option value="">Todas las escuelas</option>
                  {escuelas.map(escuela => (
                    <option key={escuela.id} value={escuela.id}>
                      {escuela.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Button 
            variant="outline-secondary" 
            onClick={clearFilters}
          >
            Limpiar Filtros
          </Button>
        </Card.Body>
      </Card>

      {/* Chart Type Selector */}
      <Card className="mb-4 no-print">
        <Card.Header>
          <h5 className="mb-0">📈 Tipo de Gráfico</h5>
        </Card.Header>
        <Card.Body>
          <ButtonGroup className="w-100 mb-3 flex-wrap">
            <Button 
              variant={chartType === 'infrastructure' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('infrastructure')}
            >
              🏫 Infraestructura
            </Button>
            <Button 
              variant={chartType === 'services' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('services')}
            >
              ⚡ Servicios
            </Button>
            <Button 
              variant={chartType === 'sports' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('sports')}
            >
              ⚽ Deportes
            </Button>
            <Button 
              variant={chartType === 'facilities' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('facilities')}
            >
              🏢 Instalaciones
            </Button>
            <Button 
              variant={chartType === 'comparison' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('comparison')}
            >
              📊 Modalidad/Área
            </Button>
            <Button 
              variant={chartType === 'condition' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('condition')}
            >
              🔧 Condición
            </Button>
          </ButtonGroup>
        </Card.Body>
      </Card>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-primary">
            <Card.Body className="text-center">
              <h4 className="text-primary">{filteredData.length}</h4>
              <p className="text-muted mb-0">Registros</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-success">
            <Card.Body className="text-center">
              <h4 className="text-success">
                {filteredData.length > 0 
                  ? Math.round(filteredData.reduce((sum, item) => sum + (item.totalAulasFormales || 0), 0) / filteredData.length)
                  : 0
                }
              </h4>
              <p className="text-muted mb-0">Promedio Aulas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning">
            <Card.Body className="text-center">
              <h4 className="text-warning">
                {filteredData.filter(item => item.servicioEnergiaElectrica).length}
              </h4>
              <p className="text-muted mb-0">Con Electricidad</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <h4 className="text-info">
                {filteredData.filter(item => item.servicioAguaPotable).length}
              </h4>
              <p className="text-muted mb-0">Con Agua Potable</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-danger">
            <Card.Body className="text-center">
              <h4 className="text-danger">
                {filteredData.filter(item => item.esPrioritario).length}
              </h4>
              <p className="text-muted mb-0">Prioritarias</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-secondary">
            <Card.Body className="text-center">
              <h4 className="text-secondary">
                {filteredData.filter(item => item.condicionEdificio === 'Bueno').length}
              </h4>
              <p className="text-muted mb-0">Estado Bueno</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-primary">
            <Card.Body className="text-center">
              <h4 className="text-primary">
                {filteredData.filter(item => item.tieneCanchaPolideportiva || item.tieneCanchaBaloncesto || item.tieneCanchaFutbol).length}
              </h4>
              <p className="text-muted mb-0">Con Deportivas</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-success">
            <Card.Body className="text-center">
              <h4 className="text-success">
                {filteredData.filter(item => item.tieneLaboratorio).length}
              </h4>
              <p className="text-muted mb-0">Con Laboratorio</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Chart Display */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">{getChartTitle()}</h5>
        </Card.Header>
        <Card.Body>
          <div style={{ height: '400px' }}>
            {renderChart()}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ReportesInfraestructura;