import DetectionTilePreview from '@/components/DetectionDetail/DetectionTilePreview';
import { DetectionWithTile } from '@/models/detection';
import { DetectionObjectDetail } from '@/models/detection-object';
import { Button } from '@mantine/core';
import { bbox } from '@turf/turf';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import classes from './index.module.scss';

interface ComponentProps {
    detectionObject: DetectionObjectDetail;
}
const Component: React.FC<ComponentProps> = ({ detectionObject }) => {
    const [fullHistoryShowed, setFullHistoryShowed] = useState(false);
    const previewBounds = bbox(detectionObject.detections[0].tile.geometry) as [number, number, number, number];
    const tileSetUuidsDetectionsMap = detectionObject.detections.reduce<Record<string, DetectionWithTile>>(
        (prev, curr) => {
            prev[curr.tileSet.uuid] = curr;
            return prev;
        },
        {},
    );

    const tileSetsShowed = useMemo(() => {
        if (!fullHistoryShowed) {
            return detectionObject.tileSets.filter(({ preview }) => preview);
        }

        return detectionObject.tileSets;
    }, [fullHistoryShowed]);

    return (
        <div className={classes.container}>
            <h2>Historique de détections</h2>

            <div className={classes['detection-tile-previews-container']}>
                {tileSetsShowed.map(({ tileSet, preview }) => (
                    <DetectionTilePreview
                        bounds={previewBounds}
                        key={tileSet.uuid}
                        geometry={tileSetUuidsDetectionsMap[tileSet.uuid]?.geometry}
                        color={detectionObject.objectType.color}
                        tileSet={tileSet}
                        className={clsx({
                            [classes['detection-tile-preview-animated']]: !preview,
                        })}
                    />
                ))}
            </div>

            {detectionObject.tileSets.length > 3 ? (
                <Button mt="sm" variant="light" fullWidth onClick={() => setFullHistoryShowed((state) => !state)}>
                    {fullHistoryShowed ? 'Voir moins' : "Voir tout l'historique"}
                </Button>
            ) : null}
        </div>
    );
};

export default Component;