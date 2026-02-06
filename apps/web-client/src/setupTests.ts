import '@testing-library/jest-dom';

class ResizeObserverMock {
    constructor(_callback: ResizeObserverCallback) {
        void _callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}
