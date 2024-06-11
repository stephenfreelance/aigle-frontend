import React, { useCallback, useState } from 'react';
import Map, { Layer, Source, ViewStateChangeEvent } from 'react-map-gl';

import { getDetectionListEndpoint } from '@/api-endpoints';
import DetectionDetail from '@/components/DetectionDetail';
import { DetectionGeojsonData, DetectionProperties } from '@/models/detection';
import { MapLayer } from '@/models/map-layer';
import api from '@/utils/api';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import classes from './index.module.scss';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_INITIAL_VIEW_STATE = {
    longitude: 3.8767337,
    latitude: 43.6112422,
    zoom: 16,
} as const;

const MAP_CONTROLS: {
    control: mapboxgl.Control | mapboxgl.IControl;
    position: 'top-left' | 'bottom-right' | 'top-right' | 'bottom-left';
}[] = [
    // search bar
    {
        control: new MapboxGeocoder({
            accessToken: MAPBOX_TOKEN,
            mapboxgl: mapboxgl,
            placeholder: 'Rechercher par adresse',
        }),

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
            showCompass: false,
        }),
        position: 'bottom-right',
    },
];

const getSourceId = (layer: MapLayer) => `source-${layer.tileSet.uuid}`;
const getLayerId = (layer: MapLayer) => `layer-${layer.tileSet.uuid}`;

const DETECTION_ENDPOINT = getDetectionListEndpoint();

const GEOJSON_LAYER_ID = 'geojson-layer';

interface DetectionFilter {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
}

interface ComponentProps {
    layers: MapLayer[];
    displayDetections?: boolean;
}

const Component: React.FC<ComponentProps> = ({ layers, displayDetections = true }) => {
    const [detectionsFilter, setDetectionsFilter] = useState<DetectionFilter>();
    const [detectionDetailUuidShowed, setDetectionDetailUuidShowed] = useState<string>();

    const [cursor, setCursor] = useState<string>('auto');

    const handleMapRef = useCallback((node?: mapboxgl.Map) => {
        if (!node) {
            return;
        }

        MAP_CONTROLS.forEach(({ control, position }) => {
            if (!node.hasControl(control)) {
                node.addControl(control, position);
            }
        });
    }, []);

    const fetchDetections = async (detectionsFilter: DetectionFilter) => {
        const res = await api.get<DetectionGeojsonData>(DETECTION_ENDPOINT, {
            params: detectionsFilter,
        });
        return res.data;
    };

    const { data } = useQuery({
        queryKey: [DETECTION_ENDPOINT, ...Object.values(detectionsFilter || {})],
        queryFn: () => (detectionsFilter ? fetchDetections(detectionsFilter) : undefined),
        placeholderData: keepPreviousData,
        enabled: displayDetections && !!detectionsFilter,
    });

    const loadDataFromBounds = (e: mapboxgl.MapboxEvent | ViewStateChangeEvent) => {
        const map = e.target;
        const bounds = map.getBounds();

        setDetectionsFilter({
            neLat: bounds._ne.lat,
            neLng: bounds._ne.lng,
            swLat: bounds._sw.lat,
            swLng: bounds._sw.lng,
        });
    };

    const onMapClick = ({ features }: mapboxgl.MapLayerMouseEvent) => {
        if (!features || !features.length) {
            setDetectionDetailUuidShowed(undefined);
            return;
        }

        const clickedFeature = features[0];
        const detectionProperties = clickedFeature.properties as DetectionProperties;
        console.log('CLICKED DETECTION', detectionProperties);
        setDetectionDetailUuidShowed(detectionProperties.uuid);
    };

    const onPolygonMouseEnter = useCallback(() => setCursor('pointer'), []);
    const onPolygonMouseLeave = useCallback(() => setCursor('auto'), []);

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
                {layers
                    .filter((layer) => layer.displayed)
                    .map((layer, index) => (
                        <Source
                            key={layer.tileSet.uuid}
                            id={getSourceId(layer)}
                            type="raster"
                            tiles={[layer.tileSet.url]}
                            tileSize={256}
                        >
                            <Layer
                                beforeId={index ? getLayerId(layers[index - 1]) : undefined}
                                metadata={layer.tileSet}
                                id={getLayerId(layer)}
                                type="raster"
                                source={getSourceId(layer)}
                            />
                        </Source>
                    ))}

                {data && (
                    <Source id="geojson-data" type="geojson" data={data}>
                        <Layer
                            id={GEOJSON_LAYER_ID}
                            type="fill"
                            paint={{
                                'fill-opacity': 0,
                            }}
                        />
                        <Layer
                            id="geojson-layer-outline"
                            type="line"
                            paint={{
                                'line-color': ['get', 'objectTypeColor'],
                                'line-width': 2,
                            }}
                        />
                    </Source>
                )}

                {detectionDetailUuidShowed ? (
                    <div className={classes['map-detection-detail-panel-container']}>
                        <DetectionDetail detectionUuid={detectionDetailUuidShowed} />
                    </div>
                ) : undefined}
            </Map>
        </div>
    );
};

export default Component;
