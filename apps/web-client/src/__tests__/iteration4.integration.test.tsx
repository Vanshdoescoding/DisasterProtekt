import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from '@/app/Layout';
import { MapWorkspace } from '@/features/map/MapWorkspace';
import { branchStoreDefaults, useBranchStore } from '@/store/branchStore';
import { timelineStoreDefaults, useTimelineStore } from '@/store/timelineStore';
import { uiStoreDefaults, useUIStore } from '@/store/uiStore';

vi.mock('react-map-gl/maplibre', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <div data-testid="map">{children}</div>,
    NavigationControl: () => <div data-testid="nav" />
}));

vi.mock('@deck.gl/react', () => ({
    __esModule: true,
    default: ({ children, onClick }: { children: ReactNode; onClick: (info: { coordinate: [number, number]; object?: Record<string, unknown> }) => void }) => (
        <div
            data-testid="deck"
            onClick={() => onClick({ coordinate: [-112.074, 33.448], object: { id: 'heat' } })}
        >
            {children}
        </div>
    )
}));

vi.mock('@deck.gl/geo-layers', () => ({
    __esModule: true,
    H3HexagonLayer: class MockLayer { constructor() { } }
}));

vi.mock('@deck.gl/layers', () => ({
    __esModule: true,
    ScatterplotLayer: class MockLayer { constructor() { } }
}));

describe('Iteration 4 integrations', () => {
    beforeEach(() => {
        useBranchStore.setState(branchStoreDefaults);
        useTimelineStore.setState(timelineStoreDefaults);
        useUIStore.setState(uiStoreDefaults);
    });

    it('toggles ops/briefing mode without crashing', () => {
        render(
            <MemoryRouter initialEntries={['/ops']}>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/ops" element={<div data-testid="content" />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Ops Mode')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /toggle ops or briefing mode/i }));
        expect(screen.getByText('Briefing Mode')).toBeInTheDocument();
    });

    it('opens consequence panel on map click', () => {
        render(<MapWorkspace />);
        fireEvent.click(screen.getByTestId('deck'));
        expect(screen.getByText('STREET CONSEQUENCE')).toBeInTheDocument();
    });

    it('dispatches placement on drop', () => {
        render(<MapWorkspace />);
        const dropZone = screen.getByLabelText('Ops drop zone');

        const dataTransfer = {
            data: {} as Record<string, string>,
            setData(key: string, value: string) { this.data[key] = value; },
            getData(key: string) { return this.data[key]; },
            effectAllowed: '',
            dropEffect: ''
        };

        dataTransfer.setData('resource/id', 'fire');

        fireEvent.dragOver(dropZone, { dataTransfer });
        fireEvent.drop(dropZone, { dataTransfer });

        const { events, activeBranchId } = useBranchStore.getState();
        expect(events[activeBranchId]?.length).toBeGreaterThan(0);
    });

    it('auto-triggers clip load on timeline change', async () => {
        vi.useFakeTimers();
        render(<MapWorkspace />);

        fireEvent.click(screen.getByTestId('deck'));
        expect(screen.getByText(/Locating footage/i)).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(800);
        });
        expect(screen.getByText(/ANALYZING/i)).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(2200);
        });
        expect(screen.getByText(/LIVE/i)).toBeInTheDocument();

        act(() => {
            useTimelineStore.setState({ currentTick: 5 });
        });
        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(screen.getByText(/Locating footage/i)).toBeInTheDocument();
        vi.useRealTimers();
    });
});
