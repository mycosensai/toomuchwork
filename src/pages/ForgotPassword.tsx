/**
 * ForgotPassword.tsx — Password reset request page.
 */
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Mail, Check, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const mutation = trpc.passwordReset.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: () => setError("Something went wrong. Please try again."),
  });

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
        {sent ? (
          <div className="text-center text-emerald-400 flex flex-col items-center gap-2">
            <FiCheck className="w-8 h-8" />
            <p>Reset link sent! Check your email.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <div className="text-red-400 text-sm flex items-center gap-2"><FiAlertCircle /> {error}</div>}
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-dark-900 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-400" />
            <button onClick={() => mutation.mutate({ email })} disabled={mutation.isPending || !email} className="w-full px-4 py-3 bg-gold-500/90 text-black font-semibold rounded-lg hover:bg-gold-400 transition disabled:opacity-50">
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
