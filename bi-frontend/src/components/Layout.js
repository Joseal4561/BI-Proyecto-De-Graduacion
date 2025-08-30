import React from 'react';
import { Container } from 'react-bootstrap';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        <main className="p-4">
          <Container fluid>
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default Layout;