import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-white text-black' 
          : 'bg-white/10 border border-white/10 text-white'
      }`}>
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser 
          ? 'bg-white text-black rounded-tr-md' 
          : 'bg-[#0a0a0a] text-slate-300 border border-white/5 rounded-tl-md'
      }`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>
            {line.startsWith('**') && line.endsWith('**') 
              ? <strong className={isUser ? 'text-black' : 'text-white'}>{line.replace(/\*\*/g, '')}</strong>
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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Assistant</h1>
            <p className="text-slate-500 text-xs">Powered by Gemini · Knows your study data</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-slate-500" />
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Hey {user?.name?.split(' ')[0]}!</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                I'm your AI study assistant. I know your subjects, progress, and focus patterns. Ask me anything about your studies.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map(q => (
                  <button key={q.label} onClick={() => sendMessage(q.label)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#0a0a0a] border border-white/5 hover:border-white/15 text-slate-400 hover:text-white text-xs text-left transition-all group">
                    <span className="text-base">{q.emoji}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{q.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="py-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} isUser={msg.role === 'user'} />
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl rounded-tl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-4 border-t border-white/5">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask about your study progress..."
              disabled={loading}
              className="w-full px-5 py-3.5 bg-[#0a0a0a] border border-white/8 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50 pr-12" />
          </div>
          <motion.button type="submit" disabled={loading || !input.trim()}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </motion.button>
        </form>
        <p className="text-center text-slate-600 text-[9px] mt-2 tracking-wider">
          AI responses are personalized based on your study data
        </p>
      </div>
    </div>
  );
}
