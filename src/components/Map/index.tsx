import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Map, { GeolocateControl, Layer, Source, ViewStateChangeEvent } from 'react-map-gl';

import {
    DETECTION_OBJECT_LIST_ENDPOINT,
    GET_ANNOTATION_GRID_ENDPOINT,
    GET_CUSTOM_GEOMETRY_ENDPOINT,
    getDetectionListEndpoint,
} from '@/api-endpoints';
import DetectionDetail from '@/components/DetectionDetail';
import MapAddAnnotationModal from '@/components/Map/MapAddAnnotationModal';
import MapEditMultipleDetectionsModal from '@/components/Map/MapEditMultipleDetectionsModal';
import MapControlBackgroundSlider from '@/components/Map/controls/MapControlBackgroundSlider';
import MapControlFilterDetection from '@/components/Map/controls/MapControlFilterDetection';
import MapControlLayerDisplay from '@/components/Map/controls/MapControlLayerDisplay';
import MapControlLegend from '@/components/Map/controls/MapControlLegend';
import MapControlPartialToggle from '@/components/Map/controls/MapControlPartialToggle';
import MapControlSearchParcel from '@/components/Map/controls/MapControlSearchParcel';
import { processDetections } from '@/components/Map/utils/process-detections';
import SignalementPDFData from '@/components/signalement-pdf/SignalementPDFData';
import { DetectionGeojsonData, DetectionProperties } from '@/models/detection';
import { ObjectsFilter } from '@/models/detection-filter';
import { DetectionObjectDetail } from '@/models/detection-object';
import { GeoCustomZoneGeojsonData } from '@/models/geo/geo-custom-zone';
import { MapTileSetLayer } from '@/models/map-layer';
import api from '@/utils/api';
import { MAPBOX_TOKEN, PARCEL_COLOR } from '@/utils/constants';
import { useMap } from '@/utils/context/map-context';
import { LoadingOverlay, Loader as MantineLoader, Progress } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { bbox, bboxPolygon, booleanIntersects, centroid, feature, getCoord } from '@turf/turf';
import { FeatureCollection, Geometry, Polygon } from 'geojson';
import mapboxgl from 'mapbox-gl';
import DrawRectangle, { DrawStyles } from 'mapbox-gl-draw-rectangle-restrict-area';
import classes from './index.module.scss';

const ZOOM_LIMIT_TO_DISPLAY_DETECTIONS = 9;
const ZOOM_LIMIT_TO_DISPLAY_ANNOTATION_GRID = 13;
const MAP_INITIAL_VIEW_STATE_DEFAULT = {
    longitude: 3.95657,
    latitude: 43.61951,
    zoom: 16,
} as const;

const DRAW_MODE_ADD_DETECTION = 'draw_rectangle'; // draw new detection
const DRAW_MODE_MULTIPOLYGON = 'draw_polygon'; // edit multiple detections and download multiple detections

const MAPBOX_DRAW_CONTROL = new MapboxDraw({
    userProperties: true,
    displayControlsDefault: false,
    styles: DrawStyles,
    modes: Object.assign(MapboxDraw.modes, {
        [DRAW_MODE_ADD_DETECTION]: DrawRectangle,
    }),
    controls: {
        point: true, // draw new detection
        polygon: true, // edit multiple detections
        line_string: true, // download multiple detections
    },
});
const MAPBOX_GEOCODER = new MapboxGeocoder({
    accessToken: MAPBOX_TOKEN,
    mapboxgl: mapboxgl,
    placeholder: 'Rechercher par adresse',
});
const MAP_CONTROLS: {
    control: mapboxgl.Control | mapboxgl.IControl;
    position: 'top-left' | 'bottom-right' | 'top-right' | 'bottom-left';
    hideWhenNoDetection?: boolean;
    needsWritePermission?: boolean;
}[] = [
    // search bar
    {
        control: MAPBOX_GEOCODER,
        position: 'top-left',
    },
    // scale
    {
        control: new mapboxgl.ScaleControl(),
        position: 'bottom-right',
    },
    // full screen
    { control: new mapboxgl.FullscreenControl(), position: 'bottom-right' },
    // zoom
    {
        control: new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
        }),
        position: 'bottom-right',
    },
    // draw control: multiple selection and manually add detection
    {
        control: MAPBOX_DRAW_CONTROL,
        position: 'top-right',
        hideWhenNoDetection: true,
    },
] as const;

const getSourceId = (layer: MapTileSetLayer) => `source-${layer.tileSet.uuid}`;
const getLayerId = (layer: MapTileSetLayer) => `layer-${layer.tileSet.uuid}`;

