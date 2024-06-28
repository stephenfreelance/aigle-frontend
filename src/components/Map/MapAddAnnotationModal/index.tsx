import { DETECTION_POST_ENDPOINT } from '@/api-endpoints';
import InfoCard from '@/components/InfoCard';
import Loader from '@/components/Loader';
import { DetectionObject } from '@/models/detection';
import { MapLayer } from '@/models/map-layer';
import { ObjectType } from '@/models/object-type';
import api from '@/utils/api';
import { MAPBOX_TOKEN } from '@/utils/constants';
import { LngLat } from '@/utils/geojson';
import { useMap } from '@/utils/map-context';
import { Button, Modal, Select } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconShape } from '@tabler/icons-react';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import { booleanWithin, centroid, getCoord } from '@turf/turf';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { Polygon } from 'geojson';
import React, { useEffect, useMemo, useState } from 'react';
import classes from './index.module.scss';

const getAddressFromLatLng = async ([lng, lat]: LngLat): Promise<string | null> => {
    const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${MAPBOX_TOKEN}`,
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
        const address = data.features[0].properties.name_preferred;
        return address;
    } else {
        return null;
    }
};

interface FormValues {
    objectTypeUuid: string;
}

const postForm = async (values: FormValues, tileSetUuid: string, polygon: Polygon, address: string | null) => {
    const response = await api.post(`${DETECTION_POST_ENDPOINT}`, {
        detectionObject: {
            objectTypeUuid: values.objectTypeUuid,
            address,
        },
        tileSetUuid,
        geometry: polygon,
    });
    return response.data;
};

interface FormProps {
    objectTypes: ObjectType[];
    layers: MapLayer[];
    polygon: Polygon;
    hide: () => void;
}

const Form: React.FC<FormProps> = ({ objectTypes, layers, polygon, hide }) => {
    const { eventEmitter } = useMap();
    const form: UseFormReturnType<FormValues> = useForm({
        initialValues: {
            objectTypeUuid: objectTypes[0].uuid,
        },
    });
    const [address, setAddress] = useState<string | null | undefined>();
    useEffect(() => {
        const getAddress = async () => {
            const polygonCenter = getCoord(centroid(polygon)) as LngLat;
            const address = await getAddressFromLatLng(polygonCenter);
            setAddress(address);
        };

        getAddress();
    }, [polygon]);

    const tileSet = useMemo(() => {
        const polygonCenter = centroid(polygon);
        // get the first displayed layer that contains the annotation
        const layer = layers
            .filter((layer) => ['BACKGROUND', 'PARTIAL'].includes(layer.tileSet.tileSetType) && layer.displayed)
            .find((layer) => !layer.tileSet.geometry || booleanWithin(polygonCenter, layer.tileSet.geometry));

        if (!layer) {
            notifications.show({
                color: 'red',
                title: "Erreur lors de l'ajout d'une annotation",
                message: "Assurez-vous de dessiner l'annotation sur une couche visible",
            });
            hide();
            return null;
        }

        return layer.tileSet;
    }, [layers, polygon]);

    const mutation: UseMutationResult<DetectionObject, AxiosError, FormValues> = useMutation({
        mutationFn: (values: FormValues) => postForm(values, tileSet?.uuid || '', polygon, address || null),
        onSuccess: () => {
            eventEmitter.emit('UPDATE_DETECTIONS');
            notifications.show({
                title: "Ajout d'une annotation",
                message: `L'annotation a été créée avec succès`,
            });
            hide();
        },
        onError: (error) => {
            if (error.response?.data) {
                // @ts-expect-error types do not match
                form.setErrors(error.response?.data);
                notifications.show({
                    color: 'red',
                    title: 'Erreur',
                    message: 'Une erreur est survenue lors de la création de la détection',
                });
            }
        },
    });

    const handleSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)} className={clsx('compact', classes.form)}>
            <InfoCard title="Informations sur l'annotation" withCloseButton={false}>
                <ul>
                    <li>
                        Fond de carte associé: <b>{tileSet?.name}</b>
                    </li>
                    <li>
                        Addresse: <b>{address === undefined ? 'Chargement...' : address || 'Inconnue'}</b>
                    </li>
                </ul>
            </InfoCard>
            <Select
                allowDeselect={false}
                label="Type d'objet"
                data={objectTypes.map((type) => ({
                    value: type.uuid,
                    label: type.name,
                }))}
                key={form.key('objectTypeUuid')}
                {...form.getInputProps('objectTypeUuid')}
            />

            <div className="form-actions">
                <Button type="button" variant="outline" onClick={hide}>
                    Annuler
                </Button>

                <Button type="submit" leftSection={<IconShape />}>
                    Ajouter l&apos;annotation
                </Button>
            </div>
        </form>
    );
};

interface ComponentProps {
    isShowed: boolean;
    hide: () => void;
    polygon?: Polygon;
}
const Component: React.FC<ComponentProps> = ({ isShowed, polygon, hide }) => {
    const { objectTypes, layers } = useMap();

    if (!isShowed || !polygon) {
        return null;
    }

    if (!layers) {
        return <Loader />;
    }

    return (
        <Modal opened={isShowed} onClose={hide} title="Ajouter une annotation">
            {objectTypes ? (
                <Form objectTypes={objectTypes} layers={layers} polygon={polygon} hide={hide} />
            ) : (
                <Loader />
            )}
        </Modal>
    );
};

export default Component;
