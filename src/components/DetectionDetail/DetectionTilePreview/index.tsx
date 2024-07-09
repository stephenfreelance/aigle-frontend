import { TileSet } from '@/models/tile-set';
import { DEFAULT_DATE_FORMAT, MAPBOX_TOKEN } from '@/utils/constants';
import clsx from 'clsx';
import { Polygon } from 'geojson';
import React from 'react';
import Map, { Layer, Source } from 'react-map-gl';
import classes from './index.module.scss';
import { format } from 'date-fns';

interface ComponentProps {
    geometry?: Polygon;
    color: string;
    tileSet: TileSet;
    bounds: [number, number, number, number];
    className?: string;
    displayName?: boolean;
    strokedLine?: boolean;
}

const Component: React.FC<ComponentProps> = ({
    bounds,
    geometry,
    color,
    tileSet,
    className,
    displayName = true,
    strokedLine = false,
}) => {
    return (
        <div className={clsx(classes['detection-tile-preview-container-wrapper'], className)}>
            <div className={classes['detection-tile-preview-container']}>
                <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    maxBounds={bounds}
                    interactive={false}
                >
                    {geometry ? (
                        <Source id="geojson-data" type="geojson" data={geometry}>
                            <Layer
                                id="geojson-layer"
                                type="line"
                                paint={{
                                    'line-color': color,
                                    'line-width': 2,
                                    'line-dasharray': strokedLine ? [2, 2] : [],
                                }}
                            />
                        </Source>
                    ) : null}
                    <Source
                        id="raster-source"
                        scheme={tileSet.tileSetScheme}
                        type="raster"
                        tiles={[tileSet.url]}
                        tileSize={256}
                        bounds={bounds}
                    >
                        <Layer
                            beforeId={geometry ? 'geojson-layer' : undefined}
                            id="raster-layer"
                            type="raster"
                            source="raster-source"
                        />
                    </Source>
                </Map>
            </div>

            {displayName ? (
                <>
                    <p className={classes['detection-tile-preview-title']}>{tileSet.name}</p>
                    <p className={classes['detection-tile-preview-date']}>{format(tileSet.date, DEFAULT_DATE_FORMAT)}</p>
                </>
            ) : null}
        </div>
    );
};

export default Component;
