import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle2, AlertCircle, Send, Search, Inbox, Hash, Lock, Check,
  Paperclip, Link, X, Image, FileText, ExternalLink, ChevronRight,
  Mail, User, Clock, MessageSquare
} from 'lucide-react';

export default function MessagesPanel({
  pendingMessages,
  tickets = [],
  selectedTicketId,
  setSelectedTicketId,
  ticketMessages = [],
  loadingMessages,
  replyText,
  handleReplyChange,
  handleSendReply,
  submittingReply,
  handleCloseTicket,
  handleUploadAttachment
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // default to pending for admins to process issues

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
        const matchesSearch = (t.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'pending' && t.status === 'open') || 
                             (filterStatus === 'replied' && t.status === 'closed');
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [tickets, searchQuery, filterStatus]);

  // Seleccionar automáticamente el primer ticket si no hay ninguno seleccionado
  useEffect(() => {
    if (filteredTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId, setSelectedTicketId]);

  const activeTicket = useMemo(() => 
    tickets.find(t => t.id === selectedTicketId) || null
  , [tickets, selectedTicketId]);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticketMessages, loadingMessages]);

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

  const onSubmitReply = (e) => {
    e.preventDefault();
    handleSendReply(activeTicket.id, attachment);
    setAttachment(null);
  };

  // Render para previsualizar adjunto configurado en la caja de texto
  const renderAttachmentPreview = () => {
    if (uploadingAttachment) {
      return (
        <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center gap-2 text-[10px] text-zinc-450 font-mono mt-2 animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Subiendo archivo adjunto...</span>
        </div>
      );
    }
    if (!attachment) return null;
    return (
      <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-center justify-between gap-4 mt-2 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
          {attachment.type === 'image' && <Image className="w-4 h-4 text-indigo-400" />}
          {attachment.type === 'document' && <FileText className="w-4 h-4 text-indigo-400" />}
          {attachment.type === 'link' && <ExternalLink className="w-4 h-4 text-indigo-400" />}
          <span className="truncate max-w-[220px] font-bold">{attachment.name}</span>
        </div>
        <button 
          type="button"
          onClick={handleRemoveAttachment}
          className="p-1 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-white cursor-pointer transition-colors"
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
        <label className="p-2 text-zinc-500 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 rounded-xl cursor-pointer transition-colors" title="Adjuntar Archivo (PDF, Imagen...)">
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
          className={`p-2 border rounded-xl cursor-pointer transition-colors ${showLinkInput ? 'bg-indigo-600 text-white border-indigo-500' : 'text-zinc-500 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-850 border-zinc-800'}`}
          title="Adjuntar Enlace Web"
        >
          <Link className="w-4 h-4" />
        </button>

        {showLinkInput && (
          <div className="absolute bottom-12 left-0 z-20 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl w-64 space-y-3 font-mono animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Adjuntar Enlace</span>
              <button type="button" onClick={() => setShowLinkInput(false)} className="text-zinc-550 hover:text-white"><X className="w-3 h-3" /></button>
            </div>
            <div className="space-y-2 text-[10px]">
              <input 
                type="url" 
                placeholder="https://ejemplo.com"
                required
                value={inputLinkUrl}
                onChange={(e) => setInputLinkUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500/50"
              />
              <input 
                type="text" 
                placeholder="Título (Ej. Sitio Web)"
                value={inputLinkName}
                onChange={(e) => setInputLinkName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200 focus:outline-none focus:border-indigo-500/50"
              />
              <button 
                type="button" 
                onClick={handleAddLink}
                className="w-full py-2 bg-indigo-650 hover:bg-indigo-650/80 text-white font-bold rounded-lg uppercase text-[9px] tracking-widest cursor-pointer"
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
      <div className="mt-3 border-t border-zinc-800/40 pt-2.5 max-w-sm">
        {msg.attachment_type === 'image' && (
          <div className="space-y-2 text-left">
            <a 
              href={msg.attachment_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 hover:opacity-85 transition-opacity"
            >
              <img 
                src={msg.attachment_url} 
                alt={msg.attachment_name || "Imagen adjunta"} 
                className="max-h-40 object-cover w-full"
              />
            </a>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <Image className="w-3.5 h-3.5 text-zinc-600" />
              <span className="truncate text-left">{msg.attachment_name || "Imagen"}</span>
            </div>
          </div>
        )}
        {msg.attachment_type === 'document' && (
          <a 
            href={msg.attachment_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-2 text-[10px] text-zinc-300 font-mono truncate mr-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="truncate font-bold group-hover:text-white text-left">{msg.attachment_name || "Documento"}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
          </a>
        )}
        {msg.attachment_type === 'link' && (
          <a 
            href={msg.attachment_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center justify-between p-3 bg-indigo-950/15 hover:bg-indigo-950/30 border border-indigo-950/40 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-mono truncate mr-2">
              <ExternalLink className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="truncate font-bold group-hover:text-indigo-200 text-left">{msg.attachment_name || "Enlace web"}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[600px] font-sans">
      
      {/* PANEL IZQUIERDO: LISTA DE TICKETS */}
      <div className="w-full lg:w-[380px] flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
        
        {/* Header de Lista */}
        <div className="p-5 border-b border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-400" />
              Inbox Soporte
            </h3>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {pendingMessages} PENDIENTES
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input 
              type="text"
              placeholder="BUSCAR POR NOMBRE O ASUNTO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-[10px] text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-mono uppercase"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${filterStatus === 'all' ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-transparent text-zinc-550 border-transparent hover:text-zinc-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${filterStatus === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-transparent text-zinc-550 border-transparent hover:text-zinc-300'}`}
            >
              Pendientes
            </button>
            <button 
              onClick={() => setFilterStatus('replied')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border cursor-pointer ${filterStatus === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-transparent text-zinc-550 border-transparent hover:text-zinc-300'}`}
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
                onClick={() => {
                  setSelectedTicketId(ticket.id);
                  setAttachment(null);
                  setShowLinkInput(false);
                }}
                className={`p-4 border-b border-zinc-800/40 cursor-pointer transition-all relative group ${selectedTicketId === ticket.id ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.status === 'closed' ? 'bg-zinc-800' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'}`}></div>
                    <span className="text-[11px] font-bold text-zinc-200 uppercase truncate max-w-[140px]">{ticket.student_name}</span>
                  </div>
                  <span className="text-[9px] text-zinc-600 font-mono">{new Date(ticket.updated_at).toLocaleDateString('es-ES')}</span>
                </div>
                <p className="text-[10px] text-zinc-450 line-clamp-1 leading-relaxed">
                  {ticket.title}
                </p>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[8px] font-bold text-zinc-655 uppercase tracking-widest flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" /> ID-{ticket.id.toString().slice(-4)}
                  </span>
                  {ticket.status === 'closed' ? (
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Cerrado
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                      Abierto
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center space-y-3">
              <Mail className="w-8 h-8 text-zinc-800 mx-auto" />
              <p className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest">No hay tickets en esta vista</p>
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: VISTA DE CHAT */}
      <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-md relative">
        {activeTicket ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-indigo-400 shadow-inner">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{activeTicket.student_name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-mono">
                      {activeTicket.title}
                    </span>
                    <span className="text-[9px] text-zinc-600 flex items-center gap-1 font-mono uppercase">
                      <Clock className="w-3 h-3" />
                      RECIBIDO: {new Date(activeTicket.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Botón de cerrar ticket */}
              {activeTicket.status === 'open' && (
                <button 
                  onClick={() => handleCloseTicket(activeTicket.id)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-950/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cerrar y Completar
                </button>
              )}
            </div>

            {/* Chat Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-zinc-950/20">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : ticketMessages.length > 0 ? (
                ticketMessages.map((msg) => {
                  const isStudent = msg.sender_role === 'student';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isStudent ? 'items-start' : 'items-end ml-auto'} space-y-2 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {!isStudent && <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono tracking-widest">Tú (Soporte)</span>}
                        <span className="text-[8px] text-zinc-650 font-mono">
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isStudent && <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-widest">{activeTicket.student_name}</span>}
                      </div>
                      <div className={`p-4 rounded-2xl ${isStudent ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm' : 'bg-indigo-650 text-white rounded-tr-none border border-indigo-550/20 shadow-lg shadow-indigo-950/10'}`}>
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
                  <p className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest">No hay mensajes cargados</p>
                </div>
              )}
            </div>

            {/* Input de Respuesta */}
            {activeTicket.status === 'open' ? (
              <div className="p-6 bg-zinc-900/50 border-t border-zinc-800/80 animate-in slide-in-from-bottom-4 duration-300">
                <form onSubmit={onSubmitReply}>
                  <div className="relative group">
                    <textarea
                      value={replyText[activeTicket.id] || ''}
                      onChange={(e) => handleReplyChange(activeTicket.id, e.target.value)}
                      rows="3"
                      placeholder="Escribe aquí tu respuesta oficial para el estudiante..."
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none pr-16 shadow-inner transition-all"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply[activeTicket.id] || !(replyText[activeTicket.id] && replyText[activeTicket.id].trim()) || uploadingAttachment}
                      className="absolute right-4 bottom-4 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-90 cursor-pointer"
                    >
                      {submittingReply[activeTicket.id] ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>

                  {renderAttachmentPreview()}

                  <div className="flex justify-between items-center mt-3 px-2">
                    {renderAttachmentButtons()}
                    <p className="text-[9px] text-zinc-650 font-mono uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-indigo-400" /> Soporte Oficial ExpatFiscal
                    </p>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-5 bg-zinc-950/40 border-t border-zinc-800/80 flex items-start gap-3 p-6 animate-in fade-in duration-300">
                <Lock className="w-5 h-5 text-zinc-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide font-mono">Ticket Resuelto e Histórico</p>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Este ticket fue cerrado y resuelto. Ya no se pueden añadir más respuestas. Se conserva únicamente a modo de registro histórico de la interacción.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-700">
               <MessageSquare className="w-8 h-8" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-tight">Centro de Soporte Académico</h4>
               <p className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest mt-1">Selecciona una consulta para iniciar la respuesta</p>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
