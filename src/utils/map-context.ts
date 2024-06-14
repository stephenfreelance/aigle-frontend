import { DetectionFilter } from '@/models/detection-filter';
import { MapLayer } from '@/models/map-layer';
import { MapSettings } from '@/models/map-settings';
import { ObjectType } from '@/models/object-type';
import EventEmitter from 'eventemitter3';
import { create } from 'zustand';

type MapEventType = 'UPDATE_DETECTIONS';

interface MapState {
    layers?: MapLayer[];
    objectTypes?: ObjectType[];
    detectionFilter?: DetectionFilter;

    setMapSettings: (settings: MapSettings) => void;
    updateDetectionFilter: (detectionFilter: DetectionFilter) => void;
    getDisplayedTileSetUrls: () => string[];
    setTileSetVisibility: (uuid: string, visible: boolean) => void;
    eventEmitter: EventEmitter<MapEventType>;
}

const useMap = create<MapState>()((set, get) => ({
    setMapSettings: (settings: MapSettings) => {
        set(() => ({
            layers: settings.tileSets.map((tileSet) => ({
                tileSet,
                displayed: true,
            })),
            objectTypes: settings.objectTypes,
            detectionFilter: {
                objectTypesUuids: settings.objectTypes.map((type) => type.uuid),
            },
        }));
    },
    updateDetectionFilter: (detectionFilter: DetectionFilter) => {
        set((state) => ({
            detectionFilter: {
                ...state.detectionFilter,
                ...detectionFilter,
            },
        }));
    },
    getDisplayedTileSetUrls: () => {
        return (get().layers || []).filter((layer) => layer.displayed).map((layer) => layer.tileSet.url);
    },
    setTileSetVisibility: (uuid: string, visible: boolean) => {
        set((state) => {
            if (!state.layers) {
                return {};
            }

            const layerIndex = state.layers.findIndex((layer) => layer.tileSet.uuid === uuid);

            if (layerIndex === -1) {
                return {};
            }

            state.layers[layerIndex].displayed = visible;
            return {
                layers: state.layers,
            };
        });
    },
    eventEmitter: new EventEmitter<MapEventType>(),
}));

export { useMap };
