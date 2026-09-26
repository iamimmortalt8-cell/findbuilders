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

const SUGGESTED_PROMPTS = [
  "How does FindBuilders work?",
  "How do I submit a product?",
  "How do I find builders?",
  "Can I contact the team?"
];

export default function FBAssistant() {
  const STORAGE_KEY = 'fb_assistant_state';
  const location = useLocation();

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
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { messages: [], showSupport: false };
  }

  const savedState = loadSavedState();

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>(savedState.messages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, showSupport }));
  }, [messages, showSupport]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const newMessages = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // If the user explicitly asks for support/human, we can intercept or let the AI do it.
    // For safety, let's do a basic keyword check as a fallback, but rely mostly on the AI.
    const lower = trimmed.toLowerCase();
    if (lower.includes('contact the team') || lower.includes('human') || lower.includes('support form')) {
       // We'll let the AI respond, but we can also trigger support.
    }

    try {
      const pageContext = `User is currently on path: ${location.pathname}`;
      const fullContext = `${FINDBUILDERS_CONTEXT}\n\n[CURRENT CONTEXT]\n${pageContext}`;

      const res = await api.sendAIChat(newMessages, fullContext);
      
      let aiContent = res.reply || res.choices?.[0]?.message?.content || res.message || res.answer || "I'm sorry, I couldn't process that.";
      
      setMessages([...newMessages, { role: 'assistant', content: aiContent }]);
      
      if (aiContent.toLowerCase().includes('get in touch') || aiContent.toLowerCase().includes('contact the findbuilders team') || aiContent.toLowerCase().includes('fill out the form')) {
         setShowSupport(true);
      }
    } catch (err: any) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. If you need help, you can contact the FindBuilders team below." 
      }]);
      setShowSupport(true);
    } finally {
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
            className="mb-4 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-[#151D19] border border-[#202A25] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1B2520] border-b border-[#202A25]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#214C37]/20 border border-[#2E6549] flex items-center justify-center text-[#7FAF8D]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F1E8]">FindBuilders AI</h3>
                  <p className="text-[10px] text-[#7FAF8D] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7FAF8D] animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8C958E] hover:text-[#F5F1E8] hover:bg-[#202B25] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#29342E] scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B2520] border border-[#202A25] flex items-center justify-center mx-auto mb-3 text-[#D8C7A5]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-[#F5F1E8] font-medium text-sm mb-1">How can I help?</h4>
                  <p className="text-[#8C958E] text-xs">Ask me anything about FindBuilders.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#2E6549] text-white rounded-tr-sm'
                        : 'bg-[#1B2520] text-[#F5F1E8] border border-[#202A25] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
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
                <div className="mt-4 border border-[#202A25] rounded-xl bg-[#101814] p-4">
                  <h4 className="text-sm font-semibold text-[#F5F1E8] mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D8C7A5]" />
                    Contact Team
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
                    onClick={() => handleSend(p)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#29342E] text-[#C5C8C1] hover:text-[#F5F1E8] hover:border-[#789181] hover:bg-[#1B2520] transition-colors text-left"
                  >
                    {p}
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

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full bg-[#151D19] border-2 border-[#2E6549] text-[#D8C7A5] shadow-lg hover:shadow-[0_0_20px_rgba(46,101,73,0.4)] hover:scale-105 transition-all duration-300"
      >
        <Bot className="w-6 h-6" />
      </button>
    </div>
  );
}
