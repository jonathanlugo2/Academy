// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login</p>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><p>admin</p></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><p>dashboard</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe('ProtectedRoute', () => {
  it('sin sesión redirige al login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('login')).toBeTruthy();
  });

  it('muestra la página si el rol coincide', () => {
    useAuth.mockReturnValue({ user: { role: 'student' }, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('dashboard')).toBeTruthy();
  });

  it('lleva a cada rol a su propia página', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' }, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('admin')).toBeTruthy();
  });

  it('un usuario sin rol válido va al login en lugar de entrar en bucle (B1)', () => {
    useAuth.mockReturnValue({ user: { id: 'x', role: undefined }, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('login')).toBeTruthy();
  });
});
