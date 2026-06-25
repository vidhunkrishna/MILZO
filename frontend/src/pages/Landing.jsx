import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Milk, 
  Calendar, 
  MapPin, 
  Wallet, 
  Check,
  TrendingUp,
  Truck,
  Users2
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { staggerContainer, staggerChild, smoothSpring, hoverLift } from '../lib/animations';

const Landing = () => {
  const darkMode = useSelector((state) => state.ui.darkMode);

  // Carousel items definition
  const sliderItems = [
    {
      id: 1,
      title: 'Farm Fresh Milk',
      badge: 'Pure',
      desc: 'Premium pasteurized whole, double-toned, and skimmed milk.',
      image: '/card_milk.png',
      icon: <Milk className="h-5 w-5 text-sky-400" />,
      color: 'from-sky-500/20 to-blue-500/20'
    },
    {
      id: 2,
      title: 'Artisanal Cheese',
      badge: 'Organic',
      desc: 'Gourmet cheddar, local cottage paneer, and rich mozzarella.',
      image: '/card_cheese.png',
      icon: <Sparkles className="h-5 w-5 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      id: 3,
      title: 'Country Butter',
      badge: 'Churned',
      desc: 'Rich, golden salted and unsalted butter blocks.',
      image: '/card_butter.png',
      icon: <Zap className="h-5 w-5 text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/20'
    },
    {
      id: 4,
      title: 'Creamy Yogurt',
      badge: 'Probiotic',
      desc: 'Thick, creamy Greek yogurt infused with fresh berries.',
      image: '/card_yogurt.png',
      icon: <Activity className="h-5 w-5 text-rose-400" />,
      color: 'from-rose-500/20 to-red-500/20'
    },
    {
      id: 5,
      title: 'Clarified Ghee',
      badge: 'Pure Cow',
      desc: 'Traditionally prepared aromatic clarified butter jar.',
      image: '/card_milk.png',
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      color: 'from-amber-600/20 to-yellow-600/20'
    },
    {
      id: 6,
      title: 'Smart Wallets',
      badge: 'Secure',
      desc: 'Seamless Razorpay integration and instant credit recharges.',
      image: '/card_yogurt.png',
      icon: <Wallet className="h-5 w-5 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      id: 7,
      title: 'Optimized Routes',
      badge: 'Logistics',
      desc: 'Automated vehicle log mapping and agent scheduling.',
      image: '/card_milk.png',
      icon: <MapPin className="h-5 w-5 text-indigo-400" />,
      color: 'from-indigo-500/20 to-purple-500/20'
    },
    {
      id: 8,
      title: 'Subscriptions',
      badge: 'Flexible',
      desc: 'Pause, resume, or cancel daily orders with one click.',
      image: '/card_cheese.png',
      icon: <Calendar className="h-5 w-5 text-violet-400" />,
      color: 'from-violet-500/20 to-fuchsia-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden font-sans">
      
      {/* ─── Premium Glass Header ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/60 dark:bg-[#070b13]/60 backdrop-blur-xl border-b border-slate-200/55 dark:border-slate-800/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-wider font-display">
              MILZO
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
            <a href="#stats" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Overview</a>
            <a href="#security" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-95"
            >
              Enter Console
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with 3D Carousel ───────────────────────────────────── */}
      <section className="relative min-h-screen pt-28 flex flex-col items-center justify-center bg-radial-gradient-dark overflow-visible">
        {/* Glow Spheres in background */}
        <div className="absolute top-[25%] left-[10%] w-[35%] h-[35%] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none dark:block hidden" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none dark:block hidden" />

        {/* Large stylized outline background text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <h1 
            className="text-[12vw] font-black tracking-widest text-transparent uppercase text-center leading-none"
            style={{
              WebkitTextStroke: darkMode ? '1.5px rgba(255,255,255,0.035)' : '1.5px rgba(15,23,42,0.04)',
            }}
          >
            MILZO MILK
          </h1>
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Copywriting & CTAs */}
          <motion.div 
            className="lg:col-span-5 flex flex-col items-start text-left space-y-6"
            variants={staggerContainer(0.08)}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase"
              variants={staggerChild}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Next-Gen Dairy Logistics Console
            </motion.div>

            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight font-display"
              variants={staggerChild}
            >
              Streamline Your <br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Dairy Operations
              </span>
            </motion.h2>

            <motion.p 
              className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg"
              variants={staggerChild}
            >
              Enterprise-grade dashboard built for modern distributors. Optimize delivery dispatches, automate subscription calculations, and manage routes in real-time.
            </motion.p>

            <motion.div 
              className="flex flex-wrap items-center gap-4 w-full pt-4"
              variants={staggerChild}
            >
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:scale-95 group"
              >
                Launch Console
                <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-all border border-slate-200/50 dark:border-white/10 active:scale-95"
              >
                Explore Features
              </a>
            </motion.div>

            {/* Micro Trust Indicators */}
            <motion.div 
              className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/60 dark:border-slate-800/40 w-full"
              variants={staggerChild}
            >
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">99.8%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">On-Time Dispatches</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">100%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Secure Wallets</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">0-Lag</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Route Mapping</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: 3D Rotating Carousel Layout */}
          <div className="lg:col-span-7 flex items-center justify-center overflow-visible select-none min-h-[550px] relative">
            
            {/* The 3D Carousel Scene */}
            <div className="carousel-3d-container">
              
              {/* Outer Slider Wrapper (Rotates in 3D) */}
              <div 
                className="carousel-3d-slider"
                style={{
                  '--quantity': 8
                }}
              >
                {sliderItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="carousel-3d-item group/card cursor-pointer"
                    style={{
                      '--position': idx + 1
                    }}
                  >
                    {/* Glass card design */}
                    <div className="w-full h-full bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md rounded-3xl border border-white/10 dark:border-slate-800 shadow-2xl flex flex-col justify-between p-4 overflow-hidden relative group-hover/card:border-blue-500/50 group-hover/card:shadow-blue-500/10 transition-all duration-300">
                      
                      {/* Image background with overlay */}
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover opacity-25 group-hover/card:scale-110 group-hover/card:opacity-35 transition-all duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                      </div>

                      {/* Top bar (Icon & Badge) */}
                      <div className="flex items-center justify-between z-10">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          {item.icon}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                          {item.badge}
                        </span>
                      </div>

                      {/* Bottom Info (Title & Description) */}
                      <div className="z-10 text-left space-y-1.5">
                        <h4 className="text-sm font-extrabold text-white tracking-wide uppercase">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-normal line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Central Overlaying Milk Bottle Model Splash (z-index overlays items in front) */}
              <img 
                src="/milk_splash_model.png" 
                alt="Central Milk Splash Model" 
                className="carousel-3d-model animate-float mix-blend-screen"
                style={{
                  mixBlendMode: 'screen'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid Section ───────────────────────────────────── */}
      <section id="features" className="py-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Core Architecture
            </h3>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
              Built for Professional Dairy Logistics
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              MILZO brings modern database design, security measures, and responsive tracking consoles to simplify your everyday dispatches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-300 text-left space-y-4"
              {...hoverLift}
            >
              <div className="p-3 w-max rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Advanced Subscriptions</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                Easily scale daily, alternate, or weekly plans. Automatic transaction pausing/resumption updates user wallets instantly.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-300 text-left space-y-4"
              {...hoverLift}
            >
              <div className="p-3 w-max rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Truck className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Logistics & Dispatch Roster</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                Assign vehicle logs, roster delivery agent attendance, set shifts, and monitor real-time delivery performance statistics.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 hover:border-blue-500/30 hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-300 text-left space-y-4"
              {...hoverLift}
            >
              <div className="p-3 w-max rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Smart Digital Wallet</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-normal">
                Recharge digital user wallets securely. Transparent transaction ledgers capture all customer order cancellations and adjustments.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Security & Integration Section ───────────────────────────────────── */}
      <section id="security" className="py-24 bg-slate-50 dark:bg-[#070b13] border-t border-slate-200/60 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              High-Security Standards
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight font-display">
              Enterprise Role-Based Access Control (RBAC)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              MILZO protects sensitive dairy records, billing configurations, and system logging outputs. We enforce strict role-based access for SuperAdmins, Admins, Dispatch Managers, and Customer Service agents.
            </p>
            <div className="space-y-3.5">
              {[
                'JWT session authentication with HTTP-only tokens',
                'Mongo Sanitize & Helmet protection filters',
                'Comprehensive Winston logger system audit logs',
                'API gateway rate limiting safeguards'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphical Mockup Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Logo size={28} />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">MILZO API Gateway</h4>
                  <p className="text-[10px] text-slate-400">Active Node.js Express Instance</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold tracking-wider">
                ONLINE
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b13] border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily Order Volatility</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Auto-balanced</span>
              </div>
              
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b13] border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users2 className="h-5 w-5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Agent Attendance Map</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Live Sync</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b13] border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Dispatch Scheduling API</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[8px] font-bold">V1</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">0.02ms Response</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Premium Footer ───────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="text-lg font-black text-white tracking-wider">
              MILZO
            </span>
          </div>

          <p className="text-xs font-medium">
            &copy; {new Date().getFullYear()} MILZO Milk Delivery Management System. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <Link to="/login" className="text-white hover:text-blue-400 transition-colors">Admin Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
