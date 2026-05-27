// Base de datos simulada en LocalStorage para el MVP
// Esto facilita la migración directa a Supabase en la siguiente fase

const SEED_USERS = [
  {
    id: 'admin-test-id',
    email: 'admin@nomadahub.es',
    password: 'admin123',
    name: 'Carlos Admin',
    role: 'admin',
    passport: 'PA102030',
    nie: 'X1020304-Y',
    address: 'Calle Serrano 14, 2B',
    postalCode: '28001',
    arrivalDate: '2025-01-01',
    absences: 0,
    aeatDate: null,
    ssDate: null,
    residencyDoc: null
  },
  {
    id: 'nomada-test-id',
    email: 'nomada@nomadahub.es',
    password: 'nomada123',
    name: 'Juan Pérez',
    role: 'student',
    passport: 'PA987654',
    nie: 'Y1234567-X',
    address: 'Calle Gran Vía 12, 4A',
    postalCode: '28013',
    arrivalDate: '2026-01-15',
    absences: 12,
    aeatDate: '2026-02-10',
    ssDate: '2026-02-15',
    allowedResources: ['1', '3'],
    residencyDoc: {
      name: 'Resolucion_Extranjeria_Aprobada.pdf',
      size: '840 KB',
      uploadedAt: '2026-03-01T15:24:00Z',
      url: '#'
    }
  }
];

const SEED_RESOURCES = [
  {
    id: '1',
    title: 'Guía Completa del Visado de Nómada Digital en España',
    type: 'document', // 'document', 'video', 'presentation'
    url: 'https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Servicios-Consulares.aspx',
    description: 'Documento oficial con los requisitos, plazos y documentos necesarios para solicitar el visado de nómada digital desde el consulado o en España.',
    category: 'Trámites y Visados',
    tags: ['Visado', 'Trámites', 'Legal'],
    created_at: new Date('2026-04-10T10:00:00Z').toISOString()
  },
  {
    id: '2',
    title: 'Cómo registrarse como Autónomo paso a paso',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Video tutorial explicando el proceso de alta en la Seguridad Social y en Hacienda para comenzar a facturar en España como nómada digital.',
    category: 'Impuestos y Autónomos',
    tags: ['Autónomo', 'Hacienda', 'Seguridad Social'],
    created_at: new Date('2026-04-15T12:30:00Z').toISOString()
  },
  {
    id: '3',
    title: 'Presentación: Impuestos para Nómadas Digitales (Ley Beckham y IRPF)',
    type: 'presentation',
    url: 'https://docs.google.com/presentation/d/1example',
    description: 'Diapositivas guía explicando las diferencias entre el IRPF ordinario y la Ley Beckham, ventajas fiscales y cómo aplicarla.',
    category: 'Impuestos y Autónomos',
    tags: ['Ley Beckham', 'IRPF', 'Impuestos'],
    created_at: new Date('2026-04-20T09:00:00Z').toISOString()
  },
  {
    id: '4',
    title: 'Mapa de Coworkings y Colivings top en España 2026',
    type: 'document',
    url: 'https://www.google.com/maps',
    description: 'Listado y mapa interactivo con los mejores espacios de coworking y opciones de coliving adaptadas para nómadas en España (comunidades activas, velocidad de internet, etc.).',
    category: 'Coworkings y Colivings',
    tags: ['Coworking', 'Coliving', 'Comunidad'],
    created_at: new Date('2026-05-01T15:45:00Z').toISOString()
  }
];

