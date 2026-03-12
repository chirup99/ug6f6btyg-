import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import faceVideo from "../assets/landing-page-face.mp4";
import { useToast } from "@/hooks/use-toast";
import {
  cognitoSignIn,
  cognitoSignUp,
  cognitoSignInWithGoogle,
  cognitoResendSignupCode,
  handleCognitoCallback,
  getCognitoToken,
  initializeCognito,
  cognitoForgotPassword,
  cognitoConfirmResetPassword,
  getRedirectUrl,
  getCognitoUser,
} from "@/cognito";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAccessInfo, setShowAccessInfo] = useState(true);
  const [showJournalCarousel, setShowJournalCarousel] = useState(false);
  const [showPerformanceWindow, setShowPerformanceWindow] = useState(false);
  const [showPerformanceTrend, setShowPerformanceTrend] = useState(false);
  const [showTradingNotes, setShowTradingNotes] = useState(false);
  const [showGifFrame, setShowGifFrame] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "FOMO",
    "OVERTRADING",
  ]);
  const [typedNote, setTypedNote] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const availableTags = [
    "FOMO",
    "OVERTRADING",
    "GREEDY",
    "FEAR",
    "SCALPING",
    "INTRADAY",
  ];

  const fullNote =
    "Identified high-risk FOMO entry at 58400. Psychological pressure led to overtrading - 12 unnecessary scalp attempts. Net impact: -₹42k. Need to adhere to 3-trade daily limit and indicator-only confirmations.";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAccessInfo(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const journalTimer = setTimeout(() => {
      setShowJournalCarousel(true);
    }, 2000);
    return () => clearTimeout(journalTimer);
  }, []);

  useEffect(() => {
    const performanceTimer = setTimeout(() => {
      setShowJournalCarousel(false);
      setShowPerformanceWindow(true);
    }, 6000);
    return () => clearTimeout(performanceTimer);
  }, []);

  useEffect(() => {
    const trendTimer = setTimeout(() => {
      setShowPerformanceWindow(false);
      setShowPerformanceTrend(true);
    }, 9000);
    return () => clearTimeout(trendTimer);
  }, []);

  useEffect(() => {
    const notesTimer = setTimeout(() => {
      setShowPerformanceTrend(false);
      setShowTradingNotes(true);
    }, 12000);
    return () => clearTimeout(notesTimer);
  }, []);

  useEffect(() => {
    if (showTradingNotes) {
      const resetTimer = setTimeout(
        () => {
          setShowTradingNotes(false);
          setShowGifFrame(true);
          // Reset sequence state
          setTypedNote("");
          setShowTagsDropdown(false);
        },
        3000 + fullNote.length * 20,
      );
      return () => clearTimeout(resetTimer);
    }
  }, [showTradingNotes]);

  useEffect(() => {
    if (showGifFrame) {
      const timer = setTimeout(() => {
        setShowGifFrame(false);
        setShowAccessInfo(true);
      }, 3900);
      return () => clearTimeout(timer);
    }
  }, [showGifFrame]);

  useEffect(() => {
    if (showGifFrame && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [showGifFrame]);

  useEffect(() => {
    if (showTradingNotes) {
      let i = 0;
      const interval = setInterval(() => {
        setTypedNote(fullNote.slice(0, i));
        i++;
        if (i > fullNote.length) clearInterval(interval);
      }, 30);

      // Auto-open tags dropdown after typing finishes
      const dropdownTimer = setTimeout(
        () => {
          setShowTagsDropdown(true);
        },
        fullNote.length * 30 + 500,
      );

      return () => {
        clearInterval(interval);
        clearTimeout(dropdownTimer);
      };
    }
  }, [showTradingNotes]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const carouselSlides = [
    { title: "Weekly Recap", value: "+₹1,24,850", color: "text-green-400" },
    { title: "Win Rate", value: "67%", color: "text-blue-400" },
    { title: "Avg RR", value: "1:2.4", color: "text-purple-400" },
    { title: "Profit Factor", value: "2.1", color: "text-orange-400" },
  ];

  useEffect(() => {
    if (showJournalCarousel && !showPerformanceWindow) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % carouselSlides.length);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [showJournalCarousel, showPerformanceWindow, carouselSlides.length]);
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isCheckingCallback, setIsCheckingCallback] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(
        () => setCooldownSeconds(cooldownSeconds - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    initializeCognito();

    // Check if user is already authenticated
    const checkExistingSession = async () => {
      console.log("🔍 [Landing] Checking for existing session...");
      try {
        const user = await getCognitoUser();
        if (user && user.userId) {
          console.log("👤 [Landing] User already authenticated:", user.email);
          console.log("🚀 [Landing] Redirecting to home page...");

          // Ensure localStorage is synced but respect existing linked ID
          const storedUserId = localStorage.getItem("currentUserId");

          // Only overwrite if not set, or if we want to force sync (but here we want to preserve link)
          // If storedUserId exists and is different from user.userId (506c...), it might be the linked ID (c06...)
          // So we should NOT overwrite it with the raw token ID.
          if (!storedUserId) {
            localStorage.setItem("currentUserId", user.userId);
          }

          localStorage.setItem("currentUserEmail", user.email);
          localStorage.setItem("currentUsername", user.email);
          localStorage.setItem("currentDisplayName", user.displayName);
          localStorage.setItem("currentUserName", user.displayName);

          // Force redirect to home
          window.location.href = "/";
          return true;
        } else {
          console.log(
            "ℹ️ [Landing] No active session found via getCognitoUser",
          );
        }
      } catch (error) {
        console.error("❌ [Landing] Error in checkExistingSession:", error);
      }
      return false;
    };

    const checkOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.has("code");
        const hasError = urlParams.has("error");

        // Handle OAuth error
        if (hasError) {
          const errorDesc =
            urlParams.get("error_description") || "Authentication failed";
          console.error("❌ OAuth error:", errorDesc);
          toast({
            title: "Sign-In Failed",
            description: errorDesc,
            variant: "destructive",
          });
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          setIsCheckingCallback(false);
          return;
        }

        if (hasCode) {
          const log = (msg: string) => {
            console.log(msg);
          };

          // Process the OAuth callback - this exchanges the code for tokens
          const user = await handleCognitoCallback();

          if (user) {
            log(`✅ User Authenticated. Email: ${user.email}`);
            log(`🔑 Token ID (Sub): ${user.userId.substring(0, 10)}...`);

            const token = await getCognitoToken();
            let finalUserId = user.userId; // Default to Cognito sub
            let accountLinked = false;

            if (token) {
              try {
                log("📡 Syncing with Backend ID System...");
                const response = await fetch("/api/auth/cognito", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ name: user.name, email: user.email }),
                });

                const result = await response.json();
                log(`📩 Backend Reply: ${JSON.stringify(result)}`);

                if (result.success && result.userId) {
                  finalUserId = result.userId; // Use canonical userId from backend
                  accountLinked = result.accountLinked || false;
                  log(`🔗 LINKED ID FOUND: ${finalUserId}`);
                }
              } catch (err) {
                log(`⚠️ Backend Sync Failed: ${err}`);
              }
            } else {
              log("⚠️ No Token found.");
            }

            log(`💾 Final Storage ID: ${finalUserId}`);
            // Store the canonical userId (original or new)
            localStorage.setItem("currentUserId", finalUserId);
            localStorage.setItem("currentUserEmail", user.email);
            localStorage.setItem("currentUsername", user.email);
            localStorage.setItem("currentDisplayName", user.name);
            localStorage.setItem("currentUserName", user.name);

            log("✅ Redirecting to Home...");

            // Clean up URL before redirect
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
            window.location.href = "/";
            return;
          } else {
            console.error("❌ [Google OAuth] Failed to get user from callback");
            toast({
              title: "Sign-In Failed",
              description:
                "Could not complete Google sign-in. Please try again.",
              variant: "destructive",
            });
            // Clean up URL
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }
        } else {
          // If not an OAuth callback, check for existing session
          await checkExistingSession();
        }
      } catch (error: any) {
        console.error("❌ [Google OAuth] Callback error:", error);
        toast({
          title: "Sign-In Error",
          description:
            error.message || "An unexpected error occurred during sign-in.",
          variant: "destructive",
        });
        // Clean up URL on error
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } finally {
        setIsCheckingCallback(false);
      }
    };

    checkOAuthCallback();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      console.log("🔐 Initiating Google OAuth via AWS Cognito...");
      console.log("   Redirect URI:", getRedirectUrl());
      console.log("   Cognito Domain:", import.meta.env.VITE_COGNITO_DOMAIN);
      await cognitoSignInWithGoogle();
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      console.error("Error stack:", error.stack);

      if (error.message?.includes("not configured")) {
        toast({
          title: "Configuration Error",
          description:
            "Google Sign-In is not configured. Please set up AWS Cognito with Google federation.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign-In Error",
          description:
            error.message ||
            "An unexpected error occurred during Google sign-in.",
          variant: "destructive",
        });
      }
      setIsGoogleLoading(false);
    }
  };

  const [isSignupVerification, setIsSignupVerification] = useState(false);

  const handleSignupVerification = async () => {
    if (!otp || otp.length < 6) {
      toast({
        title: "Invalid Code",
        description:
          "Please enter the 6-digit verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      console.log("🔐 Confirming signup for:", email);
      const response = await fetch("/api/auth/cognito/confirm-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.details || result.message || "Verification failed",
        );
      }

      toast({
        title: "Account Verified",
        description:
          "Your account has been verified successfully. Logging you in...",
      });

      // Now automatically sign the user in since we have the password and email from state
      console.log("🔐 Signing in after verification...");
      const authUser = await cognitoSignIn(email, password);

      localStorage.setItem("currentUserId", authUser.userId);
      localStorage.setItem("currentUserEmail", authUser.email);
      localStorage.setItem("currentUsername", authUser.email);
      localStorage.setItem("currentDisplayName", authUser.name);
      localStorage.setItem("currentUserName", authUser.name);

      const token = await getCognitoToken();
      if (token) {
        try {
          await fetch("/api/auth/cognito", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: authUser.name,
              email: authUser.email,
            }),
          });
        } catch (err) {
          console.warn("Backend sync failed, continuing...", err);
        }
      }

      console.log("✅ Auto-login successful, redirecting to app...");
      window.location.href = "/";
    } catch (error: any) {
      console.error("❌ Verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!isLogin && !name) {
      toast({
        title: "Missing Information",
        description: "Please enter your name to create an account.",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description:
          "Please enter a valid email address (e.g., name@example.com).",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      if (isLogin) {
        console.log("🔐 Signing in with AWS Cognito...");
        const user = await cognitoSignIn(email, password);

        const token = await getCognitoToken();
        let finalUserId = user.userId; // Default to Cognito sub

        console.log("🔑 Authentication successful:", {
          action: "login",
          userId: user.userId,
          email: user.email,
        });

        if (token) {
          try {
            const response = await fetch("/api/auth/cognito", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ name: user.name, email: user.email }),
              signal: AbortSignal.timeout(8000),
            });

            const result = await response.json();
            if (result.success && result.userId) {
              finalUserId = result.userId; // Use canonical userId from backend
            }
          } catch (fetchError) {
            console.warn(
              "⚠️ Backend sync failed, but Cognito Auth succeeded. Continuing...",
              fetchError,
            );
          }
        }

        // Store the canonical userId
        localStorage.setItem("currentUserId", finalUserId);
        localStorage.setItem("currentUserEmail", user.email);
        localStorage.setItem("currentUsername", user.email);
        localStorage.setItem("currentDisplayName", user.name);
        localStorage.setItem("currentUserName", user.name);

        console.log("✅ Authentication successful, redirecting to app...");
        window.location.href = "/";
      } else {
        console.log("🔐 Signing up with AWS Cognito...");
        await cognitoSignUp(email, password, name);

        setIsSignupVerification(true);
        setOtp("");
        toast({
          title: "Verification Required",
          description: "Please check your email for a verification code.",
        });
      }
    } catch (error: any) {
      console.error("❌ Authentication error:", error);

      let errorMessage =
        error.message || "Something went wrong. Please try again.";

      if (error.name === "UserNotConfirmedException") {
        errorMessage =
          "Please verify your email before signing in. Check your inbox for a verification code.";
        setIsSignupVerification(true);
        setOtp("");
      } else if (error.name === "NotAuthorizedException") {
        errorMessage = "Incorrect email or password.";
      } else if (error.name === "UserNotFoundException") {
        errorMessage =
          "No account found with this email. Please sign up first.";
      } else if (error.name === "UsernameExistsException") {
        errorMessage = "An account with this email already exists.";
      } else if (error.name === "InvalidPasswordException") {
        errorMessage =
          "Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, numbers, and symbols.";
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast({
        title: "Missing Email",
        description: "Enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (cooldownSeconds > 0) {
      toast({
        title: "Please Wait",
        description: `Rate limit active. Try again in ${cooldownSeconds} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      console.log("📧 Sending forgot password request via backend...");

      // Use backend endpoint that auto-verifies email before sending OTP
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw { name: result.code || "Error", message: result.message };
      }

      console.log("✅ OTP sent successfully!");
      setIsOtpSent(true);

      toast({
        title: "Code Sent Successfully",
        description: "Verification code sent to your email.",
      });
    } catch (error: any) {
      console.error("❌ Forgot Password Error:", error.name, error.message);
      let msg = error.message || "Failed to send code.";
      let title = "Error";

      if (error.name === "UserNotFoundException") {
        msg = "This email is not registered. Please sign up first.";
        title = "User Not Found";
      } else if (error.name === "LimitExceededException") {
        msg = "Rate limit exceeded. Please wait before trying again.";
        title = "Rate Limited";
        setCooldownSeconds(300); // 5 minute cooldown
      }

      toast({
        title: title,
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSaveNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Password",
        description: "Enter new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Too Short",
        description: "Use 8+ characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      console.log("🔐 AWS confirmResetPassword:", email, otp.length, "chars");
      await cognitoConfirmResetPassword(email, otp, newPassword);

      toast({
        title: "Success",
        description: "Password reset. Login now.",
      });

      setIsForgotPassword(false);
      setIsOtpSent(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail("");
      setIsLogin(true);
    } catch (error: any) {
      console.error("❌ Error:", error.name, error.message);
      let msg = "Reset failed.";

      if (error.name === "CodeMismatchException") {
        msg = "Wrong verification code. Please check and try again.";
      } else if (error.name === "ExpiredCodeException") {
        msg = "Code expired. Request new one.";
        setIsOtpSent(false);
        setOtp("");
      } else if (error.name === "InvalidPasswordException") {
        msg = "Password needs: uppercase, lowercase, numbers, symbols.";
      } else if (error.name === "LimitExceededException") {
        msg = "Too many attempts. Wait 5-10 min.";
      }

      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (isCheckingCallback) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-white text-lg">Processing authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-6">
      <div className="text-center mb-8 relative inline-block">
        <link rel="preload" as="image" href="/logo.png" />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Perala Logo"
              className="w-12 h-12 rounded-lg"
              fetchPriority="high"
              loading="eager"
            />
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
              PERALA
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-medium tracking-widest uppercase mt-1 w-full justify-end pl-[0px] pr-[0px]">
            <span>rethink . reinvest .</span>
            <div className="relative inline-flex items-center ml-1">
              <svg
                width="24"
                height="12"
                viewBox="0 0 24 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-purple-500"
              >
                <path
                  d="M11 5.2C10.2 4 9 3 7.5 3C4.5 3 3 4.5 3 6C3 7.5 4.5 9 7.5 9C10.5 9 12 6 12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 6C12 6 13.5 9 16.5 9C19.5 9 21 7.5 21 6C21 5.6 20.9 5.2 20.7 4.8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M17.8 3.3C17.4 3.1 16.9 3 16.5 3C13.5 3 12 6 12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {/* Broken flying piece */}
              <div className="absolute -top-[5px] -right-[4px] -rotate-[15deg]">
                <div className="w-[6px] h-[2.2px] bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse mt-[5px] mb-[5px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full space-y-4">
        <div className="text-center relative flex flex-col items-center justify-center p-0 m-0 overflow-hidden">
          {/* Tradebook Preview - Always visible or transitions in */}
          <div
            className={`${showAccessInfo || showGifFrame ? "h-0 opacity-0 pointer-events-none" : "h-auto opacity-100"} w-full flex justify-center p-0 m-0 transition-all duration-700 ease-in-out transform ${showAccessInfo || showGifFrame ? "translate-y-4 scale-95" : "translate-y-0 scale-100"}`}
          >
            <div className="w-[280px] h-[160px] bg-gray-900/80 rounded-lg border border-gray-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
              <div className="p-2 border-b border-gray-800 flex items-center justify-between bg-gray-950/50">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                </div>
                <div className="text-[7px] text-gray-500 font-mono tracking-tighter">
                  TRADE_BOOK_v2.0
                </div>
              </div>

              <div className="p-2 space-y-1 relative h-full flex flex-col">
                {/* Real-style Heatmap Calendar Demo with Animation */}
                <div className="space-y-1 flex-1 overflow-hidden relative">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      <span className="text-[6px] text-gray-400 uppercase font-bold tracking-wider">
                        P&L Calendar
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="text-[5px] text-gray-600">Loss</span>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-red-500/40" />
                        <div className="w-1 h-1 rounded-full bg-red-500/20" />
                        <div className="w-1 h-1 rounded-full bg-green-500/20" />
                        <div className="w-1 h-1 rounded-full bg-green-500/40" />
                      </div>
                      <span className="text-[5px] text-gray-600">Profit</span>
                    </div>
                  </div>

                  {/* Heatmap Grid */}
                  <div className="relative h-16 overflow-hidden bg-gray-950/30 rounded border border-gray-800/50 p-1">
                    <div className="flex gap-1 animate-marquee whitespace-nowrap">
                      {Array.from({ length: 12 }).map((_, monthIdx) => (
                        <div
                          key={monthIdx}
                          className="flex flex-col gap-0.5 min-w-fit"
                        >
                          <span className="text-[5px] text-gray-600 mb-0.5 text-center">
                            {
                              [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                              ][monthIdx]
                            }
                          </span>
                          <div className="grid grid-rows-7 grid-flow-col gap-0.5">
                            {Array.from({ length: 35 }).map((_, dayIdx) => {
                              const weights = [
                                0, 0, 0, 1, 1, 2, 3, 4, 0, 0, 1, 2, 0, 0, 3, 0,
                              ];
                              const weight =
                                weights[
                                  (monthIdx * 35 + dayIdx) % weights.length
                                ];
                              const colors = [
                                "bg-gray-800/20 border-gray-800/10 rounded-full",
                                "bg-green-900/40 border-green-900/20 rounded-full",
                                "bg-green-500/40 border-green-500/20 rounded-full",
                                "bg-red-500/20 border-red-500/10 rounded-full",
                                "bg-red-500/60 border-red-500/30 rounded-full",
                              ];
                              const isTarget =
                                (monthIdx === 2 && dayIdx === 15) ||
                                (monthIdx === 4 && dayIdx === 10) ||
                                (monthIdx === 7 && dayIdx === 20);
                              return (
                                <div
                                  key={dayIdx}
                                  className={`w-1.5 h-1.5 border ${colors[weight]} transition-colors duration-300 hover:scale-125 cursor-pointer relative ${isTarget ? "ring-1 ring-purple-500/50" : ""}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Magic Lines SVG Overlay */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-0 animate-fade-in [animation-delay:2s] [animation-fill-mode:forwards]">
                      <path
                        d="M 140 80 Q 100 50 60 30"
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.7)"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        className="animate-draw-line"
                      />
                      <path
                        d="M 140 80 Q 140 40 160 25"
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.7)"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        className="animate-draw-line"
                      />
                      <path
                        d="M 140 80 Q 200 60 240 35"
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.7)"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        className="animate-draw-line"
                      />
                    </svg>
                  </div>

                  {/* Magic Bar (Purple Bar) - Positioned immediately below heatmap */}
                  <div className="bg-purple-600/95 rounded-sm py-[2px] px-2 relative overflow-hidden shadow-[0_0_8px_rgba(147,51,234,0.25)] mt-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    <div className="grid grid-cols-5 gap-0 relative">
                      <div className="flex flex-col items-center justify-center border-r border-white/10 py-[1px]">
                        <span className="text-[3px] text-purple-100/70 uppercase font-medium leading-none mb-[1px]">
                          P&L
                        </span>
                        <span className="text-[5px] text-white font-bold leading-none">
                          +₹83.5K
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-white/10 py-[1px]">
                        <span className="text-[3px] text-purple-100/70 uppercase font-medium leading-none mb-[1px]">
                          Over Trade
                        </span>
                        <span className="text-[5px] text-white font-bold leading-none">
                          12
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-white/10 py-[1px]">
                        <span className="text-[3px] text-purple-100/70 uppercase font-medium leading-none mb-[1px]">
                          FOMO
                        </span>
                        <span className="text-[5px] text-white font-bold leading-none">
                          4
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-white/10 py-[1px]">
                        <span className="text-[3px] text-purple-100/70 uppercase font-medium leading-none mb-[1px]">
                          Win%
                        </span>
                        <span className="text-[5px] text-white font-bold leading-none">
                          30%
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-[1px]">
                        <span className="text-[3px] text-purple-100/70 uppercase font-medium leading-none mb-[1px]">
                          Streak
                        </span>
                        <span className="text-[5px] text-white font-bold leading-none">
                          3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1 py-0.5 border-t border-gray-800/50 mt-auto">
                  <div className="flex items-center gap-1">
                    <div className="w-0.5 h-3 bg-purple-500 rounded-full" />
                    <span className="text-[6px] text-white font-medium">
                      Jan 27, 2026
                    </span>
                  </div>
                  <div className="text-[6px] text-purple-400 font-bold tracking-tighter animate-pulse">
                    AUTO-SYNC ACTIVE
                  </div>
                </div>

                {/* Performance Window - Loss Making Analysis Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-red-400 rounded-lg transition-all duration-500 ${showPerformanceWindow ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                >
                  <div className="p-2 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <svg
                        className="w-2.5 h-2.5 text-white/90"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
                      </svg>
                      <div>
                        <span className="text-[7px] text-white font-bold">
                          Loss Making Analysis
                        </span>
                        <p className="text-[4px] text-white/70">
                          Identify and fix problematic patterns
                        </p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-1 mb-1.5">
                      <div className="bg-white/10 rounded p-1">
                        <span className="text-[8px] text-white font-bold block">
                          6
                        </span>
                        <span className="text-[4px] text-white/70">
                          Losing Days
                        </span>
                      </div>
                      <div className="bg-white/10 rounded p-1">
                        <span className="text-[8px] text-white font-bold block">
                          4
                        </span>
                        <span className="text-[4px] text-white/70">
                          Emotional Days
                        </span>
                      </div>
                      <div className="bg-white/10 rounded p-1">
                        <span className="text-[8px] text-white font-bold block">
                          34
                        </span>
                        <span className="text-[4px] text-white/70">
                          Impulsive Trades
                        </span>
                      </div>
                      <div className="bg-white/10 rounded p-1">
                        <span className="text-[8px] text-white font-bold block">
                          40%
                        </span>
                        <span className="text-[4px] text-white/70">
                          Loss Rate
                        </span>
                      </div>
                    </div>

                    {/* Most Problematic Tags */}
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[5px]">⚠️</span>
                      <span className="text-[5px] text-white/90 font-semibold">
                        Most Problematic Tags
                      </span>
                    </div>

                    {/* Tag Cards Grid */}
                    <div className="grid grid-cols-2 gap-1 flex-1">
                      <div className="bg-white/15 rounded p-1 border border-white/10">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 flex items-center justify-center">
                            <span className="text-[3px]">!</span>
                          </div>
                          <span className="text-[5px] text-white font-bold">
                            OVERTRADING
                          </span>
                        </div>
                        <p className="text-[3.5px] text-white/60">
                          Avg Loss: ₹13930 • 100% loss rate
                        </p>
                        <p className="text-[3px] text-white/50 mt-0.5">
                          Total: ₹41,788 across 3 days
                        </p>
                      </div>
                      <div className="bg-white/15 rounded p-1 border border-white/10">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 flex items-center justify-center">
                            <span className="text-[3px]">!</span>
                          </div>
                          <span className="text-[5px] text-white font-bold">
                            INDICATOR BASED
                          </span>
                        </div>
                        <p className="text-[3.5px] text-white/60">
                          Avg Loss: ₹12408 • 100% loss rate
                        </p>
                        <p className="text-[3px] text-white/50 mt-0.5">
                          Total: ₹24,816 across 2 days
                        </p>
                      </div>
                      <div className="bg-white/15 rounded p-1 border border-white/10">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 flex items-center justify-center">
                            <span className="text-[3px]">!</span>
                          </div>
                          <span className="text-[5px] text-white font-bold">
                            FOMO
                          </span>
                        </div>
                        <p className="text-[3.5px] text-white/60">
                          Avg Loss: ₹5102 • 100% loss rate
                        </p>
                        <p className="text-[3px] text-white/50 mt-0.5">
                          Total: ₹20,408 across 4 days
                        </p>
                      </div>
                      <div className="bg-white/15 rounded p-1 border border-white/10">
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 flex items-center justify-center">
                            <span className="text-[3px]">!</span>
                          </div>
                          <span className="text-[5px] text-white font-bold">
                            BLIND TRADES
                          </span>
                        </div>
                        <p className="text-[3.5px] text-white/60">
                          Avg Loss: ₹12408 • 100% loss rate
                        </p>
                        <p className="text-[3px] text-white/50 mt-0.5">
                          Total: ₹12,408 across 1 day
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Trend - Chart Display Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg transition-all duration-500 ${showPerformanceTrend ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                >
                  <div className="p-2 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[7px] text-white font-bold">
                        Performance Trend
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[5px] text-green-400">
                          Profitable
                        </span>
                      </div>
                    </div>

                    {/* Y-Axis Labels and Chart Area */}
                    <div className="flex-1 flex relative">
                      {/* Y-Axis */}
                      <div className="flex flex-col justify-between text-[4px] text-gray-500 pr-1 py-1">
                        <span>80K</span>
                        <span>32K</span>
                        <span>7K</span>
                        <span>-18K</span>
                      </div>

                      {/* Chart */}
                      <div className="flex-1 relative bg-gray-800/30 rounded border border-gray-700/50">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-2">
                          <div className="border-t border-gray-700/30 w-full" />
                          <div className="border-t border-gray-700/30 w-full" />
                          <div className="border-t border-gray-700/30 w-full" />
                          <div className="border-t border-gray-700/30 w-full" />
                        </div>

                        {/* Performance Line Chart SVG */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          viewBox="0 0 200 80"
                          preserveAspectRatio="none"
                        >
                          {/* Area Fill */}
                          <defs>
                            <linearGradient
                              id="areaGradient"
                              x1="0%"
                              y1="0%"
                              x2="0%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor="rgba(34, 197, 94, 0.3)"
                              />
                              <stop
                                offset="100%"
                                stopColor="rgba(34, 197, 94, 0)"
                              />
                            </linearGradient>
                            <style>{`
                              @keyframes drawLine {
                                from { stroke-dashoffset: 600; }
                                to { stroke-dashoffset: 0; }
                              }
                              @keyframes movePointer {
                                0% { offset-distance: 0%; opacity: 0; }
                                5% { opacity: 1; }
                                95% { opacity: 1; }
                                100% { offset-distance: 100%; opacity: 0; }
                              }
                              @keyframes colorChange {
                                0%, 20% { fill: #ef4444; } /* Red for initial dip */
                                40%, 100% { fill: #4ade80; } /* Green for recovery and growth */
                              }
                              @keyframes valueCycle {
                                0% { content: "-₹1.2k"; opacity: 1; }
                                15% { content: "-₹2.8k"; opacity: 1; }
                                30% { content: "+₹0.5k"; opacity: 1; }
                                45% { content: "+₹1.8k"; opacity: 1; }
                                60% { content: "+₹2.4k"; opacity: 1; }
                                75% { content: "+₹3.6k"; opacity: 1; }
                                90% { content: "+₹4.2k"; opacity: 1; }
                                100% { content: "+₹4.2k"; opacity: 0; }
                              }
                              /* Alternative for SVG text: multiple elements with synchronized opacity */
                              @keyframes showVal1 { 0%, 14% { opacity: 1; } 15%, 100% { opacity: 0; } }
                              @keyframes showVal2 { 0%, 14% { opacity: 0; } 15%, 29% { opacity: 1; } 30%, 100% { opacity: 0; } }
                              @keyframes showVal3 { 0%, 29% { opacity: 0; } 30%, 44% { opacity: 1; } 45%, 100% { opacity: 0; } }
                              @keyframes showVal4 { 0%, 44% { opacity: 0; } 45%, 59% { opacity: 1; } 60%, 100% { opacity: 0; } }
                              @keyframes showVal5 { 0%, 59% { opacity: 0; } 60%, 74% { opacity: 1; } 75%, 100% { opacity: 0; } }
                              @keyframes showVal6 { 0%, 74% { opacity: 0; } 75%, 89% { opacity: 1; } 90%, 100% { opacity: 0; } }
                              @keyframes showVal7 { 0%, 89% { opacity: 0; } 90%, 98% { opacity: 1; } 99%, 100% { opacity: 0; } }

                              .animate-draw-line {
                                stroke-dasharray: 600;
                                stroke-dashoffset: 600;
                                animation: drawLine 3s linear infinite;
                              }
                              .animate-pointer-group {
                                offset-path: path("M 0 55 Q 15 50 25 48 T 50 52 T 75 45 T 100 50 T 125 48 T 150 45 T 175 35 T 200 10");
                                offset-rotate: 0deg;
                                animation: movePointer 3s linear infinite;
                              }
                              .animate-pl-text {
                                animation: colorChange 3s linear infinite;
                              }
                              .val-1 { animation: showVal1 3s step-end infinite; }
                              .val-2 { animation: showVal2 3s step-end infinite; }
                              .val-3 { animation: showVal3 3s step-end infinite; }
                              .val-4 { animation: showVal4 3s step-end infinite; }
                              .val-5 { animation: showVal5 3s step-end infinite; }
                              .val-6 { animation: showVal6 3s step-end infinite; }
                              .val-7 { animation: showVal7 3s step-end infinite; }
                            `}</style>
                          </defs>
                          <path
                            d="M 0 55 Q 15 50 25 48 T 50 52 T 75 45 T 100 50 T 125 48 T 150 45 T 175 35 T 200 10 L 200 80 L 0 80 Z"
                            fill="url(#areaGradient)"
                          />
                          {/* Line */}
                          <path
                            d="M 0 55 Q 15 50 25 48 T 50 52 T 75 45 T 100 50 T 125 48 T 150 45 T 175 35 T 200 10"
                            fill="none"
                            stroke="rgba(34, 197, 94, 1)"
                            strokeWidth="2"
                            className="animate-draw-line"
                          />
                          {/* Pointer Group with Vertical Line and P&L */}
                          <g className="animate-pointer-group">
                            <line
                              x1="0"
                              y1="-80"
                              x2="0"
                              y2="80"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <circle
                              r="3"
                              fill="white"
                              className="shadow-lg"
                              style={{
                                filter:
                                  "drop-shadow(0 0 4px rgba(34, 197, 94, 0.8))",
                              }}
                            />
                            <g transform="translate(5, -10)">
                              <rect
                                x="0"
                                y="0"
                                width="25"
                                height="10"
                                rx="2"
                                fill="rgba(0,0,0,0.8)"
                              />
                              <g className="animate-pl-text">
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-1"
                                >
                                  -₹12k
                                </text>
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-2"
                                >
                                  -₹28k
                                </text>
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-3"
                                >
                                  +₹5k
                                </text>
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-4"
                                >
                                  +₹18k
                                </text>
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-5"
                                >
                                  +₹24k
                                </text>
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-6"
                                >
                                  +₹36k
                                </text>
                                <text
                                  x="12.5"
                                  y="7"
                                  textAnchor="middle"
                                  fontSize="5"
                                  fontWeight="bold"
                                  className="val-7"
                                >
                                  +₹42k
                                </text>
                              </g>
                            </g>
                          </g>
                        </svg>
                      </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="flex justify-between mt-1 pt-1 border-t border-gray-700/50">
                      <div className="flex items-center gap-1">
                        <span className="text-[5px] text-gray-500">
                          Current Price:
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[6px] text-green-400 font-bold animate-pulse">
                            ₹78,420.50
                          </span>
                          <svg
                            className="w-1.5 h-1.5 text-green-400 animate-bounce"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M12 19V5M5 12l7-7 7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[5px] text-gray-500">Trend:</span>
                        <span className="text-[6px] text-green-400 font-bold uppercase tracking-tighter">
                          +2.4%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trading Notes - Typing Animation Overlay */}
                <div
                  className={`absolute inset-0 bg-[#0f172a] rounded-lg transition-all duration-500 ${showTradingNotes ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                >
                  <div className="p-2 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5 border-b border-gray-800 pb-1 relative">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[7px] text-white font-bold tracking-tight uppercase whitespace-nowrap">
                          Trading Notes
                        </span>
                        {/* Top Tags Display */}
                        <div className="flex gap-0.5 ml-1 animate-in fade-in slide-in-from-left-2 duration-500">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1 py-[1px] rounded-full bg-purple-500/20 border border-purple-500/30 text-[3.5px] text-purple-300 font-bold uppercase tracking-tighter animate-in zoom-in-95"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                          className={`p-0.5 rounded transition-all duration-300 ${showTagsDropdown ? "bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.4)]" : "bg-purple-500/20 hover:bg-purple-500/40"}`}
                        >
                          <svg
                            className={`w-2 h-2 ${showTagsDropdown ? "text-white" : "text-purple-400"} transition-transform duration-300 ${showTagsDropdown ? "rotate-180" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                        </button>
                        <div className="p-0.5 rounded hover:bg-white/5 cursor-pointer">
                          <svg
                            className="w-2 h-2 text-gray-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </div>
                      </div>

                      {/* Tags Dropdown Menu */}
                      <div
                        className={`absolute top-full right-0 mt-1 w-32 bg-gray-900 border border-gray-800 rounded-md shadow-2xl z-50 p-1 transition-all duration-300 transform origin-top-right ${showTagsDropdown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 -translate-y-2 pointer-events-none"}`}
                      >
                        <div className="text-[5px] text-gray-500 mb-1 px-1 font-bold uppercase tracking-widest">
                          Select Tags
                        </div>
                        <div className="grid grid-cols-2 gap-0.5">
                          {availableTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-1 py-0.5 rounded text-[4.5px] font-medium text-left transition-all duration-200 ${selectedTags.includes(tag) ? "bg-purple-600 text-white font-bold" : "hover:bg-gray-800 text-gray-400"}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Note Content Area */}
                    <div className="flex-1 bg-gray-950/40 rounded p-1.5 border border-gray-800/50 relative overflow-hidden group">
                      <div className="text-[6.5px] text-gray-300 leading-relaxed font-mono">
                        {typedNote}
                        <span className="inline-block w-1 h-2.5 bg-purple-500 ml-0.5 animate-pulse" />
                      </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[5px] text-gray-500">
                          Loss: ₹41,788
                        </span>
                      </div>
                      <span className="text-[5px] text-purple-400/80 font-bold italic">
                        Auto-analyzed by Gemini AI
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500/20" />
            </div>
          </div>

          {/* GIF/Video Frame - Shown after trading notes and before early access */}
          <div
            className={`${!showGifFrame ? "h-0 opacity-0 pointer-events-none" : "h-auto opacity-100"} p-0 m-0 transition-all duration-500 ease-in-out transform ${!showGifFrame ? "-translate-y-4 scale-95" : "translate-y-0 scale-100"}`}
          >
            <div className="bg-gray-900/50 p-2 rounded-2xl border border-gray-800/50 backdrop-blur-sm overflow-hidden w-[280px] h-[160px] mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                src={faceVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Access Info - Hides after 1 second */}
          <div
            className={`${!showAccessInfo ? "h-0 opacity-0 pointer-events-none" : "h-auto opacity-100"} p-0 m-0 transition-all duration-500 ease-in-out transform ${!showAccessInfo ? "-translate-y-4 scale-95" : "translate-y-0 scale-100"}`}
          >
            <h2 className="text-2xl font-bold text-white mb-1">
              Get Early Access
            </h2>
            <p className="text-gray-400 text-xs mb-2">
              Perala: Your Advanced Trading Journal & Performance Analysis Hub.
            </p>
            <div className="flex justify-center gap-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full" />
                <span>Daily Trade Tracking</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full" />
                <span>AI Performance Analysis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800/50 backdrop-blur-sm m-0">
          <div className="space-y-4">
            {isSignupVerification ? (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Verify Your Account
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>
                </div>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl text-center text-lg tracking-widest"
                    data-testid="input-signup-otp"
                  />
                  <Button
                    onClick={handleSignupVerification}
                    disabled={otp.length < 6 || isEmailLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11 rounded-xl disabled:opacity-50"
                    data-testid="button-verify-signup"
                  >
                    {isEmailLoading ? "Verifying..." : "Verify & Continue"}
                    {!isEmailLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        // For resending signup code, we just re-trigger handleEmailAuth in signup mode
                        // handleEmailAuth will call cognitoSignUp which should fail if user exists,
                        // but actually we should use resendConfirmationCode from cognito.ts
                        cognitoResendSignupCode(email)
                          .then(() => {
                            toast({
                              title: "Code Resent",
                              description:
                                "A new verification code has been sent to your email.",
                            });
                          })
                          .catch((err: any) => {
                            toast({
                              title: "Resend Failed",
                              description:
                                err.message || "Failed to resend code.",
                              variant: "destructive",
                            });
                          });
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                      data-testid="button-resend-signup-otp"
                    >
                      Resend Code
                    </Button>
                    <button
                      onClick={() => {
                        setIsSignupVerification(false);
                        setIsLogin(true);
                        setOtp("");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      data-testid="button-back-to-login-from-verify"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </>
            ) : isForgotPassword ? (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Reset Password
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Enter your email for a verification code
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isOtpSent}
                    className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl disabled:opacity-50"
                    data-testid="input-forgot-email"
                  />
                  {cooldownSeconds > 0 && (
                    <div className="p-3 bg-orange-900/30 border border-orange-700 rounded-lg text-center">
                      <p className="text-orange-400 text-xs">
                        AWS rate limit active. Wait{" "}
                        {Math.floor(cooldownSeconds / 60)}:
                        {(cooldownSeconds % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                  )}
                  {!isOtpSent ? (
                    <Button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || cooldownSeconds > 0}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11 rounded-xl disabled:opacity-50"
                      data-testid="button-send-otp"
                    >
                      {isSendingOtp
                        ? "Sending..."
                        : cooldownSeconds > 0
                          ? `Wait ${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, "0")}`
                          : "Send OTP"}
                      {!isSendingOtp && cooldownSeconds === 0 && (
                        <ArrowRight className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  ) : (
                    <>
                      <div className="p-2 bg-green-900/30 border border-green-700 rounded-lg text-center">
                        <p className="text-green-400 text-xs">
                          Code sent to your email
                        </p>
                      </div>
                      <Input
                        type="text"
                        placeholder="6-digit verification code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        maxLength={6}
                        className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl text-center text-lg tracking-widest"
                        data-testid="input-otp"
                      />
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password (8+ characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl pr-10"
                          data-testid="input-new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showNewPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl pr-10"
                          data-testid="input-confirm-password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      <Button
                        onClick={handleSaveNewPassword}
                        disabled={
                          otp.length < 6 ||
                          !newPassword ||
                          !confirmPassword ||
                          isSavingPassword
                        }
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-11 rounded-xl disabled:opacity-50"
                        data-testid="button-save-password"
                      >
                        {isSavingPassword ? "Resetting..." : "Reset Password"}
                        {!isSavingPassword && (
                          <ArrowRight className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || cooldownSeconds > 0}
                        className="w-full text-xs text-gray-500 hover:text-white disabled:opacity-50"
                        data-testid="button-resend-otp"
                      >
                        {isSendingOtp ? "Sending..." : "Resend Code"}
                      </Button>
                    </>
                  )}
                  <div className="flex justify-center">
                    <button
                      onClick={handleBackToLogin}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      data-testid="button-back-to-login"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex p-1 bg-gray-950 rounded-xl mb-4">
                  <Button
                    variant="ghost"
                    className={`flex-1 h-9 rounded-lg transition-all ${isLogin ? "bg-gray-800 text-white" : "text-gray-500"}`}
                    onClick={() => setIsLogin(true)}
                  >
                    Login
                  </Button>
                  <Button
                    variant="ghost"
                    className={`flex-1 h-9 rounded-lg transition-all ${!isLogin ? "bg-gray-800 text-white" : "text-gray-500"}`}
                    onClick={() => setIsLogin(false)}
                  >
                    Sign Up
                  </Button>
                </div>

                <div className="space-y-3">
                  {!isLogin && (
                    <Input
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl"
                    />
                  )}
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-950 border-gray-800 text-white placeholder-gray-400 h-11 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <Button
                    onClick={handleEmailAuth}
                    disabled={isEmailLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 h-11 rounded-xl font-semibold"
                  >
                    {isLogin ? "Login" : "Sign Up"}{" "}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>

                  {isLogin && (
                    <button
                      onClick={() => setIsForgotPassword(true)}
                      className="w-full text-right text-[10px] text-gray-500 hover:text-gray-300"
                    >
                      Forgot password?
                    </button>
                  )}

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                      <span className="bg-[#0a0a0a] px-2 text-gray-600">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-100 text-black h-11 rounded-xl border-0 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      Sign in with Google
                    </span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-6 text-[10px] text-gray-600 py-4">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full" />
            <span>Improve Your Trading</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-500 rounded-full" />
            <span>Data-Driven Patterns</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 text-[9px] text-gray-700 border-t border-gray-900 pt-4">
          <a href="/privacy" className="hover:text-gray-500">
            Privacy Policy
          </a>
          <span>© 2026 Perala</span>
        </div>
      </div>
    </div>
  );
}
