"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import {
  Diamond, Mail, MessageCircle, AlertTriangle, ExternalLink, Shield, Clock, Wallet,
} from "lucide-react";
import { FooterDisclaimer } from "@/components/LiabilityDisclaimer";
import { trpc } from "@/providers/trpc";

export default function SupportPage() {
  const createTicket = trpc.tickets.create.useMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [ticketNo, setTicketNo] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicket.mutate(
      {
        channel: "website",
        customerName: form.name || undefined,
        customerEmail: form.email || undefined,
        subject: form.subject,
        message: form.message,
        priority: "normal",
      },
      {
        onSuccess: (res) => setTicketNo(res.ticketNo),
      }
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-[#080808] text-[#E8E2D0]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[9px] tracking-[5px] uppercase text-[#C9A84C] font-medium mb-3">Help Center</p>
          <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5EED8] tracking-[4px]">Support</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#C9A84C]" />
            <Diamond className="w-1.5 h-1.5 text-[#C9A84C] rotate-45" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#C9A84C]" />
          </div>
          <p className="text-[#C8BC98]/70 text-sm mt-4 max-w-xl mx-auto">
            Every inquiry becomes an individual ticket (VLT-XXXX). An agent
            acknowledges receipt immediately — a copy lands in our operations
            inbox via Telegram.
          </p>
        </div>

        {/* Ticket form */}
        <div className="rounded-2xl border border-[#C9A84C]/25 bg-[#161616] p-8 mb-10">
          <AnimatePresence mode="wait">
            {ticketNo ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="text-5xl mb-4">🎫</div>
                <h2 className="font-cinzel text-2xl text-[#C9A84C] mb-2">Ticket {ticketNo} Created</h2>
                <p className="text-[#C8BC98] mb-1">
                  Your inquiry has been received and acknowledged. An agent will respond shortly.
                </p>
                <p className="text-[#C8BC98]/50 text-sm">
                  Keep <span className="text-[#C9A84C]">{ticketNo}</span> for reference.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={submit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-[#C8BC98]/60">Your name</span>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-2 w-full rounded-lg bg-[#111] border border-[#C9A84C]/20 px-4 py-3 text-[#E8E2D0] outline-none focus:border-[#C9A84C]"
                      placeholder="Jane Collector"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-widest text-[#C8BC98]/60">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-2 w-full rounded-lg bg-[#111] border border-[#C9A84C]/20 px-4 py-3 text-[#E8E2D0] outline-none focus:border-[#C9A84C]"
                      placeholder="jane@example.com"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-[#C8BC98]/60">Subject</span>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    minLength={3}
                    className="mt-2 w-full rounded-lg bg-[#111] border border-[#C9A84C]/20 px-4 py-3 text-[#E8E2D0] outline-none focus:border-[#C9A84C]"
                    placeholder="Question about a listing…"
                  />
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-[#C8BC98]/60">Message</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    minLength={3}
                    rows={6}
                    className="mt-2 w-full rounded-lg bg-[#111] border border-[#C9A84C]/20 px-4 py-3 text-[#E8E2D0] outline-none focus:border-[#C9A84C] resize-none"
                    placeholder="Tell us what you need…"
                  />
                </label>
                <button
                  type="submit"
                  disabled={createTicket.isPending}
                  className="w-full rounded-lg bg-[#C9A84C] py-4 font-cinzel font-bold text-black hover:bg-[#e0bf5f] transition disabled:opacity-50"
                >
                  {createTicket.isPending ? "Creating ticket…" : "Submit Inquiry →"}
                </button>
                {createTicket.isError && (
                  <p className="text-red-400 text-sm">Failed to create ticket — please try again.</p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Contact Card */}
        <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative mb-8 text-center">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />
          <div className="w-16 h-16 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-[#C9A84C] -rotate-45" />
          </div>
          <h2 className="font-cinzel text-lg font-bold text-[#C9A84C] tracking-[4px] mb-2">Contact Support</h2>
          <p className="font-cormorant italic text-base text-[#C8BC98] mb-6">
            For all inquiries, disputes, and support requests, reach out directly to our team.
          </p>
          <a href="mailto:ratchetkrewelabs@gmail.com" className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[12px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all">
            <Mail className="w-4 h-4" /> ratchetkrewelabs@gmail.com
          </a>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: <Wallet className="w-5 h-5" />, title: "Crypto Payments", text: "All crypto payments go directly wallet-to-wallet on the Solana blockchain. Use Phantom, Soul, or Robinhood wallet. We never hold your funds." },
            { icon: <Shield className="w-5 h-5" />, title: "Blockchain Certs", text: "On-chain certification creates a permanent, verifiable record of your item on Solana. Includes a downloadable certificate." },
            { icon: <Clock className="w-5 h-5" />, title: "Processing Time", text: "Stripe payments process instantly. Crypto payments depend on Solana network confirmation, typically under 30 seconds." },
            { icon: <MessageCircle className="w-5 h-5" />, title: "Disputes", text: "For disputes or issues with a transaction, contact us directly at ratchetkrewelabs@gmail.com. We will mediate fairly." },
          ].map((item) => (
            <div key={item.title} className="p-6 bg-[#161616] border border-[#C9A84C]/15">
              <div className="text-[#C9A84C] mb-3">{item.icon}</div>
              <h3 className="font-cinzel text-xs font-semibold tracking-[2px] text-[#C9A84C] uppercase mb-2">{item.title}</h3>
              <p className="text-[11px] text-[#C8BC98] leading-relaxed font-light">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Liability Disclaimer */}
        <div className="bg-red-950/20 border border-red-500/20 p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-cinzel tracking-[3px] text-red-300 uppercase mb-2">Important Disclaimers</h3>
              <ul className="space-y-2 text-[11px] text-red-300/70 leading-relaxed">
                <li>The Vault is a peer-to-peer marketplace platform only. We do not hold, custody, or manage any funds.</li>
                <li>All cryptocurrency transactions occur directly on the Solana blockchain between buyer and seller wallets.</li>
                <li>We are not liable for any lost funds, failed transactions, network delays, wallet errors, or smart contract issues.</li>
                <li>Blockchain transactions are irreversible. Verify all addresses before sending.</li>
                <li>Card payments are processed securely through Stripe. We never see or store your card details.</li>
                <li>Buyers and sellers transact at their own risk. We recommend using our on-chain certification for verification.</li>
                <li>For any issues, contact <a href="mailto:ratchetkrewelabs@gmail.com" className="text-[#C9A84C] hover:underline">ratchetkrewelabs@gmail.com</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center space-y-3">
          <Link to="/browse" className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#C9A84C] hover:text-[#E8CB7A] transition-colors">
            <ExternalLink className="w-3 h-3" /> Browse Listings
          </Link>
          <span className="text-[#8A6E2F] mx-4">|</span>
          <Link to="/appraisal" className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#C9A84C] hover:text-[#E8CB7A] transition-colors">
            <ExternalLink className="w-3 h-3" /> Get Appraisal
          </Link>
          <span className="text-[#8A6E2F] mx-4">|</span>
          <Link to="/sell" className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#C9A84C] hover:text-[#E8CB7A] transition-colors">
            <ExternalLink className="w-3 h-3" /> Sell an Item
          </Link>
        </div>
      </div>

      <FooterDisclaimer />
    </div>
  );
}
