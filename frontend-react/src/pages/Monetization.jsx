import { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, TrendingUp, MousePointerClick, Eye, 
  Sparkles, ShieldCheck, Zap, Settings2, HelpCircle, 
  ArrowUpRight, AlertCircle, Copy, Check, UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdContainer from '../components/AdContainer';

// Custom simulated 30-day traffic data
const INITIAL_CHART_DATA = [
  { day: 'Day 1', revenue: 0.12, traffic: 32 },
  { day: 'Day 5', revenue: 0.48, traffic: 120 },
  { day: 'Day 10', revenue: 1.84, traffic: 410 },
  { day: 'Day 15', revenue: 3.52, traffic: 890 },
  { day: 'Day 20', revenue: 6.78, traffic: 1450 },
  { day: 'Day 25', revenue: 9.94, traffic: 2200 },
  { day: 'Day 30', revenue: 12.45, traffic: 2840 }
];

export default function Monetization() {
  // Stats State
  const [stats, setStats] = useState({
    earnings: 12.45,
    impressions: 2840,
    clicks: 84,
    rpm: 4.38
  });

  // Settings State
  const [settings, setSettings] = useState({
    provider: 'carbon', // carbon, adsense, custom, none
    adSenseId: 'ca-pub-6865043298252927',
    adSlotId: '9876543210',
    customName: 'Developer BootCamp Sponsor',
    customImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    customLink: 'https://github.com/aveeranjan',
    customReward: 0.85
  });

  // UI States
  const [activeTab, setActiveTab] = useState('settings'); // settings, analytics, guide
  const [copiedId, setCopiedId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationInterval = useRef(null);

  // Load state from localStorage
  const loadStatsAndSettings = () => {
    try {
      // Stats
      const savedStats = localStorage.getItem('pr_monetization_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      } else {
        localStorage.setItem('pr_monetization_stats', JSON.stringify(stats));
      }

      // Settings
      const savedSettings = localStorage.getItem('pr_monetization_settings');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      } else {
        localStorage.setItem('pr_monetization_settings', JSON.stringify(settings));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatsAndSettings();

    // Listen for updates from other parts of the site (like AdContainer clicks)
    const handleStatsUpdate = () => {
      try {
        const updated = localStorage.getItem('pr_monetization_stats');
        if (updated) setStats(JSON.parse(updated));
      } catch {}
    };

    window.addEventListener('pr_monetization_stats_updated', handleStatsUpdate);
    return () => {
      window.removeEventListener('pr_monetization_stats_updated', handleStatsUpdate);
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, []);

  // Save settings
  const handleSaveSettings = (updatedSettings) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    localStorage.setItem('pr_monetization_settings', JSON.stringify(newSettings));
    
    // Alert AdContainers to reload
    window.dispatchEvent(new Event('pr_monetization_settings_updated'));
    toast.success('Ad preferences saved successfully!');
  };

  // Run Real-Time Traffic Surge Simulator
  const handleStartSimulation = () => {
    if (isSimulating) {
      // Stop
      if (simulationInterval.current) clearInterval(simulationInterval.current);
      setIsSimulating(false);
      toast.error('Traffic Surge Suspended.');
      return;
    }

    setIsSimulating(true);
    toast.success('⚡ Traffic Surge Active! Watch your earnings accumulate!', {
      icon: '🚀',
      style: {
        background: '#064e3b',
        color: '#34d399',
        border: '1px solid rgba(52, 211, 153, 0.2)'
      }
    });

    // Start running traffic simulator
    simulationInterval.current = setInterval(() => {
      setStats(prev => {
        const extraImpressions = Math.floor(Math.random() * 8) + 4; // +4 to +12 views
        const didClick = Math.random() < 0.12; // 12% click-through chance
        
        let extraEarnings = (extraImpressions * (prev.rpm / 1000));
        let extraClicks = 0;

        if (didClick) {
          extraClicks = 1;
          // Determine reward based on active provider
          let reward = 0.45;
          if (settings.provider === 'custom') reward = settings.customReward;
          else if (settings.provider === 'adsense') reward = 0.35;
          extraEarnings += reward;
        }

        const nextStats = {
          ...prev,
          impressions: prev.impressions + extraImpressions,
          clicks: prev.clicks + extraClicks,
          earnings: parseFloat((prev.earnings + extraEarnings).toFixed(5))
        };

        // Persist
        localStorage.setItem('pr_monetization_stats', JSON.stringify(nextStats));
        
        return nextStats;
      });
    }, 150); // fast updates
  };

  // Helper to copy text to clipboard
  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Generate SVG path for the line chart
  const points = INITIAL_CHART_DATA.map((d, i) => {
    const x = 50 + (i * 90);
    // scale revenue between $0 and $15 (chart height is 160, offset by 20 padding)
    const y = 180 - (d.revenue / 15 * 140);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

  return (
    <div className="min-h-screen text-slate-100 font-['Space_Grotesk'] pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded uppercase tracking-wider font-['Orbitron']">
              Creator Hub
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Creator Monetization Suite <DollarSign className="text-emerald-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Turn your study environment and productivity tracking into an active stream of income.
          </p>
        </div>

        {/* Traffic Simulator Panel */}
        <button
          onClick={handleStartSimulation}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl border transition-all select-none font-bold uppercase tracking-wider text-xs font-['Space_Grotesk'] ${
            isSimulating
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse'
              : 'bg-[#050505] text-white border-white/10 hover:border-emerald-500 hover:text-emerald-400 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
          }`}
        >
          <Zap size={14} className={isSimulating ? 'animate-bounce' : ''} />
          {isSimulating ? 'Traffic Surge Running' : 'Simulate Traffic Surge'}
        </button>
      </div>

      {/* Grid: 4 Core Earnings KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Earnings Card */}
        <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] pointer-events-none"></div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Simulated Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-['Orbitron'] tracking-tight flex items-baseline gap-1">
            ${stats.earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <ArrowUpRight size={12} /> Instant Payout Ready
          </div>
        </div>

        {/* Impressions Card */}
        <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] pointer-events-none"></div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Page Impressions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
              <Eye size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-['Orbitron'] tracking-tight">
            {stats.impressions.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-2">
            Views across all active tabs
          </div>
        </div>

        {/* Clicks Card */}
        <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] pointer-events-none"></div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ad Clicks / CTR</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-center text-purple-400">
              <MousePointerClick size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-['Orbitron'] tracking-tight flex items-baseline gap-2">
            {stats.clicks}
            <span className="text-xs text-slate-400 font-bold">
              ({stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="text-[10px] text-purple-400 font-bold mt-2">
            Click-through rate estimation
          </div>
        </div>

        {/* RPM Card */}
        <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] pointer-events-none"></div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Niche RPM Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-['Orbitron'] tracking-tight">
            ${stats.rpm.toFixed(2)}
          </div>
          <div className="text-[10px] text-amber-400 font-bold mt-2">
            High Developer Tier Rate
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 mb-8">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 uppercase tracking-wider font-['Space_Grotesk'] transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-white text-white bg-white/5'
              : 'border-transparent text-slate-500 hover:text-white'
          }`}
        >
          <Settings2 size={15} /> Ad Settings & Campaign Manager
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 uppercase tracking-wider font-['Space_Grotesk'] transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-white text-white bg-white/5'
              : 'border-transparent text-slate-500 hover:text-white'
          }`}
        >
          <TrendingUp size={15} /> Revenue Chart (30 Days)
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 uppercase tracking-wider font-['Space_Grotesk'] transition-all flex items-center gap-2 ${
            activeTab === 'guide'
              ? 'border-white text-white bg-white/5'
              : 'border-transparent text-slate-500 hover:text-white'
          }`}
        >
          <ShieldCheck size={15} /> Production Setup Guide
        </button>
      </div>

      {/* Main Content Sections based on Active Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column - Content Panel (Takes 2/3 space) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab 1: Ad Configuration Settings */}
          {activeTab === 'settings' && (
            <div className="p-6 rounded-2xl bg-[#030303] border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                Select Active Monetization Strategy
              </h3>

              {/* Provider Radio Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Developer Tech Ads */}
                <div 
                  onClick={() => handleSaveSettings({ provider: 'carbon' })}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between h-28 group relative overflow-hidden ${
                    settings.provider === 'carbon' 
                      ? 'bg-blue-500/5 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-[#050505] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Premium Developer Ads
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Display high-end contextual ads for Vercel, MongoDB Atlas, and Copilot. Perfect fit for developer interfaces.
                    </p>
                  </div>
                  <div className="text-[9px] font-black text-blue-400 tracking-wider font-['Orbitron'] uppercase mt-2">
                    {settings.provider === 'carbon' ? 'Active Network' : 'Enable Network'}
                  </div>
                </div>

                {/* Custom Sponsors */}
                <div 
                  onClick={() => handleSaveSettings({ provider: 'custom' })}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between h-28 group relative overflow-hidden ${
                    settings.provider === 'custom' 
                      ? 'bg-purple-500/5 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'bg-[#050505] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Self-Hosted Sponsor Campaigns
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Upload your own advertising banners, configure sponsored URLs, and sell direct spaces to SaaS products.
                    </p>
                  </div>
                  <div className="text-[9px] font-black text-purple-400 tracking-wider font-['Orbitron'] uppercase mt-2">
                    {settings.provider === 'custom' ? 'Active Campaign' : 'Enable Campaign'}
                  </div>
                </div>

                {/* Google AdSense */}
                <div 
                  onClick={() => handleSaveSettings({ provider: 'adsense' })}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between h-28 group relative overflow-hidden ${
                    settings.provider === 'adsense' 
                      ? 'bg-yellow-500/5 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                      : 'bg-[#050505] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Google AdSense (Production)
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Insert your real Google Publisher and Slot IDs to stream live cash once deployed on your custom domain.
                    </p>
                  </div>
                  <div className="text-[9px] font-black text-yellow-500 tracking-wider font-['Orbitron'] uppercase mt-2">
                    {settings.provider === 'adsense' ? 'Active Integration' : 'Enable Integration'}
                  </div>
                </div>

                {/* None (Ad-Free) */}
                <div 
                  onClick={() => handleSaveSettings({ provider: 'none' })}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between h-28 group relative overflow-hidden ${
                    settings.provider === 'none' 
                      ? 'bg-slate-500/5 border-slate-500' 
                      : 'bg-[#050505] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Ad-Free Sandbox Mode
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Hide all ad-generating slots. Replaces layouts with elegant "Sponsor Progress Record" placeholders.
                    </p>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 tracking-wider font-['Orbitron'] uppercase mt-2">
                    {settings.provider === 'none' ? 'Active Setup' : 'Go Ad-Free'}
                  </div>
                </div>
              </div>

              {/* Settings Configuration Panels based on Selected Provider */}
              <div className="p-5 rounded-xl bg-[#050505] border border-white/5">
                
                {/* 1. Carbon Premium Developer Info */}
                {settings.provider === 'carbon' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white">Developer Tech Ads Information</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Developer Ad mode is fully pre-configured. We render minimalist tech sponsorships using premium vectors. Clicking these during your session simulates earning values ranging from **$0.45** to **$0.75** directly inside your progress wallet!
                    </p>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[10px] text-blue-400 flex items-center gap-2">
                      <Sparkles size={12} /> Carbon Ads can be embedded for real production traffic by applying directly to Carbon Ads Network once your website receives active views.
                    </div>
                  </div>
                )}

                {/* 2. Custom Sponsored Ads Creator */}
                {settings.provider === 'custom' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">Create Custom Banner Ad Campaign</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Sponsor / Campaign Name</label>
                        <input
                          type="text"
                          value={settings.customName}
                          onChange={(e) => setSettings({ ...settings, customName: e.target.value })}
                          className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                          placeholder="e.g. Frontend Masters"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Direct Destination URL</label>
                        <input
                          type="text"
                          value={settings.customLink}
                          onChange={(e) => setSettings({ ...settings, customLink: e.target.value })}
                          className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Banner Image URL</label>
                        <input
                          type="text"
                          value={settings.customImage}
                          onChange={(e) => setSettings({ ...settings, customImage: e.target.value })}
                          className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Simulated Payment per Click</label>
                        <input
                          type="number"
                          step="0.05"
                          value={settings.customReward}
                          onChange={(e) => setSettings({ ...settings, customReward: parseFloat(e.target.value) || 0.85 })}
                          className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-['Orbitron']"
                          placeholder="0.85"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveSettings({})}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors text-white font-bold text-xs"
                    >
                      Apply Custom Campaign
                    </button>
                  </div>
                )}

                {/* 3. Google AdSense Configuration Form */}
                {settings.provider === 'adsense' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">Google AdSense Credentials</h4>
                      <span className="text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded font-['Orbitron']">
                        READY FOR LIVE CASH
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Plug in your verified Google publisher information. These parameters inject your live scripts when built for production.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Publisher Client ID</label>
                        <input
                          type="text"
                          value={settings.adSenseId}
                          onChange={(e) => setSettings({ ...settings, adSenseId: e.target.value })}
                          className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-yellow-500 outline-none font-sans"
                          placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ad Slot ID</label>
                        <input
                          type="text"
                          value={settings.adSlotId}
                          onChange={(e) => setSettings({ ...settings, adSlotId: e.target.value })}
                          className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-yellow-500 outline-none font-sans"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSaveSettings({})}
                      className="px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 transition-colors text-black font-bold text-xs uppercase tracking-wider"
                    >
                      Save & Inject Live Scripts
                    </button>
                  </div>
                )}

                {/* 4. Ad-Free Info */}
                {settings.provider === 'none' && (
                  <div>
                    <h4 className="text-sm font-bold text-white">Ad-Free Sandbox Mode</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      All slots are clear. Instead, placeholders are placed, allowing you to showcase premium banners or custom designs when presenting your portfolio to potential advertisers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Custom SVG Line Graph Analytics */}
          {activeTab === 'analytics' && (
            <div className="p-6 rounded-2xl bg-[#030303] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Traffic & Revenue Progression</h3>
                  <p className="text-xs text-slate-500">Visualization of your growing study audience metrics over the last 30 days.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-emerald-400 inline-block"></span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Revenue</span>
                  </div>
                </div>
              </div>

              {/* Custom SVG line chart */}
              <div className="w-full p-4 bg-[#050505] rounded-xl border border-white/5 relative overflow-hidden">
                <svg viewBox="0 0 620 200" className="w-full h-auto">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line 
                      key={i} 
                      x1="40" 
                      y1={40 + (i * 35)} 
                      x2="590" 
                      y2={40 + (i * 35)} 
                      stroke="rgba(255,255,255,0.03)" 
                      strokeWidth="1" 
                    />
                  ))}
                  
                  {/* Chart Fill Area */}
                  <path 
                    d={areaPath} 
                    fill="url(#gradientArea)" 
                    opacity="0.15" 
                  />

                  {/* Chart Line */}
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{ filter: 'drop-shadow(0px 0px 8px rgba(16,185,129,0.3))' }}
                  />

                  {/* Chart Dots & Labels */}
                  {points.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="5.5" 
                        fill="#030303" 
                        stroke="#10b981" 
                        strokeWidth="2.5" 
                      />
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="12" 
                        fill="rgba(16,185,129,0.1)" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity" 
                      />
                      <text 
                        x={p.x} 
                        y={p.y - 12} 
                        fill="#ffffff" 
                        fontSize="9.5" 
                        fontWeight="bold" 
                        textAnchor="middle" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity font-orbitron"
                      >
                        ${p.revenue.toFixed(2)}
                      </text>
                      <text 
                        x={p.x} 
                        y="196" 
                        fill="rgba(255,255,255,0.4)" 
                        fontSize="8.5" 
                        fontWeight="bold" 
                        textAnchor="middle"
                      >
                        {p.day}
                      </text>
                    </g>
                  ))}

                  {/* Gradient Definitions */}
                  <defs>
                    <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400 flex items-center gap-2">
                <TrendingUp size={15} /> Your monetization RPM is scaling dynamically at **${stats.rpm.toFixed(2)}**. Keep active study targets to trigger premium higher-value ads!
              </div>
            </div>
          )}

          {/* Tab 3: Detailed Setup Guide */}
          {activeTab === 'guide' && (
            <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Production Deployment Guide</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Follow these essential setups to display genuine money-making ads once you publish Progress Record to Vercel or your own custom domain.
                </p>
              </div>

              {/* Step 1: ads.txt */}
              <div className="p-5 bg-[#050505] rounded-xl border border-white/5 space-y-3 relative group">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-amber-500 tracking-widest font-['Orbitron'] uppercase">STEP 1: CREATING ADS.TXT</span>
                  <button 
                    onClick={() => copyText("google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0", "adstxt")}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                  >
                    {copiedId === 'adstxt' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Google requires an `ads.txt` file placed in the **public folder** (`frontend-react/public/ads.txt`) to authenticate you own the site. Replace `pub-XXXXXXXXXXXXXXXX` with your publisher ID:
                </p>
                <div className="bg-[#030303] border border-white/10 rounded-lg p-3 font-mono text-[10.5px] text-slate-300 select-all">
                  google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
                </div>
              </div>

              {/* Step 2: Injecting the Header Script */}
              <div className="p-5 bg-[#050505] rounded-xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-500 tracking-widest font-['Orbitron'] uppercase">STEP 2: ENABLING AUTO ADS SCRIPT</span>
                  <button 
                    onClick={() => copyText('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>', "scriptag")}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                  >
                    {copiedId === 'scriptag' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our app automatically handles placing and rendering individual ad banners. If you want Google to automatically display optimized ads across white spaces, paste this script inside the {"<head>"} of your main HTML file ({"frontend-react/index.html"}):
                </p>
                <div className="bg-[#030303] border border-white/10 rounded-lg p-3 font-mono text-[10px] text-slate-400 select-all overflow-x-auto whitespace-nowrap">
                  {'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>'}
                </div>
              </div>

              {/* Step 3: Carbon Ads Application */}
              <div className="p-5 bg-gradient-to-br from-[#020d08] to-[#040806] rounded-xl border border-emerald-500/10 space-y-2">
                <div className="text-[10px] font-black text-emerald-400 tracking-widest font-['Orbitron'] uppercase">STEP 3: DEPLOY & APPLY FOR PREMIUM NETWORKS</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  1. Deploy your app to platforms like Vercel or Netlify.<br />
                  2. Apply to Carbon Ads once you get regular daily users. They pay up to $15 RPM and require clean layouts, which our developer-signature design already ensures!<br />
                  3. If you want Google AdSense, apply through your Google AdSense Dashboard by entering your site domain. Approval typically takes 2 to 14 days.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Live Preview Panel (Takes 1/3 space) */}
        <div className="space-y-6">
          
          {/* Live Sandbox Preview Card */}
          <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[45px] pointer-events-none"></div>
            
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5 uppercase tracking-widest">
              Live Sandbox Preview
            </h3>
            <p className="text-[10px] text-slate-500 mb-6 leading-normal">
              This widget displays exactly how ads appear inside your pages based on active selections.
            </p>

            {/* Simulated Live Render Container */}
            <div className="rounded-xl border border-dashed border-white/10 bg-[#050505] p-2 min-h-36 flex items-center justify-center relative overflow-hidden group hover:border-emerald-500/20 transition-all">
              <AdContainer layout="monetization-view" />
            </div>

            {/* Click Earnings Indicator Tip */}
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs flex-shrink-0 font-['Orbitron']">
                $
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                **Instant cash test:** Click the live preview ad widget above! Clicking awards simulated earnings to your balance immediately, allowing you to test coin tracking mechanisms.
              </p>
            </div>
          </div>

          {/* Quick Stats Helper */}
          <div className="p-6 rounded-2xl bg-[#030303] border border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Niche Optimization Guide</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Niche Level</span>
                <span className="text-emerald-400 font-bold font-['Orbitron']">Level 5 (Elite Dev)</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-emerald-500"></div>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Study tools enjoy very high monetization tier slots because students are actively seeking online bootcamps, developer tools, hosting packages, and reference books.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
