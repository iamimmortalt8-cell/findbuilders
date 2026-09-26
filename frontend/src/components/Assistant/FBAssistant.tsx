import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, AlertCircle, CheckCircle2, MessageSquare, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { FINDBUILDERS_CONTEXT } from './context';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const STYLE_ID = 'fb-anim';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes fb-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes fb-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.1; transform: scale(0.8); } }
    @keyframes fb-glow { 0%, 100% { opacity: 0.3; transform: scale(1.1); } 50% { opacity: 0.5; transform: scale(1.3); } }
    @keyframes fb-breathe { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.4; } }
    @keyframes fb-blink { 0%, 94%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
    @keyframes fb-hand-left { 0%, 100% { transform: rotate(-20deg) translateY(0); } 50% { transform: rotate(-20deg) translateY(-2px); } }
    @keyframes fb-hand-right { 0%, 100% { transform: rotate(20deg) translateY(0); } 50% { transform: rotate(20deg) translateY(-2px); } }
    .fb-float { animation: fb-float 3s ease-in-out infinite; }
    .fb-pulse { animation: fb-pulse 3s ease-in-out infinite; }
    .fb-glow { animation: fb-glow 2s ease-in-out infinite; }
    .fb-breathe { animation: fb-breathe 2s ease-in-out infinite; }
    .fb-blink { animation: fb-blink 4s ease-in-out infinite; }
    .fb-hand-left { animation: fb-hand-left 3s ease-in-out infinite 0.2s; }
    .fb-hand-right { animation: fb-hand-right 3s ease-in-out infinite 0.4s; }
  `;
  document.head.appendChild(style);
}

const SUGGESTED_PROMPTS = [
  { text: "How does FindBuilders work?", icon: "📄" },
  { text: "How do I submit a product?", icon: "🚀" },
  { text: "How do I find builders?", icon: "🔍" },
  { text: "Can I contact the team?", icon: "❓" }
];

const MESSAGES = [
  "👋 Hi there! I'm FindBuilders AI. How can I help you today?",
  "✨ Looking to launch a product? I'm here to help!",
  "🚀 Ready to showcase your skills to the world?",
  "💬 Got a question about finding builders? Ask away!",
  "💡 Need help with your startup journey?",
  "🤝 Let's build something amazing together.",
  "🤔 Stuck somewhere? Just ask me!"
];

export default function FBAssistant() {
  const STORAGE_KEY = 'fb_assistant_state';
  const location = useLocation();

  const [messageIndex, setMessageIndex] = useState(0);
  const currentMessage = MESSAGES[messageIndex];

  function loadSavedState(): { messages: Message[]; showSupport: boolean } {
    try {
      const isRefresh = typeof performance !== 'undefined' && performance.getEntriesByType('navigation').some(
        (nav) => (nav as PerformanceNavigationTiming).type === 'reload'
      );
      if (isRefresh) {
        localStorage.removeItem(STORAGE_KEY);
        return { messages: [], showSupport: false };
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages && parsed.messages.length > 0) {
           return parsed;
        }
      }
    } catch { /* ignore */ }
    return { messages: [], showSupport: false };
  }

  const savedState = loadSavedState();

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>(savedState.messages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSendingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showSupport, setShowSupport] = useState(savedState.showSupport);
  const [supportData, setSupportData] = useState({ name: '', email: '', subject: '', message: '' });
  const [supportStatus, setSupportStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [supportError, setSupportError] = useState('');

  // Auto-scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showSupport]);

  // Randomize message on interval when idle
  useEffect(() => {
    if (!isHovered && !isOpen) {
      const interval = setInterval(() => {
        setMessageIndex(Math.floor(Math.random() * MESSAGES.length));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isHovered, isOpen]);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, showSupport }));
  }, [messages, showSupport]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsLoading(true);
    setInputValue('');

    const lower = trimmed.toLowerCase();
    const wantsHuman = lower.includes('contact') || lower.includes('human') || lower.includes('support') || lower.includes('feedback') || lower.includes('report');
    
    if (wantsHuman) {
      setShowSupport(true);
    }

    const currentMessages = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(currentMessages);

    try {
      const pageContext = `User is currently on path: ${location.pathname}`;
      const fullContext = `${FINDBUILDERS_CONTEXT}\n\n[CURRENT CONTEXT]\n${pageContext}`;

      const res = await api.sendAIChat(currentMessages, fullContext);
      
      let aiContent = res.reply || res.choices?.[0]?.message?.content || res.message || res.answer || "I'm sorry, I couldn't process that.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
      
      if (aiContent.toLowerCase().includes('get in touch') || aiContent.toLowerCase().includes('contact the findbuilders team') || aiContent.toLowerCase().includes('fill out the form')) {
         setShowSupport(true);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having a little trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      isSendingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const submitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportData.name || !supportData.email || !supportData.subject || !supportData.message) return;
    setSupportStatus('submitting');
    setSupportError('');

    try {
      const res = await api.sendSupportMessage(supportData);
      if (res.success) {
        setSupportStatus('success');
      } else {
        setSupportStatus('error');
        setSupportError(res.error || 'Failed to send message.');
      }
    } catch (err: any) {
      setSupportStatus('error');
      setSupportError(err.message || 'An error occurred.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="mb-4 w-[calc(100vw-32px)] sm:w-[320px] h-[480px] max-h-[calc(100vh-100px)] bg-[#151D19] border border-[#202A25] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/5 bg-[#1B2520] shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#151D19] rounded-xl border border-white/10 shadow-sm">
                    <img src="/findbuilderslogo.png" alt="FindBuilders Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain relative z-10" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full opacity-50" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#7FAF8D] border-2 border-[#1B2520] rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-[#F5F1E8] font-semibold text-sm">FindBuilders AI</h3>
                  <div className="flex items-center text-xs text-[#8C958E]">
                    <span>Your Project Guide</span>
                    <span className="mx-1.5">•</span>
                    <span className="text-[#7FAF8D]">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#8C958E] hover:text-[#F5F1E8] hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                type="button"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#29342E] scrollbar-track-transparent">
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1B2520] border border-white/5 rounded-xl p-4 sm:p-5 text-sm shadow-md"
                >
                  <p className="font-medium text-[#F5F1E8] mb-4">
                    👋 Hi! Welcome to FindBuilders.
                  </p>
                  <p className="text-[#8C958E] mb-2">I can help you get started:</p>
                  <ul className="space-y-2 text-[#F5F1E8] mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-base">🚀</span> How to launch a product
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-base">🔍</span> How to find builders
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-base">🤝</span> Connecting with others
                    </li>
                  </ul>
                  <p className="font-medium text-[#F5F1E8]">What would you like to know?</p>
                </motion.div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm shadow-md whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#2E6549] text-[#F5F1E8] rounded-tr-sm'
                        : 'bg-[#1B2520] text-[#F5F1E8] border border-[#202A25] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1B2520] border border-[#202A25] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8C958E] animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8C958E] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8C958E] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {showSupport && (
                <div className="mt-4 border border-[#202A25] rounded-xl bg-[#101814] p-4 shrink-0 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-[#29342E] scrollbar-track-transparent">
                  <h4 className="text-sm font-semibold text-[#F5F1E8] mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D8C7A5]" />
                    Contact Team 🤝
                  </h4>
                  <p className="text-xs text-[#8C958E] mb-4">Send a message directly to the FindBuilders founders.</p>
                  
                  {supportStatus === 'success' ? (
                    <div className="text-center py-4 text-[#7FAF8D]">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Message sent successfully!</p>
                      <button onClick={() => { setShowSupport(false); setSupportStatus('idle'); }} className="mt-3 text-xs text-[#8C958E] hover:text-[#F5F1E8]">Close form</button>
                    </div>
                  ) : (
                    <form onSubmit={submitSupport} className="space-y-3">
                      <input 
                        type="text" placeholder="Name" required
                        value={supportData.name} onChange={e => setSupportData({...supportData, name: e.target.value})}
                        className="w-full bg-[#151D19] border border-[#29342E] rounded-lg px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#789181] focus:outline-none"
                      />
                      <input 
                        type="email" placeholder="Email" required
                        value={supportData.email} onChange={e => setSupportData({...supportData, email: e.target.value})}
                        className="w-full bg-[#151D19] border border-[#29342E] rounded-lg px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#789181] focus:outline-none"
                      />
                      <input 
                        type="text" placeholder="Subject" required
                        value={supportData.subject} onChange={e => setSupportData({...supportData, subject: e.target.value})}
                        className="w-full bg-[#151D19] border border-[#29342E] rounded-lg px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#789181] focus:outline-none"
                      />
                      <textarea 
                        placeholder="How can we help?" rows={3} required
                        value={supportData.message} onChange={e => setSupportData({...supportData, message: e.target.value})}
                        className="w-full bg-[#151D19] border border-[#29342E] rounded-lg px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#789181] focus:outline-none resize-none"
                      />
                      {supportError && (
                        <p className="text-xs text-[#C97878] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {supportError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button 
                          type="button" onClick={() => setShowSupport(false)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium text-[#8C958E] hover:text-[#F5F1E8] bg-[#151D19] border border-[#29342E] hover:bg-[#1B2520] transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" disabled={supportStatus === 'submitting'}
                          className="flex-1 py-2 rounded-lg text-xs font-medium text-[#1A1A16] bg-[#D8C7A5] hover:bg-[#E5D5B5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          {supportStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Prompts */}
            {!showSupport && messages.length < 3 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p.text)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#29342E] text-[#C5C8C1] hover:text-[#F5F1E8] hover:border-[#789181] hover:bg-[#1B2520] transition-colors text-left flex items-center gap-1.5"
                  >
                    <span>{p.icon}</span> {p.text.replace('How do I ', '').replace('How does ', '').replace('Can I ', '').replace('?', '')}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-[#151D19] border-t border-[#202A25]">
              <div className="relative flex items-end gap-2 bg-[#1B2520] border border-[#29342E] rounded-xl p-1 focus-within:border-[#789181] focus-within:ring-1 focus-within:ring-[#789181]/40 transition-all">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask FindBuilders AI..."
                  className="flex-1 max-h-32 min-h-[36px] bg-transparent text-sm text-[#F5F1E8] placeholder-[#69736C] px-3 py-2 focus:outline-none resize-none"
                  rows={1}
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-8 h-8 mb-0.5 mr-0.5 rounded-lg bg-[#D8C7A5] text-[#1A1A16] flex items-center justify-center hover:bg-[#E5D5B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button & Hover Bubble */}
      <div
        className="relative pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute bottom-full right-0 mb-4 w-56 bg-[#151D19]/90 backdrop-blur-md border border-[#2E6549]/30 rounded-2xl rounded-br-sm px-4 py-3 shadow-xl pointer-events-none"
            >
              <p className="text-sm text-[#F5F1E8] font-medium leading-relaxed">
                {currentMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7FAF8D]/60"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          aria-label="Open AI Assistant"
        >
          {/* Floor Shadow */}
          <div className={`absolute bottom-1 w-6 h-1 sm:w-8 sm:h-1.5 bg-[#0A0E0C] rounded-[100%] blur-[2px] ${isHovered ? '' : 'fb-pulse'}`} />

          {/* Avatar Container */}
          <div className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${isHovered ? '' : 'fb-float'}`}>
            {/* Glowing Backdrop */}
            <div className={`absolute inset-0 bg-[#7FAF8D]/20 rounded-full blur-xl ${isHovered ? '' : 'fb-glow'}`} />

            {/* Core Head */}
            <motion.div
              className="relative w-8 h-8 sm:w-10 sm:h-10 bg-[#151D19] rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center border border-[#2E6549]/50 z-10"
              animate={isHovered ? { rotateX: 15, rotateY: 20 } : { rotateX: 0, rotateY: 0 }}
              transition={{ duration: 0.3 }}
            >
              <img src="/findbuilderslogo.png" alt="FindBuilders Logo" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            </motion.div>

            {/* Floating Left Hand */}
            <div className={`absolute -left-1 top-5 w-2 h-3 bg-[#1B2520] rounded-full border border-[#2E6549]/30 z-20 shadow-[0_0_8px_rgba(127,175,141,0.1)] ${isHovered ? '' : 'fb-hand-left'}`} />

            {/* Floating Right Hand */}
            <div className={`absolute -right-1 top-5 w-2 h-3 bg-[#1B2520] rounded-full border border-[#2E6549]/30 z-0 shadow-[0_0_8px_rgba(127,175,141,0.1)] ${isHovered ? '' : 'fb-hand-right'}`} />
          </div>
        </motion.button>
      </div>
    </div>
  );
}
