import React, { useCallback, useEffect, useState } from 'react';
import Map, { Layer, Source, ViewStateChangeEvent } from 'react-map-gl';

import { getDetectionListEndpoint } from '@/api-endpoints';
import DetectionDetail from '@/components/DetectionDetail';
import MapAddAnnotationModal from '@/components/Map/MapAddAnnotationModal';
import MapControlFilterDetection from '@/components/Map/controls/MapControlFilterDetection';
import MapControlLayerDisplay from '@/components/Map/controls/MapControlLayerDisplay';
import MapControlLegend from '@/components/Map/controls/MapControlLegend';
import MapControlSearchParcel from '@/components/Map/controls/MapControlSearchParcel';
import { DetectionGeojsonData, DetectionProperties } from '@/models/detection';
import { MapLayer } from '@/models/map-layer';
import api from '@/utils/api';
import { MAPBOX_TOKEN } from '@/utils/constants';
import { useMap } from '@/utils/map-context';
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

const MAP_INITIAL_VIEW_STATE = {
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

const getSourceId = (layer: MapLayer) => `source-${layer.tileSet.uuid}`;
const getLayerId = (layer: MapLayer) => `layer-${layer.tileSet.uuid}`;

const DETECTION_ENDPOINT = getDetectionListEndpoint();

const GEOJSON_LAYER_ID = 'geojson-layer';
const GEOJSON_LAYER_OUTLINE_ID = 'geojson-layer-outline';
const GEOJSON_LAYER_EXTRA_ID = 'geojson-layer-data-extra';
const GEOJSON_LAYER_EXTRA_BOUNDINGS_ID = 'geojson-layer-data-extra-boundings';

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
    layers: MapLayer[];
    displayDetections?: boolean;
    displayLayersGeometry?: boolean;
    fitBoundsFirstLayer?: boolean;
    boundLayers?: boolean;
}

