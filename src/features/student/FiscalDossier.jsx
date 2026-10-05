import { useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, Compass, Download, FileText, MapPin, Plane, Upload, User
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../lib/dates';
import {
  RESIDENCY_THRESHOLD_DAYS, calculateResidencyDays, isFiscalResident, residencyProgress
} from '../../lib/residency';

const ACCEPTED_DOC_TYPES = '.pdf,.png,.jpg,.jpeg,.webp';

// Pestaña "Dossier fiscal" del alumno: datos personales, hitos, cómputo de
// residencia y documento de extranjería.
export default function FiscalDossier({ user, refreshUser }) {
  const [absencesInput, setAbsencesInput] = useState(user.absences || 0);
  const [savingAbsences, setSavingAbsences] = useState(false);
  const [absencesSuccess, setAbsencesSuccess] = useState(false);
  const [absencesError, setAbsencesError] = useState('');

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [docError, setDocError] = useState('');

  const effectiveDays = calculateResidencyDays(user.arrivalDate, user.absences);
  const progressPercent = residencyProgress(effectiveDays);
  const isResident = isFiscalResident(effectiveDays);

  const handleSaveAbsences = async (e) => {
    e.preventDefault();
    setAbsencesSuccess(false);
    setAbsencesError('');

    const absences = Number(absencesInput);
    if (absencesInput === '' || !Number.isInteger(absences) || absences < 0 || absences > 366) {
      setAbsencesError('Introduce un número de días entre 0 y 366.');
      return;
    }

    setSavingAbsences(true);
    try {
      await api.users.update(user.id, { absences });
      await refreshUser();
      setAbsencesSuccess(true);
      setTimeout(() => setAbsencesSuccess(false), 3000);
    } catch (err) {
      setAbsencesError('Error al actualizar: ' + err.message);
    } finally {
      setSavingAbsences(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setUploadingDoc(true);
    setUploadSuccess(false);
    setDocError('');
    try {
      const previousDoc = user.residencyDoc;
      const residencyDoc = await api.residencyDocs.upload(file, user.id);
      await api.users.update(user.id, { residencyDoc });
      await api.residencyDocs.remove(previousDoc);
      await refreshUser();
      setUploadSuccess(true);
    } catch (err) {
      setDocError(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownload = async () => {
    setDocError('');
    try {
      const url = await api.residencyDocs.getUrl(user.residencyDoc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setDocError(err.message);
    }
  };

  return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Panel Lateral: Perfil e Hitos */}
          <div className="space-y-6">
            {/* Datos Personales */}
            <div className="bg-bg-card border border-border-main rounded-2xl p-6 backdrop-blur-md shadow-sm">
              <h3 className="text-sm font-bold text-text-title mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                <User className="w-5 h-5 text-text-active" />
                DATOS PERSONALES
              </h3>
              
              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <span className="text-text-muted block text-[9px] uppercase tracking-widest font-bold">PASAPORTE</span>
                  <p className="text-text-main font-medium mt-0.5">{user.passport || 'NO REGISTRADO'}</p>
                </div>
                <div className="pt-2.5 border-t border-border-main">
                  <span className="text-text-muted block text-[9px] uppercase tracking-widest font-bold">NIE</span>
                  <p className="text-text-main font-medium mt-0.5">{user.nie || 'NO REGISTRADO'}</p>
                </div>
                <div className="pt-2.5 border-t border-border-main">
                  <span className="text-text-muted block text-[9px] uppercase tracking-widest font-bold">DIRECCIÓN FISCAL (ESPAÑA)</span>
                  {user.address ? (
                    <div className="flex items-start gap-1.5 text-text-main mt-1 font-sans text-xs">
                      <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                      <p>{user.address} (C.P. {user.postalCode})</p>
                    </div>
                  ) : (
                    <p className="text-text-muted italic mt-0.5">SIN DIRECCIÓN GUARDADA</p>
                  )}
                </div>
              </div>
            </div>

            {/* Hitos Autónomo */}
            <div className="bg-bg-card border border-border-main rounded-2xl p-6 text-xs space-y-4 backdrop-blur-md shadow-sm font-mono">
              <h3 className="text-sm font-bold text-text-title flex items-center gap-2 uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                HITOS ADMINISTRATIVOS
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-bg-input border border-border-main rounded-xl">
                  <div>
                    <p className="font-bold text-text-main text-[10px] uppercase tracking-wider">Alta en la AEAT</p>
                    <p className="text-[9px] text-text-muted mt-0.5 uppercase">Modelo 036 / 037 Hacienda</p>
                  </div>
                  {user.aeatDate ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                      {formatDate(user.aeatDate)}
                    </span>
                  ) : (
                    <span className="text-[9px] bg-bg-card text-text-muted border border-border-main px-2 py-0.5 rounded-md uppercase font-bold">
                      PENDIENTE
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-bg-input border border-border-main rounded-xl">
                  <div>
                    <p className="font-bold text-text-main text-[10px] uppercase tracking-wider">Alta Seguridad Social</p>
                    <p className="text-[9px] text-text-muted mt-0.5 uppercase">Régimen Especial RETA</p>
                  </div>
                  {user.ssDate ? (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                      {formatDate(user.ssDate)}
                    </span>
                  ) : (
                    <span className="text-[9px] bg-bg-card text-text-muted border border-border-main px-2 py-0.5 rounded-md uppercase font-bold">
                      PENDIENTE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Área de Calculadora Fiscal y Gestor Documental (2 Columnas) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Calculadora Fiscal */}
            <div className="bg-bg-card border border-border-main rounded-2xl p-6 space-y-5 backdrop-blur-md shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-text-title flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Compass className="w-5 h-5 text-text-active" />
                  CÓMPUTO DE RESIDENCIA FISCAL (183 DÍAS)
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  En España se considera que eres Residente Fiscal si pasas más de 183 días en el territorio durante el año natural. Controla tus días efectivos de estancia.
                </p>
              </div>

              {user.arrivalDate ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                    <div className="p-4 bg-bg-input border border-border-main rounded-xl text-center shadow-inner">
                      <span className="text-[9px] font-bold text-text-muted block uppercase tracking-wider">Entrada a España</span>
                      <p className="text-xs font-bold text-text-main mt-1.5">{formatDate(user.arrivalDate)}</p>
                    </div>
                    
                    <div className="p-4 bg-bg-input border border-border-main rounded-xl text-center shadow-inner">
                      <span className="text-[9px] font-bold text-text-muted block uppercase tracking-wider">Ausencias / Viajes</span>
                      <p className="text-xs font-bold text-text-main mt-1.5">{user.absences || 0} DÍAS</p>
                    </div>

                    <div className="p-4 bg-bg-input border border-border-main rounded-xl text-center shadow-inner">
                      <span className="text-[9px] font-bold text-text-muted block uppercase tracking-wider">Estancia Efectiva</span>
                      <p className="text-xs font-bold text-text-active mt-1.5">{effectiveDays} DÍAS</p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-text-muted">Progreso Residencia Fiscal</span>
                      <span className="text-text-title">{effectiveDays} / {RESIDENCY_THRESHOLD_DAYS} DÍAS ({progressPercent.toFixed(0)}%)</span>
                    </div>
                    
                    <div className="w-full h-3.5 bg-bg-input rounded-full overflow-hidden border border-border-main p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isResident
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-indigo-650 shadow-[0_0_10px_rgba(15,117,188,0.1)]'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    isResident
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-450'
                      : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-450'
                  }`}>
                    <div className="mt-0.5">
                      {isResident ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>
                    <div className="text-xs font-mono">
                      <p className="font-bold uppercase tracking-wider text-text-title">
                        {isResident 
                          ? `UMBRAL DE ${RESIDENCY_THRESHOLD_DAYS} DÍAS ALCANZADO` 
                          : `FALTAN ${RESIDENCY_THRESHOLD_DAYS - effectiveDays} DÍAS PARA RESIDENCIA FISCAL`}
                      </p>
                      <p className="text-text-muted mt-1 font-sans text-xs leading-relaxed">
                        {isResident 
                          ? 'A partir de este momento eres considerado residente fiscal en España para el ejercicio tributario correspondiente.'
                          : 'Si continúas en España, superarás el umbral. Registra tus viajes fuera de España en el formulario inferior para que se descuenten del cómputo.'}
                      </p>
                    </div>
                  </div>

                  {/* Formulario para guardar ausencias */}
                  <form onSubmit={handleSaveAbsences} className="pt-4 border-t border-border-main flex flex-col sm:flex-row items-end gap-4 font-mono">
                    <div className="w-full sm:max-w-xs">
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-text-active" /> REGISTRAR AUSENCIAS (VIAJES)
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        max="366"
                        step="1"
                        required
                        value={absencesInput}
                        onChange={(e) => {
                            setAbsencesInput(e.target.value);
                            if (absencesSuccess) setAbsencesSuccess(false);
                        }}
                        className="w-full bg-bg-input border border-border-main focus:border-border-hover focus:shadow-[0_0_12px_rgba(15,117,188,0.08)] rounded-xl px-4 py-3 text-xs text-text-main focus:outline-none transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingAbsences}
                      className="bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-500/20 rounded-xl py-3 px-5 text-[10px] font-bold uppercase tracking-widest shrink-0 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingAbsences ? 'GUARDANDO...' : 'ACTUALIZAR DATOS'}
                    </button>

                    {absencesError && (
                      <span className="text-[10px] text-red-500 font-bold mb-3.5 uppercase tracking-wider">
                        {absencesError}
                      </span>
                    )}

                    {absencesSuccess && (
                      <span className="text-[10px] text-emerald-500 font-bold mb-3.5 animate-pulse uppercase tracking-wider">
                        ¡Guardado con éxito!
                      </span>
                    )}
                  </form>
                </div>
              ) : (
                <div className="text-xs text-text-muted font-mono uppercase text-center py-8 border border-dashed border-border-main rounded-xl">
                  <AlertCircle className="w-8 h-8 text-text-muted mb-2 mx-auto" />
                  No tienes una fecha de entrada asignada por administración para calcular tu residencia.
                </div>
              )}
            </div>

            {/* Gestor Documental Extranjería */}
            <div className="bg-bg-card border border-border-main rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-text-title flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Upload className="w-5 h-5 text-text-active" />
                  EXPEDIENTE DE EXTRANJERÍA (RESOLUCIÓN)
                </h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Sube tu resolución aprobada de residencia para tenerla disponible de consulta y permitir que el equipo de soporte administrativo la verifique.
                </p>
              </div>

              {user.residencyDoc ? (
                <div className="p-4 bg-bg-input border border-border-main rounded-xl flex items-center justify-between gap-4 font-mono">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-bg-card border border-border-main text-text-active shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-title truncate uppercase tracking-wide">{user.residencyDoc.name}</p>
                      <p className="text-[9px] text-text-muted mt-1 uppercase tracking-wider">
                        TAMAÑO: {user.residencyDoc.size} • SUBIDO: {formatDate(user.residencyDoc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      className="p-2.5 text-text-muted hover:text-text-main bg-bg-card border border-border-main hover:border-border-hover rounded-lg transition-all cursor-pointer"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    {/* Re-subir */}
                    <label className="p-2.5 text-text-active hover:text-indigo-400 bg-bg-active border border-border-active hover:border-border-hover rounded-lg cursor-pointer hover:scale-105 transition-all text-center border" title="Sustituir documento">
                      <Upload className="w-4 h-4 inline" />
                      <input 
                        type="file" 
                        accept={ACCEPTED_DOC_TYPES} 
                        disabled={uploadingDoc}
                        onChange={handleUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-border-main rounded-2xl p-8 text-center flex flex-col items-center justify-center bg-bg-input/40 relative overflow-hidden group hover:border-border-hover transition-all duration-300">
                  <Upload className="w-8 h-8 text-text-muted group-hover:text-text-active transition-colors mb-3" />
                  <p className="text-xs font-bold text-text-title font-mono uppercase tracking-wider">Selecciona el archivo de tu resolución</p>
                  <p className="text-[9px] text-text-muted font-mono uppercase tracking-widest mt-1">Formatos PDF, PNG, JPG (Máx. 5MB)</p>
                  
                  <label className="mt-4 px-4 py-2.5 bg-bg-input hover:bg-bg-card text-text-muted hover:text-text-main border border-border-main hover:border-border-hover rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest cursor-pointer transition-colors block">
                    {uploadingDoc ? (
                      <span className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        Subiendo...
                      </span>
                    ) : (
                      'Examinar Archivo'
                    )}
                    <input 
                      type="file" 
                      accept={ACCEPTED_DOC_TYPES} 
                      disabled={uploadingDoc}
                      onChange={handleUpload}
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {docError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{docError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="uppercase text-[9px] font-bold tracking-wider">Documento guardado en tu expediente.</span>
                </div>
              )}
            </div>

          </div>

        </div>
  );
}
