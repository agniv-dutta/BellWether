import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Chip } from './ui/Chip';
import { useSendChat } from '../hooks/useApi';
import type { ChatMessage, Product } from '../lib/types';

const STARTER_SUGGESTIONS = [
  'Show me something for a sunset wedding',
  'I want earthy tones and handloom textures',
  'What pairs well with a terracotta saree?',
];

export const ChatDrawer: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendChat = useSendChat();

  // Session ID persistence
  const sessionId = useCallback(() => {
    let id = sessionStorage.getItem('bellwether_chat_session');
    if (!id) {
      id = `session-${crypto.randomUUID()}`;
      sessionStorage.setItem('bellwether_chat_session', id);
    }
    return id;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback((text?: string) => {
    const message = text || input.trim();
    if (!message || sendChat.isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: 'user',
      content: message,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    sendChat.mutate(
      { sessionId: sessionId(), message },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage = {
            id: `assistant-${crypto.randomUUID()}`,
            role: 'assistant',
            content: data.reply,
            products_mentioned: data.products_mentioned,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            id: `error-${crypto.randomUUID()}`,
            role: 'assistant',
            content: 'I hit a snag. Could you try that again?',
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      }
    );
  }, [input, sendChat, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* FAB Toggle */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-persimmon text-paper shadow-oxblood-lg flex items-center justify-center hover:bg-coral transition-colors cursor-pointer"
            aria-label="Open chat assistant"
          >
            <MessageCircle className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-paper border border-apricot/40 rounded-3xl shadow-oxblood-lg flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-blush bg-blush/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-persimmon text-paper flex items-center justify-center">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-oxblood leading-none">BellWether</h3>
                  <span className="text-[11px] text-oxblood/60 font-mono">Shopping assistant</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-blush flex items-center justify-center text-oxblood/80 cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3 py-4">
                  <p className="text-sm text-oxblood/70 text-center">
                    Ask me anything about our collection.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {STARTER_SUGGESTIONS.map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        variant="blush"
                        onClick={() => handleSend(s)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-persimmon text-paper rounded-br-lg'
                        : 'bg-blush/70 text-oxblood rounded-bl-lg'
                    }`}
                  >
                    <p>{msg.content}</p>

                    {/* Products Mentioned */}
                    {msg.products_mentioned && msg.products_mentioned.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {msg.products_mentioned.map((p: Product) => (
                          <div
                            key={p.id}
                            className="flex-shrink-0 w-32 bg-paper/80 border border-apricot/30 rounded-2xl p-2 space-y-1"
                          >
                            <div className="arch-sm overflow-hidden aspect-square bg-blush">
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[11px] font-medium text-oxblood line-clamp-1">{p.name}</p>
                            <p className="text-[11px] font-serif font-bold text-oxblood">₹{p.price.toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {sendChat.isPending && (
                <div className="flex justify-start">
                  <div className="bg-blush/70 rounded-2xl rounded-bl-lg px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                        className="w-2 h-2 rounded-full bg-hibiscus/70"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-blush bg-paper">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message…"
                  className="flex-1 px-4 py-2.5 bg-blush/30 border border-apricot/30 rounded-full text-sm text-oxblood placeholder:text-oxblood/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/30"
                  aria-label="Chat message input"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sendChat.isPending}
                  className="w-10 h-10 rounded-full bg-persimmon text-paper flex items-center justify-center hover:bg-coral transition-colors disabled:opacity-50 cursor-pointer"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
