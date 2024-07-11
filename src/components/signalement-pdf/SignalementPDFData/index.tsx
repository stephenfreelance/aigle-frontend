import React, { useCallback, useEffect, useState } from 'react';

import { getDetectionParcelDetailEndpoint } from '@/api-endpoints';
import DetectionTilePreview from '@/components/DetectionDetail/DetectionTilePreview';
import SignalementPDFDocument, {
    PreviewImage,
    ComponentProps as SignalementPDFDocumentProps,
} from '@/components/signalement-pdf/SignalementPDFDocument';
import { DetectionWithTile } from '@/models/detection';
import { DetectionObjectDetail } from '@/models/detection-object';
import { ParcelDetail } from '@/models/parcel';
import { TileSet } from '@/models/tile-set';
import api from '@/utils/api';
import { DEFAULT_DATE_FORMAT } from '@/utils/constants';
import { formatParcel } from '@/utils/format';
import { usePDF } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import { bbox } from '@turf/turf';
import { format } from 'date-fns';
import classes from './index.module.scss';

const fetchParcelDetail = async (uuid: string) => {
    const res = await api.get<ParcelDetail>(getDetectionParcelDetailEndpoint(uuid));

    return res.data;
};

const getSignalementPDFDocumentName = (detectionObject: DetectionObjectDetail) => {
    let name = 'signalement ';

    if (detectionObject.parcel) {
        name += `${formatParcel(detectionObject.parcel)} `;
    }

    name += `- ${format(new Date(), 'dd-MM-yyyy-HH-mm-ss')}`;

    return name;
};

interface DocumentContainerProps extends SignalementPDFDocumentProps {
    onDownloadTriggered: () => void;
}

const DocumentContainer: React.FC<DocumentContainerProps> = ({ onDownloadTriggered, ...pdfProps }) => {
    const pdfDocument = <SignalementPDFDocument {...pdfProps} />;

    const [instance] = usePDF({ document: pdfDocument });

    useEffect(() => {
        if (instance.blob) {
            const url = URL.createObjectURL(instance.blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = getSignalementPDFDocumentName(pdfProps.detectionObject);

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onDownloadTriggered();
        }
    }, [instance.blob]);

    return <></>;
};

const PLAN_URL_TILESET: TileSet = {
    date: '2024-07-08T16:00:31Z',
    name: 'Plan',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileSetStatus: 'VISIBLE',
    tileSetScheme: 'xyz',
    tileSetType: 'BACKGROUND',
    minZoom: null,
    maxZoom: null,
    uuid: 'e55bfa81-a6dd-407c-a1f1-70bc2211a11c',
    createdAt: '2024-07-08T16:00:31Z',
    updatedAt: '2024-07-08T16:00:31Z',
};

const getPreviewId = (tileSetUuid: string) => `preview-${tileSetUuid}`;

interface ComponentProps {
    detectionObject: DetectionObjectDetail;
    latLong: string;
    onDownloadTriggered: () => void;
}
const Component: React.FC<ComponentProps> = ({ detectionObject, latLong, onDownloadTriggered }: ComponentProps) => {
    const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
    const { data: parcel, isLoading: parcelIsLoading } = useQuery({
        queryKey: [getDetectionParcelDetailEndpoint(String(detectionObject.parcel?.uuid))],
        enabled: !!detectionObject.parcel?.uuid,
        queryFn: () => fetchParcelDetail(detectionObject.parcel?.uuid),
    });

    const previewBounds = bbox(detectionObject.detections[0].tile.geometry) as [number, number, number, number];
    const tileSetsToRender = detectionObject.tileSets.filter(({ preview }) => preview).reverse();

    const tileSetUuidsDetectionsMap = detectionObject.detections.reduce<Record<string, DetectionWithTile>>(
        (prev, curr) => {
            prev[curr.tileSet.uuid] = curr;
            return prev;
        },
        {},
    );

    const getPreviewImage = useCallback((uuid: string, title: string, index: number) => {
        const id = getPreviewId(uuid);
        const canvas = document.querySelector(`#${id} canvas`);
        const src = (canvas as HTMLCanvasElement).toDataURL('image/png');

        setPreviewImages((prev) => [
            ...prev,
            {
                index,
                src,
                title,
            },
        ]);
    }, []);

    if (parcelIsLoading) {
        return null;
    }

    return (
        <div className={classes.container}>
            SignalementPDFdata {detectionObject.id} {latLong}
            {tileSetsToRender.map(({ tileSet }, index) => (
                <DetectionTilePreview
                    geometries={[
                        ...(tileSetUuidsDetectionsMap[tileSet.uuid]?.geometry
                            ? [
                                  {
                                      geometry: tileSetUuidsDetectionsMap[tileSet.uuid].geometry,
                                      color: detectionObject.objectType.color,
                                  },
                              ]
                            : []),
                        ...(parcel?.geometry ? [{ geometry: parcel.geometry, color: '#FF6F00' }] : []),
                    ]}
                    tileSet={tileSet}
                    key={tileSet.uuid}
                    bounds={previewBounds}
                    classNames={{
                        main: classes['detection-tile-preview-detail'],
                        inner: classes['detection-tile-preview-inner'],
                    }}
                    id={getPreviewId(tileSet.uuid)}
                    displayName={false}
                    onIdle={() => getPreviewImage(tileSet.uuid, format(tileSet.date, DEFAULT_DATE_FORMAT), index)}
                    extended={true}
                />
            ))}
            <DetectionTilePreview
                tileSet={PLAN_URL_TILESET}
                bounds={previewBounds}
                classNames={{
                    main: classes['detection-tile-preview-detail'],
                    inner: classes['detection-tile-preview-inner'],
                }}
                id={getPreviewId(PLAN_URL_TILESET.uuid)}
                displayName={false}
                onIdle={() => getPreviewImage(PLAN_URL_TILESET.uuid, 'Plan', tileSetsToRender.length)}
                extended={true}
            />
            {previewImages.length === tileSetsToRender.length + 1 ? (
                <DocumentContainer
                    detectionObject={detectionObject}
                    latLong={latLong}
                    previewImages={previewImages.sort((a, b) => a.index - b.index)}
                    onDownloadTriggered={onDownloadTriggered}
                />
            ) : null}
        </div>
    );
};

export default Component;