const Component: React.FC<ComponentProps> = ({
    layers,
    displayLayersGeometry,
    fitBoundsFirstLayer = false,
    displayDetections = true,
    boundLayers = true,
}) => {
    const [mapBounds, setMapBounds] = useState<MapBounds>();
    const [detectionDetailsShowed, setDetectionDetailsShowed] = useState<{
        detectionObjectUuid: string;
        detectionUuid: string;
    } | null>(null);
    const [sectionShowed, leftSectionShowed] = useState<LeftSection>();

    const [addAnnotationPolygon, setAddAnnotationPolygon] = useState<Polygon>();

    const { eventEmitter, detectionFilter } = useMap();

    const [cursor, setCursor] = useState<string>();
    const [mapRef, setMapRef] = useState<mapboxgl.Map>();

    const handleMapRef = useCallback((node?: mapboxgl.Map) => {
        console.log('handle map ref', node);
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

        // change labels

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
        ]) {
            const control = document.querySelector(querySelector);

            if (!control) {
                continue;
            }

            control.setAttribute('title', title);
            control.setAttribute('aria-label', title);
        }

        // draw control callbacks

        node.on('draw.modechange', ({ mode }: { mode: keyof MapboxDraw.Modes }) => {
            if (mode === 'draw_polygon') {
                MAPBOX_DRAW_CONTROL.changeMode('draw_rectangle', {
                    escapeKeyStopsDrawing: true, // default true
                    allowCreateExceeded: false, // default false
                    exceedCallsOnEachMove: false, // default false
                });
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
    }, []);

    const layersDisplayed = layers.filter((layer) => layer.displayed);
    const tileSetsUuids = layersDisplayed.map((layer) => layer.tileSet.uuid);

    // detections fetching

    const fetchDetections = async (signal: AbortSignal, mapBounds?: MapBounds) => {
        if (!displayDetections || !mapBounds || !detectionFilter) {
            return null;
        }

        const res = await api.get<DetectionGeojsonData>(DETECTION_ENDPOINT, {
            params: {
                ...mapBounds,
                ...detectionFilter,
                tileSetsUuids: tileSetsUuids,
            },
            signal,
        });
        return res.data;
    };
    const { data, refetch } = useQuery({
        queryKey: [
            DETECTION_ENDPOINT,
            ...Object.values(mapBounds || {}),
            ...Object.values(detectionFilter || {}),
            ...tileSetsUuids,
        ],
        queryFn: ({ signal }) => fetchDetections(signal, mapBounds),
        placeholderData: keepPreviousData,
        enabled: displayDetections && !!mapBounds,
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
        refetch();
    }, [detectionFilter]);

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
            leftSectionShowed('SEARCH_ADDRESS');
        };
        MAPBOX_GEOCODER.on('loading', geocoderEventCallback);

        return () => {
            try {
                MAPBOX_GEOCODER.off('loading', geocoderEventCallback);
            } catch {}
        };
    }, []);

    const onMapClick = ({ features, target }: mapboxgl.MapLayerMouseEvent) => {
        if (!features || !features.length) {
            setDetectionDetailsShowed(null);
            leftSectionShowed(undefined);
            target.easeTo({
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                },
                duration: 250,
            });
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
            return GEOJSON_LAYER_OUTLINE_ID;
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
                initialViewState={MAP_INITIAL_VIEW_STATE}
                onLoad={loadDataFromBounds}
                onMoveEnd={loadDataFromBounds}
                interactiveLayerIds={[GEOJSON_LAYER_ID]}
                onClick={onMapClick}
                onMouseEnter={onPolygonMouseEnter}
                onMouseLeave={onPolygonMouseLeave}
                cursor={cursor}
            >
                {displayDetections ? (
                    <>
                        <MapControlSearchParcel
                            isShowed={sectionShowed === 'SEARCH_PARCEL'}
                            setIsShowed={(state: boolean) => {
                                leftSectionShowed(state ? 'SEARCH_PARCEL' : undefined);
                            }}
                        />
                        <MapControlFilterDetection
                            isShowed={sectionShowed === 'FILTER_DETECTION'}
                            setIsShowed={(state: boolean) => {
                                leftSectionShowed(state ? 'FILTER_DETECTION' : undefined);
                            }}
                        />
                        <MapControlLegend
                            isShowed={sectionShowed === 'LEGEND'}
                            setIsShowed={(state: boolean) => {
                                leftSectionShowed(state ? 'LEGEND' : undefined);
                            }}
                        />
                        <MapControlLayerDisplay
                            isShowed={sectionShowed === 'LAYER_DISPLAY'}
                            setIsShowed={(state: boolean) => {
                                leftSectionShowed(state ? 'LAYER_DISPLAY' : undefined);
                            }}
                        />
                        <MapAddAnnotationModal
                            isShowed={!!addAnnotationPolygon}
                            hide={() => setAddAnnotationPolygon(undefined)}
                            polygon={addAnnotationPolygon}
                        />
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
                <Source id="geojson-data" type="geojson" data={data || EMPTY_GEOJSON_FEATURE_COLLECTION}>
                    <Layer
                        id={GEOJSON_LAYER_ID}
                        beforeId={displayLayersGeometry ? GEOJSON_LAYER_EXTRA_ID : undefined}
                        type="fill"
                        paint={{
                            'fill-opacity': 0,
                        }}
                    />
                    <Layer
                        id={GEOJSON_LAYER_OUTLINE_ID}
                        beforeId={GEOJSON_LAYER_ID}
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
                        {...(boundLayers && layer.tileSet.geometry
                            ? {
                                  bounds: bbox(layer.tileSet.geometry),
                              }
                            : {})}
                    >
                        <Layer
                            beforeId={getLayerBeforeId(index)}
                            metadata={layer.tileSet}
                            id={getLayerId(layer)}
                            type="raster"
                            source={getSourceId(layer)}
                        />
                    </Source>
                ))}

                {detectionDetailsShowed ? (
                    <div className={classes['map-detection-detail-panel-container']}>
                        <DetectionDetail
                            detectionObjectUuid={detectionDetailsShowed.detectionObjectUuid}
                            detectionUuid={detectionDetailsShowed.detectionUuid}
                            onClose={() => setDetectionDetailsShowed(null)}
                        />
                    </div>
                ) : undefined}
            </Map>
        </div>
    );
};

export default Component;
