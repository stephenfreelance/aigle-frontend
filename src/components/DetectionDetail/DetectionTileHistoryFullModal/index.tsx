import { getDetectionObjectHistoryEndpoint } from '@/api-endpoints';
import Loader from '@/components/Loader';
import { DetectionObjectHistory } from '@/models/detection-object';
import api from '@/utils/api';
import { Modal } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { bbox } from '@turf/turf';
import React, { useState } from 'react';
import DetectionTilePreview from '../DetectionTilePreview';
import classes from './index.module.scss';

interface ComponentProps {
    isShowed: boolean;
    hide: () => void;
    detectionObjectUuid: string;
    detectionObjectId: number;
}
const Component: React.FC<ComponentProps> = ({ isShowed, hide, detectionObjectUuid, detectionObjectId }) => {
    const [bounds, setBounds] = useState<[number, number, number, number]>();

    const fetchData = async () => {
        const res = await api.get<DetectionObjectHistory>(getDetectionObjectHistoryEndpoint(detectionObjectUuid));
        const data = res.data;

        const detection = (data?.detections || []).find((d) => d.detection);

        if (!detection || !detection.detection) {
            return null;
        }

        const geometry = detection.detection?.tile.geometry;

        setBounds(bbox(geometry) as [number, number, number, number]);

        return res.data;
    };

    const { data } = useQuery({
        queryKey: [getDetectionObjectHistoryEndpoint(String(detectionObjectUuid))],
        queryFn: () => fetchData(),
        enabled: isShowed,
    });

    return (
        <Modal
            size="auto"
            className={classes.modal}
            opened={isShowed}
            onClose={hide}
            title={`Historique de détection de l'objet #${detectionObjectId}`}
        >
            {data && bounds ? (
                <div className={classes['previews-container']}>
                    {data.detections.map(({ detection, tileSet }) => (
                        <DetectionTilePreview
                            key={tileSet.uuid}
                            color={data.objectType.color}
                            tileSet={tileSet}
                            bounds={bounds}
                            geometry={detection?.geometry}
                        />
                    ))}
                </div>
            ) : (
                <Loader className={classes.loader} />
            )}
        </Modal>
    );
};

export default Component;
