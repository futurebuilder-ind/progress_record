import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  FileText, Smile, Meh, Frown, MessageSquare, 
  Lightbulb, Code2, Headphones, MoreHorizontal,
  ThumbsUp, ThumbsDown, RotateCcw, Send, User, 
  Mail, Copy, Globe, ShieldCheck, BarChart3, Check, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const RATINGS = [
  { id: 'Excellent', icon: Smile },
  { id: 'Good', icon: Smile },
  { id: 'Average', icon: Meh },
  { id: 'Poor', icon: Frown },
  { id: 'Very Poor', icon: Frown },
];

const LIKED_OPTIONS = [
  { id: 'Communication', label: 'Communication', icon: MessageSquare },
  { id: 'Problem Solving', label: 'Problem Solving', icon: Lightbulb },
  { id: 'Technical Knowledge', label: 'Technical Knowledge', icon: Code2 },
  { id: 'Support', label: 'Support', icon: Headphones },
  { id: 'Other', label: 'Other', icon: MoreHorizontal },
];

export default function Feedback() {
  const [rating, setRating] = useState('Excellent');
  const [message, setMessage] = useState('');
  const [likedMost, setLikedMost] = useState([]);
  const [recommend, setRecommend] = useState('Yes');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleLiked = (id) => {
    setLikedMost(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleReset = () => {
    setRating('Excellent');
    setMessage('');
    setLikedMost([]);
    setRecommend('Yes');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error('Message is required'); return; }
    setLoading(true);
    
    // Map string values to numeric ratings for the backend schema
    const ratingMap = {
      'Excellent': 5,
      'Good': 4,
      'Average': 3,
      'Poor': 2,
      'Very Poor': 1
    };
    const numericRating = ratingMap[rating] || 5;

    try {
      await API.post('/feedback', { 
        rating: numericRating, 
        message: message.trim(),
        likedMost,
        recommend
      });
      setSubmitted(true);
      toast.success('Feedback submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally { 
      setLoading(false); 
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-['Inter',sans-serif]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f0f11] border border-white/10 rounded-3xl p-10 max-w-md w-full text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10 text-blue-500">
            <Check size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Feedback Received</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Thank you for sharing your experience! Your insights are crucial for our continuous improvement.
          </p>
          <button 
            onClick={() => { setSubmitted(false); handleReset(); }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            Submit Another Response
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 font-['Inter',sans-serif] text-slate-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Feedback & Architect Review</h1>
          <p className="text-slate-400 text-sm mt-1">Help us improve by sharing your valuable feedback.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#141416] hover:bg-[#1a1a1d] border border-white/10 rounded-xl text-sm font-medium transition-colors">
          <FileText size={16} className="text-slate-400" />
          <span>View Guidelines</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f11] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>
            
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              
              {/* 1. Rate Your Experience */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">1</div>
                  <h3 className="text-white font-semibold text-lg tracking-tight">Rate Your Experience</h3>
                </div>
                <p className="text-slate-400 text-xs mb-5 ml-9">How was your overall experience working with the architect?</p>
                
                <div className="flex flex-wrap sm:flex-nowrap gap-3 ml-0 sm:ml-9">
                  {RATINGS.map(({ id, icon: Icon }) => (
                    <button 
                      key={id} type="button"
                      onClick={() => setRating(id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-2.5 py-5 rounded-2xl border transition-all ${
                        rating === id 
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                          : 'bg-[#141416] border-white/5 text-slate-500 hover:border-white/10 hover:bg-[#1a1a1d]'
                      }`}
                    >
                      <Icon size={28} strokeWidth={1.5} />
                      <span className="text-xs font-medium">{id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Share Your Feedback */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">2</div>
                  <h3 className="text-white font-semibold text-lg tracking-tight">Share Your Feedback</h3>
                </div>
                <p className="text-slate-400 text-xs mb-5 ml-9">Your thoughts help us improve and deliver better results.</p>
                
                <div className="ml-0 sm:ml-9 relative">
                  <textarea 
                    value={message} onChange={e => setMessage(e.target.value)}
                    maxLength={1000}
                    placeholder="Write your feedback here..."
                    className="w-full h-36 bg-[#141416] border border-white/5 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-[#1a1a1d] transition-colors resize-none"
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] font-medium text-slate-500">
                    {message.length} / 1000
                  </div>
                </div>
              </div>

              {/* 3. What did you like the most? */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">3</div>
                  <h3 className="text-white font-semibold text-lg tracking-tight">
                    What did you like the most? <span className="text-slate-500 font-normal text-sm">(Optional)</span>
                  </h3>
                </div>
                <p className="text-slate-400 text-xs mb-5 ml-9">Select all that apply</p>
                
                <div className="flex flex-wrap gap-3 ml-0 sm:ml-9">
                  {LIKED_OPTIONS.map(({ id, label, icon: Icon }) => {
                    const isSelected = likedMost.includes(id);
                    return (
                      <button
                        key={id} type="button"
                        onClick={() => toggleLiked(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                            : 'bg-[#141416] border-white/5 text-slate-400 hover:border-white/10 hover:bg-[#1a1a1d]'
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Would you recommend? */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">4</div>
                  <h3 className="text-white font-semibold text-lg tracking-tight">Would you recommend this architect?</h3>
                </div>
                <p className="text-slate-400 text-xs mb-5 ml-9">Would you recommend this architect to others?</p>
                
                <div className="flex gap-4 ml-0 sm:ml-9">
                  <button type="button" onClick={() => setRecommend('Yes')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      recommend === 'Yes' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-[#141416] border-white/5 text-slate-400 hover:bg-[#1a1a1d]'
                    }`}
                  >
                    <ThumbsUp size={16} /> Yes
                  </button>
                  <button type="button" onClick={() => setRecommend('No')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      recommend === 'No' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-[#141416] border-white/5 text-slate-400 hover:bg-[#1a1a1d]'
                    }`}
                  >
                    <ThumbsDown size={16} /> No
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-4 pt-6 mt-6 border-t border-white/5">
                <button type="button" onClick={handleReset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 transition-colors"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16} />}
                  Submit Feedback
                </button>
              </div>

            </form>
          </motion.div>
        </div>

        {/* Right Column: Cards */}
        <div className="space-y-6">
          
          {/* Architect Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1 }}
            className="bg-[#0f0f11] border border-white/5 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm mb-6 pb-4 border-b border-white/5">
              <User size={18} className="text-blue-500" />
              Architect Profile
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#1a1a1d] border border-white/10 flex items-center justify-center mb-4 shadow-inner">
                <span className="text-3xl font-bold text-white">A</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Avee Ranjan</h3>
              <p className="text-blue-500 text-xs font-semibold mt-1">Lead Developer & Architect</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between bg-[#141416] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail size={16} />
                  <span className="text-xs font-medium text-slate-300">starkbro28@gmail.com</span>
                </div>
                <button onClick={() => handleCopy('starkbro28@gmail.com')} className="text-slate-500 hover:text-white transition-colors">
                  <Copy size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-[#141416] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <Globe size={16} />
                  <span className="text-xs font-medium text-slate-300">India (IST)</span>
                </div>
                <button onClick={() => handleCopy('India (IST)')} className="text-slate-500 hover:text-white transition-colors">
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <a href="mailto:starkbro28@gmail.com"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/10 transition-colors"
            >
              <Send size={16} /> Contact Direct
            </a>
          </motion.div>

          {/* Secure & Confidential Card */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.2 }}
            className="bg-[#0f0f11] border border-white/5 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShieldCheck size={18} />
              </div>
              <h4 className="text-white font-semibold text-sm">Secure & Confidential</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed ml-11">
              Your feedback is encrypted and sent securely. We value your honesty and use it to improve continuously.
            </p>
          </motion.div>

          {/* Why Your Feedback Matters */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3 }}
            className="bg-[#0f0f11] border border-white/5 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#141416] border border-white/5 flex items-center justify-center text-blue-400">
                <BarChart3 size={18} />
              </div>
              <h4 className="text-white font-semibold text-sm">Why Your Feedback Matters</h4>
            </div>
            <ul className="space-y-3">
              {[
                'Helps improve project quality',
                'Boosts architect performance',
                'Builds better products together'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-xs text-slate-300">
                  <Check size={14} className="text-blue-500 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* We appreciate your time! */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.4 }}
            className="bg-[#0f0f11] border border-white/5 rounded-3xl p-5 shadow-xl flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-[#141416] border border-white/5 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Heart size={20} />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-0.5">We appreciate your time!</h4>
              <p className="text-slate-400 text-xs">Thank you for helping us grow.</p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
