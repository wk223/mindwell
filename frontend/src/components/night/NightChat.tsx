import { useState, useRef, useEffect, useCallback } from "react";
import { useDialogueStore } from "../../stores/useDialogueStore";
import MoonIcon from "../shared/MoonIcon";

const NIGHT_CONV_KEY = "mindwell_night_conv_id";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgId = 0;
function nextId() {
  return `night-msg-${++msgId}-${Date.now()}`;
}

const PLACEHOLDERS = [
  "今天过得怎么样...",
  "有什么想说的都可以...",
  "这里很安全...",
  "我在听...",
  "慢慢说，不急...",
  "想说什么就说吧...",
  "深夜了，你还好吗...",
  "有些话白天说不出口...",
];

const WARM_REPLIES = [
  "我在，一直在。",
  "你说，我听着呢。",
  "嗯，继续说吧。",
  "辛苦了，慢慢说。",
  "没关系，这里没有对错。",
];

function getMainChatContext(): string {
  const conversations = useDialogueStore.getState().conversations;
  if (conversations.length === 0) return "";
  const recent = conversations.slice(0, 3);
  const titles = recent.map((c) => c.title || "未命名对话").filter(Boolean);
  if (titles.length === 0) return "";
  return `\n\n（我注意到你今天聊到了：${titles.join("、")}。可以围绕这些话题多给我一些安慰和陪伴。）`;
}

export default function NightChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const warmIdx = useRef(0);
  const convId = useRef<string | null>(localStorage.getItem(NIGHT_CONV_KEY));
  const hasSentRef = useRef(false);

  useEffect(() => {
    useDialogueStore.getState().loadConversations();
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const content = input.trim();

    // Build message with main-chat context on very first send
    let messageToSend = content;
    if (!hasSentRef.current) {
      hasSentRef.current = true;
      const ctx = getMainChatContext();
      if (ctx) messageToSend = content + ctx;
    }

    const userMsg: Message = { id: nextId(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamContent("");

    const interim = WARM_REPLIES[warmIdx.current % WARM_REPLIES.length];
    warmIdx.current++;
    setStreamContent(interim);

    let fullContent = "";
    const token = localStorage.getItem("mindwell_token");

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/v1/dialogue/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversation_id: convId.current, message: messageToSend, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("对话请求失败");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取回复");

      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const event = JSON.parse(data);
            if (event.type === "token") {
              if (firstToken) {
                firstToken = false;
                fullContent = event.content;
              } else {
                fullContent += event.content;
              }
              setStreamContent(fullContent);
            } else if (event.type === "done") {
              if (event.conversation_id && !convId.current) {
                convId.current = event.conversation_id;
                localStorage.setItem(NIGHT_CONV_KEY, event.conversation_id);
              }
            }
          } catch { /* skip */ }
        }
      }

      const finalContent = fullContent || "今晚不知道怎么回答你...但我在。";
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: finalContent },
      ]);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: "深夜信号有点弱...但别担心，我还在。你可以再说一遍吗？" },
        ]);
      }
    } finally {
      setStreaming(false);
      setStreamContent("");
    }
  }, [input, streaming]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full night-glass flex items-center justify-center mb-5 sm:mb-6 animate-night-breathe">
              <MoonIcon size={28} glowing />
            </div>
            <p className="text-slate-300 text-sm sm:text-base font-light tracking-wider">
              我是小智，今晚我在
            </p>
            <p className="text-slate-300 text-xs sm:text-sm mt-2.5 leading-relaxed max-w-xs">
              不需要组织语言，不需要想太多<br />你说，我听着
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] px-4 sm:px-5 py-3 rounded-2xl text-sm sm:text-base leading-relaxed tracking-wide ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-sky-500/30 to-indigo-500/30 text-slate-200 border border-white/10"
                  : "night-glass text-slate-300"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {streaming && streamContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] sm:max-w-[70%] px-4 sm:px-5 py-3 rounded-2xl night-glass text-slate-300 text-sm sm:text-base leading-relaxed">
              {streamContent}
              <span className="inline-block w-1.5 h-4 bg-sky-400 ml-0.5 animate-night-breathe align-middle" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-0 pb-4 sm:pb-6">
        <div className="night-glass-input rounded-2xl flex items-center px-4 sm:px-5 py-3 sm:py-3.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            maxLength={1000}
            className="flex-1 bg-transparent text-slate-200 text-sm sm:text-base placeholder:text-slate-400 focus:outline-none transition-all duration-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500
                       flex items-center justify-center text-white text-sm sm:text-base
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-all duration-300"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
