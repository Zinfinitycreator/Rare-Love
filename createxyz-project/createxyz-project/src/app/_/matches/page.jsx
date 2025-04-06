"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: (message) => {
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
      setStreamingMessage("");
    },
  });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch("/api/matches");
        if (!response.ok) {
          throw new Error("Failed to fetch matches");
        }
        const data = await response.json();
        setMatches(data.matches);
      } catch (err) {
        setError("Could not load matches");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMatches();
    }
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedMatch) {
        try {
          const response = await fetch("/api/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matchId: selectedMatch.id }),
          });
          if (!response.ok) {
            throw new Error("Failed to fetch messages");
          }
          const data = await response.json();
          setMessages(data.messages || []);
        } catch (err) {
          console.error(err);
          setError("Could not load messages");
        }
      }
    };

    fetchMessages();
  }, [selectedMatch]);

  const sendMessage = async (generatePrompt = false) => {
    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          content: newMessage,
          generatePrompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages(data.messages);
      setNewMessage("");
    } catch (err) {
      console.error(err);
      setError("Failed to send message");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage();
    }
  };

  const getIcebreaker = () => sendMessage(true);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4 flex items-center justify-center">
        <div className="text-purple-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-purple-800 mb-4">
            Please sign in
          </h2>
          <a
            href="/account/signin"
            className="text-purple-600 hover:text-purple-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-purple-800 mb-6">
              Your Matches
            </h2>
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedMatch?.id === match.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-800">
                      Match #{match.id}
                    </h3>
                    <span className="text-purple-600 font-semibold">
                      {match.compatibilityScore}% Match
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {match.sharedValues.map((value) => (
                      <span
                        key={value}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            {selectedMatch ? (
              <div>
                <h2 className="text-2xl font-semibold text-purple-800 mb-6">
                  Conversation
                </h2>
                <div className="h-[400px] overflow-y-auto mb-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender_id === user?.id
                          ? "bg-purple-100 ml-auto"
                          : "bg-gray-100"
                      } max-w-[80%]`}
                    >
                      <div className="text-sm text-gray-600 mb-1">
                        {msg.sender_id === user?.id ? "You" : "Match"}
                      </div>
                      {msg.content}
                    </div>
                  ))}
                  {streamingMessage && (
                    <div className="p-3 rounded-lg bg-gray-100 max-w-[80%]">
                      {streamingMessage}
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={getIcebreaker}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                  >
                    Get Icebreaker
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center text-gray-600">
                Select a match to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;