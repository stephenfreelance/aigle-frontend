import { getDetectionObjectDetailEndpoint } from '@/api-endpoints';
import DetectionDetailDetectionData from '@/components/DetectionDetail/DetectionDetailDetectionData';
import DetectionDetailDetectionObject from '@/components/DetectionDetail/DetectionDetailDetectionObject';
import DetectionTileHistory from '@/components/DetectionDetail/DetectionTileHistory';
import SignalementPDFData from '@/components/signalement-pdf/SignalementPDFData';
import DateInfo from '@/components/ui/DateInfo';
import Loader from '@/components/ui/Loader';
import { DetectionObjectDetail } from '@/models/detection-object';
import api from '@/utils/api';
import { formatParcel } from '@/utils/format';
import { Accordion, ActionIcon, Loader as MantineLoader, ScrollArea, Tooltip } from '@mantine/core';
import { IconCalendarClock, IconDownload, IconMap, IconMapPin, IconRoute, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { centroid } from '@turf/turf';
import { Position } from 'geojson';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classes from './index.module.scss';

const getGoogleMapLink = (point: Position) => `https://www.google.com/maps/place/${point[1]},${point[0]}`;

interface ComponentProps {
    detectionObjectUuid: string;
    detectionUuid: string;
    onClose: () => void;
}

const Component: React.FC<ComponentProps> = ({ detectionObjectUuid, detectionUuid, onClose }: ComponentProps) => {
    const [signalementPdfLoading, setSignalementPdfLoading] = useState(false);

    const fetchData = async () => {
        const res = await api.get<DetectionObjectDetail>(getDetectionObjectDetailEndpoint(detectionObjectUuid));

        return res.data;
    };
    const { data, isRefetching } = useQuery({
        queryKey: [getDetectionObjectDetailEndpoint(String(detectionObjectUuid))],
        queryFn: () => fetchData(),
    });

    if (!data) {
        return <Loader className={classes.loader} />;
    }

    const initialDetection =
        data.detections.find((detection) => detection.uuid === detectionUuid) || data.detections[0];

    const {
        geometry: { coordinates: centerPoint },
    } = centroid(initialDetection.geometry);

    const latLong = `${centerPoint[1].toFixed(5)}, ${centerPoint[0].toFixed(5)}`;

    return (
        <ScrollArea scrollbars="y" offsetScrollbars={true} classNames={{ root: classes.container }}>
            <div className={classes.inner}>
                <div className={classes['top-section']}>
                    <h1>Objet détecté #{data.id}</h1>

                    {onClose ? (
                        <ActionIcon variant="transparent" onClick={onClose}>
                            <IconX />
                        </ActionIcon>
                    ) : null}
                </div>

                <div>
                    <Tooltip label="Télécharger la fiche de signalement" position="bottom-start">
                        <ActionIcon
                            variant="transparent"
                            disabled={signalementPdfLoading}
                            onClick={() => setSignalementPdfLoading(true)}
                        >
                            {signalementPdfLoading ? <MantineLoader size="xs" /> : <IconDownload />}
                        </ActionIcon>
                    </Tooltip>

                    {signalementPdfLoading ? (
                        <SignalementPDFData
                            detectionObject={data}
                            latLong={latLong}
                            onDownloadTriggered={() => setSignalementPdfLoading(false)}
                        />
                    ) : null}
                </div>

                <Accordion variant="contained" className={classes['general-informations']} defaultValue="infos">
                    <Accordion.Item key="infos" value="infos" className={classes['general-informations-item']}>
                        <Accordion.Control>Informations générales</Accordion.Control>
                        <Accordion.Panel className={classes['general-informations-content']}>
                            <p className={classes['general-informations-content-item']}>
                                <IconRoute size={16} />
                                <span className={classes['general-informations-content-item-text']}>
                                    {data.address ? data.address : <i>Adresse non-spécifiée</i>}
                                </span>
                            </p>
                            <p className={classes['general-informations-content-item']}>
                                <IconCalendarClock size={16} />{' '}
                                <span className={classes['general-informations-content-item-text']}>
                                    Dernière mise à jour :&nbsp;
                                    <DateInfo date={data.updatedAt} />
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
                                    {latLong}
                                </Link>
                            </p>
                            <p className={classes['general-informations-content-item']}>
                                <IconMap size={16} />
                                <span className={classes['general-informations-content-item-text']}>
                                    {data.parcel ? (
                                        `Parcelle : ${formatParcel(data.parcel)}`
                                    ) : (
                                        <i>Parcelle non-spécifiée</i>
                                    )}
                                </span>
                            </p>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
                <DetectionDetailDetectionObject detectionObject={data} />
                <DetectionTileHistory detectionObject={data} />
                <DetectionDetailDetectionData
                    detectionObject={data}
                    detectionRefreshing={isRefetching}
                    initialDetection={initialDetection}
                />
            </div>
        </ScrollArea>
    );
};

export default Component;
