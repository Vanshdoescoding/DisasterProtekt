import { render, screen, waitFor } from '@testing-library/react';
import { HealthStatus } from './HealthStatus';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock API client
vi.mock('@/api/client', () => ({
    apiClient: {
        getHealthPipeline: vi.fn(),
        getHealthSimulation: vi.fn(),
        getHealthGemini: vi.fn(),
        getHealthStaleStreams: vi.fn(),
    }
}));

import { apiClient } from '@/api/client';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

function renderWithProviders(ui: React.ReactNode) {
    return render(
        <QueryClientProvider client={queryClient}>
            {ui}
        </QueryClientProvider>
    );
}

describe('HealthStatus', () => {
    it('renders health badges', async () => {
        (apiClient.getHealthPipeline as any).mockResolvedValue({ status: 'ok', warnings: [], details: {} });
        (apiClient.getHealthSimulation as any).mockResolvedValue({ status: 'degraded', warnings: ['Slow'], details: {} });
        (apiClient.getHealthGemini as any).mockResolvedValue({ status: 'down', warnings: [], details: {} });
        (apiClient.getHealthStaleStreams as any).mockResolvedValue({ status: 'ok', warnings: [], details: {} });

        renderWithProviders(<HealthStatus />);

        await waitFor(() => {
            expect(screen.getByText('PIPELINE')).toBeInTheDocument();
            expect(screen.getByText('SIM')).toBeInTheDocument();
            expect(screen.getByText('GEMINI')).toBeInTheDocument();
        });

        // Check for specific classes or attributes if possible, or just presence
        // Here we assume rendering succeeds if text is present.
        // We could test styles e.g. .text-red-600 for down, but that's brittle.
    });

    it('shows stale stream warning', async () => {
        (apiClient.getHealthStaleStreams as any).mockResolvedValue({
            status: 'degraded',
            warnings: ['Stream X is stale'],
            details: {}
        });

        renderWithProviders(<HealthStatus />);

        await waitFor(() => {
            expect(screen.getByText('Critical Stream Stale')).toBeInTheDocument();
            expect(screen.getByText('Stream X is stale')).toBeInTheDocument();
        });
    });
});
