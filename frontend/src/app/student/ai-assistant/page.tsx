'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED = [
  'When is the mess open?',
  'How do I apply for leave?',
  'What are the hostel rules?',
  'How do I file a maintenance complaint?',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Hostel Management System AI Assistant powered by Gemini. I can help you with hostel-related queries, rules, procedures, and more. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content }));
      const res = await api.post('/ai/chat', { message: text, history });
      const aiMsg: Message = { role: 'assistant', content: res.data.reply, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or contact hostel management directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="AI Assistant" subtitle="Powered by Google Gemini" requiredRoles={['STUDENT']}>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px]">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-1 mb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center',
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-sky-400 to-sky-600'
                      : 'bg-muted border border-border'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-muted/40 border border-border text-foreground rounded-tl-none'
                      : 'bg-primary/15 border border-primary/20 text-foreground rounded-tr-none'
                  )}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-muted/40 border border-border flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Gemini is thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask anything about hostel rules, leave process, etc..."
              rows={1}
              className="flex w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <Button
            variant="gradient"
            size="icon"
            className="h-11 w-11 flex-shrink-0"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> Powered by Google Gemini
        </p>
      </div>
    </DashboardLayout>
  );
}
