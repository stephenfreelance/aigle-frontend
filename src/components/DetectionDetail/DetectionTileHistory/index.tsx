import DetectionTilePreview from '@/components/DetectionDetail/DetectionTilePreview';
import { DetectionWithTile } from '@/models/detection';
import { DetectionObjectDetail } from '@/models/detection-object';
import { Button } from '@mantine/core';
import { bbox } from '@turf/turf';
import React, { useState } from 'react';
import DetectionTileHistoryFullModal from '../DetectionTileHistoryFullModal';
import classes from './index.module.scss';

interface ComponentProps {
    detectionObject: DetectionObjectDetail;
}
const Component: React.FC<ComponentProps> = ({ detectionObject }) => {
    const [detectionTileHistoryFullModalShowed, setDetectionTileHistoryFullModalShowed] = useState(false);
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
                {detectionObject.tileSets
                    .filter(({ preview }) => preview)
                    .map(({ tileSet }, index) => (
                        <DetectionTilePreview
                            bounds={previewBounds}
                            key={index}
                            geometry={tileSetUuidsDetectionsMap[tileSet.uuid]?.geometry}
                            color={detectionObject.objectType.color}
                            tileSet={tileSet}
                        />
                    ))}
            </div>

            <Button mt="sm" variant="outline" fullWidth onClick={() => setDetectionTileHistoryFullModalShowed(true)}>
                Historique complet
            </Button>

            <DetectionTileHistoryFullModal
                isShowed={detectionTileHistoryFullModalShowed}
                hide={() => setDetectionTileHistoryFullModalShowed(false)}
                detectionObjectUuid={detectionObject.uuid}
                detectionObjectId={detectionObject.id}
            />
        </div>
    );
};

export default Component;
