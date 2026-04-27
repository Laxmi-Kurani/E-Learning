import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { authService } from "../../api/auth.service";
import { API_BASE_URL } from "../../api/constant";

const BOT_AVATAR = "🤖";
const USER_AVATAR = "👤";

const QUICK_REPLIES = [
  "My enrolled courses",
  "My progress",
  "Available courses",
  "My certificates",
  "Help",
];

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: `Hi there! 👋 I'm your LMS assistant. Ask me about your courses, progress, or anything about the platform.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!isAuthenticated) return null;

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_BASE_URL}/api/chatbot`,
        { message: userText },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
    } catch (err) {
      console.error("Chatbot error:", err?.response?.status, err?.response?.data || err?.message);
      const errMsg = err?.response?.data?.reply || err?.response?.data?.message || "Sorry, something went wrong. Please try again.";
      setMessages((prev) => [...prev, { from: "bot", text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
          border: "none",
          boxShadow: "0 4px 16px rgba(99,102,241,0.45)",
          cursor: "pointer",
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          transition: "transform 0.2s",
        }}
        title="Chat with LMS Assistant"
        aria-label="Open chatbot"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 28,
            zIndex: 9998,
            width: 360,
            maxWidth: "calc(100vw - 40px)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "inherit",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              padding: "14px 18px",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>🤖</span> LMS Assistant
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 14px 6px",
              maxHeight: 340,
              minHeight: 200,
              background: "#f8f9ff",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
                {msg.from === "bot" && (
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{BOT_AVATAR}</span>
                )}
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius:
                      msg.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background:
                      msg.from === "user"
                        ? "linear-gradient(135deg,#3b82f6,#8b5cf6)"
                        : "#fff",
                    color: msg.from === "user" ? "#fff" : "#1e293b",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}
                </div>
                {msg.from === "user" && (
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{USER_AVATAR}</span>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{BOT_AVATAR}</span>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "9px 14px",
                    fontSize: 13,
                    color: "#94a3b8",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "6px 12px",
              overflowX: "auto",
              background: "#f8f9ff",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                style={{
                  flexShrink: 0,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1px solid #c7d2fe",
                  background: "#eef2ff",
                  color: "#4f46e5",
                  fontSize: 11.5,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              padding: "10px 12px",
              borderTop: "1px solid #e2e8f0",
              gap: 8,
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: "8px 14px",
                fontSize: 13,
                outline: "none",
                background: "#f8f9ff",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                color: "#fff",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                opacity: input.trim() && !loading ? 1 : 0.5,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