const SEED_MESSAGES = [
  {
    id: '1',
    sender_id: 'nomada-test-id',
    sender_name: 'Juan Pérez (Nómada)',
    sender_role: 'student',
    content: 'Hola, tengo una duda sobre la Ley Beckham. ¿Puedo solicitarla si soy autónomo de una empresa en EE.UU. o solo si tengo un contrato de trabajo cuenta ajena?',
    reply: '¡Hola Juan! Para acogerte a la Ley Beckham debes tener un contrato de trabajo con una empresa española o ser desplazado por una empresa extranjera. Como autónomo general es más complejo, pero si facturas a una sola startup/empresa que te contrata, hay matices. Te recomiendo ver la presentación de Impuestos y consultar con nuestro gestor asociado.',
    created_at: new Date('2026-05-24T18:30:00Z').toISOString()
  },
  {
    id: '2',
    sender_id: 'nomada-test-id',
    sender_name: 'Juan Pérez (Nómada)',
    sender_role: 'student',
    content: '¿Hay algún grupo de Slack o Telegram para los nómadas en Madrid? Me gustaría conectar con gente al llegar la próxima semana.',
    reply: null,
    created_at: new Date('2026-05-25T11:00:00Z').toISOString()
  }
];

// Inicializar base de datos
const getStorageItem = (key, defaultValue) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
};

const setStorageItem = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockDb = {
  users: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return getStorageItem('nomada_users', SEED_USERS);
    },
    create: async (userData) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const users = getStorageItem('nomada_users', SEED_USERS);
      
      // Validar correo único
      const emailExists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
      if (emailExists) {
        throw new Error('Ya existe un usuario registrado con este correo electrónico.');
      }

      const newUser = {
        id: Date.now().toString(),
        absences: 0,
        aeatDate: null,
        ssDate: null,
        residencyDoc: null,
        ...userData,
        email: userData.email.toLowerCase().trim()
      };
      
      users.push(newUser);
      setStorageItem('nomada_users', users);
      return newUser;
    },
    update: async (id, userData) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const users = getStorageItem('nomada_users', SEED_USERS);
      const updated = users.map(u => {
        if (u.id === id) {
          return { ...u, ...userData };
        }
        return u;
      });
      setStorageItem('nomada_users', updated);
      return updated.find(u => u.id === id);
    },
    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const users = getStorageItem('nomada_users', SEED_USERS);
      const updated = users.filter(u => u.id !== id);
      setStorageItem('nomada_users', updated);
      return true;
    }
  },
  resources: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return getStorageItem('nomada_resources', SEED_RESOURCES);
    },
    create: async (resourceData) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const resources = getStorageItem('nomada_resources', SEED_RESOURCES);
      const newResource = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...resourceData,
        tags: typeof resourceData.tags === 'string' 
          ? resourceData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : resourceData.tags || []
      };
      resources.unshift(newResource);
      setStorageItem('nomada_resources', resources);
      return newResource;
    },
    update: async (id, resourceData) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const resources = getStorageItem('nomada_resources', SEED_RESOURCES);
      const updated = resources.map(r => {
        if (r.id === id) {
          return { 
            ...r, 
            ...resourceData,
            tags: typeof resourceData.tags === 'string' 
              ? resourceData.tags.split(',').map(t => t.trim()).filter(Boolean)
              : resourceData.tags || []
          };
        }
        return r;
      });
      setStorageItem('nomada_resources', updated);
      return updated.find(r => r.id === id);
    },
    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const resources = getStorageItem('nomada_resources', SEED_RESOURCES);
      const updated = resources.filter(r => r.id !== id);
      setStorageItem('nomada_resources', updated);
      return true;
    }
  },
  messages: {
    getAll: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return getStorageItem('nomada_messages', SEED_MESSAGES);
    },
    create: async (messageData) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const messages = getStorageItem('nomada_messages', SEED_MESSAGES);
      const newMessage = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        reply: null,
        ...messageData
      };
      messages.unshift(newMessage);
      setStorageItem('nomada_messages', messages);
      return newMessage;
    },
    reply: async (id, replyContent) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const messages = getStorageItem('nomada_messages', SEED_MESSAGES);
      const updated = messages.map(m => {
        if (m.id === id) {
          return { ...m, reply: replyContent };
        }
        return m;
      });
      setStorageItem('nomada_messages', updated);
      return updated.find(m => m.id === id);
    },
    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const messages = getStorageItem('nomada_messages', SEED_MESSAGES);
      const updated = messages.filter(m => m.id !== id);
      setStorageItem('nomada_messages', updated);
      return true;
    }
  }
};
