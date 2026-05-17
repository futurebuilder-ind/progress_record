import { motion } from 'framer-motion';
import { Trophy, Flame, Clock, Medal, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../api/axios';

const MEDALS = ['🥇', '🥈', '🥉'];
const COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/leaderboard');
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
        setError(err.response?.data?.message || 'Failed to initialize real-time ranking data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-blue-500" />
        </motion.div>
        <div className="text-center space-y-1">
          <p className="text-white font-bold text-sm tracking-widest uppercase font-mono">Syncing Core Metrics</p>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-mono">Connecting with global aspirants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">Access Link Interrupted</h3>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-5 py-2.5 bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Re-establish Connection
        </button>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // We want to render them in standard podium visual order: #2 (left), #1 (center), #3 (right)
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push(top3[1]);
  if (top3[0]) podiumOrder.push(top3[0]);
  if (top3[2]) podiumOrder.push(top3[2]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="text-center">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3 tracking-tight">
          <Trophy className="text-yellow-400"/> Leaderboard
        </h1>
        <p className="text-slate-400 mt-2 text-sm">See how you rank against other aspirants</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4 pt-6">
        {podiumOrder.map((user, i) => {
          const realRank = user.rank;
          const heights = ['h-32', 'h-40', 'h-28'];
          return (
            <motion.div key={user._id || user.rank} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${COLORS[realRank-1]} flex items-center justify-center text-white font-black text-lg shadow-xl overflow-hidden relative border border-white/10`}>
                {user.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover" alt={user.name} />
                ) : (
                  <span>{user.avatar}</span>
                )}
              </div>
              <div className="text-center min-w-[70px]">
                <div className="text-white font-bold text-xs truncate max-w-[80px]">{user.name.split(' ')[0]}</div>
                <div className="text-slate-400 text-[10px] mt-0.5">{user.score}%</div>
              </div>
              <div className={`w-20 ${heights[realRank-1]} bg-gradient-to-t ${COLORS[realRank-1]} rounded-t-2xl flex flex-col items-center justify-start pt-3 opacity-80 shadow-lg`}>
                <span className="text-xl mb-1">{MEDALS[realRank-1]}</span>
                <span className="text-white font-black text-lg">#{realRank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of Leaderboard */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        {rest.map((user, i) => (
          <motion.div key={user._id || user.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
            className={`flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 transition-all ${user.isMe ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-white/2'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${user.isMe ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400'}`}>
              #{user.rank}
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden border border-white/5">
              {user.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt={user.name} />
              ) : (
                <span>{user.avatar}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm truncate ${user.isMe ? 'text-blue-400' : 'text-white'}`}>{user.name}</span>
                {user.isMe && <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider font-bold">You</span>}
              </div>
              <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">{user.exam}</span>
            </div>
            <div className="flex items-center gap-4 md:gap-6 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400"><Clock size={12}/> {user.hours}h</div>
              <div className="flex items-center gap-1.5 text-orange-400"><Flame size={12}/> {user.streak} days</div>
              <div className="flex items-center gap-1.5"><Medal size={12} className="text-purple-400"/> <span className="font-bold text-white">{user.score}%</span></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
