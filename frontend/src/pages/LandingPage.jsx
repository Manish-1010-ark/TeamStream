import React, { useState, useEffect } from "react";
import { MessageSquare, FileText, Layout, Video } from "lucide-react";

function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Handle scroll effect for header
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Stay in sync with persistent, workspace-wide chat.",
    },
    {
      icon: FileText,
      title: "Collaborative Documents",
      description:
        "Edit documents together in real-time, powered by Liveblocks.",
    },
    {
      icon: Layout,
      title: "Interactive Whiteboards",
      description: "Brainstorm and plan with a shared digital canvas.",
    },
    {
      icon: Video,
      title: "Integrated Video Calls",
      description:
        "Jump into 1:1 or group video calls directly within your workspace.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
      {/* Enhanced Animated Background with Grid and Glowing Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Deep Blue Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-slate-950 to-slate-950"></div>

        {/* Balanced Grid Pattern with Oval Fade */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.18) 1px, transparent 1px)
          `,
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
          }}
        ></div>

        {/* Abstract Glowing Orbs - Subtle */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/18 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        ></div>

        {/* Geometric Abstract Elements - Subtle */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-cyan-500/15 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 border border-blue-500/15 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 border border-cyan-400/15 rotate-45 animate-float"></div>

        {/* Radial Gradient Overlays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-radial-gradient opacity-40"></div>
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-blue-900/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                TeamStream
              </h1>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <a
                    href="#dashboard"
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
                  >
                    My Dashboard
                  </a>
                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="px-6 py-2.5 border-2 border-slate-700 hover:border-cyan-500 rounded-lg font-semibold transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="px-6 py-2.5 border-2 border-slate-700 hover:border-cyan-500 rounded-lg font-semibold transition-all duration-200"
                  >
                    Login
                  </a>
                  <a
                    href="/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Additional Hero Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-5xl">
            <div className="absolute top-20 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <div className="inline-block mb-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full backdrop-blur-sm">
              <span className="text-cyan-400 text-sm font-semibold">
                The Future of Team Collaboration
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Where Your Team's Flow
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                Comes Together
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              The all-in-one collaboration suite. Real-time chat, collaborative
              documents, shared whiteboards, and integrated video calls. Stop
              switching, start streaming.
            </p>
            <button
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105"
              onClick={() => (window.location.href = "#signup")}
            >
              <span>Get Started for Free</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          {/* Hero Image Placeholder */}
          <div
            className="mt-16 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-3xl"></div>
              <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-400 text-lg">
                      Your workspace preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        {/* Section Background Enhancement */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything Your Team Needs,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Powerful tools that work together seamlessly, so your team can
              focus on what matters most
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 hover:border-cyan-500/50 rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-cyan-500/50 transition-shadow">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative py-20 px-6">
        {/* Section Background Enhancement */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-12 md:p-16 shadow-2xl animate-fade-in-up">
            <div className="absolute top-8 left-8 text-cyan-500/20 text-8xl font-serif">
              "
            </div>
            <div className="relative">
              <p className="text-2xl md:text-3xl font-medium text-slate-200 mb-8 leading-relaxed text-center">
                TeamStream has cut our meeting times in half and brought our
                remote team closer than ever.
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                  A
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Alex Thompson</p>
                  <p className="text-sm text-slate-400">
                    Product Manager, TechCorp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        {/* Section Background Enhancement */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Team Collaboration?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join thousands of teams already streaming their work together
          </p>
          <button
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105"
            onClick={() => (window.location.href = "#signup")}
          >
            <span>Start for Free</span>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 py-8 px-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2025 TeamStream. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-cyan-400 text-sm transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(12deg);
          }
          50% {
            transform: translateY(-20px) rotate(12deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .bg-radial-gradient {
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
