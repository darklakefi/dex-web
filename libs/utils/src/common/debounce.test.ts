import { describe, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  it("should debounce a function", () => {
    vi.useFakeTimers();
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(1);
    debouncedFunc(2);
    debouncedFunc(3);

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledOnce();
    expect(func).toHaveBeenCalledWith(3);

    debouncedFunc.flush();
    expect(func).toHaveBeenCalledWith(3);

    debouncedFunc.cancel();
    debouncedFunc(4);

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenCalledWith(4);
  });
});
