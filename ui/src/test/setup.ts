import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;
  globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverMock;
}
