import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Search, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [promptText, setPromptText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const placeholders = [
    "Large pothole near Sector 62 traffic light...",
    "Water leaking from main pipe on MG Road...",
    "Streetlight broken outside Delhi Public School...",
    "Garbage dumped illegally in local park..."
  ];
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "AI Grievance Routing",
      description: "Our system automatically identifies the correct municipal authority and drafts a formal complaint for you.",
      icon: Sparkles,
      delay: 0.1,
      color: "from-primary/20 to-secondary/20",
      border: "border-primary/30"
    },
    {
      title: "Hyperlocal Tracking",
      description: "View and verify issues submitted by your neighbors. Upvote critical problems to increase visibility.",
      icon: MapPin,
      delay: 0.2,
      color: "from-accent/20 to-primary/20",
      border: "border-accent/30"
    },
    {
      title: "Civic Gamification",
      description: "Earn points, unlock badges, and build your civic reputation by helping keep your community safe and clean.",
      icon: ShieldCheck,
      delay: 0.3,
      color: "from-success/20 to-emerald-500/20",
      border: "border-success/30"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full max-w-5xl mx-auto pb-20">
      
      {/* Hero Section */}
      <motion.div 
        className="text-center w-full max-w-3xl mt-12 mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-borderLight mb-6 shadow-xl"
        >
          <span className="flex h-2 w-2 rounded-full bg-success"></span>
          <span className="text-xs font-medium text-textMuted uppercase tracking-wider">System Online</span>
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Fix your city, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x text-glow">
            with AI precision.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-textMuted mb-12 max-w-2xl mx-auto leading-relaxed">
          Community Hero is a hyper-local intelligence platform that turns everyday citizens into civic champions. Report issues, generate official dossiers, and track municipal action in real-time.
        </p>

        {/* Interactive AI Prompt Box */}
        <div className="relative w-full max-w-2xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative glass-panel rounded-2xl p-2 flex items-center shadow-2xl transition-all duration-300 bg-background/80 hover:bg-background/90">
            <div className="pl-4 pr-2 text-textMuted">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <input 
              type="text" 
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-transparent border-none text-white focus:ring-0 text-base md:text-lg h-14 placeholder-textMuted/50 outline-none"
              placeholder=""
            />
            
            {/* Animated Placeholder Text */}
            {!promptText && (
              <div className="absolute left-12 pointer-events-none text-textMuted/50 text-base md:text-lg h-14 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {placeholders[placeholderIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            
            <button 
              className="bg-primary hover:bg-primaryHover text-white h-12 px-6 rounded-xl font-medium flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(108,99,255,0.3)] hover:shadow-[0_0_25px_rgba(108,99,255,0.6)] ml-2"
              onClick={() => navigate('/tracker')}
            >
              Analyze
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bento Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + feature.delay, duration: 0.6, ease: "easeOut" }}
            className={`glass-panel p-6 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border ${feature.border}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-borderLight flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white tracking-tight">{feature.title}</h3>
              <p className="text-textMuted leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
