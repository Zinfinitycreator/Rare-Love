"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [step, setStep] = useState("welcome");
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const questions = [
    {
      id: "intention",
      question:
        "What are you genuinely looking for in a relationship right now?",
      placeholder: "Be honest with yourself and others...",
    },
    {
      id: "values",
      question: "What three core values matter most to you in a relationship?",
      placeholder: "Think about what truly guides your decisions...",
    },
    {
      id: "growth",
      question: "How do you hope to grow through your next relationship?",
      placeholder: "Consider both personal and mutual growth...",
    },
  ];

  const handleInputChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/submit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit profile");
      }

      const data = await response.json();
      setSuccess(
        `Profile created! Your compatibility score is ${data.compatibility_score}%. ${data.reasoning}`
      );
      setStep("success");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
        <div className="text-purple-600 text-center pt-20">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-purple-800">
            Blind Dating
          </a>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <a
                  href="/matches"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Your Matches
                </a>
                <a
                  href="/account/signout"
                  className="text-gray-600 hover:text-gray-700"
                >
                  Sign Out
                </a>
              </>
            ) : (
              <a
                href="/account/signin"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto p-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {step === "welcome" && (
          <div className="text-center mt-20">
            <h1 className="text-4xl font-bold text-purple-800 mb-6">
              Find Your True Match
            </h1>
            <p className="text-gray-600 mb-8">
              Welcome to Blind Dating, where meaningful connections start with
              who you are, not how you look.
            </p>
            {user ? (
              <button
                onClick={() => setStep("questionnaire")}
                className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-colors"
              >
                Start Your Journey
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Sign in to begin your journey to meaningful connections.
                </p>
                <a
                  href="/account/signin"
                  className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-colors"
                >
                  Sign In to Continue
                </a>
              </div>
            )}
          </div>
        )}

        {step === "questionnaire" && user && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-semibold text-purple-800 mb-6">
              Let's Get to Know You
            </h2>

            {questions.map((q) => (
              <div key={q.id} className="mb-6">
                <label className="block text-gray-700 mb-2">{q.question}</label>
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                  rows="3"
                  placeholder={q.placeholder}
                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                  value={formData[q.id] || ""}
                />
              </div>
            ))}

            <button
              onClick={handleSubmit}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center mt-20">
            <h2 className="text-2xl font-semibold text-purple-800 mb-4">
              Profile Created!
            </h2>
            <p className="text-gray-600 mb-8">{success}</p>
            <a
              href="/matches"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-colors"
            >
              View Your Matches
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;