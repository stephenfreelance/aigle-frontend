import { MapLayer } from '@/models/map-layer';
import { MapSettings } from '@/models/map-settings';
import { create } from 'zustand';

interface MapState {
    layers?: MapLayer[];

    setMapSettings: (settings: MapSettings) => void;
    getDisplayedTileSetUrls: () => string[];
    hideTileSet: (uuid: string) => void;
}

const useMap = create<MapState>()((set, get) => ({
    setMapSettings: (settings: MapSettings) => {
        set(() => ({
            layers: settings.tileSets.map((tileSet) => ({
                tileSet,
                displayed: true,
            })),
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
}));

export { useMap };
