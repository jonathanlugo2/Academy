// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));

function LoginPage() {
  const from = useLocation().state?.from;
  return <p>login{from ? ` desde ${from}` : ''}</p>;
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><p>admin</p></ProtectedRoute>} />
        <Route path="/dashboard/*" element={<ProtectedRoute allowedRoles={['student']}><p>dashboard</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe('ProtectedRoute', () => {
  it('sin sesión redirige al login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('login desde /dashboard')).toBeTruthy();
  });

  it('recuerda la página pedida para volver a ella tras el login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/dashboard/curso/c1/l2');
    expect(screen.getByText('login desde /dashboard/curso/c1/l2')).toBeTruthy();
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
    expect(screen.getByText(/^login/)).toBeTruthy();
  });
});
