import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(password);
      navigate("/", { replace: true });
    } catch {
      // error state is surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-booth-ivory via-booth-paper to-booth-rose-300/30 px-4 dark:from-booth-night dark:via-booth-dusk dark:to-booth-plum-800">
      {/* Floating blurred shapes — purely decorative, respects reduced-motion via global CSS */}
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-booth-rose-400/30 blur-3xl dark:bg-booth-plum-500/20"
        animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-booth-gold-400/25 blur-3xl dark:bg-booth-gold-500/10"
        animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute left-1/3 top-1/4 h-40 w-40 rounded-full bg-booth-plum-300/20 blur-2xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative z-10 w-full max-w-sm rounded-3xl p-8 text-center shadow-glow sm:p-10"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "backOut" }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-booth-plum-600 shadow-soft dark:bg-booth-gold-500"
        >
          <Heart size={26} className="fill-white text-white dark:fill-booth-night dark:text-booth-night" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="font-display text-2xl text-booth-ink dark:text-booth-paper"
        >
          MistiRinai
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-1.5 text-sm text-booth-ink/60 dark:text-booth-paper/60"
        >
          Some memories are meant to stay between us.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-7 flex flex-col gap-3"
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              placeholder="Enter password"
              autoFocus
              className="w-full rounded-xl border border-booth-plum-200/70 bg-white/70 px-4 py-3 pr-11 text-sm text-booth-ink placeholder:text-booth-ink/40 transition-colors focus:border-booth-plum-400 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-booth-paper dark:placeholder:text-booth-paper/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-booth-ink/40 hover:text-booth-ink/70 dark:text-booth-paper/40 dark:hover:text-booth-paper/70"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-rose-500"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting || !password}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-booth-plum-600 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-booth-plum-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-booth-gold-500 dark:text-booth-night dark:hover:bg-booth-gold-400"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Enter Memory Booth
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
