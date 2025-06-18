import { funnel } from "remeda";

export function debounce<F extends (...args: unknown[]) => void>(
  func: F,
  wait = 0,
  {
    leading = false,
    trailing = true,
    maxWait,
  }: {
    readonly leading?: boolean;
    readonly trailing?: boolean;
    readonly maxWait?: number;
  } = {},
) {
  const {
    call,
    isIdle: _isIdle,
    ...rest
  } = funnel(
    () => {
      if (leading || trailing) {
        func();
      }
    },
    {
      minQuietPeriodMs: wait,
      ...(maxWait !== undefined && { maxBurstDurationMs: maxWait }),
      triggerAt: trailing ? (leading ? "both" : "start") : "start",
    },
  );
  return Object.assign(call, rest);
}
