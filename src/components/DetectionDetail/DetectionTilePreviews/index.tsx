import DetectionTilePreview from '@/components/DetectionDetail/DetectionTilePreview';
import { DetectionWithTile } from '@/models/detection';
import { DetectionObjectDetail } from '@/models/detection-object';
import { bbox } from '@turf/turf';
import React from 'react';
import classes from './index.module.scss';

interface ComponentProps {
    detectionObject: DetectionObjectDetail;
}
const Component: React.FC<ComponentProps> = ({ detectionObject }) => {
    const previewBounds = bbox(detectionObject.detections[0].tile.geometry) as [number, number, number, number];
    const tileSetUuidsDetectionsMap = detectionObject.detections.reduce<Record<string, DetectionWithTile>>(
        (prev, curr) => {
            prev[curr.tileSet.uuid] = curr;
            return prev;
        },
        {},
    );

    return (
        <div className={classes.container}>
            <h2>Historique de détections</h2>

            <div className={classes['detection-tile-previews-container']}>
                {detectionObject.tileSetsPreviews.map((tileSet, index) => (
                    <DetectionTilePreview
                        bounds={previewBounds}
                        key={index}
                        detection={tileSetUuidsDetectionsMap[tileSet.uuid] ?? undefined}
                        color={detectionObject.objectType.color}
                        tileSet={tileSet}
                    />
                ))}
            </div>
        </div>
    );
};

export default Component;
