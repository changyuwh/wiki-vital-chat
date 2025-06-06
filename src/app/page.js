'use client';
import { useEffect, useRef, useState } from "react";
import Message from "../components/Message";
import Prompt from "../components/Prompt";
import Sidebar from "../components/Sidebar";
import { fetchAIResponse } from "../utils/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const typingInterval = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  const [conversations, setConversations] = useState([{ id: "default", title: "New Chat", messages: [] }]);
  const [activeConversation, setActiveConversation] = useState("default");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(window.innerWidth > 768);
    
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    try {
      const saved = localStorage.getItem("conversations");
      if (saved) {
        setConversations(JSON.parse(saved));
      }
    } catch {
    }

    const savedActive = localStorage.getItem("activeConversation");
    if (savedActive) {
      setActiveConversation(savedActive);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("activeConversation", activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const currentConversation =
    conversations.find((c) => c.id === activeConversation) || conversations[0];

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 300);
    }
  };

  useEffect(() => {
    const lastMessage = currentConversation.messages[currentConversation.messages.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      scrollToBottom();
    }
  }, [currentConversation.messages.length]);

  const typingEffect = (text, messageId) => {
    setIsTyping(true);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? { ...msg, content: "", loading: true } : msg
              ),
            }
          : conv
      )
    );

    const words = text.split(" ");
    let wordIndex = 0;
    let currentText = "";

    clearInterval(typingInterval.current);
    typingInterval.current = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex === 0 ? "" : " ") + words[wordIndex++];

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content: currentText, loading: true } : msg
                  ),
                }
              : conv
          )
        );
      } else {
        clearInterval(typingInterval.current);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content: currentText, loading: false } : msg
                  ),
                }
              : conv
          )
        );
        setIsLoading(false);
        setIsTyping(false);
      }
    }, 40);
  };

  const updateBotMessage = (botId, content, isError = false) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === botId ? { ...msg, content, loading: false, error: isError } : msg
              ),
            }
          : conv
      )
    );
  };

  const handleTopicSelect = async (topicName, prompt) => {
    if (isLoading || isTyping) return;

    const botMessageId = `bot-${Date.now()}`;
    const botMessage = {
      id: botMessageId,
      role: "bot",
      content: "Thinking...",
      timestamp: new Date().toISOString(),
      loading: true,
    };

    let targetConversationId = activeConversation;
    let currentConv = conversations.find((c) => c.id === activeConversation);

    if (!currentConv) {
      const newId = `conv-${Date.now()}`;
      setConversations((prev) => [{ id: newId, title: topicName, messages: [] }, ...prev]);
      setActiveConversation(newId);
      targetConversationId = newId;
    } else {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation ? { ...conv, title: topicName } : conv
        )
      );
    }

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === targetConversationId
          ? {
              ...conv,
              messages: [botMessage],
            }
          : conv
      )
    );

    setIsLoading(true);

    try {
      const tempConversationForApi = {
        messages: [{ role: "user", content: prompt }],
      };

      const responseText = await fetchAIResponse(tempConversationForApi);
      typingEffect(responseText, botMessageId);
    } catch (error) {
      updateBotMessage(botMessageId, `Error: ${error.message}`, true);
      setIsLoading(false);
    }
  };

  const generateResponse = async (convo, botMessageId) => {
    try {
      const responseText = await fetchAIResponse(convo);
      typingEffect(responseText, botMessageId);
    } catch (error) {
      updateBotMessage(botMessageId, `Error: ${error.message}`, true);
      setIsLoading(false);
    }
  };

  return (
    <div className={`app-container ${theme === "light" ? "light-theme" : "dark-theme"}`}>
      <div
        className={`overlay ${isSidebarOpen ? "show" : "hide"}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onTopicSelect={handleTopicSelect}
      />
      <main className="main-container">
        {currentConversation.messages.length === 0 ? (
          <div className="welcome-container">
            <p className="welcome-text">Hello! Navigate the topics on the left panel to begin your chat.</p>
          </div>
        ) : (
          <div className="messages-container" ref={messagesContainerRef}>
            {currentConversation.messages.map((message) => (
              <Message key={message.id} message={message} theme={theme} />
            ))}
          </div>
        )}
        <div className="prompt-container">
          <div className="prompt-wrapper">
            <Prompt
              conversations={conversations}
              setConversations={setConversations}
              activeConversation={activeConversation}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              generateResponse={generateResponse}
            />
          </div>
        </div>
      </main>
    </div>
  );
}