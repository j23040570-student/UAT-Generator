import { useState } from "react";
import { loginAccount } from "../../utils/demoAuth";
import "./Login.css";

/* Shared Icons */

export function AuthIcon({ type }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "email" ? (
        <>
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="m3 6 9 7 9-7" />
        </>
      ) : (
        <>
          <rect x="4" y="10" width="16" height="12" rx="2" />
          <path d="M8 10V6a4 4 0 0 1 8 0v4" />
          <circle cx="12" cy="15" r="1" />
          <path d="M12 16v3" />
        </>
      )}
    </svg>
  );
}

/* Shared Robot Illustration */

function RobotLogo() {
  return (
    <svg
      className="auth-robot"
      viewBox="0 0 200 180"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="robotBody" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dcd9ff" />
          <stop offset="100%" stopColor="#8c83eb" />
        </linearGradient>

        <linearGradient id="robotFace" x2="0" y2="1">
          <stop offset="0%" stopColor="#424ce2" />
          <stop offset="100%" stopColor="#17165c" />
        </linearGradient>

        <radialGradient id="robotEye">
          <stop offset="0%" stopColor="#c3ffff" />
          <stop offset="100%" stopColor="#00baff" />
        </radialGradient>
      </defs>

      <rect
        x="94" y="19" width="12" height="33" rx="6"
        fill="url(#robotBody)"
      />

      <rect
        x="90" y="5" width="20" height="27" rx="10"
        fill="url(#robotBody)"
      />

      <rect
        x="22" y="84" width="24" height="45" rx="12"
        fill="url(#robotBody)"
      />

      <rect
        x="154" y="84" width="24" height="45" rx="12"
        fill="url(#robotBody)"
      />

      <rect
        x="35" y="40" width="130" height="116" rx="45"
        fill="url(#robotBody)"
      />

      <rect
        x="48" y="65" width="104" height="66" rx="25"
        fill="url(#robotFace)"
      />

      <circle
        cx="78" cy="98" r="10"
        fill="url(#robotEye)"
      />

      <circle
        cx="122" cy="98" r="10"
        fill="url(#robotEye)"
      />

      <path
        d="M89 138 Q100 151 111 138 Z"
        fill="#5548e6"
      />
    </svg>
  );
}

/* Shared Authentication Layout */

export function AuthLayout({ children, signup = false }) {
  return (
    <div
      className={`auth-page ${signup ? "signup-page" : "login-page"}`}
    >
      <aside className="auth-left">

        <span className="auth-decoration circle-one" />
        <span className="auth-decoration circle-two" />
        <span className="auth-decoration circle-three" />
        <span className="auth-decoration circle-four" />
        <span className="auth-decoration circle-five" />

        <div className="auth-brand">
          <RobotLogo />

          <h2>UATGen AI</h2>

          <p>Your AI-powered test case partner</p>
        </div>

      </aside>

      <main className="auth-right">
        <div className="auth-form-container">
          {children}
        </div>
      </main>
    </div>
  );
}

/* Login Page */

export default function Login({
  onLogin,
  onSignUp,
  notice
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userEmail = await loginAccount(
        email,
        password,
        remember
      );

      onLogin(userEmail);
    } catch (error) {
      setError(error.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>

      <h1 className="auth-title">
        Welcome Back
      </h1>

      <form
        className="auth-form login-form"
        onSubmit={handleLogin}
      >

        <div className="auth-input-group">

          <AuthIcon type="email" />

          <input
            type="email"
            placeholder="Email Address"
            aria-label="Email address"
            autoComplete="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

        </div>

        <div className="auth-input-group">

          <AuthIcon type="password" />

          <input
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

        </div>

        <div className="login-options">

          <label className="auth-checkbox">

            <input
              type="checkbox"
              checked={remember}
              onChange={(event) =>
                setRemember(event.target.checked)
              }
            />

            <span>Remember me</span>

          </label>

          <button
            type="button"
            className="auth-link"
            onClick={() =>
              setError(
                "Password recovery is not connected yet."
              )
            }
          >
            Forgot Password?
          </button>

        </div>

        {notice && !error && (
          <p className="auth-success" role="status">
            {notice}
          </p>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit login-submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <p className="auth-switch">

        Don't have an account?{" "}

        <button
          type="button"
          className="auth-link"
          onClick={onSignUp}
        >
          Sign up
        </button>

      </p>

    </AuthLayout>
  );
}