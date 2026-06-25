import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { slideInUp, smoothSpring, staggerContainer, staggerChild } from '../lib/animations';

const quickReplies = [
  { label: 'Low Stock Alert', query: 'Show me any low inventory alerts' },
  { label: 'Roster Summary', query: 'What is the attendance status today?' },
  { label: 'Route Issues', query: 'Are there any route bottlenecks?' },
  { label: 'Revenue Overview', query: 'Show today\'s revenue metrics' },
];

const MILZO_KNOWLEDGE = {
  stock: '⚠️ LOW INVENTORY ALERT: Organic Butter is down to 12 units and Pure Desi Ghee is down to 5 units in Whitefield hub. We recommend generating a vendor restock order.',
  attendance: '📅 ROSTER SUMMARY: Out of 12 scheduled agents for the Morning Milk Dispatch, 10 are present, 1 is absent (Amit Mishra), and 1 is on leave (Dinesh Karthik). All routes are covered.',
  routes: '📍 ROUTE BOTTLE NECKS: Indiranagar Route C is currently unassigned due to agent shortage. Koramangala Route A is experiencing minor delays of 15 mins due to road repairs.',
  revenue: '💰 REVENUE STATUS: Daily collected revenue is ₹48,250. Month-to-date collections stand at ₹39.95 Lakhs across 842 active subscribers.',
  greeting: (name) => `Hello ${name}! I'm MILZO AI, your operations assistant. How can I help you coordinate today's dairy dispatches?`,
  default: 'I can query active registers, routes, and billing alerts. Try asking about "stock", "roster", "routes", or "revenue" for live reports!'
};

const AIChatWidget = () => {
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: MILZO_KNOWLEDGE.greeting(user?.name || 'Admin'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = MILZO_KNOWLEDGE.default;
      const normalized = text.toLowerCase();

      if (normalized.includes('stock') || normalized.includes('inventory') || normalized.includes('ghee') || normalized.includes('butter')) {
        replyText = MILZO_KNOWLEDGE.stock;
      } else if (normalized.includes('roster') || normalized.includes('attendance') || normalized.includes('absent') || normalized.includes('leave')) {
        replyText = MILZO_KNOWLEDGE.attendance;
      } else if (normalized.includes('route') || normalized.includes('delay') || normalized.includes('unassigned') || normalized.includes('bottleneck')) {
        replyText = MILZO_KNOWLEDGE.routes;
      } else if (normalized.includes('revenue') || normalized.includes('earn') || normalized.includes('paid') || normalized.includes('wallet')) {
        replyText = MILZO_KNOWLEDGE.revenue;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  // Message animation variants
  const messageVariants = {
    user: {
      initial: { opacity: 0, x: 20, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
    },
    ai: {
      initial: { opacity: 0, x: -20, scale: 0.95 },
      animate: { opacity: 1, x: 0, scale: 1 },
    },
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="relative group p-4 rounded-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-glow"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 blur opacity-30 group-hover:opacity-65 transition-opacity duration-200 animate-pulse-slow"></span>
            <MessageSquare className="h-6 w-6 relative z-10" />
            <span className="absolute top-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-bg z-20"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="w-[380px] h-[520px] rounded-3xl bg-white/95 dark:bg-dark-card/95 backdrop-blur-2xl border border-slate-200/80 dark:border-dark-border/80 shadow-2xl flex flex-col justify-between overflow-hidden"
            variants={slideInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smoothSpring}
          >
            {/* Header Panel */}
            <motion.div
              className="p-4 bg-gradient-to-r from-primary-600 to-indigo-600 border-b border-slate-100 dark:border-dark-border/40 flex items-center justify-between text-white"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-white">
                  <Bot className="h-5 w-5 animate-pulse-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1">
                    MILZO AI Agent <Sparkles className="h-3.5 w-3.5 text-sky-300 fill-current" />
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    <span className="text-[10px] text-sky-100 font-semibold">Online Assistant</span>
                  </div>
                </div>
              </div>
              
              <motion.button
                onClick={() => setIsOpen(false)}
                className="p-1 text-sky-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </motion.div>

            {/* Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[300px]">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const variant = messageVariants[msg.sender] || messageVariants.ai;
                  return (
                    <motion.div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      initial={variant.initial}
                      animate={variant.animate}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    className="flex flex-col items-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-400 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {messages.length === 1 && (
              <motion.div
                className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20"
                variants={staggerContainer(0.06)}
                initial="initial"
                animate="animate"
              >
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Suggested Queries</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((qr, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleSend(qr.query)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-600/20 dark:hover:text-primary-400 border border-slate-200 dark:border-white/5 hover:border-primary-200 dark:hover:border-primary-500/20 text-slate-600 dark:text-slate-400 transition-colors font-semibold"
                      variants={staggerChild}
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {qr.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-150 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/40 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="Ask about inventory, routes, attendance..."
                className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary-500/40 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
              />
              <motion.button
                onClick={() => handleSend(inputValue)}
                className="p-2 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-md transition-colors"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <Send className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatWidget;
