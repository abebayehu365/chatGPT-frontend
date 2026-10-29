import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://chatgpt-clone-ml7j.onrender.com/api";

function App() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`);
      if (response.data?.success) {
        const conversationData = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data?.conversations ?? []);

        setConversations(conversationData);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const handleSendMessage = async (question) => {
    const trimmedQuestion = question?.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedQuestion,
    };

    setConversations((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations`, {
        question: trimmedQuestion,
      });

      if (response.data?.success) {
        const { userConversation, assistantConversation } =
          response.data.data ?? {};

        setConversations((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempUserMessage.id);
          const nextMessages = [...filtered];

          if (userConversation) nextMessages.push(userConversation);
          if (assistantConversation) nextMessages.push(assistantConversation);

          return nextMessages;
        });
      }
    } catch (error) {
      console.error("Error posting conversation:", error);

      const errorMessage =
        error.response?.data?.message ||
        (error.request
          ? "Cannot reach the backend. Make sure it is running on port 5500."
          : null) ||
        "There was an error generating a response.";

      const errorConversation = {
        id: Date.now() + 1,
        role: "assistant",
        content: errorMessage,
      };

      setConversations((prev) => [...prev, errorConversation]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="chat">
        <ChatHeader />

        <MessageList
          conversations={conversations}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
