import { useState } from "react";
import {
  AuthLayout,
  AuthIcon
} from "../Login/Login";

import { createAccount } from "../../utils/demoAuth";
import "./SignUp.css";

export default function SignUp({
  onLogin,
  onRegistered
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(event) {
    event.preventDefault();
    setError("");

    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "Password must contain at least 8 characters, including letters and numbers."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError(
        "Please accept the Terms of Service and Privacy Policy."
      );
      return;
    }

    setLoading(true);

    try {
      await createAccount(email, password);

      onRegistered();
    } catch (error) {
      setError(
        error.message || "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout signup>

      <h1 className="auth-title signup-title">
        Create Account
      </h1>

      <p className="signup-subtitle">
        Join UATGen AI and generate test cases in minutes.
      </p>

      <form
        className="auth-form signup-form"
        onSubmit={handleSignUp}
      >

        {/* Email Address */}

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

        {/* Password */}

        <div>

          <div className="auth-input-group">

            <AuthIcon type="password" />

            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

          </div>

          <small className="signup-password-hint">
            Use 8+ characters with letters and numbers
          </small>

        </div>

        {/* Confirm Password */}

        <div className="auth-input-group">

          <AuthIcon type="password" />

          <input
            type="password"
            placeholder="Confirm Password"
            aria-label="Confirm password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            required
          />

        </div>

        {/* Terms and Conditions */}

        <div className="signup-terms">

          <input
            type="checkbox"
            id="signup-agreement"
            checked={agreed}
            onChange={(event) =>
              setAgreed(event.target.checked)
            }
          />

          <div>

            <label htmlFor="signup-agreement">
              I agree to the{" "}
            </label>

            <button
              type="button"
              className="auth-link"
              onClick={() =>
                setError(
                  "Terms of Service are not available in this prototype."
                )
              }
            >
              Terms of Service
            </button>

            {" and "}

            <button
              type="button"
              className="auth-link"
              onClick={() =>
                setError(
                  "Privacy Policy is not available in this prototype."
                )
              }
            >
              Privacy Policy
            </button>

          </div>

        </div>

        {/* Validation Message */}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit signup-submit"
          disabled={loading}
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>

      </form>

      <p className="auth-switch">

        Already have an account?{" "}

        <button
          type="button"
          className="auth-link"
          onClick={onLogin}
        >
          Login
        </button>

      </p>

    </AuthLayout>
  );
}