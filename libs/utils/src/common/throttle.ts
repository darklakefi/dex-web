import { funnel } from "remeda";

export function throttle<F extends (...args: unknown[]) => unknown>(
  func: F,
  wait = 0,
) {
  return funnel(func, {
    minGapMs: wait,
    triggerAt: "start",
  });
}
