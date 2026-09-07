/**
 * SettingsSecurity.tsx — Security settings: 2FA, backup codes, session management.
 */
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Key, AlertTriangle, Check, Copy, Loader2 } from "lucide-react";

export default function SettingsSecurity() {
  const { isAuthenticated } = useAuth();
  const [show2FA, setShow2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const enable2FA = trpc.twoFactor.enable2FA.useMutation();
  const generateCodes = trpc.twoFactor.generateBackupCodes.useMutation();

  const handleGenerate = async () => {
    const codes = await generateCodes.mutateAsync({});
    setBackupCodes(codes.codes || []);
    setShow2FA(true);
  };

  if (!isAuthenticated) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Security</h1>
      </div>

      {/* 2FA Section */}
      <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-400 mb-4">Add an extra layer of security with 2FA.</p>
        <button onClick={handleGenerate} disabled={enable2FA.isPending} className="px-6 py-3 bg-gold-500/90 text-black font-semibold rounded-lg hover:bg-gold-400 transition disabled:opacity-50">
          {enable2FA.isPending ? "Setting up..." : "Enable 2FA"}
        </button>
      </div>

      {/* Backup Codes */}
      {show2FA && (
        <div className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Backup Codes</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {backupCodes.map((code, i) => (
              <div key={i} className="bg-dark-900 border border-gold-500/20 rounded-lg p-3 text-center">
                <p className="text-gold-400 font-mono text-sm">{code}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); setCopied(true); }} className="mt-4 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition flex items-center gap-2">
            <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy Codes"}
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-orange-400">
            <AlertTriangle className="w-3 h-3" /> Store these codes safely. Each code can only be used once.
          </div>
        </div>
      )}
    </section>
  );
}
