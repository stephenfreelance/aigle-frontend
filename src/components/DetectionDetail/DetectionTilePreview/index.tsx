import { DetectionWithTile } from '@/models/detection';
import { TileSet } from '@/models/tile-set';
import { MAPBOX_TOKEN } from '@/utils/constants';
import React from 'react';
import Map, { Layer, Source } from 'react-map-gl';
import classes from './index.module.scss';

interface ComponentProps {
    detection?: DetectionWithTile;
    color: string;
    tileSet: TileSet;
    bounds: [number, number, number, number];
    displayName?: boolean;
}

const Component: React.FC<ComponentProps> = ({ bounds, detection, color, tileSet, displayName = true }) => {
    return (
        <div className={classes['detection-tile-preview-container-wrapper']}>
            <div className={classes['detection-tile-preview-container']}>
                <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    maxBounds={bounds}
                    interactive={false}
                >
                    {detection ? (
                        <Source id="geojson-data" type="geojson" data={detection.geometry}>
                            <Layer
                                id="geojson-layer"
                                type="line"
                                paint={{
                                    'line-color': color,
                                    'line-width': 2,
                                }}
                            />
                        </Source>
                    ) : null}
                    <Source id="raster-source" type="raster" tiles={[tileSet.url]} tileSize={256} bounds={bounds}>
                        <Layer
                            beforeId={detection ? 'geojson-layer' : undefined}
                            id="raster-layer"
                            type="raster"
                            source="raster-source"
                        />
                    </Source>
                </Map>
            </div>

            {displayName ? <p className={classes['detection-tile-preview']}>{tileSet.name}</p> : null}
        </div>
    );
};

export default Component;
