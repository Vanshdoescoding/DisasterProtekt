import { render, screen, waitFor } from '@testing-library/react';
import { BranchTimeline } from './BranchTimeline';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBranchStore } from '@/store/branchStore';

// Mock API and Store
vi.mock('@/api/client', () => ({
    apiClient: {
        getAuditTimeline: vi.fn(),
    }
}));
import { apiClient } from '@/api/client';

// Mock Store
vi.mock('@/store/branchStore', () => ({
    useBranchStore: vi.fn(),
}));

const queryClient = new QueryClient();

function renderWithProviders(ui: React.ReactNode) {
    return render(
        <QueryClientProvider client={queryClient}>
            {ui}
        </QueryClientProvider>
    );
}

describe('BranchTimeline Audit', () => {
    it('renders audit events', async () => {
        // Setup Store Mock
        (useBranchStore as any).mockReturnValue({
            activeBranchId: 'branch_1',
            branches: {
                baseline: { id: 'baseline', name: 'Baseline', isBaseline: true },
                branch_1: { id: 'branch_1', name: 'Test Branch', isBaseline: false }
            },
            events: {},
            setActiveBranch: vi.fn(),
            runId: 'run_123'
        });

        // Setup API Mock
        const mockEvents = {
            run_id: 'run_123',
            entries: [
                { category: 'DECISION', occurred_at: new Date().toISOString(), object_id: '1', summary: 'Values applied' },
                { category: 'SYSTEM', occurred_at: new Date().toISOString(), object_id: '2', summary: 'Simulation started' }
            ]
        };
        (apiClient.getAuditTimeline as any).mockResolvedValue(mockEvents);

        renderWithProviders(<BranchTimeline />);

        await waitFor(() => {
            expect(screen.getByText('Values applied')).toBeInTheDocument();
            expect(screen.getByText('Simulation started')).toBeInTheDocument();
        });
    });

    it('handles empty state', async () => {
        // Setup Store Mock
        (useBranchStore as any).mockReturnValue({
            activeBranchId: 'branch_1',
            branches: {
                baseline: { id: 'baseline', name: 'Baseline', isBaseline: true },
                branch_1: { id: 'branch_1', name: 'Test Branch', isBaseline: false }
            },
            events: {},
            runId: 'run_123'
        });

        (apiClient.getAuditTimeline as any).mockResolvedValue({ entries: [] });

        renderWithProviders(<BranchTimeline />);

        await waitFor(() => {
            expect(screen.getByText('No events recorded')).toBeInTheDocument();
        });
    });
});
