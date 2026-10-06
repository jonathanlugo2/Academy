import { describe, expect, it } from 'vitest';
import {
  adjacentLessons,
  courseLevelMaterials,
  courseProgress,
  formatClock,
  formatFileSize,
  formatTotal,
  indexProgress,
  lessonMaterials,
  mapCourse,
  mapProgress,
  moveItem,
  parseDuration,
  plural,
  resumeLesson
} from './courses';

const lessonRow = (id, position, duration = null) => ({
  id, course_id: 'c1', section_id: 's', title: id, type: 'video', url: 'https://youtu.be/x',
  storage_path: null, duration_seconds: duration, position, created_at: '2026-10-01'
});

// Capítulos y lecciones llegan desordenados de la BD
const course = mapCourse({
  id: 'c1',
  title: 'Curso',
  description: null,
  is_published: true,
  course_sections: [
    { id: 's2', title: 'Dos', position: 2, lessons: [lessonRow('l3', 1, 120)] },
    { id: 's1', title: 'Uno', position: 1, lessons: [lessonRow('l2', 2, 60), lessonRow('l1', 1, 30)] }
  ],
  course_materials: [
    { id: 'm2', course_id: 'c1', lesson_id: 'l1', title: 'Plantilla', storage_path: 'p.xlsx', position: 1 },
    { id: 'm1', course_id: 'c1', lesson_id: null, title: 'Guía', storage_path: 'g.pdf', position: 0 }
  ],
  course_enrollments: [{ student_id: 'a' }]
});

const progress = (rows) => indexProgress(rows.map(mapProgress));

describe('mapCourse', () => {
  it('ordena capítulos y lecciones y aplana el temario', () => {
    expect(course.sections.map(s => s.id)).toEqual(['s1', 's2']);
    expect(course.lessons.map(l => l.id)).toEqual(['l1', 'l2', 'l3']);
  });

  it('suma la duración y normaliza campos vacíos', () => {
    expect(course.totalSeconds).toBe(210);
    expect(course.description).toBe('');
    expect(course.studentIds).toEqual(['a']);
  });

  it('separa materiales de la formación y de cada lección', () => {
    expect(courseLevelMaterials(course).map(m => m.id)).toEqual(['m1']);
    expect(lessonMaterials(course, 'l1').map(m => m.id)).toEqual(['m2']);
    expect(lessonMaterials(course, 'l2')).toEqual([]);
  });

  it('admite una formación sin capítulos', () => {
    const empty = mapCourse({ id: 'x', title: 'Vacía', is_published: false });
    expect(empty.lessons).toEqual([]);
    expect(courseProgress(empty, new Map())).toEqual({ completed: 0, total: 0, percent: 0 });
    expect(resumeLesson(empty, new Map())).toBeNull();
  });
});

describe('progreso', () => {
  const p = progress([
    { lesson_id: 'l1', course_id: 'c1', completed_at: '2026-10-02', updated_at: '2026-10-02T10:00:00Z' },
    { lesson_id: 'l3', course_id: 'c1', completed_at: null, updated_at: '2026-10-03T10:00:00Z' }
  ]);

  it('cuenta solo las lecciones completadas', () => {
    expect(courseProgress(course, p)).toEqual({ completed: 1, total: 3, percent: 33 });
  });

  it('reanuda en la última lección abierta', () => {
    expect(resumeLesson(course, p).id).toBe('l3');
  });

  it('empieza por la primera lección si no hay progreso', () => {
    expect(resumeLesson(course, new Map()).id).toBe('l1');
  });

  it('ignora el progreso de lecciones que ya no existen', () => {
    const stale = progress([{ lesson_id: 'borrada', course_id: 'c1', completed_at: '2026-10-02', updated_at: '2026-10-09' }]);
    expect(resumeLesson(course, stale).id).toBe('l1');
    expect(courseProgress(course, stale).completed).toBe(0);
  });
});

describe('adjacentLessons', () => {
  it('cruza los límites de capítulo', () => {
    expect(adjacentLessons(course, 'l2')).toMatchObject({ prev: { id: 'l1' }, next: { id: 'l3' } });
  });

  it('no tiene anterior en la primera ni siguiente en la última', () => {
    expect(adjacentLessons(course, 'l1').prev).toBeNull();
    expect(adjacentLessons(course, 'l3').next).toBeNull();
    expect(adjacentLessons(course, 'otra')).toEqual({ prev: null, next: null });
  });
});

describe('duraciones', () => {
  it('formatClock', () => {
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(null)).toBe('');
  });

  it('formatTotal', () => {
    expect(formatTotal(0)).toBe('');
    expect(formatTotal(20)).toBe('1 min');
    expect(formatTotal(2700)).toBe('45 min');
    expect(formatTotal(3900)).toBe('1 h 5 min');
    expect(formatTotal(7200)).toBe('2 h');
  });

  it('parseDuration', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('12')).toBe(720);
    expect(parseDuration('4:30')).toBe(270);
    expect(parseDuration('1:02:05')).toBe(3725);
    expect(parseDuration('4:75')).toBeNaN();
    expect(parseDuration('abc')).toBeNaN();
  });
});

describe('moveItem', () => {
  it('intercambia con el vecino', () => {
    expect(moveItem(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
  });

  it('no se sale de los extremos', () => {
    const ids = ['a', 'b'];
    expect(moveItem(ids, 'a', -1)).toBe(ids);
    expect(moveItem(ids, 'b', 1)).toBe(ids);
  });
});

it('formatFileSize', () => {
  expect(formatFileSize(500)).toBe('1 KB');
  expect(formatFileSize(250 * 1024)).toBe('250 KB');
  expect(formatFileSize(3 * 1024 * 1024)).toBe('3 MB');
  expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
});

it('plural', () => {
  expect(plural(1, 'lección', 'lecciones')).toBe('1 lección');
  expect(plural(0, 'lección', 'lecciones')).toBe('0 lecciones');
});
