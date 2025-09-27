import React from 'react';
import { Nav, Navbar, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      roles: ['admin', 'user']
    },
    {
      path: '/datos-educativos',
      label: 'Datos Educativos',
      icon: '📚',
      roles: ['admin', 'user']
    },
    {
      path: '/escuelas',
      label: 'Escuelas',
      icon: '🏫',
      roles: ['admin', 'user']
    },
    {
      path: '/reportes',
      label: 'Reportes',
      icon: '📈',
      roles: ['admin', 'user']
    },
    {
      path: '/usuarios',
      label: 'Usuarios',
      icon: '👥',
      roles: ['admin']
    },
    {
      path: '/ai-predictions',
      label: 'Predicciones IA',
      icon: '🤖',
      roles: ['admin', 'user']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="bg-dark text-white vh-100 position-fixed" style={{ width: '250px', top: 0, left: 0, zIndex: 1000 }}>
      <div className="p-3 border-bottom border-secondary">
        <Navbar.Brand className="text-white">
          <strong>BI Educación</strong>
        </Navbar.Brand>
        <small className="d-block text-muted">
          {user?.username} ({user?.role})
        </small>
      </div>

      <Nav className="flex-column p-3">
        {filteredMenuItems.map((item) => (
          <Nav.Item key={item.path} className="mb-2">
            <Nav.Link
              as={Link}
              to={item.path}
              className={`text-white p-3 rounded d-flex align-items-center ${
                location.pathname === item.path ? 'bg-primary' : 'text-white-50'
              }`}
              style={{
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: location.pathname === item.path ? '#0d6efd' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = '#495057';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span className="me-3" style={{ fontSize: '1.2em' }}>
                {item.icon}
              </span>
              {item.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="position-absolute bottom-0 w-100 p-3 border-top border-secondary">
        <Button
          variant="outline-light"
          size="sm"
          className="w-100"
          onClick={logout}
        >
          🚪 Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;