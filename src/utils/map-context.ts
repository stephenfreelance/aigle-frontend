import { detectionControlStatuses, detectionValidationStatuses } from '@/models/detection';
import { DetectionFilter } from '@/models/detection-filter';
import { GeoCustomZoneGeojsonData } from '@/models/geo/geo-custom-zone';
import { MapGeoCustomZoneLayer, MapTileSetLayer } from '@/models/map-layer';
import { MapSettings } from '@/models/map-settings';
import { ObjectType } from '@/models/object-type';
import { TileSet, TileSetStatus, TileSetType } from '@/models/tile-set';
import EventEmitter from 'eventemitter3';
import { create } from 'zustand';

const getInitialLayers = (settings: MapSettings) => {
    const layers: MapTileSetLayer[] = [];
    let backgroundSet = false;

    settings.tileSetSettings.forEach(({ tileSet, geometry }) => {
        let displayed = false;

        if (tileSet.tileSetType !== 'BACKGROUND') {
            displayed = tileSet.tileSetStatus === 'VISIBLE';
        } else {
            displayed = !backgroundSet;
            backgroundSet = true;
        }

        layers.push({
            tileSet: { ...tileSet, geometry },
            displayed,
        });
    });

    return layers;
};

type MapEventType = 'UPDATE_DETECTIONS' | 'JUMP_TO' | 'DISPLAY_PARCEL';

interface MapState {
    layers?: MapTileSetLayer[];
    customZoneLayers?: MapGeoCustomZoneLayer[];
    objectTypes?: ObjectType[];
    detectionFilter?: DetectionFilter;
    settings?: MapSettings;
    geoCustomZoneUuidGeoCustomZoneGeojsonDataMap: Record<string, GeoCustomZoneGeojsonData>;
    geoCustomZonesGeojsonLoading: string[];
    userLastPosition?: GeoJSON.Position | null;

    setGeoCustomZoneGeojsonLoading: (geoCustomZoneUuid: string, loading: boolean) => void;
    setGeoCustomZoneGeojson: (geoCustomZoneGeojson: GeoCustomZoneGeojsonData) => void;
    setMapSettings: (settings: MapSettings) => void;
    resetLayers: () => void;
    updateDetectionFilter: (detectionFilter: DetectionFilter) => void;
    getDisplayedTileSetUrls: () => string[];
    setTileSetVisibility: (uuid: string, visible: boolean) => void;
    setCustomZoneVisibility: (uuid: string, visible: boolean) => void;
    getTileSets: (tileSetTypes: TileSetType[], tileSetStatuses: TileSetStatus[]) => TileSet[];
    eventEmitter: EventEmitter<MapEventType>;
}

const useMap = create<MapState>()((set, get) => ({
    setGeoCustomZoneGeojson: (geoCustomZoneGeojson: GeoCustomZoneGeojsonData) => {
        set(() => ({
            geoCustomZoneUuidGeoCustomZoneGeojsonDataMap: {
                ...get().geoCustomZoneUuidGeoCustomZoneGeojsonDataMap,
                [geoCustomZoneGeojson.properties.uuid]: geoCustomZoneGeojson,
            },
        }));
        get().setGeoCustomZoneGeojsonLoading(geoCustomZoneGeojson.properties.uuid, false);
    },
    geoCustomZonesGeojsonLoading: [],
    setGeoCustomZoneGeojsonLoading: (geoCustomZoneUuid: string, loading: boolean) => {
        set((state) => {
            let geoCustomZonesGeojsonLoading: string[];

            if (loading) {
                geoCustomZonesGeojsonLoading = Array.from(
                    new Set([...state.geoCustomZonesGeojsonLoading, geoCustomZoneUuid]),
                );
            } else {
                geoCustomZonesGeojsonLoading = state.geoCustomZonesGeojsonLoading.filter(
                    (uuid) => uuid !== geoCustomZoneUuid,
                );
            }

            return {
                geoCustomZonesGeojsonLoading,
            };
        });
    },
    setMapSettings: (settings: MapSettings) => {
        const allObjectTypes: ObjectType[] = [];
        const objectTypesUuids = new Set<string>();

        settings.objectTypeSettings.forEach(({ objectType, objectTypeCategoryObjectTypeStatus }) => {
            if (objectTypesUuids.has(objectType.uuid)) {
                return;
            }

            allObjectTypes.push(objectType);

            if (objectTypeCategoryObjectTypeStatus === 'VISIBLE') {
                objectTypesUuids.add(objectType.uuid);
            }
        });

        const layers = getInitialLayers(settings);

        set(() => ({
            settings,
            layers,
            customZoneLayers: settings.geoCustomZones.map((geoCustomZone) => ({
                geoCustomZone,
                displayed: false,
            })),
            objectTypes: allObjectTypes,
            detectionFilter: {
                objectTypesUuids: Array.from(objectTypesUuids),
                detectionValidationStatuses: [...detectionValidationStatuses],
                detectionControlStatuses: [...detectionControlStatuses],
                score: 0.6,
                prescripted: null,
                customZonesUuids: settings.geoCustomZones.map(({ uuid }) => uuid),
            },
            userLastPosition: settings.userLastPosition,
        }));
    },
    resetLayers: () => {
        const settings = get().settings;

        if (!settings) {
            return;
        }

        const layers = getInitialLayers(settings);

        set(() => ({
            layers,
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

            if (state.layers[layerIndex].tileSet.tileSetType === 'BACKGROUND' && !visible) {
                throw new Error('Cannot hide background layer');
            }

            // only one background can be displayed at once
            if (state.layers[layerIndex].tileSet.tileSetType === 'BACKGROUND') {
                state.layers.forEach((layer) => {
                    if (layer.tileSet.tileSetType === 'BACKGROUND' && layer.tileSet.uuid !== uuid) {
                        layer.displayed = false;
                    }
                });
            }

            return {
                layers: state.layers,
            };
        });
    },
    setCustomZoneVisibility: (uuid: string, visible: boolean) => {
        set((state) => {
            if (!state.customZoneLayers) {
                return {};
            }

            const layerIndex = state.customZoneLayers.findIndex((layer) => layer.geoCustomZone.uuid === uuid);

            if (layerIndex === -1) {
                return {};
            }

            state.customZoneLayers[layerIndex].displayed = visible;

            return {
                customZoneLayers: state.customZoneLayers,
            };
        });
    },
    getTileSets: (tileSetTypes: TileSetType[], tileSetStatuses: TileSetStatus[]) => {
        return (get().layers || [])
            .filter(
                (layer) =>
                    tileSetTypes.includes(layer.tileSet.tileSetType) &&
                    tileSetStatuses.includes(layer.tileSet.tileSetStatus),
            )
            .map((layer) => layer.tileSet);
    },
    geoCustomZoneUuidGeoCustomZoneGeojsonDataMap: {},
    eventEmitter: new EventEmitter<MapEventType>(),
}));

export { useMap };
