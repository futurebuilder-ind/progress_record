import { motion } from 'framer-motion';
import { Trophy, Flame, Clock, Medal } from 'lucide-react';

const LEADERBOARD = [
  { rank: 1, name: 'Arjun Sharma', exam: 'GATE', hours: 312, streak: 45, score: 98, avatar: 'A' },
  { rank: 2, name: 'Priya Verma', exam: 'NEET', hours: 290, streak: 38, score: 95, avatar: 'P' },
  { rank: 3, name: 'Rohit Kumar', exam: 'JEE', hours: 278, streak: 30, score: 92, avatar: 'R' },
  { rank: 4, name: 'Sneha Rao', exam: 'UPSC', hours: 260, streak: 28, score: 89, avatar: 'S' },
  { rank: 5, name: 'Dev Patel', exam: 'CAT', hours: 245, streak: 22, score: 86, avatar: 'D' },
  { rank: 6, name: 'Anita Singh', exam: 'SSC', hours: 230, streak: 20, score: 82, avatar: 'An' },
  { rank: 7, name: 'You', exam: 'GATE', hours: 187, streak: 7, score: 75, avatar: 'Y', isMe: true },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
];

export default function Leaderboard() {
  const top3 = LEADERBOARD.slice(0, 3);
  const rest = LEADERBOARD.slice(3);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3">
          <Trophy className="text-yellow-400"/> Leaderboard
        </h1>
        <p className="text-slate-400 mt-2">See how you rank against other aspirants</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-4">
        {[top3[1], top3[0], top3[2]].map((user, i) => {
          const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
          const heights = ['h-32', 'h-40', 'h-28'];
          return (
            <motion.div key={user.rank} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${COLORS[realRank-1]} flex items-center justify-center text-white font-black text-lg shadow-xl`}>
                {user.avatar}
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-sm">{user.name.split(' ')[0]}</div>
                <div className="text-slate-400 text-xs">{user.score}%</div>
              </div>
              <div className={`w-20 ${heights[i]} bg-gradient-to-t ${COLORS[realRank-1]} rounded-t-2xl flex flex-col items-center justify-start pt-3 opacity-80`}>
                <span className="text-2xl">{MEDALS[realRank-1]}</span>
                <span className="text-white font-black text-xl">#{realRank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of Leaderboard */}
      <div className="glass rounded-2xl overflow-hidden">
        {rest.map((user, i) => (
          <motion.div key={user.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
            className={`flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 transition-all ${user.isMe ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-white/2'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${user.isMe ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400'}`}>
              #{user.rank}
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${user.isMe ? 'text-blue-400' : 'text-white'}`}>{user.name}</span>
                {user.isMe && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">You</span>}
              </div>
              <span className="text-slate-500 text-xs">{user.exam}</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-slate-400"><Clock size={13}/> {user.hours}h</div>
              <div className="flex items-center gap-1.5 text-orange-400"><Flame size={13}/> {user.streak} days</div>
              <div className="flex items-center gap-1.5"><Medal size={13} className="text-purple-400"/> <span className="font-bold text-white">{user.score}%</span></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
