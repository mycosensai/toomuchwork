"use client";

import { useState } from "react";

export function VoiceCommand({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [listening, setListening] = useState(false);

  const toggle = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      onCommand("voice-not-supported");
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onCommand(text);
    };

    if (listening) recognition.stop();
    else recognition.start();
  };

  return (
    <button
      onClick={toggle}
      className={`rounded-full p-2 transition ${listening ? "bg-red-500/20 text-red-400" : "bg-dark-800 text-gold-400 hover:bg-dark-700"}`}
      title="Voice command"
    >
      <span className="text-xs">{listening ? "Listening..." : "🎤"}</span>
    </button>
  );
}
