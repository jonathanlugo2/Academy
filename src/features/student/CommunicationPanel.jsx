import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle2, Send, Clock, MessageSquare, 
  User, Search, Inbox, Mail, Hash, HelpCircle,
  Shield, ChevronRight, PenLine, AlertCircle, Lock,
  Paperclip, Link, X, Image, FileText, ExternalLink,
  ArrowLeft
} from 'lucide-react';

export default function CommunicationPanel({
  successMsg,
  setSuccessMsg,
  newMessage,
  setNewMessage,
  newTicketTitle,
  setNewTicketTitle,
  sendingMessage,
  handleCreateTicket,
  handleSendTicketMessage,
  handleUploadAttachment,
  tickets = [],
  selectedTicketId,
  setSelectedTicketId,
  ticketMessages = [],
  loadingMessages
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, open, closed
  const [showComposeView, setShowComposeView] = useState(false);

  // Attachment states
  const [attachment, setAttachment] = useState(null);
  const [inputLinkUrl, setInputLinkUrl] = useState('');
  const [inputLinkName, setInputLinkName] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const scrollRef = useRef(null);

  // Filtrado de tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter(t => {
        const matchesSearch = (t.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'open' && t.status === 'open') || 
                             (filterStatus === 'closed' && t.status === 'closed');
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [tickets, searchQuery, filterStatus]);

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  // Seleccionar automáticamente el primer ticket si ninguno está seleccionado (solo en desktop)
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if (isDesktop && filteredTickets.length > 0 && !selectedTicketId && !showComposeView) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId, showComposeView, setSelectedTicketId]);

  const activeTicket = useMemo(() => 
    tickets.find(t => t.id === selectedTicketId) || null
  , [tickets, selectedTicketId]);

  // Auto-scroll al final del chat cuando cambia el listado de mensajes del ticket
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticketMessages, loadingMessages]);

  // Cuando se crea un ticket exitosamente, volver a la vista de conversaciones
  useEffect(() => {
    if (successMsg && showComposeView) {
      const timer = setTimeout(() => {
        setShowComposeView(false);
        setSuccessMsg('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, showComposeView, setSuccessMsg]);

  const handleSelectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setShowComposeView(false);
    setAttachment(null);
    setShowLinkInput(false);
  };

  const handleOpenCompose = () => {
    setShowComposeView(true);
    setSelectedTicketId(null);
    setSuccessMsg('');
    setNewTicketTitle('');
    setNewMessage('');
    setAttachment(null);
    setShowLinkInput(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      const res = await handleUploadAttachment(file);
      setAttachment(res);
    } catch (err) {
      alert("Error al subir archivo: " + err.message);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!inputLinkUrl.trim()) return;
    setAttachment({
      url: inputLinkUrl.trim(),
      name: inputLinkName.trim() || "Enlace web",
      type: "link"
    });
    setInputLinkUrl('');
    setInputLinkName('');
    setShowLinkInput(false);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
  };

  const onSubmitCreateTicket = (e) => {
    e.preventDefault();
    handleCreateTicket(e, attachment);
    setAttachment(null);
  };

  const onSubmitSendMessage = (e) => {
    e.preventDefault();
    handleSendTicketMessage(e, attachment);
    setAttachment(null);
  };

  // Render para previsualizar adjunto configurado en la caja de texto
  const renderAttachmentPreview = () => {
    if (uploadingAttachment) {
      return (
        <div className="p-3 bg-bg-input/60 border border-border-main rounded-xl flex items-center gap-2 text-[10px] text-text-muted font-mono mt-2 animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Subiendo archivo adjunto...</span>
        </div>
      );
    }
    if (!attachment) return null;
    return (
      <div className="p-3 bg-bg-active border border-border-active rounded-xl flex items-center justify-between gap-4 mt-2 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-2 text-xs text-text-active font-mono">
          {attachment.type === 'image' && <Image className="w-4 h-4 text-text-active" />}
          {attachment.type === 'document' && <FileText className="w-4 h-4 text-text-active" />}
          {attachment.type === 'link' && <ExternalLink className="w-4 h-4 text-text-active" />}
          <span className="truncate max-w-[220px] font-bold">{attachment.name}</span>
        </div>
        <button 
          type="button"
          onClick={handleRemoveAttachment}
          className="p-1 hover:bg-bg-input rounded-lg text-text-muted hover:text-text-main cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Botones para adjuntar archivo / enlace en el editor
  const renderAttachmentButtons = () => {
    return (
      <div className="flex gap-2 items-center relative">
        <label className="p-2 text-text-muted hover:text-text-main bg-bg-input hover:bg-bg-card border border-border-main rounded-xl cursor-pointer transition-colors" title="Adjuntar Archivo (PDF, Imagen...)">
          <Paperclip className="w-4 h-4" />
          <input 
            type="file" 
            accept="image/*,.pdf" 
            onChange={handleFileChange} 
            className="hidden" 
            disabled={uploadingAttachment}
          />
        </label>
        
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-2 border rounded-xl cursor-pointer transition-colors ${showLinkInput ? 'bg-indigo-600 text-white border-indigo-500' : 'text-text-muted hover:text-text-main bg-bg-input hover:bg-bg-card border-border-main'}`}
          title="Adjuntar Enlace Web"
        >
          <Link className="w-4 h-4" />
        </button>

        {showLinkInput && (
          <div className="absolute bottom-12 left-0 z-20 bg-bg-card border border-border-main p-4 rounded-2xl shadow-2xl w-64 space-y-3 font-mono animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center border-b border-border-main pb-2">
              <span className="text-[9px] font-bold text-text-title uppercase tracking-wider">Adjuntar Enlace</span>
              <button type="button" onClick={() => setShowLinkInput(false)} className="text-text-muted hover:text-text-main"><X className="w-3 h-3" /></button>
            </div>
            <div className="space-y-2 text-[10px]">
              <input 
                type="url" 
                placeholder="https://ejemplo.com"
                required
                value={inputLinkUrl}
                onChange={(e) => setInputLinkUrl(e.target.value)}
                className="w-full bg-bg-input border border-border-main px-3 py-2 rounded-lg text-text-main focus:outline-none focus:border-border-hover"
              />
              <input 
                type="text" 
                placeholder="Título (Ej. Sitio Web)"
                value={inputLinkName}
                onChange={(e) => setInputLinkName(e.target.value)}
                className="w-full bg-bg-input border border-border-main px-3 py-2 rounded-lg text-text-main focus:outline-none focus:border-border-hover"
              />
              <button 
                type="button" 
                onClick={handleAddLink}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg uppercase text-[9px] tracking-widest cursor-pointer"
              >
                Insertar Enlace
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render para mostrar adjuntos en la burbuja de chat
  const renderMessageAttachment = (msg) => {
    if (!msg.attachment_url) return null;
    return (
      <div className="mt-3 border-t border-border-main/40 pt-2.5 max-w-sm">
        {msg.attachment_type === 'image' && (
          <div className="space-y-2 text-left">
            <a 
              href={msg.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block rounded-lg overflow-hidden border border-border-main bg-bg-input hover:opacity-85 transition-opacity"
            >
              <img 
                src={msg.attachment_url} 
                alt={msg.attachment_name || "Imagen adjunta"} 
                className="max-h-40 object-cover w-full"
              />
            </a>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
              <Image className="w-3.5 h-3.5 text-text-muted animate-pulse" />
              <span className="truncate">{msg.attachment_name || "Imagen"}</span>
            </div>
          </div>
        )}
        {msg.attachment_type === 'document' && (
          <a 
            href={msg.attachment_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-3 bg-bg-input hover:bg-bg-card border border-border-main rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-2 text-[10px] text-text-main font-mono truncate mr-2">
              <FileText className="w-4 h-4 text-text-active" />
              <span className="truncate font-bold group-hover:text-text-title">{msg.attachment_name || "Documento"}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text-title transition-colors" />
          </a>
        )}
        {msg.attachment_type === 'link' && (
          <a 
            href={msg.attachment_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-3 bg-bg-active hover:bg-bg-active/85 border border-border-active rounded-xl transition-all group"
          >
            <div className="flex items-center gap-2 text-[10px] text-text-active font-mono truncate mr-2">
              <ExternalLink className="w-4 h-4 text-text-active" />
              <span className="truncate font-bold group-hover:text-indigo-400 dark:group-hover:text-indigo-200">{msg.attachment_name || "Enlace web"}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-active group-hover:translate-x-0.5 transition-transform" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[600px] font-sans text-left">
      
      {/* PANEL IZQUIERDO: LISTA DE TICKETS */}
      <div className={`w-full lg:w-[380px] flex-col bg-bg-card border border-border-main rounded-3xl overflow-hidden shadow-sm ${selectedTicketId || showComposeView ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header de Lista */}
        <div className="p-5 border-b border-border-main space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-title uppercase tracking-tight font-mono flex items-center gap-2">
              <Inbox className="w-4 h-4 text-text-active" />
              Soporte: Mis Tickets
            </h3>
            <span className="text-[10px] font-bold text-text-active bg-bg-active px-2.5 py-1 rounded-lg border border-border-active">
              {openTicketsCount > 0 ? `${openTicketsCount} ACTIVO(S)` : 'AL DÍA'}
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input 
              type="text"
              placeholder="BUSCAR TICKETS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-input border border-border-main rounded-xl pl-9 pr-4 py-2 text-[10px] text-text-main outline-none focus:border-border-hover transition-all font-mono uppercase focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${filterStatus === 'all' ? 'bg-bg-input text-text-title border-border-main' : 'bg-transparent text-text-muted border-transparent hover:text-text-main'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterStatus('open')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${filterStatus === 'open' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-transparent text-text-muted border-transparent hover:text-text-main'}`}
            >
              Abiertos
            </button>
            <button 
              onClick={() => setFilterStatus('closed')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${filterStatus === 'closed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-transparent text-text-muted border-transparent hover:text-text-main'}`}
            >
              Resueltos
            </button>
          </div>
        </div>

        {/* Listado de Tickets */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredTickets.length > 0 ? (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket.id)}
                className={`p-4 border-b border-border-main/40 cursor-pointer transition-all relative group ${selectedTicketId === ticket.id && !showComposeView ? 'bg-bg-active border-l-4 border-l-indigo-500' : 'hover:bg-bg-input/50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'closed' ? 'bg-bg-input border border-border-main' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'}`}></div>
                    <span className="text-[11px] font-bold text-text-main uppercase truncate max-w-[180px]">
                      {ticket.title}
                    </span>
                  </div>
                  <span className="text-[9px] text-text-muted font-mono">
                    {new Date(ticket.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" /> ID-{ticket.id.toString().slice(-4)}
                  </span>
                  {ticket.status === 'closed' ? (
                    <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Resuelto
                    </span>
                  ) : (
                    <span className="text-[8px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                      Abierto
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center space-y-3">
              <Mail className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-[10px] text-text-muted uppercase font-mono tracking-widest">
                {tickets.length === 0 ? 'No tienes tickets abiertos' : 'Sin resultados'}
              </p>
            </div>
          )}
        </div>

        {/* Botón de Nueva Consulta */}
        <div className="p-4 border-t border-border-main bg-bg-input/20">
          <button
            onClick={handleOpenCompose}
            className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all ${showComposeView ? 'bg-indigo-600 text-white shadow-lg' : 'bg-bg-input text-text-active border border-border-active hover:bg-indigo-600 hover:text-white hover:shadow-lg'}`}
          >
            <PenLine className="w-3.5 h-3.5" />
            Nueva Consulta
          </button>
        </div>
      </div>

      {/* PANEL DERECHO: VISTA DE CHAT O COMPOSE */}
      <div className={`flex-1 flex-col bg-bg-card border border-border-main rounded-3xl overflow-hidden relative shadow-sm ${selectedTicketId || showComposeView ? 'flex' : 'hidden lg:flex'}`}>
        
        {showComposeView ? (
          /* ─── VISTA DE CREACIÓN DE TICKET ─── */
          <>
            {/* Compose Header */}
            <div className="px-6 py-5 border-b border-border-main bg-bg-input/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowComposeView(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-input transition-colors lg:hidden shrink-0 cursor-pointer"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-bg-input border border-border-main flex items-center justify-center text-text-active shadow-inner">
                  <PenLine className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-title uppercase tracking-tight">Crear Nuevo Ticket de Soporte</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-text-active bg-bg-active px-2.5 py-0.5 rounded border border-border-active uppercase tracking-widest font-mono">
                      Soporte Administrativo
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowComposeView(false)} 
                className="text-[10px] text-text-muted hover:text-text-main font-bold font-mono uppercase tracking-wider bg-bg-card hover:bg-bg-input border border-border-main px-3 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Compose Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-bg-input/10">
              <div className="max-w-2xl mx-auto space-y-6">
                
                <div className="p-5 bg-bg-card border border-border-main rounded-2xl space-y-2">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-text-active mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-text-title uppercase tracking-wide font-mono">Sistema de Tickets de Soporte</p>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                        Abre una conversación especificando un tema claro (por ejemplo: "Declaración IRPF"). Podrás adjuntar archivos (PDF, imágenes) o enlaces web para aportar contexto a tu consulta.
                      </p>
                    </div>
                  </div>
                </div>

                {successMsg ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide font-mono">Ticket Creado</p>
                      <p className="text-[11px] text-text-muted mt-1">{successMsg}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onSubmitCreateTicket} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">Asunto / Título de Consulta</label>
                      <input 
                        type="text"
                        placeholder="EJ. DECLARACIÓN IRPF, MODELO 036..."
                        required
                        value={newTicketTitle}
                        onChange={(e) => setNewTicketTitle(e.target.value)}
                        className="w-full bg-bg-input border border-border-main focus:border-border-hover rounded-xl px-4 py-3 text-xs text-text-main placeholder-text-muted focus:outline-none transition-all uppercase font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">Detalles de la Consulta</label>
                      <div className="relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows="5"
                          placeholder="Describe detalladamente tu situación o consulta aquí..."
                          required
                          className="w-full bg-bg-input border border-border-main focus:border-border-hover rounded-2xl px-5 py-4 text-xs text-text-main placeholder-text-muted focus:outline-none resize-none pr-16 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newMessage.trim() || !newTicketTitle.trim() || uploadingAttachment}
                          className="absolute right-4 bottom-4 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-90 cursor-pointer"
                        >
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      
                      {renderAttachmentPreview()}
                      <div className="mt-2.5">
                        {renderAttachmentButtons()}
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>

        ) : activeTicket ? (
          /* ─── VISTA DE CHAT EN VIVO PARA TICKET ACTIVO ─── */
          <>
            {/* Chat Header */}
            <div className="px-6 py-5 border-b border-border-main bg-bg-input/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectTicket(null)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-bg-input transition-colors lg:hidden shrink-0 cursor-pointer"
                  title="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-bg-input border border-border-main flex items-center justify-center text-text-active shadow-inner">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-title uppercase tracking-tight">
                    {activeTicket.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activeTicket.status === 'open' ? (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" /> ABIERTO
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> CERRADO / HISTÓRICO
                      </span>
                    )}
                    <span className="text-[9px] text-text-muted flex items-center gap-1 font-mono uppercase">
                      <Clock className="w-3 h-3" />
                      CREADO: {new Date(activeTicket.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-bg-input/10">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : ticketMessages.length > 0 ? (
                ticketMessages.map((msg) => {
                  const isUser = msg.sender_role === 'student';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end ml-auto' : 'items-start'} space-y-2 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {!isUser && <span className="text-[9px] font-bold text-text-active uppercase font-mono tracking-widest">Soporte ExpatFiscal</span>}
                        <span className="text-[8px] text-text-muted font-mono">
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isUser && <span className="text-[9px] font-bold text-text-muted uppercase font-mono tracking-widest">Tú</span>}
                      </div>
                      <div className={`p-4 rounded-2xl ${isUser ? 'bg-indigo-600 dark:bg-indigo-650 text-white rounded-tr-none border border-indigo-550/20 shadow-lg shadow-indigo-950/10' : 'bg-bg-input border border-border-main text-text-main rounded-tl-none shadow-sm'}`}>
                        <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap text-left">
                          {msg.content}
                        </p>
                        {renderMessageAttachment(msg)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-[10px] text-text-muted uppercase font-mono tracking-widest">No hay mensajes cargados</p>
                </div>
              )}
            </div>

            {/* Input para responder o aviso de cerrado */}
            {activeTicket.status === 'open' ? (
              <div className="p-6 bg-bg-input/50 border-t border-border-main/80">
                <form onSubmit={onSubmitSendMessage}>
                  <div className="relative group">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows="3"
                      placeholder="Escribe un mensaje de respuesta para soporte..."
                      required
                      className="w-full bg-bg-input border border-border-main focus:border-border-hover rounded-2xl px-6 py-4 text-xs text-text-main placeholder-text-muted focus:outline-none resize-none pr-16 shadow-inner transition-all"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim() || uploadingAttachment}
                      className="absolute right-4 bottom-4 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-90 cursor-pointer"
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                  
                  {renderAttachmentPreview()}
                  
                  <div className="flex justify-between items-center mt-3 px-2">
                    {renderAttachmentButtons()}
                    <p className="text-[9px] text-text-muted font-mono uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="w-3 h-3" /> Canal de Soporte Activo
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-5 bg-amber-500/10 border-t border-amber-500/20 flex items-start gap-3 p-6 animate-in fade-in duration-300">
                <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide font-mono">Ticket Resuelto y Cerrado</p>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    Este ticket ha sido cerrado por el administrador y se encuentra en modo histórico. No puedes enviar más mensajes. Si tienes otra duda o consulta, por favor haz clic en <span className="text-text-active font-bold">"Nueva Consulta"</span> para abrir un nuevo ticket.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── ESTADO VACÍO ─── */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-bg-input border border-border-main flex items-center justify-center text-text-muted">
               <MessageSquare className="w-8 h-8" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-text-title uppercase tracking-tight">Centro de Soporte Académico</h4>
               <p className="text-[10px] text-text-muted uppercase font-mono tracking-widest mt-1">Selecciona un ticket de la lista o crea uno nuevo</p>
             </div>
             <button
               onClick={handleOpenCompose}
               className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-indigo-500/20"
             >
               <PenLine className="w-3.5 h-3.5" />
               Nueva Consulta
             </button>
          </div>
        )}
      </div>

    </div>
  );
}
