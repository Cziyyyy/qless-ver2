'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface KioskTimerProps {
  inactivityLimitSeconds?: number;
}

export default function KioskInactivityTimer({ inactivityLimitSeconds = 30 }: KioskTimerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const resetStateAndHome = useCallback(() => {
    setShowPrompt(false);
    // Clear temporary local storage or state
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('kiosk_draft');
    }
    router.push('/kiosk');
  }, [router]);

  useEffect(() => {
    // Only activate inactivity timer on /kiosk subpages except /kiosk root home
    if (pathname === '/kiosk') {
      setShowPrompt(false);
      return;
    }

    let idleTimer: NodeJS.Timeout;

    const handleActivity = () => {
      if (!showPrompt) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          setShowPrompt(true);
          setCountdown(10);
        }, inactivityLimitSeconds * 1000);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    idleTimer = setTimeout(() => {
      setShowPrompt(true);
      setCountdown(10);
    }, inactivityLimitSeconds * 1000);

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };  }, [pathname, inactivityLimitSeconds, showPrompt]);

  // Countdown timer inside modal
  useEffect(() => {
    if (!showPrompt) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetStateAndHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showPrompt, resetStateAndHome]);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center border-4 border-mapua-gold">
        <div className="w-20 h-20 bg-mapua-gold/20 text-mapua-red rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-12 h-12" />
        </div>

        <h2 className="text-3xl font-extrabold text-mapua-black mb-3">Are you still there?</h2>
        <p className="text-gray-600 text-lg mb-6">
          Your kiosk session will reset to the home screen in{' '}
          <span className="font-extrabold text-mapua-red text-2xl">{countdown}</span> seconds for safety.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setShowPrompt(false);
              setCountdown(10);
            }}
            className="flex-1 kiosk-touch-target kiosk-btn bg-mapua-red hover:bg-mapua-red-dark text-white font-black text-xl rounded-2xl py-4 shadow-lg flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-6 h-6" />
            <span>CONTINUE</span>
          </button>

          <button
            onClick={resetStateAndHome}
            className="flex-1 kiosk-touch-target kiosk-btn bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg rounded-2xl py-4"
          >
            RETURN TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