const DETECTION_ENDPOINT = getDetectionListEndpoint();

const GEOJSON_CUSTOM_ZONES_LAYER_ID = 'custom-zones-geojson-layer';
const GEOJSON_CUSTOM_ZONES_LAYER_OUTLINE_ID = 'custom-zones-geojson-layer-outline';
const GEOJSON_DETECTIONS_LAYER_ID = 'detections-geojson-layer';
const GEOJSON_DETECTIONS_LAYER_OUTLINE_ID = 'detections-geojson-layer-outline';
const GEOJSON_LAYER_EXTRA_ID = 'geojson-layer-data-extra';
const GEOJSON_LAYER_EXTRA_BOUNDINGS_ID = 'geojson-layer-data-extra-boundings';
const GEOJSON_PARCEL_LAYER_ID = 'parcel-geojson-layer';
const GEOJSON_ANNOTATION_GRID_LAYER_ID = 'annotation-grid-geojson-layer';
const GEOJSON_ANNOTATION_GRID_LABEL_LAYER_ID = 'annotation-grid-label-geojson-layer';

const GEOJSON_LAYER_EXTRA_COLOR = '#FF0000';

const MULTIPLE_SELECTION_MAX = 30;

type LeftSection = 'SEARCH_ADDRESS' | 'FILTER_DETECTION' | 'LEGEND' | 'LAYER_DISPLAY' | 'SEARCH_PARCEL';

const EMPTY_GEOJSON_FEATURE_COLLECTION: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
} as const;

interface MapBounds {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
}

type DrawMode = 'MULTIPLE_EDIT' | 'ADD_DETECTION' | 'MULTIPLE_DOWNLOAD';
const DRAW_MODE_TITLES_MAP: Record<DrawMode, string> = {
    MULTIPLE_EDIT: 'Edition multiple',
    ADD_DETECTION: 'Dessiner un objet',
    MULTIPLE_DOWNLOAD: 'Téléchargement multiple de rapports',
};

const getAnnotationGridFilters = (objectsFilter: ObjectsFilter) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { detectionValidationStatuses, ...annotationFilter } = objectsFilter;
    return annotationFilter;
};

interface ComponentProps {
    layers: MapTileSetLayer[];
    displayDetections?: boolean;
    displayLayersGeometry?: boolean;
    fitBoundsFirstLayer?: boolean;
    displayTileSetControls?: boolean;
    displayDrawControl?: boolean;
    skipProcessDetections?: boolean;
    displayLayersSelection?: boolean;
    boundLayers?: boolean;
    initialPosition?: GeoJSON.Position | null;
}

