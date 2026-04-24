import { useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Tracks user inactivity and fires callbacks when the session should warn / expire.
 *
 * @param {object} opts
 * @param {boolean}  opts.enabled         - Only active when a user is logged in.
 * @param {number}   opts.idleMs          - Idle time before warning (default 30 min).
 * @param {number}   opts.warnSecs        - Seconds to count down in warning (default 60).
 * @param {Function} opts.onWarn          - Called when idle threshold is crossed.
 * @param {Function} opts.onCountdown     - Called every second with remaining seconds.
 * @param {Function} opts.onTimeout       - Called when countdown reaches 0.
 */
export function useSessionTimeout({
  enabled,
  idleMs   = 30 * 60 * 1000,
  warnSecs = 60,
  onWarn,
  onCountdown,
  onTimeout,
}) {
  const idleTimer       = useRef(null);
  const countdownTimer  = useRef(null);
  const remainingRef    = useRef(warnSecs);
  const isWarningRef    = useRef(false);

  // Keep callbacks in refs so timers never go stale
  const onWarnRef      = useRef(onWarn);
  const onCountdownRef = useRef(onCountdown);
  const onTimeoutRef   = useRef(onTimeout);
  useEffect(() => { onWarnRef.current      = onWarn;      }, [onWarn]);
  useEffect(() => { onCountdownRef.current = onCountdown; }, [onCountdown]);
  useEffect(() => { onTimeoutRef.current   = onTimeout;   }, [onTimeout]);

  const clearAll = useCallback(() => {
    clearTimeout(idleTimer.current);
    clearInterval(countdownTimer.current);
  }, []);

  // Start the warning countdown (called once when idle threshold fires)
  const startCountdown = useCallback(() => {
    isWarningRef.current = true;
    remainingRef.current = warnSecs;
    onWarnRef.current?.();

    clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      remainingRef.current -= 1;
      onCountdownRef.current?.(remainingRef.current);
      if (remainingRef.current <= 0) {
        clearInterval(countdownTimer.current);
        onTimeoutRef.current?.();
      }
    }, 1000);
  }, [warnSecs]);

  // (Re)start the idle timer — called on each user activity
  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(startCountdown, idleMs);
  }, [idleMs, startCountdown]);

  // Allow the parent to dismiss the warning and restart idle tracking
  const continueSession = useCallback(() => {
    clearAll();
    isWarningRef.current = false;
    remainingRef.current = warnSecs;
    resetIdleTimer();
  }, [clearAll, warnSecs, resetIdleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearAll();
      isWarningRef.current = false;
      return;
    }

    const handleActivity = () => {
      if (isWarningRef.current) return; // don't reset while warning is visible
      resetIdleTimer();
    };

    ACTIVITY_EVENTS.forEach(e =>
      window.addEventListener(e, handleActivity, { passive: true })
    );
    resetIdleTimer(); // kick off on mount

    return () => {
      clearAll();
      ACTIVITY_EVENTS.forEach(e =>
        window.removeEventListener(e, handleActivity)
      );
    };
  }, [enabled, resetIdleTimer, clearAll]);

  return { continueSession };
}
