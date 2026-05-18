import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, DollarSign, Sparkles, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

// Custom developer ads library (Carbon Ads style)
const DEVELOPER_ADS = [
  {
    id: 'vercel',
    title: 'Vercel',
    description: 'Deploy React instantly. Global CDN, Serverless Functions, and premium speed by default.',
    cta: 'Deploy Now',
    link: 'https://vercel.com',
    logo: '▲',
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.02)',
    border: 'rgba(255,255,255,0.1)',
    reward: 0.45 // Clicking this gives $0.45 simulated cash!
  },
  {
    id: 'mongodb',
    title: 'MongoDB Atlas',
    description: 'The developer database. Fully managed document database with global scale and search.',
    cta: 'Try Free',
    link: 'https://mongodb.com/atlas',
    logo: '🍃',
    color: '#00ed64',
    bg: 'rgba(0,237,100,0.02)',
    border: 'rgba(0,237,100,0.1)',
    reward: 0.60
  },
  {
    id: 'github',
    title: 'GitHub Copilot',
    description: 'Your AI pair programmer. Write code faster, configure tests, and build ideas in real-time.',
    cta: 'Start Trial',
    link: 'https://github.com/features/copilot',
    logo: '🐙',
    color: '#a370f7',
    bg: 'rgba(163,112,247,0.02)',
    border: 'rgba(163,112,247,0.1)',
    reward: 0.50
  },
  {
    id: 'frontendmasters',
    title: 'Frontend Masters',
    description: 'Deep-dive React, TypeScript & CSS courses. Learn from leading industry experts.',
    cta: 'Start Learning',
    link: 'https://frontendmasters.com',
    logo: '💻',
    color: '#ff3e00',
    bg: 'rgba(255,62,0,0.02)',
    border: 'rgba(255,62,0,0.1)',
    reward: 0.75
  }
];

