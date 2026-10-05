import { useState, useMemo } from 'react';
import { 
  Plus, Edit2, AlertCircle, CheckCircle2, Upload, Calendar, Tag, Play, Trash2, 
  Search, Filter, X, Eye, FileText, Video, Presentation, Code, ExternalLink, ChevronRight, ChevronLeft, MoreHorizontal, LayoutGrid, List
} from 'lucide-react';

export default function ResourceUploader({
  editingResourceId,
  handleAddResource,
  formError,
  formSuccess,
  isSubmitting,
  newTitle, setNewTitle,
  newType, setNewType,
  newUrl, setNewUrl,
  newDesc, setNewDesc,
  newCategory, setNewCategory,
  newTags, setNewTags,
  handlePdfFileChange,
  handleCancelEdit,
  selectedAssignUserIds, setSelectedAssignUserIds,
  studentSearchQuery, setStudentSearchQuery,
  users,
  resources, // Recibimos el listado completo para filtrar aquí
  setPreviewResource,
  handleStartEditResource,
  handleDeleteResource,
  resourceIcon,
  newImageUrl, setNewImageUrl,
  uploadingImage,
  handleImageUpload,
  uploadingPdf
}) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtrado inteligente
  const filteredResources = useMemo(() => {
    return resources
      .filter(r => {
        const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || r.type === filterType;
        const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [resources, searchQuery, filterType, filterCategory]);

  // Paginación local
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const paginatedData = filteredResources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCreateModal = () => {
    handleCancelEdit(); // Limpiar form
    setShowModal(true);
  };

  const onEdit = (resource) => {
    handleStartEditResource(resource);
    setShowModal(true);
  };

  // Tras guardar con éxito se muestra el aviso un momento y se cierra el modal
  const onSubmit = async (e) => {
    if (await handleAddResource(e)) {
      setTimeout(() => setShowModal(false), 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE SECCIÓN CON BOTÓN DE ACCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-card/40 p-4 rounded-2xl border border-border-main/80 backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-bold text-text-title flex items-center gap-2 font-mono uppercase tracking-tight">
            <LayoutGrid className="w-5 h-5 text-text-active" />
            Gestión de Contenido Académico
          </h3>
          <p className="text-xs text-text-muted font-mono mt-0.5">Directorio centralizado de formaciones y recursos.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 border border-indigo-400/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Recurso
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS INTELIGENTES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-bg-input/20 p-3 rounded-2xl border border-border-main/40">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="BUSCAR POR TÍTULO O DESCRIPCIÓN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main focus:border-border-hover/50 outline-none font-mono"
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-bg-input border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-main focus:border-border-hover/50 outline-none font-mono cursor-pointer"
          >
            <option value="all">TODOS LOS TIPOS</option>
            <option value="video">VÍDEOS</option>
            <option value="document">PDFs</option>
            <option value="presentation">DIAPOSITIVAS</option>
            <option value="html_video">CÓDIGO HTML</option>
            <option value="test">TESTS INTERACTIVOS</option>
            <option value="link">ENLACES</option>
          </select>
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-bg-input border border-border-main rounded-xl px-4 py-2.5 text-xs text-text-main focus:border-border-hover/50 outline-none font-mono cursor-pointer"
          >
            <option value="all">TODAS LAS CATEGORÍAS</option>
            <option value="Trámites y Visados">TRÁMITES Y VISADOS</option>
            <option value="Impuestos y Autónomos">IMPUESTOS Y FISCALIDAD</option>
            <option value="Herramientas Digitales">HERRAMIENTAS</option>
          </select>
        </div>
      </div>

      {/* TABLA ESTILO ERP MODERNO */}
      <div className="bg-bg-card border border-border-main rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main bg-bg-input/40 text-[10px] text-text-muted font-mono uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Recurso / Formación</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Categoría</th>
                <th className="px-6 py-4 font-bold">Fecha Registro</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40">
              {paginatedData.length > 0 ? (
                paginatedData.map((resource) => (
                  <tr key={resource.id} className="group hover:bg-bg-input/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-bg-input border border-border-main flex items-center justify-center text-text-muted group-hover:text-text-active group-hover:border-border-active transition-all shadow-inner">
                          {resourceIcon(resource.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-main truncate group-hover:text-text-title transition-colors">{resource.title}</p>
                          <p className="text-[10px] text-text-muted truncate font-mono mt-0.5 uppercase tracking-tight">{resource.tags?.join(' • ') || 'SIN ETIQUETAS'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-bold text-text-muted bg-bg-input border border-border-main px-2.5 py-1 rounded-lg uppercase font-mono tracking-wider">
                        {resource.type === 'html_video' ? 'CÓDIGO' : resource.type === 'test' ? 'TEST' : resource.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-text-main font-medium">{resource.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-main font-mono">{new Date(resource.created_at).toLocaleDateString('es-ES')}</span>
                        <span className="text-[9px] text-text-muted font-mono uppercase">Sistema Sync</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewResource(resource)}
                          className="p-2 text-text-active hover:bg-bg-active rounded-lg transition-all cursor-pointer"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(resource)}
                          className="p-2 text-text-muted hover:text-text-title hover:bg-bg-input rounded-lg transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted font-mono text-xs uppercase tracking-widest">
                    No se encontraron resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN MODERNA */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-bg-input/25 border-t border-border-main flex items-center justify-between">
            <p className="text-[10px] text-text-muted font-mono uppercase">
              Mostrando <span className="text-text-main">{paginatedData.length}</span> de <span className="text-text-main">{filteredResources.length}</span> recursos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-bg-input border border-border-main rounded-lg text-text-muted disabled:opacity-30 hover:bg-bg-card transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                      currentPage === i + 1 
                        ? 'bg-indigo-600 text-white border border-indigo-500 shadow-[0_0_8px_rgba(15,117,188,0.2)]' 
                        : 'bg-bg-input text-text-muted border border-border-main hover:text-text-main hover:bg-bg-card'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-bg-input border border-border-main rounded-lg text-text-muted disabled:opacity-30 hover:bg-bg-card transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EMERGENTE PARA CREACIÓN/EDICIÓN (ESTILO ERP) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-bg-card border border-border-main rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-border-main flex justify-between items-center bg-bg-input/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-bg-active border border-border-active flex items-center justify-center text-text-active">
                  {editingResourceId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-title uppercase tracking-tight font-mono">
                    {editingResourceId ? 'Editar Formación' : 'Añadir Nueva Formación'}
                  </h3>
                  <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Panel de Creación de Contenido</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-bg-input rounded-xl text-text-muted hover:text-text-title transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={onSubmit} className="space-y-6">
                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-start gap-3 font-mono">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 dark:text-emerald-450 text-xs rounded-2xl flex items-start gap-3 font-mono">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Título de la Formación *</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej. Guía de Residencia 2024"
                      className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main placeholder-text-muted focus:border-border-hover outline-none transition-all font-mono shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Tipo de Recurso</label>
                    <div className="relative">
                      <select 
                        value={newType} 
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none font-mono cursor-pointer appearance-none focus:border-border-hover transition-all shadow-inner"
                      >
                        <option value="video">VÍDEO (EXTERNAL)</option>
                        <option value="presentation">GOOGLE SLIDES</option>
                        <option value="document">DOCUMENTO PDF</option>
                        <option value="html_video">CÓDIGO / MP4 DIRECTO</option>
                        <option value="test">TEST INTERACTIVO (HTML)</option>
                        <option value="link">ENLACE WEB</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Categoría Académica</label>
                    <select 
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none font-mono cursor-pointer appearance-none focus:border-border-hover transition-all shadow-inner"
                    >
                      <option value="Trámites y Visados">TRÁMITES Y VISADOS</option>
                      <option value="Impuestos y Autónomos">IMPUESTOS Y FISCALIDAD</option>
                      <option value="Herramientas Digitales">HERRAMIENTAS</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    {newType === 'document' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Cargar Documento PDF *</label>
                        <input type="file" accept="application/pdf" id="pdf-upload-erp" onChange={handlePdfFileChange} disabled={uploadingPdf} className="hidden" />
                        <label 
                          htmlFor="pdf-upload-erp"
                          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-main hover:border-border-hover/45 bg-bg-input/40 hover:bg-bg-input/80 rounded-2xl py-8 transition-all cursor-pointer group"
                        >
                          <Upload className="w-6 h-6 text-text-muted group-hover:text-text-active group-hover:scale-110 transition-all" />
                          <p className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-text-main">
                            {uploadingPdf
                              ? 'Subiendo PDF...'
                              : newUrl && (newUrl.startsWith('storage:') || newUrl.startsWith('data:application/pdf'))
                                ? 'Archivo PDF cargado (pulsa para sustituirlo)'
                                : 'Selecciona el archivo PDF (máx. 20 MB)'}
                          </p>
                        </label>
                      </div>
                    ) : newType === 'test' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Código HTML del Test *</label>
                        <textarea 
                          rows="8"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="Pega aquí el código HTML/CSS/JS de tu test..."
                          className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main placeholder-text-muted focus:border-border-hover outline-none transition-all font-mono resize-y shadow-inner h-40"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">
                          {newType === 'html_video' ? 'Código de Inserción / URL MP4 *' : 'Enlace del Recurso *'}
                        </label>
                        <input 
                          type="text" 
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main placeholder-text-muted focus:border-border-hover outline-none transition-all font-mono shadow-inner"
                        />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 font-mono ml-1">Descripción Breve *</label>
                    <textarea 
                      rows="3"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Resume el contenido para los alumnos..."
                      className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main placeholder-text-muted focus:border-border-hover outline-none transition-all font-mono resize-none shadow-inner"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 font-mono ml-1">Etiquetas del Sistema</label>
                    <span className="text-[9px] text-text-muted font-mono uppercase tracking-tight block mb-2 ml-1">Separar por comas (Ej: Fiscal, Hacienda, 2024)</span>
                    <input 
                      type="text" 
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="Etiquetas..."
                      className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3.5 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono shadow-inner"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-4 pt-3 border-t border-border-main/40">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono ml-1">Imagen de Portada (Tarjeta de Curso)</label>
                    
                    {/* Presets Grid */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-text-muted font-mono uppercase tracking-tight block ml-1">Seleccionar Ilustración ExpatFiscal</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('/preset_tramites.png')}
                          className={`px-3 py-2 rounded-xl text-[9px] font-bold font-mono uppercase border cursor-pointer text-center transition-colors ${newImageUrl === '/preset_tramites.png' ? 'bg-bg-active text-text-active border-border-active shadow-[0_0_10px_rgba(15,117,188,0.1)]' : 'bg-bg-input text-text-muted border-border-main hover:border-border-hover hover:text-text-main'}`}
                        >
                          Trámites
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('/preset_impuestos.png')}
                          className={`px-3 py-2 rounded-xl text-[9px] font-bold font-mono uppercase border cursor-pointer text-center transition-colors ${newImageUrl === '/preset_impuestos.png' ? 'bg-bg-active text-text-active border-border-active shadow-[0_0_10px_rgba(15,117,188,0.1)]' : 'bg-bg-input text-text-muted border-border-main hover:border-border-hover hover:text-text-main'}`}
                        >
                          Impuestos
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('/preset_coworking.png')}
                          className={`px-3 py-2 rounded-xl text-[9px] font-bold font-mono uppercase border cursor-pointer text-center transition-colors ${newImageUrl === '/preset_coworking.png' ? 'bg-bg-active text-text-active border-border-active shadow-[0_0_10px_rgba(15,117,188,0.1)]' : 'bg-bg-input text-text-muted border-border-main hover:border-border-hover hover:text-text-main'}`}
                        >
                          Coworking
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('/preset_herramientas.png')}
                          className={`px-3 py-2 rounded-xl text-[9px] font-bold font-mono uppercase border cursor-pointer text-center transition-colors ${newImageUrl === '/preset_herramientas.png' ? 'bg-bg-active text-text-active border-border-active shadow-[0_0_10px_rgba(15,117,188,0.1)]' : 'bg-bg-input text-text-muted border-border-main hover:border-border-hover hover:text-text-main'}`}
                        >
                          Herramientas
                        </button>
                      </div>
                    </div>

                    {/* Image URL & File Upload */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-text-muted font-mono uppercase tracking-tight block mb-2 ml-1">URL de Imagen Personalizada</span>
                        <input 
                          type="text" 
                          value={newImageUrl && !newImageUrl.startsWith('/preset_') && !newImageUrl.startsWith('data:') ? newImageUrl : ''}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-bg-input border border-border-main rounded-2xl px-5 py-3 text-xs text-text-main outline-none focus:border-border-hover transition-all font-mono shadow-inner"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-text-muted font-mono uppercase tracking-tight block mb-2 ml-1">Cargar Archivo de Portada</span>
                        <input 
                          type="file" 
                          accept="image/png,image/jpeg,image/webp,image/gif" 
                          id="image-upload-uploader" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                        <label 
                          htmlFor="image-upload-uploader"
                          className="w-full flex items-center justify-center gap-2 border border-dashed border-border-main hover:border-border-hover/40 bg-bg-input/40 hover:bg-bg-input/85 rounded-2xl py-3 transition-all cursor-pointer group text-center"
                        >
                          <Upload className="w-4 h-4 text-text-muted group-hover:text-text-active transition-all" />
                          <span className="text-[9px] font-bold text-text-muted font-mono uppercase tracking-widest group-hover:text-text-main">
                            {uploadingImage ? 'Subiendo...' : 'Examinar Archivo'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Image Preview */}
                    {newImageUrl && (
                      <div className="p-3 bg-bg-input/40 border border-border-main rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                        <div className="w-16 h-10 rounded-lg overflow-hidden border border-border-main shrink-0">
                          <img src={newImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <span className="text-[8px] text-text-active font-bold uppercase tracking-wider font-mono">Vista Previa Asignada</span>
                          <p className="text-[9px] text-text-muted truncate font-mono mt-0.5">{newImageUrl}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setNewImageUrl('')} 
                          className="text-[9px] text-red-500 hover:text-red-400 font-bold font-mono px-3 py-1.5 border border-border-main hover:border-border-hover hover:bg-bg-input rounded-xl cursor-pointer transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-bg-input/40 p-6 rounded-3xl border border-border-main/80 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">Control de Acceso Estudiantes</label>
                    <button
                      type="button"
                      onClick={() => setSelectedAssignUserIds(users.filter(u => u.role === 'student').map(u => u.id))}
                      className="text-[9px] text-text-active hover:bg-bg-active px-3 py-1.5 rounded-lg font-bold border border-border-active uppercase transition-all cursor-pointer"
                    >
                      Asignar a todos
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="FILTRAR ESTUDIANTES..."
                      className="w-full bg-bg-input border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-[10px] text-text-main outline-none focus:border-border-hover/40 transition-all uppercase font-mono"
                    />
                    {studentSearchQuery.trim() !== '' && (
                      <div className="absolute left-0 right-0 mt-1 bg-bg-card border border-border-main rounded-xl max-h-40 overflow-y-auto z-[110] p-2 shadow-2xl">
                        {users.filter(u => u.role === 'student' && (u.name || '').toLowerCase().includes(studentSearchQuery.toLowerCase())).map(student => {
                          const isSelected = selectedAssignUserIds.includes(student.id);
                          return (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => isSelected ? setSelectedAssignUserIds(prev => prev.filter(id => id !== student.id)) : setSelectedAssignUserIds(prev => [...prev, student.id])}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-[10px] transition-colors mb-1 cursor-pointer ${isSelected ? 'bg-bg-active text-text-active' : 'hover:bg-bg-input text-text-muted'}`}
                            >
                              <span>{student.name}</span>
                              <span className="font-bold">{isSelected ? 'QUITAR' : 'AÑADIR'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {users.filter(u => selectedAssignUserIds.includes(u.id)).map(student => (
                      <span key={student.id} className="text-[9px] bg-bg-input border border-border-main px-2.5 py-1 rounded-lg text-text-main flex items-center gap-1.5 font-mono">
                        {student.name}
                        <button type="button" onClick={() => setSelectedAssignUserIds(prev => prev.filter(id => id !== student.id))} className="text-red-550 hover:text-red-400 text-base cursor-pointer">×</button>
                      </span>
                    ))}
                    {selectedAssignUserIds.length === 0 && <span className="text-[9px] text-text-muted italic font-mono uppercase">Solo administradores tendrán acceso.</span>}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-border-main bg-bg-card/50 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3.5 bg-bg-input border border-border-main text-text-muted hover:text-text-title rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={onSubmit}
                className="flex-[2] px-6 py-3.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all font-mono flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingResourceId ? 'Guardar Cambios' : 'Confirmar Creación')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
