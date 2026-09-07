/**
 * SettingsNotifications.tsx — Notification preferences page.
 */
import { trpc } from "@/providers/trpc";
import { useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

export default function SettingsNotifications() {
  const { isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState({
    emailOffers: true,
    emailBids: true,
    emailPayouts: true,
    emailAlerts: true,
    pushBids: true,
    pushAlerts: true,
    digestDaily: false,
  });

  if (!isAuthenticated) return null;

  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-gold-400" />
        <h1 className="text-3xl font-bold text-white">Notification Preferences</h1>
      </div>

      <div className="space-y-4">
        {[
          { key: "emailOffers", label: "Offer Notifications", icon: MessageSquare, desc: "Get notified when someone makes an offer" },
          { key: "emailBids", label: "Bid Notifications", icon: MessageSquare, desc: "Get notified when a bid is placed" },
          { key: "emailPayouts", label: "Payout Notifications", icon: Mail, desc: "Get notified when payouts are ready" },
          { key: "emailAlerts", label: "Price Alerts", icon: Bell, desc: "Get notified when prices move" },
          { key: "pushBids", label: "Push Bids", icon: Smartphone, desc: "Real-time bid alerts via push" },
          { key: "pushAlerts", label: "Push Alerts", icon: Smartphone, desc: "Real-time price alert push notifications" },
          { key: "digestDaily", label: "Daily Digest", icon: Mail, desc: "Get a daily summary of all notifications" },
        ].map(({ key, label, icon: Icon, desc }) => (
          <div key={key} className="bg-dark-800/50 border border-gold-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Icon className="w-5 h-5 text-gold-400" />
              <div>
                <p className="text-white font-semibold">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
            <button onClick={() => toggle(key)} className={`w-12 h-6 rounded-full transition ${prefs[key as keyof typeof prefs] ? "bg-gold-500" : "bg-gray-700"}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition ${prefs[key as keyof typeof prefs] ? "ml-7" : "ml-1"}`} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
