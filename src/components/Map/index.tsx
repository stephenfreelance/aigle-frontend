import React, { useCallback } from 'react';
import Map, { Layer, Source, ViewStateChangeEvent } from 'react-map-gl';

import { MapLayer } from '@/models/map-layer';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
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

interface ComponentProps {
    layers: MapLayer[];
}

const Component: React.FC<ComponentProps> = ({ layers }) => {
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

    return (
        <div className={classes.container}>
            <Map
                reuseMaps={true}
                ref={handleMapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={MAP_INITIAL_VIEW_STATE}
                onMoveEnd={(e: ViewStateChangeEvent) => {
                    const map = e.target;
                    const bounds = map.getBounds();
                    console.log({bounds});
                }}
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
            </Map>
        </div>
    );
};

export default Component;
