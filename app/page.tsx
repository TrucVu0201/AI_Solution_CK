"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
  isError?: boolean;
  followUps?: string[];
};

// ─── Suggested questions theo tab ───
const TABS = ["Tuyển sinh", "Career Path", "Trắc nghiệm MBTI"];

const SUGGESTED_BY_TAB: Record<string, { title: string; desc: string }[]> = {
  "Tuyển sinh": [
    { title: "Tìm trường theo điểm số", desc: "Với 24 điểm khối A00, mình có thể vào trường nào?" },
    { title: "Tìm ngành phù hợp", desc: "Hãy giúp mình tìm ngành phù hợp với sở thích." },
    { title: "So sánh ngành học", desc: "So sánh ngành Marketing và Kinh doanh quốc tế." },
    { title: "Học phí phù hợp", desc: "Trường nào có học phí dưới 30 triệu đồng mỗi năm?" },
    { title: "Tìm học bổng", desc: "Tìm học bổng dành cho sinh viên năm nhất." },
    { title: "Phương thức xét tuyển", desc: "Mình nên chọn phương thức xét tuyển nào?" },
  ],
  "Career Path": [
    { title: "Lộ trình ngành IT", desc: "Lộ trình thăng tiến của ngành Công nghệ thông tin từ Junior lên Senior như nào?" },
    { title: "Ngành AI & Data", desc: "Vị trí Entry-level của ngành AI & Khoa học Dữ liệu lương tham khảo bao nhiêu?" },
    { title: "Career path Cybersecurity", desc: "Lộ trình thăng tiến của ngành An toàn thông tin từ Junior lên Senior như nào?" },
    { title: "Kỹ năng cần thiết", desc: "AI/ML Engineer cần những kỹ năng cứng nào về toán và lập trình?" },
    { title: "So sánh career path", desc: "Career path của Kỹ thuật Phần mềm và Khoa học Máy tính khác nhau chỗ nào?" },
    { title: "Định hướng lại ngành", desc: "Mình đang học Kinh tế nhưng muốn chuyển sang IT, có được không?" },
  ],
  "Trắc nghiệm MBTI": [
    { title: "Làm trắc nghiệm MBTI", desc: "Mình muốn làm trắc nghiệm tính cách MBTI để biết ngành nào phù hợp." },
    { title: "Tìm hiểu MBTI", desc: "MBTI là gì và có thực sự giúp chọn ngành không?" },
    { title: "INTJ phù hợp ngành gì", desc: "Người có tính cách INTJ thì phù hợp với ngành nghề nào?" },
    { title: "ENFP phù hợp ngành gì", desc: "Người có tính cách ENFP thì phù hợp với ngành nghề nào?" },
    { title: "So sánh 2 type", desc: "INTJ và INTP khác nhau chỗ nào, ngành nào phù hợp hơn?" },
    { title: "MBTI và môi trường làm việc", desc: "Người tính cách hướng nội thì phù hợp với môi trường làm việc nào?" },
  ],
};

// ─── Follow-up gợi ý theo keyword ───
function getFollowUps(botText: string, userText: string): string[] {
  const combined = (botText + userText).toLowerCase();

  if (combined.includes("mbti") || combined.includes("tính cách") || combined.includes("intj") || combined.includes("enfp")) {
    return [
      "Ngành nào phù hợp nhất với type MBTI của mình?",
      "Mình muốn làm trắc nghiệm MBTI đầy đủ.",
      "Type MBTI này có điểm mạnh và yếu gì?",
    ];
  }
  if (combined.includes("career") || combined.includes("lộ trình") || combined.includes("thăng tiến") || combined.includes("junior") || combined.includes("senior")) {
    return [
      "Kỹ năng nào cần trang bị để thăng tiến nhanh hơn?",
      "Mức lương trung bình ở các cấp độ này là bao nhiêu?",
      "Chứng chỉ nào cần thiết cho lộ trình này?",
    ];
  }
  if (combined.includes("điểm chuẩn") || combined.includes("xét tuyển") || combined.includes("trường") || combined.includes("đại học")) {
    return [
      "Học phí của trường đó khoảng bao nhiêu?",
      "Trường này có học bổng cho sinh viên mới không?",
      "Ngành nào của trường này có cơ hội việc làm tốt nhất?",
    ];
  }
  if (combined.includes("ngành") || combined.includes("công việc") || combined.includes("ra trường")) {
    return [
      "Ngành này lương khởi điểm khoảng bao nhiêu?",
      "Kỹ năng gì cần chuẩn bị từ khi còn học?",
      "Ngành này có xu hướng tăng trưởng trong tương lai không?",
    ];
  }
  if (combined.includes("kỹ năng") || combined.includes("học")) {
    return [
      "Cần bao lâu để thành thạo những kỹ năng này?",
      "Có khóa học nào phù hợp để học những kỹ năng này không?",
      "Kỹ năng nào quan trọng nhất cần ưu tiên trước?",
    ];
  }
  return [
    "Bạn có thể cho mình biết thêm chi tiết không?",
    "Ngành này có triển vọng như thế nào trong 5 năm tới?",
    "Mình cần chuẩn bị gì thêm không?",
  ];
}

