import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { mockDb } from '../utils/mockDb';

export function AuthProvider({ children }) {
  // Inicialización perezosa de la sesión para evitar llamadas a setState en useEffect
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nomada_session');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Error cargando la sesión persistida:', e);
        localStorage.removeItem('nomada_session');
      }
    }
    return null;
  });

  const login = async (email, password) => {
    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 500));

    let usersList = await mockDb.users.getAll();

    // Auto-sanación: Garantizar que los usuarios de prueba siempre existan en el LocalStorage
    const hasAdmin = usersList.some(u => u.email.toLowerCase() === 'admin@nomadahub.es');
    const hasStudent = usersList.some(u => u.email.toLowerCase() === 'nomada@nomadahub.es');
    if (!hasAdmin || !hasStudent) {
      localStorage.removeItem('nomada_users');
      usersList = await mockDb.users.getAll();
    }

    const foundUser = usersList.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (foundUser) {
      // Guardar todo el perfil excepto la contraseña en el estado de sesión
      const { password: _, ...sessionUser } = foundUser;
      
      setUser(sessionUser);
      localStorage.setItem('nomada_session', JSON.stringify(sessionUser));
      return sessionUser;
    } else {
      throw new Error('Credenciales incorrectas. Intenta con admin@nomadahub.es / admin123 o nomada@nomadahub.es / nomada123.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nomada_session');
  };

  const refreshUser = async () => {
    if (!user) return;
    const usersList = await mockDb.users.getAll();
    const updatedUser = usersList.find(u => u.id === user.id);
    if (updatedUser) {
      const { password: _, ...sessionUser } = updatedUser;
      setUser(sessionUser);
      localStorage.setItem('nomada_session', JSON.stringify(sessionUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthProvider;
