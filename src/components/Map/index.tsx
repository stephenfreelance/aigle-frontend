import React, { useEffect, useRef } from 'react';
import Map from 'react-map-gl';

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import mapboxgl from 'mapbox-gl';
import type { MapStyle } from 'react-map-gl';
import classes from './index.module.scss';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const getMapStyle = (urls: string[]) => {
    const style: MapStyle = {
        layers: [],
        sources: {},
        version: 8,
    };

    urls.forEach((url, index) => {
        const rasterId = `raster_${index}`;

        style.layers.push({
            source: rasterId,
            type: 'raster',
            id: rasterId,
        });
        style.sources[rasterId] = {
            type: 'raster',
            // tiles: ['https://aigle-tiles-210324.s3.fr-par.scw.cloud/{z}/{x}/{y}.png'],
            tiles: [url],
            tileSize: 256,
        };
    });

    return style;
};

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

interface ComponentProps {
    urls: string[];
}

const Component: React.FC<ComponentProps> = ({ urls }) => {
    const ref = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        MAP_CONTROLS.forEach(({ control, position }) => {
            if (!ref.current) {
                return;
            }

            if (!ref.current.hasControl(control)) {
                ref.current.addControl(control, position);
            }
        });
    }, [ref.current]);

    const styles: MapStyle = getMapStyle(urls);

    return (
        <div className={classes.container}>
            <Map
                ref={ref}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle={styles}
                initialViewState={MAP_INITIAL_VIEW_STATE}
            />
        </div>
    );
};

export default Component;
