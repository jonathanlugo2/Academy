import React from 'react';
import { 
  HelpCircle, CheckCircle2, Send, Clock 
} from 'lucide-react';

export default function CommunicationPanel({
  successMsg,
  setSuccessMsg,
  newMessage,
  setNewMessage,
  sendingMessage,
  handleSendMessage,
  messages,
  paginatedMessages,
  messagesPage,
  setMessagesPage,
  totalMessagesPages,
  currentMessagesPage
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 lg:sticky lg:top-24 backdrop-blur-md shadow-sm font-mono">
        <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          ENVIAR CONSULTA
        </h3>
        
        <p className="text-xs text-zinc-400 mb-4 font-sans leading-relaxed">
          ¿Tienes dudas sobre los visados, los impuestos de autónomo o necesitas recomendación de zonas? Tu mensaje será enviado directamente al panel del administrador global.
        </p>

        {successMsg && (
          <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-indigo-400 mt-0.5" />
            <span className="text-[10px] uppercase font-bold tracking-wide">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-550 uppercase tracking-widest mb-2">Mensaje / Pregunta</label>
            <textarea 
              rows="4"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (successMsg) setSuccessMsg('');
              }}
              placeholder="ESCRIBE TU CONSULTA DE FORMA DETALLADA..."
              required
              className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-indigo-400/80 focus:shadow-[0_0_12px_rgba(0,242,254,0.12)] rounded-xl px-4 py-3.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none resize-none uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={sendingMessage || !newMessage.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-zinc-950 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_10px_rgba(0,242,254,0.15)] font-mono"
          >
            {sendingMessage ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                ENVIAR CONSULTA
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-4 font-mono">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-800/80">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">TUS CONSULTAS</h3>
            <p className="text-[10px] text-zinc-550 uppercase tracking-widest mt-1">Historial de dudas enviadas y sus respuestas oficiales.</p>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-zinc-550 text-xs uppercase tracking-wider">
                Aún no has enviado ninguna consulta. Usa el formulario de la izquierda.
              </div>
            ) : (
              paginatedMessages.map(msg => {
                if (msg.reply) {
                  localStorage.setItem(`read_reply_${msg.id}`, 'true');
                }
                
                return (
                  <div key={msg.id} className="p-6 space-y-4 hover:bg-zinc-900/20 transition-colors">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        {msg.reply ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-450 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Respuesta Recibida
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-450 border border-amber-500/20 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            Esperando Respuesta
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-550">
                        {new Date(msg.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>

                    <div className="p-4 bg-zinc-950/80 border border-zinc-800/80 rounded-xl">
                      <span className="text-[9px] font-bold text-zinc-550 block mb-1.5 uppercase tracking-widest">Tu consulta original:</span>
                      <p className="text-xs text-zinc-300 font-medium">
                        {msg.content}
                      </p>
                    </div>

                    {msg.reply && (
                      <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-xl space-y-2 ml-6 shadow-[0_0_12px_rgba(0,242,254,0.04)]">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                          <span>Respuesta del Administrador</span>
                        </div>
                        <p className="text-xs text-indigo-250/90 leading-relaxed font-sans font-medium">
                          {msg.reply}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Controles de paginación para consultas */}
        {totalMessagesPages > 1 && (
          <div className="px-6 py-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center justify-between text-xs backdrop-blur-md shadow-sm font-mono">
            <button
              onClick={() => setMessagesPage(prev => Math.max(1, prev - 1))}
              disabled={currentMessagesPage === 1}
              className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-300 border border-zinc-805 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all cursor-pointer uppercase text-[10px] font-bold"
            >
              Anterior
            </button>
            <span className="text-zinc-550 uppercase text-[10px] tracking-wider font-bold">
              Página <span className="text-indigo-400 font-bold">{currentMessagesPage}</span> de <span className="text-zinc-300 font-bold">{totalMessagesPages}</span>
            </span>
            <button
              onClick={() => setMessagesPage(prev => Math.min(totalMessagesPages, prev + 1))}
              disabled={currentMessagesPage === totalMessagesPages}
              className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-300 border border-zinc-805 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-all cursor-pointer uppercase text-[10px] font-bold"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
