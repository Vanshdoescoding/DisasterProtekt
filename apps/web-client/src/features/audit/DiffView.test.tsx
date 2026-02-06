import { render, screen, waitFor } from '@testing-library/react';
import { DiffView } from './DiffView';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBranchStore } from '@/store/branchStore';

// Mock API
vi.mock('@/api/client', () => ({
    apiClient: {
        getBranchDiff: vi.fn(),
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

describe('DiffView', () => {
    it('does not render on baseline', () => {
        (useBranchStore as any).mockReturnValue({
            activeBranchId: 'baseline',
            runId: 'run_1'
        });

        const { container } = renderWithProviders(<DiffView />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders diff metrics on branch', async () => {
        (useBranchStore as any).mockReturnValue({
            activeBranchId: 'branch_2',
            runId: 'run_1'
        });

        (apiClient.getBranchDiff as any).mockResolvedValue({
            baseline_branch_id: 'baseline',
            compare_branch_id: 'branch_2',
            baseline_event_count: 50,
            compare_event_count: 55,
            delta_event_count: 5
        });

        renderWithProviders(<DiffView />);

        await waitFor(() => {
            expect(screen.getByText('Branch Compare')).toBeInTheDocument(); // Header if I added one, or "Branch events"
            // My DiffView has "BRANCH DIFF" as label
            expect(screen.getByText('Branch Diff')).toBeInTheDocument();
            expect(screen.getByText('55')).toBeInTheDocument(); // Count
            expect(screen.getByText('5')).toBeInTheDocument();  // Delta
        });
    });
});
