import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const SUGGESTIONS = [
  "Which lab has Arduino?",
  "Available oscilloscopes?",
  "How do I request equipment?",
  "List all labs",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm CRCE Bot. Ask me about labs, equipment, or how to request items." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post("/chatbot", { message: msg, session_id: sessionRef.current });
      sessionRef.current = data.session_id;
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I couldn't reach the assistant." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        data-testid="chatbot-toggle"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-[#2563EB] to-blue-500 shadow-lg hover:scale-110 transition-transform flex items-center justify-center text-white z-50"
        aria-label="Open chatbot"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
      {open && (
        <div
          data-testid="chatbot-panel"
          className="fixed bottom-24 right-6 w-[88vw] sm:w-96 max-h-[70vh] bg-white/95 backdrop-blur-xl border border-[#E2E8F0] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 crce-slide-up"
        >
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-blue-400 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-display font-bold text-[#1E293B]">CRCE Bot</div>
              <div className="text-xs text-[#64748B]">Powered by Claude Sonnet 4.5</div>
            </div>
          </div>
          <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  data-testid={m.role === "user" ? "chatbot-user-msg" : "chatbot-bot-msg"}
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#2563EB] text-white rounded-br-sm"
                      : "bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-sm">
                  Thinking…
                </div>
              </div>
            )}
          </div>
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] hover:bg-blue-50 hover:border-blue-200 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t border-[#E2E8F0] bg-white flex gap-2"
          >
            <input
              data-testid="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="crce-input"
            />
            <button data-testid="chatbot-send" type="submit" disabled={loading} className="crce-btn-primary !px-3">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
