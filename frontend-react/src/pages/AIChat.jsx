import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 bg-blue-500 rounded-full"
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] text-slate-500 dark:text-slate-400 shadow-sm'
      }`}>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
        isUser 
          ? 'bg-blue-600 text-white rounded-tr-none' 
          : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-tl-none'
      }`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>
            {line.startsWith('**') && line.endsWith('**') 
              ? <strong className={isUser ? 'text-white' : 'text-[var(--text-main)] font-bold'}>{line.replace(/\*\*/g, '')}</strong>
              : line.startsWith('- ') 
              ? <span className="block ml-2">• {line.substring(2)}</span>
              : line
            }
            {i < msg.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

const QUICK_PROMPTS = [
  { label: 'Study plan for today', emoji: '📋' },
  { label: 'Analyze my weak areas', emoji: '📊' },
  { label: 'Motivate me', emoji: '💪' },
  { label: 'How to improve focus?', emoji: '🎯' },
];

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    
    setInput('');
    const userMsg = { role: 'user', content: msg, time: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
  
    try {
      const { data } = await API.post('/ai/chat', {
        message: msg,
        history: [...messages.slice(-10), userMsg].map(m => ({ role: m.role, content: m.content }))
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, time: Date.now() }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'AI is unavailable right now.';
      toast.error(errMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, time: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('ai_chat_history');
    toast.success('Chat cleared');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto font-['Outfit'] select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/10 flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">AI Assistant</h1>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">Powered by Gemini · Integrated study mainframe</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[11px] font-semibold transition-colors px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-[var(--border-color)] cursor-pointer">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 chat-scroll">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-sm">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={20} className="text-blue-500" />
              </div>
              <h2 className="text-slate-900 dark:text-white font-extrabold text-lg mb-1.5 tracking-tight">Hey {user?.name?.split(' ')[0]}!</h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mb-5 leading-relaxed">
                I'm your AI study companion. I know your study metrics, assignments, and focus consistency. Let's practice active recall!
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map(q => (
                  <button key={q.label} onClick={() => sendMessage(q.label)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] hover:border-blue-500/40 text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-xs text-left transition-all cursor-pointer shadow-sm">
                    <span className="text-sm">{q.emoji}</span>
                    <span className="font-semibold truncate">{q.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="py-2">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} isUser={msg.role === 'user'} />
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex gap-3.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-slate-400" />
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl rounded-tl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0 pt-4 border-t border-[var(--border-color)]">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask about your study progress..."
            disabled={loading}
            className="saas-input flex-1 py-3" />
          <button type="submit" disabled={loading || !input.trim()}
            className="saas-btn-primary w-11 h-11 p-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
        <p className="text-center text-slate-400 dark:text-slate-500 text-[9px] mt-2 tracking-wider uppercase font-bold">
          AI coaching insights are dynamically synchronized with your metrics logs
        </p>
      </div>
    </div>
  );
}
