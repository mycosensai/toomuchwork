'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield, BookOpen, FileText, Mail, Heart, ExternalLink,
  AlertTriangle, Github,
} from 'lucide-react';

export function HelpPage() {
  const { activeView, completeOnboarding, setShowWelcome } = useStore();
  if (activeView !== 'help') return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Help & About</h1>
        <p className="mt-1 text-sm text-zinc-500">Learn about QuietFlow, your privacy, and how to get the most out of it.</p>
      </div>

      {/* About */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-emerald-500" /> About QuietFlow
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p className="mb-3">
            QuietFlow is a live traffic intelligence platform designed with one goal: 
            <strong> to help people with social anxiety, agoraphobia, or sensory sensitivities know when it&apos;s quiet enough to go outside.</strong>
          </p>
          <p className="mb-3">
            By aggregating public traffic cameras, density estimates, and community reports into a single color-coded interface,
            QuietFlow makes the decision to leave home less uncertain and more informed.
          </p>
          <p>
            Every design decision — from the calm greens to the gentle notification language — is evaluated against the question:
            <em> &ldquo;Does this reduce or increase the user&apos;s perceived risk of encountering heavy traffic or crowds?&rdquo;</em>
          </p>
        </CardContent>
      </Card>

      {/* How to use */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-blue-500" /> How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">1</span>
            <p><strong>Check the Map</strong> — Green roads and markers mean quiet. Red means busy. Tap any marker for details.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">2</span>
            <p><strong>Use Quiet Finder</strong> — Search for a place and see predicted quiet windows. The &ldquo;Leave Now&rdquo; score tells you if it&apos;s a good time.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">3</span>
            <p><strong>Save Your Places</strong> — Add your home, work, and favorite stores for personalized density insights.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">4</span>
            <p><strong>Enable Calm Mode</strong> — Toggle it in the sidebar for reduced visual noise, larger text, and gentler colors.</p>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="mb-4 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Important Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p className="mb-2">
            <strong>QuietFlow is an aid, not a guarantee.</strong> Density estimates are derived from
            public data sources, computer vision analysis, and community reports. They may not
            reflect real-time conditions accurately in all cases.
          </p>
          <p className="mb-2">
            Always use your own judgment when deciding whether to go out. QuietFlow is designed
            to <em>supplement</em> your intuition, not replace it.
          </p>
          <p>
            Data sources, refresh rates, and confidence levels are shown transparently so you
            can make informed decisions about how much to rely on the information presented.
          </p>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-violet-500" /> Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
          <p className="mb-2">
            QuietFlow only ingests cameras and data sources that are legally permissible for
            public or authorized viewing. All identifiable footage (faces, license plates)
            is automatically blurred before any frame is stored or displayed.
          </p>
          <p className="mb-2">
            Location data is stored locally and never shared. Community reports are anonymous
            by default. You can delete your data at any time.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => { completeOnboarding(); setShowWelcome(true); }}>
          <BookOpen className="mr-1.5 h-4 w-4" /> Show tutorial again
        </Button>
        <Button variant="outline" className="flex-1">
          <Mail className="mr-1.5 h-4 w-4" /> Contact support
        </Button>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-400">
        QuietFlow v0.1.0 · Built with Next.js, MapLibre, and ❤️
      </div>
    </div>
  );
}
