import { useMemo, useState } from 'react';
import { MainMap, MapSelection } from './MainMap';
import { LayerToggles } from './LayerToggles';
import { TimeController } from './TimeController';
import { UncertaintyToggle } from './UncertaintyToggle';
import { StreetConsequencePanel, SelectedStreet } from './StreetConsequencePanel';
import { EvidencePanel } from '../governance/EvidencePanel';
import { ResourceTray } from '../ops/ResourceTray';
import { OpsDropZone } from '../ops/OpsDropZone';
import { BranchTimeline } from '../timeline/BranchTimeline';
import { useBranchStore } from '@/store/branchStore';
import { useTimelineStore } from '@/store/timelineStore';
import { validatePlacement } from '../ops/placementValidation';
import { OpPlacementDTO } from '@/services/api/types';
import { logClientEvent } from '@/shared/logger';
import clsx from 'clsx';
import { HealthStatus } from '../observability/HealthStatus';
import { DiffView } from '../audit/DiffView';

const DEFAULT_COORDINATE: [number, number] = [-112.074, 33.448];

interface PlacementFeedback {
    variant: 'valid' | 'invalid';
    message: string;
}

export function MapWorkspace() {
    const [selectedStreet, setSelectedStreet] = useState<SelectedStreet | null>(null);
    const [placementFeedback, setPlacementFeedback] = useState<PlacementFeedback | null>(null);

    const { createPlacement, activeBranchId, lastPlacementId } = useBranchStore();
    const { currentTick } = useTimelineStore();

    const handleMapClick = (selection: MapSelection) => {
        setSelectedStreet({
            id: selection.label,
            coordinate: selection.coordinate
        });
        logClientEvent({ type: 'street_select', locationId: selection.label, source: selection.source });
    };

    const dropCoordinate = selectedStreet?.coordinate ?? DEFAULT_COORDINATE;

    const handleDrop = (e: React.DragEvent) => {
        const resourceId = e.dataTransfer.getData('resource/id');
        if (!resourceId) return;

        const candidate = {
            type: resourceId as OpPlacementDTO['type'],
            location: { lat: dropCoordinate[1], lng: dropCoordinate[0] }
        };

        const validation = validatePlacement(candidate);
        if (!validation.valid) {
            setPlacementFeedback({ variant: 'invalid', message: validation.reason });
            logClientEvent({
                type: 'placement_event',
                placementId: 'invalid',
                resourceType: resourceId,
                branchId: activeBranchId,
                valid: false
            });
            return;
        }

        const placement: OpPlacementDTO = {
            id: `op_${Date.now()}`,
            type: candidate.type,
            location: candidate.location,
            timestamp: new Date().toISOString(),
            status: 'planned'
        };
        createPlacement(placement);
        setPlacementFeedback({ variant: 'valid', message: `Placement queued: ${candidate.type}` });
    };

    const layoutClass = clsx(
        'h-full w-full',
        selectedStreet ? 'grid grid-cols-[1fr_24rem] gap-4' : 'relative'
    );

    const feedbackStyle = useMemo(() => clsx(
        'text-xs px-3 py-2 rounded-md border shadow-sm',
        placementFeedback?.variant === 'valid'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
    ), [placementFeedback]);

    return (
        <div className={layoutClass}>
            <OpsDropZone onDrop={handleDrop}>
                <div className="relative h-full w-full">
                    <MainMap onSelectLocation={handleMapClick} />
                    <LayerToggles />
                    <ResourceTray />
                    <BranchTimeline />
                    <DiffView />
                    <HealthStatus />
                    <EvidencePanel />
                    <UncertaintyToggle />
                    <TimeController />

                    {placementFeedback && (
                        <div className="absolute bottom-28 right-4 z-20" role="status" aria-live="polite">
                            <div className={feedbackStyle}>{placementFeedback.message}</div>
                        </div>
                    )}
                </div>
            </OpsDropZone>

            {selectedStreet && (
                <div className="h-full pb-24 pr-4">
                    <StreetConsequencePanel
                        selectedStreet={selectedStreet}
                        branchId={activeBranchId}
                        simTick={currentTick}
                        placementId={lastPlacementId}
                        onClose={() => setSelectedStreet(null)}
                        className="h-full"
                    />
                </div>
            )}
        </div>
    );
}
