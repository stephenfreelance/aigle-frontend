import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Map, { GeolocateControl, Layer, Source, ViewStateChangeEvent } from 'react-map-gl';

import { GET_CUSTOM_GEOMETRY_ENDPOINT, getDetectionListEndpoint } from '@/api-endpoints';
import DetectionDetail from '@/components/DetectionDetail';
import MapAddAnnotationModal from '@/components/Map/MapAddAnnotationModal';
import MapControlBackgroundSlider from '@/components/Map/controls/MapControlBackgroundSlider';
import MapControlFilterDetection from '@/components/Map/controls/MapControlFilterDetection';
import MapControlLayerDisplay from '@/components/Map/controls/MapControlLayerDisplay';
import MapControlLegend from '@/components/Map/controls/MapControlLegend';
import MapControlPartialToggle from '@/components/Map/controls/MapControlPartialToggle';
import MapControlSearchParcel from '@/components/Map/controls/MapControlSearchParcel';
import { processDetections } from '@/components/Map/utils/process-detections';
import { DetectionGeojsonData, DetectionProperties } from '@/models/detection';
import { GeoCustomZoneGeojsonData } from '@/models/geo/geo-custom-zone';
import { MapTileSetLayer } from '@/models/map-layer';
import api from '@/utils/api';
import { MAPBOX_TOKEN, PARCEL_COLOR } from '@/utils/constants';
import { useMap } from '@/utils/context/map-context';
import { Loader as MantineLoader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { bbox, bboxPolygon, centroid, feature, getCoord } from '@turf/turf';
import { FeatureCollection, Geometry, Polygon } from 'geojson';
import mapboxgl from 'mapbox-gl';
import DrawRectangle, { DrawStyles } from 'mapbox-gl-draw-rectangle-restrict-area';
import classes from './index.module.scss';

const ZOOM_LIMIT_TO_DISPLAY_DETECTIONS = 9;
const MAP_INITIAL_VIEW_STATE_DEFAULT = {
    longitude: 3.95657,
    latitude: 43.61951,
    zoom: 16,
} as const;

const MAPBOX_DRAW_CONTROL = new MapboxDraw({
    userProperties: true,
    displayControlsDefault: false,
    styles: DrawStyles,
    modes: Object.assign(MapboxDraw.modes, {
        draw_rectangle: DrawRectangle,
    }),
    controls: {
        polygon: true,
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
    // draw
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

const GEOJSON_LAYER_EXTRA_COLOR = '#FF0000';

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

interface ComponentProps {
    layers: MapTileSetLayer[];
    displayDetections?: boolean;
    displayLayersGeometry?: boolean;
    fitBoundsFirstLayer?: boolean;
    displayTileSetControls?: boolean;
    displayDrawControl?: boolean;
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
    initialPosition,
}) => {
    const [mapBounds, setMapBounds] = useState<MapBounds>();
    const [detectionDetailsShowed, setDetectionDetailsShowed] = useState<{
        detectionObjectUuid: string;
        detectionUuid: string;
    } | null>(null);
    const [leftSectionShowed, setLeftSectionShowed] = useState<LeftSection>();
    const [drawMode, setDrawMode] = useState<boolean>(false);

    const [parcelPolygonDisplayed, setParcelPolygonDisplayed] = useState<Polygon>();

    const [addAnnotationPolygon, setAddAnnotationPolygon] = useState<Polygon>();

    const { eventEmitter, objectsFilter, resetLayers, settings, customZoneLayers } = useMap();

    const [cursor, setCursor] = useState<string>();
    const [mapRef, setMapRef] = useState<mapboxgl.Map>();

    const customZoneLayersDisplayedUuids = (customZoneLayers || [])
        .filter(({ displayed }) => displayed)
        .map(({ geoCustomZone }) => geoCustomZone.uuid);

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

        // draw control callbacks

        node.on('draw.modechange', ({ mode }: { mode: keyof MapboxDraw.Modes }) => {
            if (mode === 'draw_polygon') {
                resetLayers();
                setDrawMode(true);
                setLeftSectionShowed(undefined);

                notifications.show({
                    title: 'Mode de dessin activé',
                    message: "L'affichage des couches a été réinitialisé",
                });
                MAPBOX_DRAW_CONTROL.changeMode('draw_rectangle', {
                    escapeKeyStopsDrawing: true, // default true
                    allowCreateExceeded: false, // default false
                    exceedCallsOnEachMove: false, // default false
                });
            } else {
                setDrawMode(false);
            }
        });

        node.on('draw.create', ({ features }) => {
            if (!features.length) {
                return;
            }

            const polygon: Polygon = features[0].geometry;

            // drawing returns one extra point not needed
            if (polygon.coordinates[0].length >= 6) {
                polygon.coordinates[0] = polygon.coordinates[0].slice(0, 5);
            }

            setAddAnnotationPolygon(polygon);
            MAPBOX_DRAW_CONTROL.deleteAll();
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
                    querySelector: '.mapbox-gl-draw_polygon',
                    title: 'Dessiner un objet',
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

    const layersDisplayed = layers.filter((layer) => layer.displayed);

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

        return processDetections(res.data);
    };
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
        enabled: !!mapBounds,
    });

    // event that makes detections to be reloaded
    useEffect(() => {
        eventEmitter.on('UPDATE_DETECTIONS', refetch);

        return () => {
            eventEmitter.off('UPDATE_DETECTIONS', refetch);
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
        if (!features || !features.length) {
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
                            disabled={drawMode}
                        />
                        <MapAddAnnotationModal
                            isShowed={!!addAnnotationPolygon}
                            hide={() => setAddAnnotationPolygon(undefined)}
                            polygon={addAnnotationPolygon}
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
                <Source id="detections-geojson-data" type="geojson" data={data || EMPTY_GEOJSON_FEATURE_COLLECTION}>
                    <Layer
                        id={GEOJSON_DETECTIONS_LAYER_ID}
                        beforeId={displayLayersGeometry ? GEOJSON_LAYER_EXTRA_ID : undefined}
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
        </div>
    );
};

export default Component;
