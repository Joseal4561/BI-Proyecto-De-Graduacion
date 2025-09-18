// __tests__/Dashboard.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Dashboard from './components/Dashboard';
import { AuthContext } from './../contexts/AuthContext';


const mockUser = { username: 'testuser', role: 'admin' };
const mockAuthContext = {
  user: mockUser
};

// Mock the API responses
const server = setupServer(
  rest.get('http://localhost:3000/datos-educativos', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, cantidadAlumnos: 100, tasaDesercion: '5.00', anio: 2023, semestre: 1, escuela: { nombre: 'Escuela A' } },
        { id: 2, cantidadAlumnos: 200, tasaDesercion: '15.00', anio: 2023, semestre: 2, escuela: { nombre: 'Escuela B' } },
      ])
    );
  }),
  rest.get('http://localhost:3000/escuelas', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, nombre: 'Escuela A' },
        { id: 2, nombre: 'Escuela B' },
        { id: 3, nombre: 'Escuela C' },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard Component', () => {
  test('should display statistics and recent data after a successful fetch', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Dashboard />
      </AuthContext.Provider>
    );

    // Initial state: loading spinner is visible
    expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument();

    // Wait for the data to be fetched and the component to update
    await waitFor(() => {
      // Check if the loading spinner is gone
      expect(screen.queryByText('Cargando dashboard...')).not.toBeInTheDocument();
      
      // Check if the statistics are correctly calculated and displayed
      expect(screen.getByText('2')).toBeInTheDocument(); // totalRegistros
      expect(screen.getByText('3')).toBeInTheDocument(); // totalEscuelas
      expect(screen.getByText('150')).toBeInTheDocument(); // promedioAlumnos (100+200)/2
      expect(screen.getByText('10.00%')).toBeInTheDocument(); // tasaDesercionPromedio (5.00+15.00)/2

      // Check if the recent data table is rendered with the correct information
      expect(screen.getByText('Escuela A')).toBeInTheDocument();
      expect(screen.getByText('Escuela B')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });
});