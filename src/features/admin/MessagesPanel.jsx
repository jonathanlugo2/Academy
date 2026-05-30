import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle2, AlertCircle, Send, Search, Filter, MessageSquare, 
  User, Clock, ChevronRight, ChevronLeft, Inbox, Trash2, MoreHorizontal,
  Mail, Reply, Flag, Hash
} from 'lucide-react';

export default function MessagesPanel({
  pendingMessages,
  messages, // Recibimos el listado completo para el nuevo sistema Help-Desk
  replyText,
  handleReplyChange,
  handleSendReply,
  submittingReply
}) {
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, replied
  const [filterPriority, setFilterPriority] = useState('all');
  
  const scrollRef = useRef(null);

  // Filtrado inteligente de conversaciones
  const filteredMessages = useMemo(() => {
    return messages
      .filter(m => {
        const matchesSearch = m.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             m.content.toLowerCase().includes(searchQuery.toLowerCase());
        const isReplied = !!m.reply;
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'pending' && !isReplied) || 
                             (filterStatus === 'replied' && isReplied);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [messages, searchQuery, filterStatus]);

  // Seleccionar automáticamente el primer mensaje si no hay ninguno seleccionado
  useEffect(() => {
    if (filteredMessages.length > 0 && !selectedMsgId) {
      setSelectedMsgId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMsgId]);

  const activeMessage = useMemo(() => 
    messages.find(m => m.id === selectedMsgId) || null
  , [messages, selectedMsgId]);

  // Auto-scroll al final del chat cuando cambia el mensaje o la respuesta
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedMsgId, activeMessage?.reply]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)] min-h-[600px] font-sans">
      
      {/* PANEL IZQUIERDO: LISTA DE CONVERSACIONES */}
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
              placeholder="BUSCAR CONSULTA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-[10px] text-zinc-200 outline-none focus:border-indigo-500/30 transition-all font-mono uppercase"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${filterStatus === 'all' ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-transparent text-zinc-550 border-transparent hover:text-zinc-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${filterStatus === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-transparent text-zinc-550 border-transparent hover:text-zinc-300'}`}
            >
              Pendientes
            </button>
            <button 
              onClick={() => setFilterStatus('replied')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${filterStatus === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-transparent text-zinc-550 border-transparent hover:text-zinc-300'}`}
            >
              Resueltos
            </button>
          </div>
        </div>

        {/* Listado de Mensajes */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredMessages.length > 0 ? (
            filteredMessages.map(msg => (
              <div 
                key={msg.id}
                onClick={() => setSelectedMsgId(msg.id)}
                className={`p-4 border-b border-zinc-800/40 cursor-pointer transition-all relative group ${selectedMsgId === msg.id ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${msg.reply ? 'bg-zinc-800' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'}`}></div>
                    <span className="text-[11px] font-bold text-zinc-200 uppercase truncate max-w-[140px]">{msg.sender_name}</span>
                  </div>
                  <span className="text-[9px] text-zinc-600 font-mono">{new Date(msg.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {msg.content}
                </p>
                <div className="flex justify-between items-center mt-2.5">
                   <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                     <Hash className="w-2.5 h-2.5" /> ID-{msg.id.toString().slice(-4)}
                   </span>
                   {msg.reply && <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center space-y-3">
              <Mail className="w-8 h-8 text-zinc-800 mx-auto" />
              <p className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest">No hay consultas en esta vista</p>
            </div>
          )}
        </div>
      </div>

      {/* PANEL DERECHO: VISTA DE CHAT / CONVERSACIÓN */}
      <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
        {activeMessage ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-indigo-400 shadow-inner">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{activeMessage.sender_name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-mono">ESTUDIANTE ACTIVO</span>
                    <span className="text-[9px] text-zinc-600 flex items-center gap-1 font-mono uppercase">
                      <Clock className="w-3 h-3" />
                      RECIBIDO: {new Date(activeMessage.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all" title="Marcar como Prioritario"><Flag className="w-4 h-4" /></button>
                <button className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-zinc-950/20">
              
              {/* Mensaje del Estudiante */}
              <div className="flex flex-col items-start space-y-2 max-w-[85%] animate-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-widest">{activeMessage.sender_name}</span>
                  <span className="text-[8px] text-zinc-650 font-mono">{new Date(activeMessage.created_at).toLocaleTimeString('es-ES')}</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {activeMessage.content}
                  </p>
                </div>
              </div>

              {/* Respuesta del Administrador */}
              {activeMessage.reply && (
                <div className="flex flex-col items-end space-y-2 max-w-[85%] ml-auto animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] text-zinc-650 font-mono">RESPUESTA ENVIADA</span>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono tracking-widest">Soporte Académico</span>
                  </div>
                  <div className="bg-indigo-600 text-white p-5 rounded-2xl rounded-tr-none shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
                    <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap">
                      {activeMessage.reply}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] text-emerald-400 font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Entregado y Notificado
                  </div>
                </div>
              )}
            </div>

            {/* Input de Respuesta */}
            {!activeMessage.reply && (
              <div className="p-6 bg-zinc-900/50 border-t border-zinc-800/80 animate-in slide-in-from-bottom-4 duration-300">
                <div className="relative group">
                  <textarea
                    value={replyText[activeMessage.id] || ''}
                    onChange={(e) => handleReplyChange(activeMessage.id, e.target.value)}
                    rows="3"
                    placeholder="Escribe aquí tu respuesta oficial para el estudiante..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/50 rounded-2xl px-6 py-5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none pr-16 shadow-inner transition-all"
                  />
                  <button
                    onClick={() => handleSendReply(activeMessage.id)}
                    disabled={submittingReply[activeMessage.id] || !(replyText[activeMessage.id] && replyText[activeMessage.id].trim())}
                    className="absolute right-4 bottom-4 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-90"
                  >
                    {submittingReply[activeMessage.id] ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-3 px-2">
                  <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Reply className="w-3 h-3" /> Soporte Oficial ExpatFiscal
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                    {(replyText[activeMessage.id] || '').length} caracteres
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
               <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-tight">Centro de Comunicación</h4>
               <p className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest mt-1">Selecciona una consulta para iniciar la respuesta</p>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}
