import { MapLayer } from '@/models/map-layer';
import { MapSettings } from '@/models/map-settings';
import { ObjectType } from '@/models/object-type';
import EventEmitter from 'eventemitter3';
import { create } from 'zustand';

type MapEventType = 'UPDATE_DETECTIONS';

interface MapState {
    layers?: MapLayer[];
    objectTypes?: ObjectType[];

    setMapSettings: (settings: MapSettings) => void;
    getDisplayedTileSetUrls: () => string[];
    hideTileSet: (uuid: string) => void;
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
        }));
    },
    getDisplayedTileSetUrls: () => {
        return (get().layers || []).filter((layer) => layer.displayed).map((layer) => layer.tileSet.url);
    },
    hideTileSet: (uuid: string) => {
        set((state) => {
            if (!state.layers) {
                return {};
            }

            const layerIndex = state.layers.findIndex((layer) => layer.tileSet.uuid === uuid);

            if (layerIndex === -1) {
                return {};
            }

            state.layers[layerIndex].displayed = true;
            return {
                layers: state.layers,
            };
        });
    },
    eventEmitter: new EventEmitter<MapEventType>(),
}));

export { useMap };
