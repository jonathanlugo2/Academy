import { useState, useEffect, useMemo, useRef } from 'react';
import { Navigate, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { LogOut, Shield, Sun, Moon, ChevronDown, KeyRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { RESOURCE_CATEGORIES } from '../features/resources/resourceMeta';
import { indexProgress, isLessonCompleted, resumeLesson } from '../lib/courses';
import { hasFiscalProfile, hasSupportChannel, roleLabel } from '../lib/roles';

import StudentSidebar from '../features/student/StudentSidebar';
import CourseDirectory from '../features/student/CourseDirectory';
import CoursePlayer from '../features/student/CoursePlayer';
import CommunicationPanel from '../features/student/CommunicationPanel';
import FiscalDossier from '../features/student/FiscalDossier';
import ChangePasswordModal from '../features/account/ChangePasswordModal';
import ErrorBanner from './ErrorBanner';

// 2 filas de 4 tarjetas en escritorio
const COURSES_PER_PAGE = 8;
const CATEGORIES = ['all', ...RESOURCE_CATEGORIES];
const COURSE_ROUTE = '/dashboard/curso/:courseId/:lessonId?';
const courseUrl = (courseId, lessonId) => `/dashboard/curso/${courseId}${lessonId ? `/${lessonId}` : ''}`;

export default function StudentDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // La formación abierta va en la URL para poder recargar o compartir el enlace
  const courseMatch = matchPath(COURSE_ROUTE, location.pathname);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState('resources'); // 'resources', 'fiscal', 'support'
  // Los asesores solo tienen formaciones
  const showFiscal = hasFiscalProfile(user?.role);
  const showSupport = hasSupportChannel(user?.role);
  const tabAllowed = (tab) => tab === 'resources' || (tab === 'fiscal' && showFiscal) || (tab === 'support' && showSupport);
  const activeTab = courseMatch || !tabAllowed(selectedTab) ? 'resources' : selectedTab;
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Menú desplegable del perfil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const [coursesPage, setCoursesPage] = useState(1);

  // Datos
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Mensajes del ticket seleccionado (se guardan junto al id para saber si están cargados)
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [messagesState, setMessagesState] = useState({ ticketId: null, messages: [] });
  const ticketMessages = selectedTicketId && messagesState.ticketId === selectedTicketId ? messagesState.messages : [];
  const loadingMessages = Boolean(selectedTicketId) && messagesState.ticketId !== selectedTicketId;

  // Búsqueda y filtros
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState('all');

  // Formulario de soporte
  const [newMessage, setNewMessage] = useState('');
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [supportError, setSupportError] = useState('');

  // Cambiar de pestaña cierra la formación abierta; cambiar filtros vuelve a la página 1
  const setActiveTab = (tab) => {
    setSelectedTab(tab);
    if (courseMatch) navigate('/dashboard');
  };
  const setSearchQuery = (value) => {
    setSearchQueryState(value);
    setCoursesPage(1);
  };
  const setSelectedCategory = (value) => {
    setSelectedCategoryState(value);
    setCoursesPage(1);
  };

  const progressByLesson = useMemo(() => indexProgress(progress), [progress]);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return courses.filter(course => {
      const matchesSearch =
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.tags.some(t => t.toLowerCase().includes(query)) ||
        course.lessons.some(l => l.title.toLowerCase().includes(query));
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    // La RLS limita formaciones (publicadas y asignadas), progreso y tickets al alumno
    Promise.all([api.courses.getAll(), api.progress.getMine(userId), showSupport ? api.tickets.getAll() : []])
      .then(([courseList, progressList, ticketsList]) => {
        if (!active) return;
        setCourses(courseList);
        setProgress(progressList);
        setTickets(ticketsList.filter(t => t.student_id === userId));
        setLoadError('');
      })
      .catch(e => {
        console.error('Error al cargar datos:', e);
        if (active) setLoadError('No se pudieron cargar tus datos. Recarga la página o inténtalo más tarde.');
      })
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [userId, showSupport]);

  useEffect(() => {
    if (!selectedTicketId) return undefined;
    let active = true;
    api.tickets.getMessages(selectedTicketId)
      .then(messages => active && setMessagesState({ ticketId: selectedTicketId, messages }))
      .catch(err => {
        console.error('Error al cargar mensajes del ticket:', err);
        if (active) {
          setMessagesState({ ticketId: selectedTicketId, messages: [] });
          setSupportError('No se pudieron cargar los mensajes de este ticket.');
        }
      });
    return () => { active = false; };
  }, [selectedTicketId]);

  const reloadTickets = async () => {
    const ticketsList = await api.tickets.getAll();
    setTickets(ticketsList.filter(t => t.student_id === userId));
  };

  const handleCreateTicket = async (e, attachment = null) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newMessage.trim()) return;

    setSendingMessage(true);
    setSuccessMsg('');
    setSupportError('');
    try {
      const ticket = await api.tickets.create({
        title: newTicketTitle.trim(),
        content: newMessage.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null
      });

      setNewTicketTitle('');
      setNewMessage('');
      setSuccessMsg('Tu ticket de soporte ha sido creado con éxito.');
      await reloadTickets();
      if (ticket?.id) setSelectedTicketId(ticket.id);
    } catch (err) {
      setSupportError('Error al crear el ticket: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendTicketMessage = async (e, attachment = null) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId) return;

    setSendingMessage(true);
    setSupportError('');
    try {
      const newMsg = await api.tickets.createMessage({
        ticket_id: selectedTicketId,
        sender_id: user.id,
        content: newMessage.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null
      });

      setNewMessage('');
      setMessagesState(prev => (
        prev.ticketId === selectedTicketId ? { ...prev, messages: [...prev.messages, newMsg] } : prev
      ));
      await reloadTickets();
    } catch (err) {
      setSupportError('Error al enviar el mensaje: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUploadAttachment = (file) => api.tickets.uploadAttachment(file, user.id);

  const mergeProgress = (row) => setProgress(prev => [...prev.filter(p => p.lessonId !== row.lessonId), row]);

  const handleToggleCompleted = async (lessonId) => {
    try {
      mergeProgress(await api.progress.set(lessonId, { completed: !isLessonCompleted(progressByLesson, lessonId) }));
    } catch (err) {
      console.error('Error al actualizar progreso:', err);
      setLoadError('No se pudo guardar tu progreso. Inténtalo de nuevo.');
    }
  };

  // Registrar la visita permite reanudar en la última lección abierta
  const handleVisitLesson = (lessonId) => {
    api.progress.set(lessonId).then(mergeProgress).catch(err => console.error('Error al registrar la visita:', err));
  };

  const handleOpenMaterial = async (material) => {
    if (!material.storagePath) {
      window.open(material.url, '_blank', 'noopener,noreferrer');
      return;
    }
    // La pestaña se abre antes de firmar la URL para que no la bloquee el navegador
    const win = window.open('', '_blank');
    try {
      const url = await api.materials.getDownloadUrl(material);
      if (win) {
        win.opener = null;
        win.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      win?.close();
      setLoadError('No se pudo descargar el material: ' + err.message);
    }
  };

  const totalCoursesPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE) || 1;
  const currentCoursesPage = Math.min(coursesPage, totalCoursesPages);
  const paginatedCourses = filteredCourses.slice((currentCoursesPage - 1) * COURSES_PER_PAGE, currentCoursesPage * COURSES_PER_PAGE);

  // Formación y lección abiertas según la URL
  const openCourse = courseMatch && courses.find(c => c.id === courseMatch.params.courseId);
  const openLesson = openCourse && openCourse.lessons.find(l => l.id === courseMatch.params.lessonId);

  const renderCourse = () => {
    if (!openCourse || openCourse.lessons.length === 0) {
      return (
        <div className="m-6 py-16 flex flex-col items-center gap-4 text-text-muted bg-bg-card border border-border-main rounded-3xl">
          <p className="text-xs font-mono uppercase tracking-wider">Esta formación no está disponible.</p>
          <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-text-active font-mono uppercase cursor-pointer hover:underline">
            Volver a mis formaciones
          </button>
        </div>
      );
    }
    if (!openLesson) {
      return <Navigate replace to={courseUrl(openCourse.id, resumeLesson(openCourse, progressByLesson).id)} />;
    }
    return (
      <CoursePlayer
        course={openCourse}
        lesson={openLesson}
        progressByLesson={progressByLesson}
        userEmail={user.email}
        onSelectLesson={(lessonId) => navigate(courseUrl(openCourse.id, lessonId))}
        onBack={() => navigate('/dashboard')}
        onToggleCompleted={handleToggleCompleted}
        onVisit={handleVisitLesson}
        onOpenMaterial={handleOpenMaterial}
      />
    );
  };


  if (!user) return null;

  return (
    <div className="h-screen overflow-hidden bg-bg-main flex flex-col md:flex-row text-text-main font-sans transition-colors duration-200">
      
      {/* SIDEBAR */}
      <StudentSidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showSupport={showSupport}
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0">
        <header className="h-16 border-b border-border-main bg-bg-card backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-40">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-title font-mono">
            {activeTab === 'resources' && 'RECURSOS DEL SISTEMA // FORMACIONES'}
            {activeTab === 'fiscal' && 'DOSSIER FISCAL // ESTADO'}
            {activeTab === 'support' && 'COMUNICACIÓN DIRECTA // SOPORTE'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-text-active bg-bg-active border border-border-active px-3 py-1.5 rounded-xl font-bold font-mono uppercase tracking-wider hidden sm:inline-block">
              {user.role === 'advisor' ? 'Equipo Asidne' : 'Nómada Activo'}
            </div>
            
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 pl-3 border-l border-border-main hover:opacity-85 transition-opacity cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-bg-input border border-border-main flex items-center justify-center font-bold text-text-active text-xs font-mono shadow-sm">
                  {user?.name?.charAt(0) || 'N'}
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-text-title leading-none">{user?.name}</p>
                    <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-[9px] text-text-muted mt-1 uppercase tracking-wider font-bold font-mono leading-none">{roleLabel(user?.role)}</p>
                </div>
              </button>

              {isProfileMenuOpen && (
                <>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-56 bg-bg-card border border-border-main rounded-2xl p-2 shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 border-b border-border-main/50 mb-1.5">
                      <p className="text-xs font-bold text-text-title truncate">{user?.name}</p>
                      <p className="text-[9px] text-text-muted truncate mt-0.5">{user?.email}</p>
                    </div>

                    {showFiscal && (
                      <button
                        onClick={() => {
                          setActiveTab('fiscal');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold font-mono uppercase tracking-wider text-text-muted hover:text-text-main hover:bg-bg-input rounded-xl transition-all cursor-pointer text-left font-mono"
                      >
                        <Shield className="w-4 h-4 text-text-active" />
                        Mi Perfil Fiscal
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowChangePassword(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold font-mono uppercase tracking-wider text-text-muted hover:text-text-main hover:bg-bg-input rounded-xl transition-all cursor-pointer text-left font-mono"
                    >
                      <KeyRound className="w-4 h-4 text-text-active" />
                      Cambiar Contraseña
                    </button>

                    <button
                      onClick={() => {
                        toggleTheme();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold font-mono uppercase tracking-wider text-text-muted hover:text-text-main hover:bg-bg-input rounded-xl transition-all cursor-pointer text-left font-mono"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4 text-amber-400" />
                          Modo Claro
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 text-indigo-500" />
                          Modo Oscuro
                        </>
                      )}
                    </button>

                    <div className="border-t border-border-main/50 my-1.5" />

                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold font-mono uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer text-left font-mono"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-bg-main">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-xs text-text-muted font-mono uppercase tracking-wider">Loading System Data...</p>
            </div>
          </div>
        ) : (
          <div className={`flex-1 ${courseMatch ? 'p-0 h-full overflow-hidden bg-bg-main' : `p-6 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto no-scrollbar`}`}>

            <ErrorBanner message={loadError} onClose={() => setLoadError('')} />

            {activeTab === 'resources' && (
              courseMatch ? renderCourse() : (
                <CourseDirectory 
                  user={user}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={CATEGORIES}
                  filteredCourses={filteredCourses}
                  paginatedCourses={paginatedCourses}
                  setCoursesPage={setCoursesPage}
                  totalCoursesPages={totalCoursesPages}
                  currentCoursesPage={currentCoursesPage}
                  progressByLesson={progressByLesson}
                  onOpenCourse={(course) => navigate(courseUrl(course.id))}
                />
              )
            )}

            {activeTab === 'fiscal' && (
              <FiscalDossier user={user} refreshUser={refreshUser} />
            )}

            {activeTab === 'support' && (
              <ErrorBanner message={supportError} onClose={() => setSupportError('')} />
            )}

            {activeTab === 'support' && (
              <CommunicationPanel 
                successMsg={successMsg}
                setSuccessMsg={setSuccessMsg}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                newTicketTitle={newTicketTitle}
                setNewTicketTitle={setNewTicketTitle}
                sendingMessage={sendingMessage}
                handleCreateTicket={handleCreateTicket}
                handleSendTicketMessage={handleSendTicketMessage}
                handleUploadAttachment={handleUploadAttachment}
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                setSelectedTicketId={setSelectedTicketId}
                ticketMessages={ticketMessages}
                loadingMessages={loadingMessages}
              />
            )}

          </div>
        )}
      </main>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}
