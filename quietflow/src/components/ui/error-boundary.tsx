'use client';

import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/cn';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in development; in production, send to error monitoring
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Something went wrong</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-3 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}