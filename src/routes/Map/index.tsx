import React, { useEffect, useRef } from 'react';
import Map from 'react-map-gl';

import classes from './index.module.scss';
import Layout from '@/components/Layout';
import type { MapStyle } from 'react-map-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_STYLE: MapStyle = {
  layers: [
    {
      source: 'base',
      type: 'raster',
      id: 'base',
    },
  ],
  sources: {
    base: {
      type: 'raster',
      // tiles: ['https://aigle-tiles-210324.s3.fr-par.scw.cloud/{z}/{x}/{y}.png'],
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png	'],
      tileSize: 256,
    },
  },
  version: 8,
} as const;

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
    position: 'bottom-right'
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

const Component: React.FC = () => {
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

  return (
    <Layout>
      <div className={classes.container}>
        <Map
          ref={ref}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLE}
          initialViewState={MAP_INITIAL_VIEW_STATE}
        />
      </div>
    </Layout>
  );
};

export default Component;
