import React, { type JSX } from "react";
import "./TerminalLogin.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI =
  import.meta.env.VITE_REDIRECT_URI || `${location.origin}/home`;

function buildGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export default function TerminalLogin(): JSX.Element {
  const handleSignIn = async () => {
    try {
      if (API_BASE) {
        const res = await fetch(
          `${API_BASE.replace(/\/$/, "")}/auth/google`
        );
        if (!res.ok) throw new Error("Failed to get auth url from backend");
        const data = await res.json();
        if (!data?.url) throw new Error("No URL returned from backend");
        window.location.href = data.url;
        return;
      }

      if (!GOOGLE_CLIENT_ID) {
        alert("Missing VITE_GOOGLE_CLIENT_ID environment variable.");
        return;
      }
      const url = buildGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      console.error("Sign-in error:", err);
      alert("Could not start sign-in. See console for details.");
    }
  };

  return (
    <div className="terminal-screen">
      <div className="terminal-glow" />
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="title">guest@neon-terminal:~</div>
        </div>

        <div className="terminal-body">
          <pre className="prompt-line typing">
            <span className="prompt-user">guest@neon:~$</span>{" "}
            <span className="prompt-text">
              Welcome — please sign in with Google
            </span>
          </pre>

          <div className="neon-card">
            <div className="neon-text">
              <h2>Sign in with Google</h2>
              <p className="muted">
                Continue securely using your Google account to access the
                dashboard.
              </p>

              <button
                className="neon-btn"
                onClick={handleSignIn}
                aria-label="Sign in with Google"
              >
                <svg
                  className="btn-google"
                  viewBox="0 0 533.5 544.3"
                  aria-hidden
                >
                  <path
                    fill="#4285F4"
                    d="M533.5 278.4c0-17.4-1.4-34.1-4-50.3H272v95.3h147.4c-6.4 34.7-25.6 64-54.6 83.6v69.3h88.2c51.6-47.5 81.5-118 81.5-197.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M272 544.3c73.5 0 135.4-24.5 180.7-66.7l-88.2-69.3c-24.5 16.5-55.7 26.3-92.5 26.3-71 0-131.2-47.9-152.6-112.3H27.3v70.6C72.8 480.5 165.6 544.3 272 544.3z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M119.4 324.3c-10.9-32.7-10.9-67.9 0-100.6V153.1H27.3c-39.8 78.5-39.8 171.9 0 250.4l92.1-79.2z"
                  />
                  <path
                    fill="#EA4335"
                    d="M272 107.4c39.6 0 75.1 13.6 103.1 40.4l77.3-77.3C407.7 24.7 345.8 0 272 0 165.6 0 72.8 63.8 27.3 153.1l92.1 70.6C140.8 155.3 201 107.4 272 107.4z"
                  />
                </svg>
                <span className="btn-text">Sign in with Google</span>
              </button>
            </div>
          </div>

          <pre className="hint">
            💡 Tip: Your credentials are never stored — OAuth handled securely.
          </pre>
        </div>
      </div>
    </div>
  );
}
