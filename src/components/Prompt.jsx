'use client';
import { ArrowUp } from "lucide-react";
import { useState } from "react";

const Prompt = ({
  conversations,
  setConversations,
  activeConversation,
  generateResponse,
  isLoading,
  setIsLoading,
}) => {
  const [promptText, setPromptText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || !promptText.trim()) return;

    setIsLoading(true);

    const currentConvo =
      conversations.find((convo) => convo.id === activeConversation) ||
      conversations[0];

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptText,
    };

    const apiConversation = {
      ...currentConvo,
      messages: [...currentConvo.messages, userMessage],
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversation
          ? { ...conv, messages: [...conv.messages, userMessage] }
          : conv
      )
    );

    setPromptText("");

    setTimeout(() => {
      const botMessageId = `bot-${Date.now()}`;
      const botMessage = {
        id: botMessageId,
        role: "bot",
        content: "Thinking...",
        loading: true,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation
            ? { ...conv, messages: [...conv.messages, botMessage] }
            : conv
        )
      );

      generateResponse(apiConversation, botMessageId);
    },);
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <input
        placeholder="Type your questions"
        className="prompt-input"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        required
      />
      <button type="submit" className="send-prompt-btn">
        <ArrowUp size={20} />
      </button>
    </form>
  );
};

export default Prompt;