const Component: React.FC<ComponentProps> = ({
    layers,
    displayLayersGeometry,
    fitBoundsFirstLayer = false,
    displayTileSetControls = true,
    displayDetections = true,
    boundLayers = true,
    skipProcessDetections = false,
    displayLayersSelection = true,
    initialPosition,
}) => {
    const [mapBounds, setMapBounds] = useState<MapBounds>();
    const [detectionDetailsShowed, setDetectionDetailsShowed] = useState<{
        detectionObjectUuid: string;
        detectionUuid: string;
    } | null>(null);
    const [leftSectionShowed, setLeftSectionShowed] = useState<LeftSection>();
    const [drawMode, setDrawMode] = useState<DrawMode | null>(null);

    const [parcelPolygonDisplayed, setParcelPolygonDisplayed] = useState<Polygon>();

    const [addAnnotationPolygon, setAddAnnotationPolygon] = useState<Polygon>();
    const [multipleEditDetectionsUuids, setMultipleEditDetectionsUuids] = useState<string[] | undefined>(undefined);

    const {
        eventEmitter,
        objectsFilter,
        getTileSetsUuids,
        setTileSetsVisibility,
        settings,
        customZoneLayers,
        annotationLayerVisible,
    } = useMap();

    const [cursor, setCursor] = useState<string>();
    const [mapRef, setMapRef] = useState<mapboxgl.Map>();

    const [detectionObjectsToDownload, setDetectionObjectsToDownload] = useState<DetectionObjectDetail[]>();
    const [detectionObjectsNbrToDownloadProcessed, setDetectionObjectsNbrToDownloadProcessed] = useState(0);

    const customZoneLayersDisplayedUuids = (customZoneLayers || [])
        .filter(({ displayed }) => displayed)
        .map(({ geoCustomZone }) => geoCustomZone.uuid);

    // we get detections for all the layers available for the user, even if they are not displayed
    const tileSetsUuidsDetection = useMemo(
        () =>
            layers
                .filter(
                    (layer) =>
                        ['BACKGROUND', 'PARTIAL'].includes(layer.tileSet.tileSetType) &&
                        ['VISIBLE', 'HIDDEN'].includes(layer.tileSet.tileSetStatus),
                )
                .map((layer) => layer.tileSet.uuid),
        [],
    );

    const {
        data,
        refetch,
        isFetching: isDetectionsFetching,
    } = useQuery({
        queryKey: [
            DETECTION_ENDPOINT,
            ...Object.values(mapBounds || {}),
            ...Object.values(objectsFilter || {}),
            ...tileSetsUuidsDetection,
        ],
        queryFn: ({ signal }) => fetchDetections(signal, mapBounds),
        placeholderData: keepPreviousData,
        enabled: displayDetections && !!mapBounds,
    });

    const handleMapRef = useCallback((node?: mapboxgl.Map) => {
        if (!node) {
            return;
        }

        setMapRef(node);

        MAP_CONTROLS.forEach(({ control, position, hideWhenNoDetection }) => {
            if (!displayDetections && hideWhenNoDetection) {
                return;
            }

            if (!node.hasControl(control)) {
                node.addControl(control, position);
            }
        });

        // fit bounds

        if (fitBoundsFirstLayer) {
            const layer = layersDisplayed.find((layer) => layer.tileSet.geometry);

            if (layer) {
                node.fitBounds(bbox(layer.tileSet.geometry), { padding: 20, animate: false });
            }
        }

        // change controls labels

        setTimeout(() => {
            for (const { querySelector, title } of [
                {
                    querySelector: `.mapbox-gl-${DRAW_MODE_MULTIPOLYGON}`,
                    title: DRAW_MODE_TITLES_MAP.MULTIPLE_EDIT,
                },
                {
                    querySelector: '.mapbox-gl-draw_point',
                    title: DRAW_MODE_TITLES_MAP.ADD_DETECTION,
                },
                {
                    querySelector: '.mapbox-gl-draw_line',
                    title: DRAW_MODE_TITLES_MAP.MULTIPLE_DOWNLOAD,
                },
                {
                    querySelector: '.mapboxgl-ctrl-fullscreen',
                    title: 'Plein écran',
                },
                {
                    querySelector: '.mapboxgl-ctrl-fullscreen > .mapboxgl-ctrl-icon',
                    title: 'Plein écran',
                },
                {
                    querySelector: '.mapboxgl-ctrl-zoom-in',
                    title: 'Zoomer',
                },
                {
                    querySelector: '.mapboxgl-ctrl-zoom-in > .mapboxgl-ctrl-icon',
                    title: 'Zoomer',
                },
                {
                    querySelector: '.mapboxgl-ctrl-zoom-out',
                    title: 'Dézoomer',
                },
                {
                    querySelector: '.mapboxgl-ctrl-zoom-out > .mapboxgl-ctrl-icon',
                    title: 'Dézoomer',
                },
                {
                    querySelector: '.mapboxgl-ctrl-compass',
                    title: 'Boussole',
                },
                {
                    querySelector: '.mapboxgl-ctrl-compass > .mapboxgl-ctrl-icon',
                    title: 'Boussole',
                },
                {
                    querySelector: '.mapboxgl-ctrl-geolocate',
                    title: 'Ma position',
                },
                {
                    querySelector: '.mapboxgl-ctrl-geolocate > .mapboxgl-ctrl-icon',
                    title: 'Ma position',
                },
            ]) {
                const control = document.querySelector(querySelector);

                if (!control) {
                    continue;
                }

                control.setAttribute('title', title);
                control.setAttribute('aria-label', title);
            }
        }, 100);
    }, []);

    useEffect(() => {
        if (!mapRef) {
            return;
        }

        // draw control callbacks

        const handleModeChange = (event) => {
            const { mode } = event;

            if (mode === 'draw_point') {
                const partialLayersDisplayedUuids = getTileSetsUuids(['PARTIAL'], ['VISIBLE', 'HIDDEN'], true);
                let partialLayersToDisplayUuids: string[] = [];

                if (partialLayersDisplayedUuids.length) {
                    partialLayersToDisplayUuids = getTileSetsUuids(['PARTIAL'], ['VISIBLE', 'HIDDEN'], false);
                }

                const mostRecentBackgroundLayer = layers
                    .sort(
                        (layer1, layer2) =>
                            new Date(layer2.tileSet.date).getTime() - new Date(layer1.tileSet.date).getTime(),
                    )
                    .filter((layer) => layer.tileSet.tileSetType === 'BACKGROUND')[0];

                setTileSetsVisibility([...partialLayersToDisplayUuids, mostRecentBackgroundLayer.tileSet.uuid], true);

                setDrawMode('ADD_DETECTION');
                setLeftSectionShowed(undefined);

                notifications.show({
                    title: 'Mode de dessin activé',
                    message: "L'affichage des couches a été réinitialisé",
                });
                MAPBOX_DRAW_CONTROL.changeMode(DRAW_MODE_ADD_DETECTION, {
                    escapeKeyStopsDrawing: true,
                    allowCreateExceeded: false,
                    exceedCallsOnEachMove: false,
                });
            } else if (mode === 'draw_line_string') {
                MAPBOX_DRAW_CONTROL.changeMode(DRAW_MODE_MULTIPOLYGON);
                setDrawMode('MULTIPLE_DOWNLOAD');
            } else if (mode === DRAW_MODE_MULTIPOLYGON) {
                setDrawMode('MULTIPLE_EDIT');
            } else {
                setDrawMode(null);
            }
        };

        const handleCreate = async (event) => {
            const { features } = event;

            const getDetectionUuidsFromPolygon = (polygon: Polygon): string[] | undefined => {
                if (!drawMode) {
                    return;
                }

                const detectionUuids: string[] = [];

                for (const feature of data?.features || []) {
                    if (!booleanIntersects(feature.geometry, polygon)) {
                        continue;
                    }

                    detectionUuids.push(feature.properties.uuid);
                }

                if (detectionUuids.length > MULTIPLE_SELECTION_MAX) {
                    notifications.show({
                        title: DRAW_MODE_TITLES_MAP[drawMode],
                        message: `Vous avez sélectionné ${detectionUuids.length} objets. La sélection est limitée à ${MULTIPLE_SELECTION_MAX} détections.`,
                        color: 'red',
                    });
                    MAPBOX_DRAW_CONTROL.deleteAll();
                    return;
                }

                if (!detectionUuids.length) {
                    notifications.show({
                        title: DRAW_MODE_TITLES_MAP[drawMode],
                        message: "Aucune détection n'a été sélectionnée",
                        color: 'red',
                    });
                    MAPBOX_DRAW_CONTROL.deleteAll();
                    return;
                }

                return detectionUuids;
            };

            if (drawMode === 'MULTIPLE_EDIT') {
                if (!features.length) {
                    return;
                }

                const polygon: Polygon = features[0].geometry;
                const detectionUuids = getDetectionUuidsFromPolygon(polygon);

                if (!detectionUuids) {
                    return;
                }

                setMultipleEditDetectionsUuids(detectionUuids);
            }

            if (drawMode === 'MULTIPLE_DOWNLOAD') {
                if (!features.length) {
                    return;
                }

                const polygon: Polygon = features[0].geometry;
                const detectionUuids = getDetectionUuidsFromPolygon(polygon);

                if (!detectionUuids) {
                    return;
                }

                MAPBOX_DRAW_CONTROL.deleteAll();
                notifications.show({
                    title: `Génération des fiches de signalement en cours (${detectionUuids.length} détections)`,
                    message: 'Le téléchargement se lancera dans quelques instants',
                });

                const detectionObjectsDetailsRes = await api.get<DetectionObjectDetail[]>(
                    DETECTION_OBJECT_LIST_ENDPOINT,
                    {
                        params: {
                            detectionUuids: detectionUuids.join(','),
                            detail: true,
                        },
                    },
                );
                const detectionObjectsDetails = detectionObjectsDetailsRes.data;
                setDetectionObjectsToDownload(detectionObjectsDetails);
            }

            if (drawMode === 'ADD_DETECTION') {
                if (!features.length) {
                    return;
                }

                const polygon: Polygon = features[0].geometry;

                // drawing returns one extra point not needed
                if (polygon.coordinates[0].length >= 6) {
                    polygon.coordinates[0] = polygon.coordinates[0].slice(0, 5);
                }

                setAddAnnotationPolygon(polygon);
            }

            MAPBOX_DRAW_CONTROL.deleteAll();
        };

        mapRef.on('draw.modechange', handleModeChange);
        mapRef.on('draw.create', handleCreate);

        return () => {
            mapRef.off('draw.modechange', handleModeChange);
            mapRef.off('draw.create', handleCreate);
        };
    }, [data, mapRef, drawMode]);

    const layersDisplayed = layers.filter((layer) => layer.displayed);

    // detections fetching

    const fetchDetections = async (signal: AbortSignal, mapBounds?: MapBounds) => {
        if (!displayDetections || !mapBounds || !objectsFilter) {
            return null;
        }

        if (mapRef && mapRef.getZoom() <= ZOOM_LIMIT_TO_DISPLAY_DETECTIONS) {
            return null;
        }

        const res = await api.get<DetectionGeojsonData>(DETECTION_ENDPOINT, {
            params: {
                ...mapBounds,
                ...objectsFilter,
                tileSetsUuids: tileSetsUuidsDetection,
            },
            signal,
        });

        if (skipProcessDetections) {
            return res.data;
        }

        return processDetections(res.data);
    };

    // annotation grid fetching

    const annotationGridFilters = objectsFilter ? getAnnotationGridFilters(objectsFilter) : undefined;

    const fetchAnnotationGrid = async (signal: AbortSignal, mapBounds?: MapBounds) => {
        if (!displayDetections || !mapBounds || !objectsFilter || !annotationLayerVisible) {
            return null;
        }

        if (mapRef && mapRef.getZoom() <= ZOOM_LIMIT_TO_DISPLAY_ANNOTATION_GRID) {
            return null;
        }

        const res = await api.get<DetectionGeojsonData>(GET_ANNOTATION_GRID_ENDPOINT, {
            params: {
                ...mapBounds,
                ...annotationGridFilters,
                tileSetsUuids: tileSetsUuidsDetection,
            },
            signal,
        });

        return res.data;
    };
    const { data: annotationGrid, refetch: refetchAnnotationGrid } = useQuery({
        queryKey: [
            GET_ANNOTATION_GRID_ENDPOINT,
            ...Object.values(mapBounds || {}),
            ...Object.values(annotationGridFilters || {}),
            ...tileSetsUuidsDetection,
        ],
        queryFn: ({ signal }) => fetchAnnotationGrid(signal, mapBounds),
        placeholderData: keepPreviousData,
        enabled: annotationLayerVisible && !!mapBounds,
    });

    // custom zones fetching

    const fetchCustomZoneGeometries = async (signal: AbortSignal, mapBounds?: MapBounds) => {
        if (!mapBounds || customZoneLayersDisplayedUuids.length === 0) {
            return null;
        }

        const res = await api.get<GeoCustomZoneGeojsonData>(GET_CUSTOM_GEOMETRY_ENDPOINT, {
            params: {
                ...mapBounds,
                uuids: customZoneLayersDisplayedUuids,
            },
            signal,
        });

        return res.data;
    };
    const { data: customZonesGeometries } = useQuery({
        queryKey: [
            GET_CUSTOM_GEOMETRY_ENDPOINT,
            ...Object.values(mapBounds || {}),
            customZoneLayersDisplayedUuids.join(','),
        ],
        queryFn: ({ signal }) => fetchCustomZoneGeometries(signal, mapBounds),
        placeholderData: keepPreviousData,
        enabled: !!customZoneLayersDisplayedUuids.length && !!mapBounds,
    });

    // event that makes detections to be reloaded
    useEffect(() => {
        const updateDetections = () => {
            refetchAnnotationGrid();
            refetch();
        };

        eventEmitter.on('UPDATE_DETECTIONS', updateDetections);

        return () => {
            eventEmitter.off('UPDATE_DETECTIONS', updateDetections);
        };
    }, []);
    useEffect(() => {
        if (!mapRef) {
            return;
        }

        const jumpTo = (center: mapboxgl.LngLatLike) => {
            mapRef.jumpTo({
                center,
            });
        };

        eventEmitter.on('JUMP_TO', jumpTo);

        return () => {
            eventEmitter.off('JUMP_TO', jumpTo);
        };
    }, [mapRef]);
    useEffect(() => {
        if (!mapRef) {
            return;
        }

        const displayParcel = (polygon: Polygon) => {
            setParcelPolygonDisplayed(polygon);
        };

        eventEmitter.on('DISPLAY_PARCEL', displayParcel);

        return () => {
            eventEmitter.off('DISPLAY_PARCEL', displayParcel);
        };
    }, [mapRef]);
    useEffect(() => {
        refetch();
    }, [objectsFilter]);

    // bounds

    const loadDataFromBounds = (e: mapboxgl.MapboxEvent | ViewStateChangeEvent) => {
        const map = e.target;
        const bounds = map.getBounds();

        setMapBounds({
            neLat: bounds._ne.lat,
            neLng: bounds._ne.lng,
            swLat: bounds._sw.lat,
            swLng: bounds._sw.lng,
        });
    };

    // map click events

    useEffect(() => {
        const geocoderEventCallback = () => {
            setLeftSectionShowed('SEARCH_ADDRESS');
        };
        MAPBOX_GEOCODER.on('loading', geocoderEventCallback);

        return () => {
            try {
                MAPBOX_GEOCODER.off('loading', geocoderEventCallback);
            } catch {}
        };
    }, []);

    const closeDetectionDetail = useCallback(() => {
        setDetectionDetailsShowed(null);
        setLeftSectionShowed(undefined);
        mapRef?.easeTo({
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
            },
            duration: 250,
        });
    }, [mapRef]);

    const onMapClick = ({ features, target }: mapboxgl.MapLayerMouseEvent) => {
        const currentDrawMode = MAPBOX_DRAW_CONTROL.getMode();

        if (
            !features ||
            !features.length ||
            [DRAW_MODE_ADD_DETECTION, DRAW_MODE_MULTIPOLYGON].includes(currentDrawMode)
        ) {
            closeDetectionDetail();
            return;
        }

        const clickedFeature = features[0];
        const detectionProperties = clickedFeature.properties as DetectionProperties;
        setDetectionDetailsShowed({
            detectionObjectUuid: detectionProperties.detectionObjectUuid,
            detectionUuid: detectionProperties.uuid,
        });

        target.setPadding({
            top: 0,
            right: 500, // $detection-detail-panel-width
            bottom: 0,
            left: 0,
        });
        target.flyTo({
            center: getCoord(centroid(clickedFeature.geometry as Polygon)) as [number, number],
        });
    };

    const onPolygonMouseEnter = useCallback(() => setCursor('pointer'), []);
    const onPolygonMouseLeave = useCallback(() => setCursor(undefined), []);

    const getLayerBeforeId = (index: number) => {
        if (index) {
            return getLayerId(layersDisplayed[index - 1]);
        }

        if (displayDetections) {
            return GEOJSON_CUSTOM_ZONES_LAYER_OUTLINE_ID;
        }

        if (displayLayersGeometry) {
            return GEOJSON_LAYER_EXTRA_ID;
        }

        return undefined;
    };

    return (
        <div className={classes.container}>
            <Map
                reuseMaps={true}
                ref={handleMapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                    ...MAP_INITIAL_VIEW_STATE_DEFAULT,
                    ...(initialPosition ? { longitude: initialPosition[0], latitude: initialPosition[1] } : {}),
                }}
                onLoad={loadDataFromBounds}
                onMoveEnd={loadDataFromBounds}
                interactiveLayerIds={[GEOJSON_DETECTIONS_LAYER_ID]}
                onClick={onMapClick}
                onMouseEnter={onPolygonMouseEnter}
                onMouseLeave={onPolygonMouseLeave}
                cursor={cursor}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                {...(settings?.globalGeometry ? { maxBounds: bbox(settings.globalGeometry) } : {})}
            >
                <GeolocateControl
                    position="top-left"
                    style={{
                        position: 'fixed',
                        left: '300px', // searchbar width
                        zIndex: 10,
                        transform: 'translateX(calc(-10px - 100%))',
                        background: 'none',
                    }}
                />
                {displayDetections ? (
                    <>
                        <MapControlSearchParcel
                            isShowed={leftSectionShowed === 'SEARCH_PARCEL'}
                            setIsShowed={(state: boolean) => {
                                setLeftSectionShowed(state ? 'SEARCH_PARCEL' : undefined);
                            }}
                        />
                        <MapControlFilterDetection
                            isShowed={leftSectionShowed === 'FILTER_DETECTION'}
                            setIsShowed={(state: boolean) => {
                                setLeftSectionShowed(state ? 'FILTER_DETECTION' : undefined);
                            }}
                        />
                        {displayTileSetControls ? (
                            <>
                                <MapControlBackgroundSlider />
                                <MapControlPartialToggle />
                            </>
                        ) : null}
                        <MapControlLegend
                            isShowed={leftSectionShowed === 'LEGEND'}
                            setIsShowed={(state: boolean) => {
                                setLeftSectionShowed(state ? 'LEGEND' : undefined);
                            }}
                        />
                        <MapControlLayerDisplay
                            isShowed={leftSectionShowed === 'LAYER_DISPLAY'}
                            setIsShowed={(state: boolean) => {
                                setLeftSectionShowed(state ? 'LAYER_DISPLAY' : undefined);
                            }}
                            displayLayersSelection={displayLayersSelection}
                            disabled={drawMode !== null}
                        />
                        <MapAddAnnotationModal
                            isShowed={!!addAnnotationPolygon}
                            hide={() => setAddAnnotationPolygon(undefined)}
                            polygon={addAnnotationPolygon}
                        />
                        <MapEditMultipleDetectionsModal
                            isShowed={!!multipleEditDetectionsUuids}
                            hide={() => setMultipleEditDetectionsUuids(undefined)}
                            detectionsUuids={multipleEditDetectionsUuids}
                        />
                        {isDetectionsFetching ? (
                            <div className={classes['detections-loader-container']}>
                                <MantineLoader size="sm" />
                            </div>
                        ) : null}
                    </>
                ) : null}
                {displayLayersGeometry ? (
                    <>
                        <Source
                            type="geojson"
                            id="geojson-data-extra-boundings"
                            data={{
                                type: 'FeatureCollection',
                                features: layers
                                    .filter((layer) => layer.tileSet.geometry)
                                    .map((layer) =>
                                        bboxPolygon(bbox(feature(layer.tileSet.geometry as Geometry)), {
                                            properties: {
                                                uuid: layer.tileSet.uuid,
                                                color: GEOJSON_LAYER_EXTRA_COLOR,
                                            },
                                        }),
                                    ),
                            }}
                        >
                            <Layer
                                id={GEOJSON_LAYER_EXTRA_BOUNDINGS_ID}
                                type="line"
                                paint={{
                                    'line-color': ['get', 'color'],
                                    'line-width': 2,
                                }}
                            />
                        </Source>
                        <Source
                            type="geojson"
                            id="geojson-data-extra"
                            data={{
                                type: 'FeatureCollection',
                                features: layers
                                    .filter((layer) => layer.tileSet.geometry)
                                    .map((layer) => ({
                                        type: 'Feature',
                                        properties: {
                                            uuid: layer.tileSet.uuid,
                                            color: GEOJSON_LAYER_EXTRA_COLOR,
                                        },
                                        geometry: layer.tileSet.geometry as Geometry,
                                    })),
                            }}
                        >
                            <Layer
                                id={GEOJSON_LAYER_EXTRA_ID}
                                beforeId={GEOJSON_LAYER_EXTRA_BOUNDINGS_ID}
                                type="fill"
                                paint={{
                                    'fill-color': ['get', 'color'],
                                    'fill-opacity': 0.25,
                                    'fill-outline-color': ['get', 'color'],
                                }}
                            />
                        </Source>
                    </>
                ) : null}

                <Source
                    id="annotation-grid-data"
                    type="geojson"
                    data={annotationGrid || EMPTY_GEOJSON_FEATURE_COLLECTION}
                >
                    <Layer
                        id={GEOJSON_ANNOTATION_GRID_LAYER_ID}
                        beforeId={displayLayersGeometry ? GEOJSON_LAYER_EXTRA_ID : undefined}
                        type="line"
                        paint={{
                            'line-color': '#ff0000',
                            'line-width': 2,
                            'line-opacity': 0.75,
                        }}
                    />
                    <Layer
                        id={GEOJSON_ANNOTATION_GRID_LABEL_LAYER_ID}
                        beforeId={GEOJSON_ANNOTATION_GRID_LAYER_ID}
                        type="symbol"
                        layout={{
                            'text-field': ['get', 'text'],
                            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                            'text-size': 12,
                            'text-anchor': 'center',
                            'symbol-placement': 'point',
                        }}
                        paint={{
                            'text-color': '#000000', // Text color
                            'text-halo-color': '#ffffff', // Add a halo for better readability
                            'text-halo-width': 2,
                        }}
                    />
                </Source>
                <Source id="detections-geojson-data" type="geojson" data={data || EMPTY_GEOJSON_FEATURE_COLLECTION}>
                    <Layer
                        id={GEOJSON_DETECTIONS_LAYER_ID}
                        beforeId={GEOJSON_ANNOTATION_GRID_LABEL_LAYER_ID}
                        type="fill"
                        paint={{
                            'fill-opacity': 0,
                        }}
                    />
                    <Layer
                        id={GEOJSON_DETECTIONS_LAYER_OUTLINE_ID}
                        beforeId={GEOJSON_DETECTIONS_LAYER_ID}
                        type="line"
                        paint={{
                            'line-color': ['get', 'objectTypeColor'],
                            'line-width': [
                                'case',
                                [
                                    '==',
                                    ['get', 'detectionObjectUuid'],
                                    detectionDetailsShowed?.detectionObjectUuid || null,
                                ], // condition to check if uuid matches
                                4, // width for the selected polygon
                                2, // width for other polygons
                            ],
                        }}
                    />
                </Source>
                <Source
                    id="parcel-geojson-data"
                    type="geojson"
                    data={parcelPolygonDisplayed || EMPTY_GEOJSON_FEATURE_COLLECTION}
                >
                    <Layer
                        id={GEOJSON_PARCEL_LAYER_ID}
                        beforeId={GEOJSON_DETECTIONS_LAYER_OUTLINE_ID}
                        type="line"
                        paint={{
                            'line-width': 2,
                            'line-color': PARCEL_COLOR,
                            'line-dasharray': [2, 2],
                        }}
                    />
                </Source>
                <Source
                    id="custom-zones-geojson-data"
                    type="geojson"
                    data={customZonesGeometries || EMPTY_GEOJSON_FEATURE_COLLECTION}
                >
                    <Layer
                        id={GEOJSON_CUSTOM_ZONES_LAYER_ID}
                        beforeId={GEOJSON_PARCEL_LAYER_ID}
                        type="fill"
                        paint={{
                            'fill-color': ['get', 'color'],
                            'fill-opacity': 0.2,
                        }}
                    />
                    <Layer
                        id={GEOJSON_CUSTOM_ZONES_LAYER_OUTLINE_ID}
                        beforeId={GEOJSON_CUSTOM_ZONES_LAYER_ID}
                        type="line"
                        paint={{
                            'line-color': ['get', 'color'],
                            'line-opacity': 0.4,
                            'line-width': 2,
                            'line-dasharray': [2, 2],
                        }}
                    />
                </Source>
                {layersDisplayed.map((layer, index) => (
                    <Source
                        key={layer.tileSet.uuid}
                        id={getSourceId(layer)}
                        type="raster"
                        scheme={layer.tileSet.tileSetScheme}
                        tiles={[layer.tileSet.url]}
                        tileSize={256}
                        {...(layer.tileSet.maxZoom
                            ? {
                                  maxzoom: layer.tileSet.maxZoom,
                              }
                            : {})}
                        {...(layer.tileSet.minZoom
                            ? {
                                  minzoom: layer.tileSet.minZoom,
                              }
                            : {})}
                        {...(boundLayers && (layer.tileSet.geometry || settings?.globalGeometry)
                            ? {
                                  bounds: bbox(layer.tileSet.geometry || settings.globalGeometry),
                              }
                            : {})}
                    >
                        <Layer
                            beforeId={getLayerBeforeId(index)}
                            metadata={layer.tileSet}
                            id={getLayerId(layer)}
                            type="raster"
                            source={getSourceId(layer)}
                            paint={layer.tileSet.monochrome ? { 'raster-saturation': -1 } : {}}
                            {...(layer.tileSet.maxZoom
                                ? {
                                      maxzoom: layer.tileSet.maxZoom,
                                  }
                                : {})}
                            {...(layer.tileSet.minZoom
                                ? {
                                      minzoom: layer.tileSet.minZoom,
                                  }
                                : {})}
                        />
                    </Source>
                ))}

                {detectionDetailsShowed ? (
                    <div className={classes['map-detection-detail-panel-container']}>
                        <DetectionDetail
                            detectionObjectUuid={detectionDetailsShowed.detectionObjectUuid}
                            detectionUuid={detectionDetailsShowed.detectionUuid}
                            onClose={() => closeDetectionDetail()}
                        />
                    </div>
                ) : undefined}
            </Map>
            {detectionObjectsToDownload ? (
                <>
                    <SignalementPDFData
                        detectionObjects={detectionObjectsToDownload}
                        onGenerationFinished={(error?: string) => {
                            if (error) {
                                notifications.show({
                                    title: 'Erreur lors de la génération des fiches de signalement',
                                    message: error,
                                    color: 'red',
                                });
                            }

                            setDetectionObjectsToDownload(undefined);
                            setDetectionObjectsNbrToDownloadProcessed(0);
                        }}
                        setNbrDetectionObjectsProcessed={(nbr) => setDetectionObjectsNbrToDownloadProcessed(nbr)}
                    />
                    <LoadingOverlay
                        zIndex={10000000}
                        visible={true}
                        loaderProps={{
                            children: (
                                <>
                                    <h2>Génération des rapports...</h2>
                                    <p>Cette opération peut prendre quelques minutes</p>
                                    <p>Veuillez ne pas fermer cette fenêtre</p>
                                    <Progress
                                        aria-label="Uploading progress"
                                        mt="md"
                                        value={
                                            100 *
                                            (detectionObjectsNbrToDownloadProcessed / detectionObjectsToDownload.length)
                                        }
                                    />
                                </>
                            ),
                        }}
                    />
                </>
            ) : null}
        </div>
    );
};

export default Component;
