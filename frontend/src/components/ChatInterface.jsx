import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Tag,
  ArrowRight,
  MessageSquare,
  Globe,
} from 'lucide-react';

const SUGGESTIONS = {
  English: [
    "I'm a 30yo farmer making 50k in the North Zone with 2 acres of land",
    "Urban street vendor in Central Zone earning 1.8 Lakhs with a family of 4",
    "20-year-old SC/ST college student looking for higher education assistance",
    "Person with disability earning 1.2 Lakhs needing healthcare & pension support",
  ],
  Hindi: [
    "मैं उत्तर क्षेत्र में 30 वर्ष का किसान हूँ, 2 एकड़ जमीन है और आय 50 हजार है।",
    "मध्य क्षेत्र में स्ट्रीट वेंडर हूँ, 4 लोगों का परिवार और 1.8 लाख सालाना आय है।",
    "20 वर्षीय एससी/एसटी कॉलेज छात्र हूँ, उच्च शिक्षा छात्रवृत्ति सहायता चाहिए।",
    "दिव्यांग व्यक्ति हूँ, सालाना आय 1.2 लाख है, पेंशन और स्वास्थ्य लाभ चाहिए।",
  ],
};

export default function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  extractedPayload,
  onSwitchToIntake,
  language = 'English',
}) {
  const [input, setInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (text) => {
    onSendMessage(text);
  };

  const activeSuggestions = SUGGESTIONS[language] || SUGGESTIONS.English;

  return (
    <div className="flex flex-col h-[600px] rounded-3xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-md shadow-emerald-600/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Conversational Eligibility Assistant
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini Multi-Turn
              </span>
              <span className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[10px] text-teal-300 font-mono">
                {language}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Anti-Text-to-SQL &bull; Relational PostgreSQL Scheme Matching
            </p>
          </div>
        </div>

        {onSwitchToIntake && (
          <button
            onClick={onSwitchToIntake}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-emerald-500/40 transition"
          >
            <span>Manual Intake Form</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
          </button>
        )}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'border border-slate-800 bg-slate-950/90 text-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Grounded Summary or Matched Count Badge */}
                {msg.matchedCount !== undefined && !isUser && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-400">
                      ✓ {msg.matchedCount} Relational Scheme(s) Matched
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">Supabase PG</span>
                  </div>
                )}

                {/* Parameters Extracted Pill Strip */}
                {msg.extracted && Object.keys(msg.extracted).length > 0 && !isUser && (
                  <div className="mt-2.5 flex flex-wrap gap-1 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 mr-1">
                      <Tag className="h-3 w-3 text-emerald-400" /> Extracted:
                    </span>
                    {msg.extracted.annual_income !== undefined && msg.extracted.annual_income !== null && (
                      <span className="rounded-md bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-400 font-mono">
                        ₹{Number(msg.extracted.annual_income).toLocaleString('en-IN')}
                      </span>
                    )}
                    {msg.extracted.age && (
                      <span className="rounded-md bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
                        {msg.extracted.age} yrs
                      </span>
                    )}
                    {msg.extracted.occupation && (
                      <span className="rounded-md bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-teal-300 font-mono">
                        {msg.extracted.occupation}
                      </span>
                    )}
                    {msg.extracted.location_zone && (
                      <span className="rounded-md bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-amber-300 font-mono">
                        {msg.extracted.location_zone}
                      </span>
                    )}
                    {msg.extracted.disability_status && (
                      <span className="rounded-md bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[10px] text-rose-300 font-mono">
                        PWD
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading / Typing Animation */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-none border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 text-xs text-slate-400">
                  Gemini reasoning in {language} & querying PostgreSQL...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="border-t border-slate-800/60 bg-slate-950/50 px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0 font-medium">
            Try:
          </span>
          {activeSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSuggestionClick(item)}
              className="shrink-0 rounded-lg border border-slate-800/80 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-emerald-500/40 hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              &ldquo;{item.slice(0, 36)}...&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800/80 p-4 bg-slate-950/80">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              language === 'Hindi'
                ? 'अपनी स्थिति लिखें (उदा. "मैं 32 साल का किसान हूँ, 50,000 आय है...")...'
                : "Type your situation (e.g. 'I am a 32yo farmer earning 50k in North Zone')..."
            }
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-4 pr-24 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:brightness-110 active:scale-95 disabled:opacity-40"
          >
            <span>{isLoading ? '...' : 'Send'}</span>
            <Send className="h-3 w-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
