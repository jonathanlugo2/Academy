import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Download,
  ExternalLink, FileText, Paperclip, PlayCircle
} from 'lucide-react';
import LessonPlayer from '../resources/LessonPlayer';
import { ResourceIcon, resourceTypeLabel } from '../resources/resourceMeta';
import {
  adjacentLessons, courseLevelMaterials, courseProgress, formatClock, formatFileSize, formatTotal,
  isLessonCompleted, lessonMaterials, plural
} from '../../lib/courses';

// Contenidos que necesitan más alto que un vídeo 16:9
const TALL_TYPES = ['test', 'document'];

function ProgressBar({ percent }) {
  return (
    <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden border border-border-main/50">
      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
    </div>
  );
}

function LessonStatusButton({ title, completed, current, onToggle }) {
  const label = completed ? `Marcar «${title}» como pendiente` : `Marcar «${title}» como completada`;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      aria-label={label}
      className="shrink-0 cursor-pointer rounded-full hover:scale-110 transition-transform"
    >
      {completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        : current ? <PlayCircle className="w-5 h-5 text-indigo-500" />
        : <Circle className="w-5 h-5 text-text-muted/60" />}
    </button>
  );
}

// Temario lateral: capítulos plegables con el estado de cada lección
function Curriculum({ course, currentLessonId, progressByLesson, onSelect, onToggleCompleted }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleSection = (id) => setCollapsed(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="space-y-3">
      {course.sections.filter(s => s.lessons.length > 0).map((section, index) => {
        const done = section.lessons.filter(l => isLessonCompleted(progressByLesson, l.id)).length;
        const seconds = section.lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0);
        const isOpen = !collapsed.has(section.id);
        return (
          <div key={section.id} className="border border-border-main rounded-2xl overflow-hidden bg-bg-card/40">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
              className="w-full flex items-start gap-2 px-3.5 py-3 text-left cursor-pointer hover:bg-bg-input/50"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-extrabold text-text-title font-mono uppercase tracking-wide">
                  {index + 1}. {section.title}
                </span>
                <span className="block text-[9px] text-text-muted font-mono uppercase mt-0.5">
                  {done}/{section.lessons.length} completadas{seconds > 0 && ` · ${formatTotal(seconds)}`}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <ul className="border-t border-border-main/60">
                {section.lessons.map(lesson => {
                  const isCurrent = lesson.id === currentLessonId;
                  const completed = isLessonCompleted(progressByLesson, lesson.id);
                  return (
                    <li
                      key={lesson.id}
                      className={`flex items-center gap-3 pl-3.5 transition-colors border-l-2 ${
                        isCurrent ? 'bg-bg-active border-l-indigo-500' : 'border-l-transparent hover:bg-bg-input/60'
                      }`}
                    >
                      <LessonStatusButton title={lesson.title} completed={completed} current={isCurrent} onToggle={() => onToggleCompleted(lesson.id)} />
                      <button
                        type="button"
                        aria-current={isCurrent ? 'true' : undefined}
                        onClick={() => onSelect(lesson.id)}
                        className="flex-1 min-w-0 py-2.5 pr-3.5 text-left cursor-pointer"
                      >
                        <span className={`block text-xs leading-snug ${isCurrent ? 'font-bold text-text-active' : 'font-semibold text-text-main'}`}>
                          {lesson.title}
                        </span>
                        <span className="flex items-center gap-1.5 text-[9px] text-text-muted font-mono uppercase mt-0.5">
                          <ResourceIcon type={lesson.type} size="w-3 h-3" />
                          {resourceTypeLabel(lesson.type)}
                          {lesson.durationSeconds != null && ` · ${formatClock(lesson.durationSeconds)}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MaterialRow({ material, onOpen }) {
  const isFile = Boolean(material.storagePath);
  return (
    <li className="flex items-center gap-3 p-3 bg-bg-card border border-border-main rounded-2xl">
      <span className="w-9 h-9 rounded-xl bg-bg-input border border-border-main flex items-center justify-center shrink-0">
        {isFile ? <FileText className="w-4 h-4 text-text-active" /> : <ExternalLink className="w-4 h-4 text-text-active" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-bold text-text-main truncate">{material.title}</span>
        <span className="block text-[9px] text-text-muted font-mono uppercase truncate">
          {isFile ? [material.fileName?.split('.').pop(), formatFileSize(material.sizeBytes)].filter(Boolean).join(' · ') : 'Enlace externo'}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onOpen(material)}
        className="shrink-0 px-3 py-2 rounded-xl border border-border-main bg-bg-input hover:border-border-hover text-[10px] font-bold font-mono uppercase tracking-wider text-text-muted hover:text-text-main flex items-center gap-1.5 cursor-pointer"
      >
        {isFile ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
        {isFile ? 'Descargar' : 'Abrir'}
      </button>
    </li>
  );
}

function Materials({ course, lessonId, onOpen }) {
  const ofLesson = lessonMaterials(course, lessonId);
  const ofCourse = courseLevelMaterials(course);
  if (ofLesson.length + ofCourse.length === 0) {
    return <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest text-center py-8">Esta formación no tiene materiales de apoyo</p>;
  }
  return (
    <div className="space-y-5">
      {[['De esta lección', ofLesson], ['De la formación', ofCourse]].filter(([, items]) => items.length > 0).map(([title, items]) => (
        <div key={title} className="space-y-2">
          <h5 className="text-[10px] font-extrabold text-text-muted font-mono uppercase tracking-wider">{title}</h5>
          <ul className="space-y-2">{items.map(m => <MaterialRow key={m.id} material={m} onOpen={onOpen} />)}</ul>
        </div>
      ))}
    </div>
  );
}

function Overview({ course, lesson }) {
  return (
    <div className="space-y-5 text-left">
      {lesson.description && (
        <div className="space-y-1.5">
          <h5 className="text-[10px] font-extrabold text-text-muted font-mono uppercase tracking-wider">Sobre esta lección</h5>
          <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">{lesson.description}</p>
        </div>
      )}
      <div className="space-y-1.5">
        <h5 className="text-[10px] font-extrabold text-text-muted font-mono uppercase tracking-wider">Sobre la formación</h5>
        {course.description
          ? <p className="text-sm text-text-main leading-relaxed whitespace-pre-line">{course.description}</p>
          : <p className="text-xs text-text-muted italic">Sin descripción.</p>}
      </div>
      <dl className="flex flex-wrap gap-2 text-[10px] font-mono uppercase">
        {[course.category, plural(course.lessons.length, 'lección', 'lecciones'), formatTotal(course.totalSeconds)].filter(Boolean).map(item => (
          <dd key={item} className="px-2.5 py-1 rounded-lg bg-bg-input border border-border-main text-text-muted">{item}</dd>
        ))}
      </dl>
    </div>
  );
}

export default function CoursePlayer({
  course,
  lesson,
  progressByLesson,
  userEmail,
  onSelectLesson,
  onBack,
  onToggleCompleted,
  onVisit,
  onOpenMaterial
}) {
  // En móvil el temario es una pestaña más; en escritorio va en la columna derecha
  const [tab, setTab] = useState('curriculum');

  // Al cambiar de lección: registrar la visita y volver arriba, al reproductor
  const columnRef = useRef(null);
  const lessonId = lesson.id;
  useEffect(() => {
    onVisit(lessonId);
    columnRef.current?.scrollTo({ top: 0 });
  }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { prev, next } = adjacentLessons(course, lesson.id);
  const progress = courseProgress(course, progressByLesson);
  const completed = isLessonCompleted(progressByLesson, lesson.id);
  const lessonIndex = course.lessons.findIndex(l => l.id === lesson.id);
  const section = course.sections.find(s => s.id === lesson.sectionId);
  const materialsCount = lessonMaterials(course, lesson.id).length + courseLevelMaterials(course).length;

  const tabs = [
    { id: 'curriculum', label: 'Contenido', mobileOnly: true },
    { id: 'overview', label: 'Descripción' },
    { id: 'materials', label: `Materiales${materialsCount ? ` (${materialsCount})` : ''}` },
  ];
  // En escritorio la pestaña "Contenido" no existe: se muestra Descripción
  const tabState = (id) => {
    if (tab === id) return 'active';
    if (id === 'overview' && tab === 'curriculum') return 'desktop-active';
    return 'inactive';
  };
  const tabClass = {
    active: 'bg-bg-active text-text-active border-border-active',
    'desktop-active': 'text-text-muted border-transparent lg:bg-bg-active lg:text-text-active lg:border-border-active',
    inactive: 'text-text-muted border-transparent hover:text-text-main',
  };
  const panelClass = (id) => ({ active: 'block', 'desktop-active': 'hidden lg:block', inactive: 'hidden' }[tabState(id)]);

  const curriculum = (
    <Curriculum
      course={course}
      currentLessonId={lesson.id}
      progressByLesson={progressByLesson}
      onSelect={onSelectLesson}
      onToggleCompleted={onToggleCompleted}
    />
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-bg-main">
      {/* Columna principal */}
      <div ref={columnRef} className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto p-4 lg:p-6 gap-5">
        <div className="flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors cursor-pointer font-mono uppercase shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Mis formaciones</span>
          </button>
          <h2 className="flex-1 min-w-0 text-right text-[11px] font-bold text-text-title font-mono uppercase tracking-wide truncate">
            {course.title}
          </h2>
        </div>

        {/* Reproductor: los vídeos quedan fijos arriba en móvil; los PDF y tests
            son altos y taparían el resto, así que se desplazan con la página */}
        <div className={`-mx-4 lg:mx-0 bg-black lg:rounded-3xl border-y lg:border border-border-main overflow-hidden shadow-md shrink-0 ${
          TALL_TYPES.includes(lesson.type) ? 'h-[60vh] lg:h-[620px]' : 'aspect-video sticky -top-4 z-20 lg:static'
        }`}>
          <LessonPlayer key={lesson.id} lesson={lesson} userEmail={userEmail} />
        </div>

        {/* Lección actual y navegación */}
        <div className="bg-bg-card border border-border-main rounded-3xl p-5 space-y-4 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
                {section && `${section.title} · `}Lección {lessonIndex + 1} de {course.lessons.length}
              </p>
              <h3 className="text-lg font-bold text-text-title leading-snug">{lesson.title}</h3>
            </div>
            <button
              onClick={() => onToggleCompleted(lesson.id)}
              className={`py-3 px-5 rounded-2xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border shrink-0 ${
                completed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {completed ? 'Completada' : 'Marcar como completada'}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              disabled={!prev}
              onClick={() => prev && onSelectLesson(prev.id)}
              className="flex-1 min-w-0 py-3 px-4 rounded-2xl bg-bg-input border border-border-main hover:border-border-hover disabled:opacity-40 disabled:pointer-events-none text-left cursor-pointer transition-all"
            >
              <span className="flex items-center gap-1 text-[9px] text-text-muted font-mono uppercase font-bold"><ChevronLeft className="w-3.5 h-3.5" />Anterior</span>
              <span className="block text-xs text-text-main font-semibold truncate mt-0.5">{prev ? prev.title : 'Es la primera lección'}</span>
            </button>
            <button
              disabled={!next}
              onClick={() => next && onSelectLesson(next.id)}
              className={`flex-1 min-w-0 py-3 px-4 rounded-2xl border disabled:opacity-40 disabled:pointer-events-none text-right cursor-pointer transition-all ${
                completed && next ? 'bg-bg-active border-border-active' : 'bg-bg-input border-border-main hover:border-border-hover'
              }`}
            >
              <span className="flex items-center justify-end gap-1 text-[9px] text-text-muted font-mono uppercase font-bold">Siguiente<ChevronRight className="w-3.5 h-3.5" /></span>
              <span className="block text-xs text-text-main font-semibold truncate mt-0.5">{next ? next.title : 'Es la última lección'}</span>
            </button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="shrink-0 space-y-4">
          <div role="tablist" className="flex gap-1 bg-bg-input p-1.5 rounded-2xl border border-border-main">
            {tabs.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 text-center text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                  tabClass[tabState(t.id)]} ${t.mobileOnly ? 'lg:hidden' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className={`${panelClass('curriculum')} lg:hidden space-y-3`}>
            <div className="flex items-center gap-3 text-[10px] font-bold font-mono uppercase">
              <ProgressBar percent={progress.percent} />
              <span className="text-indigo-500 shrink-0">{progress.completed}/{progress.total}</span>
            </div>
            {curriculum}
          </div>
          <div className={panelClass('overview')}><Overview course={course} lesson={lesson} /></div>
          <div className={panelClass('materials')}><Materials course={course} lessonId={lesson.id} onOpen={onOpenMaterial} /></div>
        </div>
      </div>

      {/* Columna derecha: temario (escritorio) */}
      <aside className="hidden lg:flex w-96 border-l border-border-main bg-bg-sidebar flex-col h-full shrink-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-main bg-bg-input shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-title uppercase tracking-widest flex items-center gap-2 font-mono">
              <BookOpen className="w-4 h-4 text-text-active" />
              Contenido
            </span>
            <span className="text-[10px] font-bold text-indigo-500 font-mono">{progress.completed}/{progress.total} · {progress.percent}%</span>
          </div>
          <ProgressBar percent={progress.percent} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{curriculum}</div>
        {materialsCount > 0 && (
          <button
            onClick={() => setTab('materials')}
            className="px-5 py-3.5 border-t border-border-main bg-bg-input text-[10px] text-text-muted hover:text-text-main font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {plural(materialsCount, 'material de apoyo', 'materiales de apoyo')}
          </button>
        )}
      </aside>
    </div>
  );
}
