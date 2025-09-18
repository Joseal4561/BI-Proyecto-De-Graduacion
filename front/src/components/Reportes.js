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
import { Bar, Line, Pie } from 'react-chartjs-2';
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

const Reportes = () => {
  const { user } = useAuth();
  const [datos, setDatos] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSemesterSelected] = useState('');
  const [selectedEscuela, setSelectedEscuela] = useState('');
  const [chartType, setChartType] = useState('students'); // students, desercion, promocion, comparison

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [datos, selectedYear, selectedSemester, selectedEscuela]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch datos educativos and escuelas
      const [datosResponse, escuelasResponse] = await Promise.all([
        api.get('/datos-educativos'),
        api.get('/escuelas')
      ]);
      
      setDatos(datosResponse.data);
      setEscuelas(escuelasResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos para reportes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...datos];

    if (selectedYear) {
      filtered = filtered.filter(item => item.anio.toString() === selectedYear);
    }

    if (selectedSemester) {
      filtered = filtered.filter(item => item.semestre === selectedSemester);
    }

    if (selectedEscuela) {
      filtered = filtered.filter(item => item.escuelaId.toString() === selectedEscuela);
    }

    setFilteredData(filtered);
  };

  const clearFilters = () => {
    setSelectedYear('');
    setSemesterSelected('');
    setSelectedEscuela('');
  };

  const getUniqueYears = () => {
    return [...new Set(datos.map(item => item.anio))].sort((a, b) => b - a);
  };

  // Chart Data Generators
  const getStudentsChartData = () => {
    const schoolData = {};
    
    filteredData.forEach(item => {
      const schoolName = item.escuela?.nombre || `Escuela ${item.escuelaId}`;
      if (!schoolData[schoolName]) {
        schoolData[schoolName] = [];
      }
      schoolData[schoolName].push({
        year: item.anio,
        semester: item.semestre,
        students: item.cantidadAlumnos,
        inscriptions: item.numeroInscripciones
      });
    });

    const labels = Object.keys(schoolData);
    const studentsData = labels.map(school => {
      return schoolData[school].reduce((sum, record) => sum + record.students, 0) / schoolData[school].length;
    });
    const inscriptionsData = labels.map(school => {
      return schoolData[school].reduce((sum, record) => sum + record.inscriptions, 0) / schoolData[school].length;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Promedio de Alumnos',
          data: studentsData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Promedio de Inscripciones',
          data: inscriptionsData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getDesercionChartData = () => {
    const labels = filteredData.map(item => {
      const schoolName = item.escuela?.nombre || `Escuela ${item.escuelaId}`;
      return `${schoolName} (${item.anio}-${item.semestre})`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Tasa de Deserción (%)',
          data: filteredData.map(item => parseFloat(item.tasaDesercion)),
          backgroundColor: filteredData.map(item => 
            parseFloat(item.tasaDesercion) > 10 
              ? 'rgba(255, 99, 132, 0.6)' 
              : 'rgba(75, 192, 192, 0.6)'
          ),
          borderColor: filteredData.map(item => 
            parseFloat(item.tasaDesercion) > 10 
              ? 'rgba(255, 99, 132, 1)' 
              : 'rgba(75, 192, 192, 1)'
          ),
          borderWidth: 1
        }
      ]
    };
  };

  const getPromocionChartData = () => {
    const validData = filteredData.filter(item => item.tasaPromocion !== null && item.tasaPromocion !== undefined);
    
    const labels = validData.map(item => {
      const schoolName = item.escuela?.nombre || `Escuela ${item.escuelaId}`;
      return `${schoolName} (${item.anio}-${item.semestre})`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Tasa de Promoción (%)',
          data: validData.map(item => parseFloat(item.tasaPromocion || 0)),
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  };

  const getUrbanRuralChartData = () => {
    const urbanCount = filteredData.filter(item => item.esUrbana === true).length;
    const ruralCount = filteredData.filter(item => item.esUrbana === false).length;

    return {
      labels: ['Urbano', 'Rural'],
      datasets: [
        {
          data: [urbanCount, ruralCount],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const getComparisonChartData = () => {
    const years = getUniqueYears();
    const semesters = ['1', '2'];
    
    const datasets = semesters.map(semester => {
      const data = years.map(year => {
        const records = filteredData.filter(item => 
          item.anio === year && item.semestre === semester
        );
        return records.length > 0 
          ? records.reduce((sum, item) => sum + item.cantidadAlumnos, 0) / records.length
          : 0;
      });

      return {
        label: `${semester}° Semestre`,
        data,
        borderColor: semester === '1' ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
        backgroundColor: semester === '1' ? 'rgba(255, 99, 132, 0.2)' : 'rgba(54, 162, 235, 0.2)',
        fill: false,
        tension: 0.1
      };
    });

    return {
      labels: years.map(year => year.toString()),
      datasets
    };
  };

  const chartOptions = {
    responsive: true,
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
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución Urbano vs Rural',
      },
    },
  };

  function getChartTitle() {
    switch (chartType) {
      case 'students':
        return 'Promedio de Alumnos e Inscripciones por Escuela';
      case 'desercion':
        return 'Tasa de Deserción por Registro';
      case 'promocion':
        return 'Tasa de Promoción por Registro';
      case 'comparison':
        return 'Comparación de Alumnos por Año y Semestre';
      default:
        return 'Reporte Educativo';
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
      case 'students':
        return <Bar data={getStudentsChartData()} options={chartOptions} />;
      case 'desercion':
        return <Bar data={getDesercionChartData()} options={chartOptions} />;
      case 'promocion':
        return <Line data={getPromocionChartData()} options={chartOptions} />;
      case 'comparison':
        return <Line data={getComparisonChartData()} options={chartOptions} />;
      case 'urban-rural':
        return <Pie data={getUrbanRuralChartData()} options={pieChartOptions} />;
      default:
        return <Bar data={getStudentsChartData()} options={chartOptions} />;
    }
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando datos para reportes...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>📊 Reportes Educativos</h2>
          <p className="text-muted">Análisis visual de datos educativos</p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-primary" onClick={printReport}>
            🖨️ Imprimir Reporte
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">🔍 Filtros</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Año</Form.Label>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">Todos los años</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Semestre</Form.Label>
                <Form.Select
                  value={selectedSemester}
                  onChange={(e) => setSemesterSelected(e.target.value)}
                >
                  <option value="">Ambos semestres</option>
                  <option value="1">1° Semestre</option>
                  <option value="2">2° Semestre</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
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
            <Col md={2}>
              <Form.Label>&nbsp;</Form.Label>
              <Button 
                variant="outline-secondary" 
                className="d-block w-100"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Chart Type Selector */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">📈 Tipo de Gráfico</h5>
        </Card.Header>
        <Card.Body>
          <ButtonGroup className="w-100 mb-3">
            <Button 
              variant={chartType === 'students' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('students')}
            >
              👥 Alumnos
            </Button>
            <Button 
              variant={chartType === 'desercion' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('desercion')}
            >
              📉 Deserción
            </Button>
            <Button 
              variant={chartType === 'promocion' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('promocion')}
            >
              📈 Promoción
            </Button>
            <Button 
              variant={chartType === 'comparison' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('comparison')}
            >
              📊 Comparación
            </Button>
            <Button 
              variant={chartType === 'urban-rural' ? 'primary' : 'outline-primary'}
              onClick={() => setChartType('urban-rural')}
            >
              🏘️ Urbano/Rural
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
                  ? Math.round(filteredData.reduce((sum, item) => sum + item.cantidadAlumnos, 0) / filteredData.length)
                  : 0
                }
              </h4>
              <p className="text-muted mb-0">Promedio Alumnos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning">
            <Card.Body className="text-center">
              <h4 className="text-warning">
                {filteredData.length > 0 
                  ? (filteredData.reduce((sum, item) => sum + parseFloat(item.tasaDesercion), 0) / filteredData.length).toFixed(2)
                  : 0
                }%
              </h4>
              <p className="text-muted mb-0">Deserción Promedio</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info">
            <Card.Body className="text-center">
              <h4 className="text-info">
                {filteredData.filter(item => item.tasaPromocion).length > 0 
                  ? (filteredData.filter(item => item.tasaPromocion).reduce((sum, item) => sum + parseFloat(item.tasaPromocion), 0) / filteredData.filter(item => item.tasaPromocion).length).toFixed(2)
                  : 0
                }%
              </h4>
              <p className="text-muted mb-0">Promoción Promedio</p>
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

export default Reportes;