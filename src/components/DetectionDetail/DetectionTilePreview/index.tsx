import { TileSet } from '@/models/tile-set';
import { DEFAULT_DATE_FORMAT, MAPBOX_TOKEN } from '@/utils/constants';
import { extendBbox } from '@/utils/geojson';
import clsx from 'clsx';
import { format } from 'date-fns';
import { Polygon } from 'geojson';
import React from 'react';
import Map, { Layer, Source } from 'react-map-gl';
import classes from './index.module.scss';

interface PreviewGeometry {
    color: string;
    geometry: Polygon;
}

interface ClassNames {
    wrapper?: string;
    main?: string;
    inner?: string;
}

interface ComponentProps {
    geometries?: PreviewGeometry[];
    tileSet: TileSet;
    bounds: [number, number, number, number];
    classNames?: ClassNames;
    displayName?: boolean;
    strokedLine?: boolean;
    extended?: boolean;
    id?: string;
    onIdle?: () => void;
}

const Component: React.FC<ComponentProps> = ({
    bounds,
    geometries,
    tileSet,
    classNames,
    displayName = true,
    strokedLine = false,
    extended = false,
    id,
    onIdle,
}) => {
    const bounds_ = extended ? extendBbox(bounds) : bounds;

    return (
        <div className={clsx(classes['detection-tile-preview-container-wrapper'], classNames?.wrapper)}>
            <div className={clsx(classes['detection-tile-preview-container'], classNames?.main)}>
                <div className={clsx(classes['detection-tile-preview'], classNames?.inner)}>
                    <Map
                        mapboxAccessToken={MAPBOX_TOKEN}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle="mapbox://styles/mapbox/streets-v11"
                        maxBounds={bounds_}
                        interactive={false}
                        {...(id ? { id } : {})}
                        {...(onIdle ? { onIdle } : {})}
                    >
                        {geometries ? (
                            <Source
                                type="geojson"
                                id="geojson-data"
                                data={{
                                    type: 'FeatureCollection',
                                    features: geometries.map(({ geometry, color }) => ({
                                        type: 'Feature',
                                        properties: {
                                            color: color,
                                        },
                                        geometry: geometry,
                                    })),
                                }}
                            >
                                <Layer
                                    id="geojson-layer"
                                    type="line"
                                    paint={{
                                        'line-color': ['get', 'color'],
                                        'line-width': 3,
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
                            bounds={bounds_}
                        >
                            <Layer
                                beforeId={geometries ? 'geojson-layer' : undefined}
                                id="raster-layer"
                                type="raster"
                                source="raster-source"
                            />
                        </Source>
                    </Map>
                </div>
            </div>

            {displayName ? (
                <>
                    <p className={classes['detection-tile-preview-title']}>{tileSet.name}</p>
                    <p className={classes['detection-tile-preview-date']}>
                        {format(tileSet.date, DEFAULT_DATE_FORMAT)}
                    </p>
                </>
            ) : null}
        </div>
    );
};

export default Component;
