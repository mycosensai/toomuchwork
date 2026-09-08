'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const steps = [
  {
    title: 'Welcome to QuietFlow',
    description: 'CTOS://LIVE_INTELLIGENCE — Real-time traffic density, live cameras, and quiet-window finder for stress-free errands.',
    color: 'text-cyan-400',
  },
  {
    title: 'Density Map',
    description: 'The map shows real-time traffic and crowd density. Green means quiet, red means busy. Tap any camera or business for details.',
    color: 'text-blue-400',
  },
  {
    title: 'Quiet Finder',
    description: 'Search for any grocery, pharmacy, or coffee shop. We\'ll show you the best quiet windows to visit — and give you a "Leave Now" score.',
    color: 'text-violet-400',
  },
  {
    title: 'Minimal Interface',
    description: 'Everything is contained in the launcher. Open the app grid to access all features. Calm mode available for reduced visual noise.',
    color: 'text-emerald-400',
  },
];

export function WelcomeModal() {
  const { showWelcome, completeOnboarding, skipOnboarding, onboarding, nextOnboardingStep } = useStore();
  if (!showWelcome && onboarding.completed) return null;

  const step = steps[onboarding.currentStep] || steps[0];
  const isLast = onboarding.currentStep >= steps.length - 1;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="border-cyan-500/20 bg-cyber-bg-card/80 shadow-[0_0_40px_rgba(0,240,255,0.15)]">
        <CardContent className="p-8">
          {/* Minimal logo — just a glyph */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <span className="text-xl font-bold text-cyan-400">◉</span>
            </div>
          </div>

          <h3 className={`mb-3 text-center text-lg font-bold ${step.color}`}>{step.title}</h3>
          <p className="mb-6 text-center text-sm text-zinc-400 max-w-sm">{step.description}</p>

          {/* Step indicators */}
          <div className="mb-6 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  i === onboarding.currentStep ? 'bg-cyan-400' : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {isLast ? (
              <Button
                className="flex-1 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                onClick={completeOnboarding}
              >
                Enter CTOS <Sparkles className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="flex-1 border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                onClick={nextOnboardingStep}
              >
                Next →
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={skipOnboarding}
              className="text-zinc-500 hover:text-cyan-400"
            >
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
