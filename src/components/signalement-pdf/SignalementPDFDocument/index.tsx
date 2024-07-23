import logoImg from '@/assets/logo.png';
import prefetHeraultImg from '@/assets/signalement-pdf/prefet_herault.jpg';
import { DetectionObjectDetail } from '@/models/detection-object';
import { ParcelDetail } from '@/models/parcel';
import { DEFAULT_DATE_FORMAT, DETECTION_CONTROL_STATUSES_NAMES_MAP } from '@/utils/constants';
import { formatCommune, formatParcel } from '@/utils/format';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import React from 'react';

const countSuspectObjectsParcel = (parcel: ParcelDetail, excludeObjectUuid: string): Record<string, number> => {
    const suspectObjectsMap: Record<string, number> = {};

    parcel.detectionObjects.forEach((detectionObject) => {
        if (
            detectionObject.uuid === excludeObjectUuid ||
            !detectionObject.detection ||
            detectionObject.detection.detectionData.detectionValidationStatus !== 'SUSPECT'
        ) {
            return;
        }

        if (!suspectObjectsMap[detectionObject.objectType.name]) {
            suspectObjectsMap[detectionObject.objectType.name] = 0;
        }

        suspectObjectsMap[detectionObject.objectType.name] += 1;
    });

    return suspectObjectsMap;
};

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: '32px 16px',
        fontSize: 10,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '12%',
        width: '100%',
    },
    topSectionLogoContainer: {
        width: '20%',
    },
    topSectionTextContainer: {
        fontSize: 16,
        textAlign: 'center',

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',

        gap: '8px',
    },
    topSectionLogo: {},
    subTitleContainer: {
        marginTop: '8px',
    },
    subTitle: {
        fontFamily: 'Courier-Oblique',
    },
    mainSection: {
        marginTop: '16px',
    },
    tilePreviews: {
        marginTop: '16px',

        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    tilePreviewContainer: {
        marginTop: '8px',
        width: '45%',
    },
    tilePreviewImg: {
        height: 'auto',
        width: '100%',
    },
    tilePreviewTitle: {
        marginTop: '4px',
        width: '100%',
        fontSize: 8,
        textAlign: 'center',
    },
});

export interface PreviewImage {
    index: number;
    src: string;
    title: string;
}

export interface ComponentProps {
    detectionObject: DetectionObjectDetail;
    latLong: string;
    previewImages: PreviewImage[];
    parcel?: ParcelDetail | null;
}

// Create Document Component
const Component: React.FC<ComponentProps> = ({ detectionObject, latLong, previewImages, parcel }) => {
    const suspectObjectsCount = parcel ? countSuspectObjectsParcel(parcel, detectionObject.uuid) : null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.topSection}>
                    <View style={styles.topSectionLogoContainer}>
                        <Image src={prefetHeraultImg} style={styles.topSectionLogo} />
                    </View>
                    <View style={styles.topSectionTextContainer}>
                        <Text>Fiche de signalement</Text>
                        <Text>Objet détecté #{detectionObject.id}</Text>
                    </View>
                    <View style={styles.topSectionLogoContainer}>
                        <Image src={logoImg} style={styles.topSectionLogo} />
                    </View>
                </View>

                <View style={styles.subTitleContainer}>
                    <Text style={styles.subTitle}>
                        Potentielle infraction au code de l&apos;urbanisme et/ou de l&apos;environnement
                    </Text>
                </View>

                <View style={styles.mainSection}>
                    <Text>
                        Commune de{' '}
                        {detectionObject.parcel?.commune
                            ? formatCommune(detectionObject.parcel.commune, 'CODE_AFTER_NAME')
                            : 'Commune non-spécifiée'}
                    </Text>
                    <Text>
                        Parcelle :{' '}
                        {detectionObject.parcel ? formatParcel(detectionObject.parcel) : 'Parcelle non-spécifiée'}
                    </Text>
                    <Text>Coordonnées GPS : {latLong}</Text>
                    <Text>Objet signalé : {detectionObject.objectType.name}</Text>
                    <Text>Zones à enjeux : {parcel?.customGeoZones.map((zone) => zone.name).join(', ')}</Text>
                    <Text>
                        Statut:{' '}
                        {
                            DETECTION_CONTROL_STATUSES_NAMES_MAP[
                                detectionObject.detections[0].detectionData.detectionControlStatus
                            ]
                        }
                    </Text>
                    <Text>
                        Date de la dernière modification : {format(detectionObject.updatedAt, DEFAULT_DATE_FORMAT)}
                    </Text>
                    {suspectObjectsCount ? (
                        <Text>
                            Autre objets suspects sur la parcelle :{' '}
                            {Object.keys(suspectObjectsCount)
                                .map((key) => `${key} : ${suspectObjectsCount[key]}`)
                                .join(', ')}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.tilePreviews}>
                    {previewImages.map(({ src, title }, index) => (
                        <View key={index} style={styles.tilePreviewContainer}>
                            <Image src={src} style={styles.tilePreviewImg} />
                            <Text style={styles.tilePreviewTitle}>{title}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default Component;
