// frontend/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await axios.post("http://localhost:3001/api/auth/forgot-password", {
        email,
      });
      setMessage("Password reset link has been sent to your email address.");
      setIsSuccess(true);
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "Could not send reset link. Please try again."
      );
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Your Password">
      {!isSuccess ? (
        <>
          <p className="text-slate-400 text-center mb-6 text-sm">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-sm font-semibold text-slate-400 mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/70 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                required
              />
            </div>

            {message && !isSuccess && (
              <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {message}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-900 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending Reset Link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <p className="font-medium">{message}</p>
            </div>
          </div>

          <p className="text-slate-400 text-sm mb-4">
            Didn't receive the email? Check your spam folder or try again.
          </p>

          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail("");
              setMessage("");
            }}
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
        <p className="text-slate-400">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;
