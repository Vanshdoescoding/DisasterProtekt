import { useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';

// In a real implementation this would hold drop logic and deck.gl overlay integration
// For now, we will use it to catch the drop event on the map container
export function OpsDropZone({ children, onDrop }: { children: React.ReactNode; onDrop: (e: React.DragEvent) => void }) {
    const { mode } = useUIStore();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (mode !== 'ops') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, [mode]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (mode !== 'ops') return;
        e.preventDefault();
        onDrop(e);
    }, [mode, onDrop]);

    return (
        <div
            className="w-full h-full relative"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            aria-label="Ops drop zone"
        >
            {children}
        </div>
    );
}