// ─── Render markdown đơn giản ───
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.match(/^[-*]\s/)) {
      return <li key={i} className="ml-4 list-disc">{formatInline(line.replace(/^[-*]\s/, ""))}</li>;
    }
    if (line.match(/^\d+\.\s/)) {
      return <li key={i} className="ml-4 list-decimal">{formatInline(line.replace(/^\d+\.\s/, ""))}</li>;
    }
    if (line.startsWith("### ")) return <p key={i} className="font-bold text-base mt-2">{formatInline(line.replace("### ", ""))}</p>;
    if (line.startsWith("## ")) return <p key={i} className="font-bold text-lg mt-2">{formatInline(line.replace("## ", ""))}</p>;
    if (line.trim() === "") return <br key={i} />;
    return <p key={i}>{formatInline(line)}</p>;
  });
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

const FONT_STACK = "'Be Vietnam Pro', 'Inter', 'Segoe UI', Arial, sans-serif";
const TIMEOUT_MS = 30000;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [activeTab, setActiveTab] = useState("Tuyển sinh");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, conversation_id: conversationId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [...prev, { role: "bot", text: "Mình chưa thể xử lý yêu cầu này. Bạn hãy thử gửi lại câu hỏi nhé.", isError: true }]);
      } else {
        const followUps = getFollowUps(data.answer, text);
        setMessages((prev) => [...prev, { role: "bot", text: data.answer, followUps }]);
        if (data.conversation_id) setConversationId(data.conversation_id);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setMessages((prev) => [...prev, { role: "bot", text: "Đã dừng. Bạn có thể gửi lại câu hỏi nhé.", isError: false }]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: "Mình chưa thể xử lý yêu cầu này. Bạn hãy thử gửi lại câu hỏi nhé.", isError: true }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleStop() { abortRef.current?.abort(); }
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" style={{ fontFamily: FONT_STACK }}>
      <div className="w-full max-w-2xl h-[820px] flex flex-col rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white shadow-sm">

        {/* Header */}
        <div className="h-[76px] shrink-0 px-6 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] leading-tight">UniGuide AI</h1>
            <p className="text-sm text-[#64748B] leading-tight">Trợ lý tư vấn tuyển sinh thông minh</p>
          </div>
          <button onClick={handleNewConversation} className="text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] px-3 py-1.5 rounded-lg transition-colors">
            Cuộc trò chuyện mới
          </button>
        </div>

        {/* Khu vực chat */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#F8FAFC]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-[#0F172A] text-center">Xin chào! Mình là UniGuide AI</h2>
              <p className="text-base text-[#475569] text-center leading-relaxed max-w-md mt-3 mb-6">
                Bạn đang băn khoăn chọn ngành, chọn trường hay phương thức xét tuyển? Hãy chia sẻ điểm số và mong muốn của bạn, mình sẽ hỗ trợ từng bước.
              </p>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 w-full">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-[#2563EB] text-white"
                        : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Suggested questions theo tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_BY_TAB[activeTab].map((q, i) => (
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
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i}>
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.isError ? (
                      <div className="max-w-[85%] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-2xl px-5 py-4 flex flex-col gap-3">
                        <span className="text-base leading-relaxed">{m.text}</span>
                        <button onClick={handleRetry} className="self-start text-sm font-semibold bg-white border border-[#FDE68A] text-[#92400E] px-4 py-2 rounded-lg hover:bg-[#FEF3C7] transition-colors">
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      <div className={`max-w-[80%] px-5 py-3 text-base leading-relaxed ${
                        m.role === "user"
                          ? "bg-[#2563EB] text-white rounded-2xl rounded-br-md whitespace-pre-wrap"
                          : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-2xl rounded-bl-md shadow-sm"
                      }`}>
                        {m.role === "bot" ? <div className="space-y-1">{renderMarkdown(m.text)}</div> : m.text}
                      </div>
                    )}
                  </div>

                  {/* Follow-up suggestions sau câu trả lời bot cuối cùng */}
                  {m.role === "bot" && !m.isError && m.followUps && i === messages.length - 1 && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-start pl-1">
                      {m.followUps.map((q, fi) => (
                        <button
                          key={fi}
                          onClick={() => sendMessage(q)}
                          className="text-sm text-[#2563EB] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 rounded-full hover:bg-[#DBEAFE] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start items-center gap-3">
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-md px-5 py-3.5 flex items-center gap-2 shadow-sm">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" />
                    </span>
                    <span className="text-sm text-[#64748B]">UniGuide AI đang soạn câu trả lời...</span>
                  </div>
                  <button onClick={handleStop} className="text-sm font-semibold text-[#EF4444] border border-[#FCA5A5] bg-white px-3 py-2 rounded-xl hover:bg-[#FEF2F2] transition-colors">
                    ⏹ Dừng
                  </button>
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
            UniGuide AI có thể đưa ra thông tin chưa hoàn toàn chính xác. Vui lòng đối chiếu với đề án tuyển sinh chính thức.
          </p>
        </div>
      </div>
    </div>
  );
}