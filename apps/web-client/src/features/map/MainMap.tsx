import Map, { NavigationControl } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useMemo } from 'react';
import { useUIStore } from '@/store/uiStore';
import 'maplibre-gl/dist/maplibre-gl.css';

type H3Datum = { hex: string; value: number };
type PointDatum = { id: string; position: [number, number]; intensity: number };
type MapPickInfo = { coordinate: [number, number] | null; object?: unknown };

export interface MapSelection {
    coordinate: [number, number];
    label: string;
    source: 'map_click' | 'layer_pick';
}

const INITIAL_VIEW_STATE = {
    longitude: -112.074,
    latitude: 33.448,
    zoom: 11,
    pitch: 45,
    bearing: 0
};

const HEAT_DATA: H3Datum[] = [
    { hex: '892a3064c97ffff', value: 10 },
    { hex: '892a3064c93ffff', value: 50 },
    { hex: '892a3064c8bffff', value: 80 },
];

const FLOOD_POINTS: PointDatum[] = [
    { id: 'flood_1', position: [-112.091, 33.452], intensity: 0.7 },
    { id: 'flood_2', position: [-112.05, 33.44], intensity: 0.5 },
];

const POWER_POINTS: PointDatum[] = [
    { id: 'power_1', position: [-112.081, 33.455], intensity: 0.9 },
    { id: 'power_2', position: [-112.063, 33.46], intensity: 0.6 },
];

const TRAFFIC_POINTS: PointDatum[] = [
    { id: 'traffic_1', position: [-112.072, 33.446], intensity: 0.8 },
    { id: 'traffic_2', position: [-112.095, 33.442], intensity: 0.4 },
];

const toLabel = (coordinate: [number, number]) =>
    `Lat ${coordinate[1].toFixed(3)}, Lng ${coordinate[0].toFixed(3)}`;

export function MainMap({ onSelectLocation }: { onSelectLocation?: (selection: MapSelection) => void }) {
    const { mode, activeLayerIds } = useUIStore();

    const mapStyle = mode === 'ops'
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

    const layers = useMemo(() => ([
        new H3HexagonLayer({
            id: 'heat-layer',
            data: HEAT_DATA,
            pickable: true,
            wireframe: false,
            filled: true,
            extruded: false,
            getHexagon: (d: H3Datum) => d.hex,
            getFillColor: (d: H3Datum) => [255, (1 - d.value / 100) * 255, 0, 150],
            visible: activeLayerIds.includes('heat')
        }),
        new ScatterplotLayer({
            id: 'flood-layer',
            data: FLOOD_POINTS,
            pickable: true,
            getPosition: (d: PointDatum) => d.position,
            getRadius: (d: PointDatum) => 120 + d.intensity * 80,
            getFillColor: (d: PointDatum) => [0, 128, 255, 140 + d.intensity * 80],
            visible: activeLayerIds.includes('flood')
        }),
        new ScatterplotLayer({
            id: 'power-layer',
            data: POWER_POINTS,
            pickable: true,
            getPosition: (d: PointDatum) => d.position,
            getRadius: (d: PointDatum) => 110 + d.intensity * 70,
            getFillColor: (d: PointDatum) => [255, 200, 0, 140 + d.intensity * 80],
            visible: activeLayerIds.includes('power')
        }),
        new ScatterplotLayer({
            id: 'traffic-layer',
            data: TRAFFIC_POINTS,
            pickable: true,
            getPosition: (d: PointDatum) => d.position,
            getRadius: (d: PointDatum) => 90 + d.intensity * 60,
            getFillColor: (d: PointDatum) => [255, 120, 0, 140 + d.intensity * 80],
            visible: activeLayerIds.includes('traffic')
        })
    ]), [activeLayerIds]);

    const handleClick = (info: MapPickInfo) => {
        if (!info.coordinate || !onSelectLocation) return;
        const coordinate = info.coordinate as [number, number];
        const label = toLabel(coordinate);
        onSelectLocation({
            coordinate,
            label,
            source: info.object ? 'layer_pick' : 'map_click'
        });
    };

    return (
        <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller
            layers={layers}
            getTooltip={(info: MapPickInfo) => info.object && 'Hazard Signal'}
            onClick={handleClick}
        >
            <Map
                mapStyle={mapStyle}
                reuseMaps
                attributionControl={false}
            >
                <NavigationControl position="top-right" />
            </Map>
        </DeckGL>
    );
}