export default function AdContainer({ layout = 'sidebar' }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    provider: 'carbon', // carbon, adsense, custom, none
    adSenseId: '',
    adSlotId: '',
    customName: 'Progress Pro Sponsor',
    customImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
    customLink: 'https://github.com/aveeranjan',
    customReward: 0.85
  });

  const [activeDevAd, setActiveDevAd] = useState(DEVELOPER_ADS[0]);
  const [isHovered, setIsHovered] = useState(false);

  // Load monetization settings from local storage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('pr_monetization_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Failed to load monetization settings", e);
    }
  };

  useEffect(() => {
    loadSettings();

    // Listen for setting changes
    window.addEventListener('pr_monetization_settings_updated', loadSettings);
    
    // Choose a random developer ad on mount
    const randomAd = DEVELOPER_ADS[Math.floor(Math.random() * DEVELOPER_ADS.length)];
    setActiveDevAd(randomAd);

    // Track simulated Page Impression
    setTimeout(() => {
      incrementImpressions();
    }, 1000);

    return () => {
      window.removeEventListener('pr_monetization_settings_updated', loadSettings);
    };
  }, []);

  // Set up Google AdSense Script injection
  useEffect(() => {
    if (settings.provider === 'adsense' && settings.adSenseId) {
      try {
        const existingScript = document.querySelector('script[src*="adsbygoogle.js"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adSenseId}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.body.appendChild(script);
        }
        
        // Push ad init
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense layout initialization warning. Usually safe in local development.", e);
      }
    }
  }, [settings.provider, settings.adSenseId, settings.adSlotId]);

  // Helper to record simulated impressions
  const incrementImpressions = () => {
    try {
      const stats = JSON.parse(localStorage.getItem('pr_monetization_stats') || '{"earnings":12.45,"impressions":2840,"clicks":84,"rpm":4.38}');
      stats.impressions += 1;
      
      // Every impression adds a fraction of RPM (e.g. $4.50 RPM = $0.0045 per impression)
      const rpm = stats.rpm || 4.38;
      const earningsPerImpression = rpm / 1000;
      stats.earnings = parseFloat((stats.earnings + earningsPerImpression).toFixed(5));
      
      localStorage.setItem('pr_monetization_stats', JSON.stringify(stats));
      // Dispatch event to update the Monetization Dashboard if open
      window.dispatchEvent(new Event('pr_monetization_stats_updated'));
    } catch {}
  };

  // Helper when clicking simulated ads (giving instant rewards!)
  const handleAdClick = (rewardAmount, adName) => {
    try {
      const stats = JSON.parse(localStorage.getItem('pr_monetization_stats') || '{"earnings":12.45,"impressions":2840,"clicks":84,"rpm":4.38}');
      stats.clicks += 1;
      stats.earnings = parseFloat((stats.earnings + rewardAmount).toFixed(2));
      
      localStorage.setItem('pr_monetization_stats', JSON.stringify(stats));
      window.dispatchEvent(new Event('pr_monetization_stats_updated'));
      
      toast.success(`+$${rewardAmount.toFixed(2)} Instant Ad Earnings!`, {
        icon: '💵',
        style: {
          background: '#042f1a',
          color: '#34d399',
          border: '1px solid rgba(52, 211, 153, 0.2)'
        }
      });
    } catch {}
  };

  // 1. None Mode (Aesthetic Sponsor CTA)
  if (settings.provider === 'none') {
    if (layout === 'sidebar') {
      return (
        <div className="p-4 mx-3 my-2 rounded-2xl bg-[#030303] border border-white/5 flex flex-col items-center text-center gap-2 select-none">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
            <Megaphone size={14} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white font-['Space_Grotesk']">Sponsor Progress Record</div>
            <div className="text-[9px] text-slate-500 mt-0.5 leading-normal">Monetize your dashboard and track live earnings.</div>
          </div>
          <button 
            onClick={() => navigate('/monetization')}
            className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[9px] font-bold border border-white/10 transition-colors uppercase tracking-wider font-['Space_Grotesk']"
          >
            Enable Ads
          </button>
        </div>
      );
    }
    
    // Horizontal Banner None placeholder
    return (
      <div 
        onClick={() => navigate('/monetization')}
        className="w-full p-6 rounded-2xl bg-gradient-to-r from-slate-900/40 to-slate-950/40 border border-dashed border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
            <Megaphone size={20} className="group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-white font-bold text-sm tracking-wide">Monetize Your Traffic</div>
            <div className="text-slate-500 text-xs mt-0.5">Toggle real Google AdSense, Sponsor Banners, or Carbon Tech Ads to start earning.</div>
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white text-black font-bold text-[11px] uppercase tracking-wider group-hover:scale-105 transition-transform flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.15)]">
          <Sparkles size={12} /> Configure Ad Slot
        </div>
      </div>
    );
  }

  // 2. Custom Sponsored Ads
  if (settings.provider === 'custom') {
    const isSidebar = layout === 'sidebar';
    return (
      <a 
        href={settings.customLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleAdClick(settings.customReward || 0.85, settings.customName)}
        className={`block p-3 rounded-2xl bg-[#030303] border border-white/5 hover:border-blue-500/30 transition-all group overflow-hidden relative ${isSidebar ? 'mx-3 my-2' : 'w-full'}`}
      >
        <div className="absolute top-1 right-2 text-[7px] font-bold text-blue-400 tracking-widest uppercase">SPONSOR</div>
        
        <div className={`flex ${isSidebar ? 'flex-col gap-2' : 'flex-col sm:flex-row items-center gap-4'}`}>
          <div className={`${isSidebar ? 'w-full h-24' : 'w-full sm:w-36 h-20'} rounded-lg overflow-hidden relative bg-slate-900 border border-white/10 flex-shrink-0`}>
            <img 
              src={settings.customImage} 
              alt={settings.customName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-white flex items-center gap-1">
                {settings.customName} <ExternalLink size={8} className="text-slate-500" />
              </div>
              <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                Click this premium banner to check out our sponsor and support developer-driven productivity software.
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[8px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5 rounded uppercase tracking-wider font-['Orbitron']">
                Earn $0.85
              </span>
              <span className="text-[8px] text-slate-500 group-hover:text-white transition-colors font-bold uppercase tracking-wider">
                Visit Sponsor &rarr;
              </span>
            </div>
          </div>
        </div>
      </a>
    );
  }

  // 3. Google AdSense (Genuine production structure + Local friendly fallback mockup)
  if (settings.provider === 'adsense') {
    const isSidebar = layout === 'sidebar';
    
    // In local development, Google AdSense doesn't display because it runs on localhost and requires active domain review.
    // To ensure perfect developer UX, we render a highly premium "Google AdSense Sandbox Block" when on localhost,
    // which simulates Google Adsense displaying while keeping the real script integration running under the hood!
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return (
        <div 
          onClick={() => handleAdClick(0.35, "Google AdSense Mock")}
          className={`cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#0c0f1a] to-[#040814] border border-blue-500/20 relative group overflow-hidden ${isSidebar ? 'mx-3 my-2' : 'w-full'}`}
        >
          {/* AdSense Yellow bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500"></div>
          
          <div className="flex justify-between items-start mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              <span className="text-[8px] font-black text-yellow-500 tracking-[0.2em] font-['Orbitron'] uppercase">GOOGLE ADSENSE</span>
            </div>
            <span className="text-[7px] text-slate-500 tracking-wider">ca-pub-{settings.adSenseId ? settings.adSenseId.substring(0, 8) + '...' : 'XXXXXX'}</span>
          </div>

          <div className="text-center py-3">
            <div className="text-xs text-white font-bold tracking-wide">Sponsored Interactive Placement</div>
            <div className="text-[9px] text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
              Google AdSense script is injected! This gorgeous mockup is active in local development. When deployed on your live domain, a real contextual ad will render here.
            </div>
          </div>

          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5">
            <span className="text-[8px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.5 rounded font-['Orbitron']">
              Sandbox Click: $0.35
            </span>
            <span className="text-[8px] text-slate-500 group-hover:text-yellow-500 transition-colors uppercase font-bold tracking-widest">
              Live Preview
            </span>
          </div>
        </div>
      );
    }

    // Active Production Google AdSense HTML integration
    return (
      <div className={`adsense-wrapper overflow-hidden ${isSidebar ? 'mx-3 my-2 p-1 bg-black/20 rounded-xl' : 'w-full py-4'}`}>
        <div className="text-[8px] text-slate-600 text-right tracking-widest uppercase mb-1">Advertisement</div>
        {settings.adSenseId && settings.adSlotId ? (
          <ins className="adsbygoogle"
               style={{ display: 'block', textAlign: 'center' }}
               data-ad-client={settings.adSenseId}
               data-ad-slot={settings.adSlotId}
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
        ) : (
          <div className="text-xs text-slate-500 text-center py-4 border border-dashed border-white/10 rounded-xl">
            Please configure AdSense Client ID & Slot ID in Monetization Suite.
          </div>
        )}
      </div>
    );
  }

  // 4. Developer Premium Ads (Carbon Ads Style - Gorgeous default)
  const isSidebar = layout === 'sidebar';
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => handleAdClick(activeDevAd.reward, activeDevAd.title)}
      className={`cursor-pointer p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${isSidebar ? 'mx-3 my-2' : 'w-full'}`}
      style={{
        backgroundColor: activeDevAd.bg,
        border: `1px solid ${isHovered ? activeDevAd.color + '40' : 'rgba(255, 255, 255, 0.05)'}`,
        boxShadow: isHovered ? `0 0 20px ${activeDevAd.color}0a` : 'none'
      }}
    >
      {/* Top Banner Tag */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
          <Sparkles size={8} className="text-slate-400" /> Sponsored Tech Partner
        </span>
        <span className="text-[7px] text-slate-500 group-hover:text-white transition-colors bg-white/5 px-1 py-0.5 rounded font-['Space_Grotesk'] font-bold">
          ads via PR
        </span>
      </div>

      {/* Main Content */}
      <div className={`flex ${isSidebar ? 'flex-col gap-2.5' : 'flex-row items-center gap-4'}`}>
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 transition-transform group-hover:scale-105 duration-300 shadow-[0_0_15px_rgba(255,255,255,0.02)]"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            border: `1px solid ${activeDevAd.color}20`,
            color: activeDevAd.color 
          }}
        >
          {activeDevAd.logo}
        </div>
        
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white flex items-center gap-1 font-['Space_Grotesk']">
            {activeDevAd.title}
          </h4>
          <p className="text-[9.5px] text-slate-400 mt-1 leading-normal font-sans">
            {activeDevAd.description}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5">
        <span 
          className="text-[8px] font-bold border px-1.5 py-0.5 rounded font-['Orbitron'] transition-colors"
          style={{
            borderColor: activeDevAd.color + '30',
            backgroundColor: activeDevAd.color + '05',
            color: activeDevAd.color
          }}
        >
          Earn ${activeDevAd.reward.toFixed(2)}
        </span>
        
        <span className="text-[8.5px] font-bold text-white flex items-center gap-1 uppercase tracking-wider group-hover:translate-x-0.5 transition-all">
          {activeDevAd.cta} &rarr;
        </span>
      </div>
    </div>
  );
}
