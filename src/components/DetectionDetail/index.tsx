import { getDetectionDetailEndpoint, getObjectTypeDetailEndpoint } from '@/api-endpoints';
import DateInfo from '@/components/DateInfo';
import DetectionDetailDetectionObject from '@/components/DetectionDetail/DetectionDetailDetectionObject';
import Loader from '@/components/Loader';
import { DetectionDetail } from '@/models/detection';
import api from '@/utils/api';
import { Accordion, ActionIcon } from '@mantine/core';
import { IconCalendarClock, IconMap, IconMapPin, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { centroid } from '@turf/turf';
import { Position } from 'geojson';
import React from 'react';
import { Link } from 'react-router-dom';
import classes from './index.module.scss';

const getGoogleMapLink = (point: Position) => `https://www.google.com/maps/place/${point[1]},${point[0]}`;

interface ComponentProps {
    detectionUuid: string;
    onClose?: () => void;
}

const Component: React.FC<ComponentProps> = ({ detectionUuid, onClose }: ComponentProps) => {
    const fetchData = async () => {
        const res = await api.get<DetectionDetail>(getDetectionDetailEndpoint(detectionUuid));

        return res.data;
    };
    const { data } = useQuery({
        queryKey: [getObjectTypeDetailEndpoint(String(detectionUuid))],
        queryFn: () => fetchData(),
    });

    if (!data) {
        return <Loader className={classes.loader} />;
    }

    const {
        geometry: { coordinates: centerPoint },
    } = centroid(data.geometry);

    return (
        <div className={classes.container}>
            <div className={classes['top-section']}>
                <h1>Détection #{data.id}</h1>
                {onClose ? (
                    <ActionIcon variant="transparent" onClick={onClose}>
                        <IconX />
                    </ActionIcon>
                ) : null}
            </div>
            <Accordion variant="contained" className={classes['general-informations']} defaultValue="infos">
                <Accordion.Item key="infos" value="infos" className={classes['general-informations-item']}>
                    <Accordion.Control>Informations générales</Accordion.Control>
                    <Accordion.Panel className={classes['general-informations-content']}>
                        <p className={classes['general-informations-content-item']}>
                            <IconMap size={16} /> {data.detectionObject.address}
                        </p>
                        <p className={classes['general-informations-content-item']}>
                            <IconCalendarClock size={16} />{' '}
                            <span className={classes['general-informations-content-item-text']}>
                                Dernière mise à jour :&nbsp;
                                <DateInfo date={data.detectionObject.updatedAt} />
                            </span>
                        </p>
                        <p className={classes['general-informations-content-item']}>
                            <IconMapPin size={16} />{' '}
                            <Link
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes['general-informations-content-item-text']}
                                to={getGoogleMapLink(centerPoint)}
                            >
                                {`${centerPoint[1].toFixed(5)}, ${centerPoint[0].toFixed(5)}`}
                            </Link>
                        </p>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
            <DetectionDetailDetectionObject detection={data} />
        </div>
    );
};

export default Component;
