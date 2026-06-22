"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
  isError?: boolean;
};

const SUGGESTED_QUESTIONS = [
  { title: "Tìm trường theo điểm số", desc: "Với 24 điểm khối A00, mình có thể vào trường nào?" },
  { title: "Tìm ngành phù hợp", desc: "Hãy giúp mình tìm ngành phù hợp với sở thích." },
  { title: "So sánh ngành học", desc: "So sánh ngành Marketing và Kinh doanh quốc tế." },
  { title: "Học phí phù hợp", desc: "Trường nào có học phí dưới 30 triệu đồng mỗi năm?" },
  { title: "Tìm học bổng", desc: "Tìm học bổng dành cho sinh viên năm nhất." },
  { title: "Phương thức xét tuyển", desc: "Mình nên chọn phương thức xét tuyển nào?" },
];

const FONT_STACK = "'Be Vietnam Pro', 'Inter', 'Segoe UI', Arial, sans-serif";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, conversation_id: conversationId }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Mình chưa thể xử lý yêu cầu này. Bạn hãy thử gửi lại câu hỏi nhé.",
            isError: true,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
        if (data.conversation_id) setConversationId(data.conversation_id);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Mình chưa thể xử lý yêu cầu này. Bạn hãy thử gửi lại câu hỏi nhé.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.text);
  }

  function handleNewConversation() {
    setMessages([]);
    setConversationId("");
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4"
      style={{ fontFamily: FONT_STACK }}
    >
      <div className="w-full max-w-2xl h-[700px] flex flex-col rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm">

        {/* Header */}
        <div className="h-[76px] shrink-0 px-6 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] leading-tight">UniGuide AI</h1>
            <p className="text-sm text-[#64748B] leading-tight">Trợ lý tư vấn tuyển sinh thông minh</p>
          </div>
          <button
            onClick={handleNewConversation}
            className="text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg transition-colors"
          >
            Cuộc trò chuyện mới
          </button>
        </div>

        {/* Khu vực chat */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#F8FAFC]">
          {messages.length === 0 ? (
            // Màn hình chào mừng
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-[#0F172A] text-center">
                Xin chào! Mình là UniGuide AI
              </h2>
              <p className="text-base text-[#475569] text-center leading-relaxed max-w-md mt-3 mb-7">
                Bạn đang băn khoăn chọn ngành, chọn trường hay phương thức xét tuyển? Hãy chia sẻ
                điểm số và mong muốn của bạn, mình sẽ hỗ trợ từng bước.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.desc)}
                    className="text-left bg-white border border-[#E2E8F0] rounded-xl p-4 hover:border-[#2563EB] hover:shadow-md transition-all duration-150"
                  >
                    <span className="block text-base font-semibold text-[#0F172A]">{q.title}</span>
                    <span className="block text-sm text-[#64748B] mt-1">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Danh sách tin nhắn
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.isError ? (
                    <div className="max-w-[85%] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-2xl px-5 py-4 flex flex-col gap-3">
                      <span className="text-base leading-relaxed">{m.text}</span>
                      <button
                        onClick={handleRetry}
                        className="self-start text-sm font-semibold bg-white border border-[#FDE68A] text-[#92400E] px-4 py-2 rounded-lg hover:bg-[#FEF3C7] transition-colors"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[80%] px-5 py-3 text-base leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-[#2563EB] text-white rounded-2xl rounded-br-md"
                          : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-2xl rounded-bl-md shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-md px-5 py-3.5 flex items-center gap-2 shadow-sm">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" />
                    </span>
                    <span className="text-sm text-[#64748B]">UniGuide AI đang soạn câu trả lời...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Ô nhập */}
        <div className="border-t border-[#E2E8F0] bg-white p-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hãy nhập câu hỏi về ngành học, trường, điểm chuẩn, học phí..."
              className="flex-1 rounded-2xl border border-[#E2E8F0] px-4 py-3 text-base text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-5 rounded-2xl bg-[#2563EB] text-white text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1D4ED8] transition-colors"
            >
              Gửi
            </button>
          </div>
          <p className="text-xs text-[#94A3B8] text-center mt-2 leading-snug">
            UniGuide AI có thể đưa ra thông tin chưa hoàn toàn chính xác. Vui lòng đối chiếu với đề
            án tuyển sinh chính thức.
          </p>
        </div>
      </div>
    </div>
  );
}
