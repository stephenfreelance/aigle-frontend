import { DETECTION_DATA_POST_ENDPOINT, getDetectionObjectDetailEndpoint } from '@/api-endpoints';
import DetectionTilePreview from '@/components/DetectionDetail/DetectionTilePreview';
import ErrorCard from '@/components/ErrorCard';
import {
    DetectionControlStatus,
    DetectionValidationStatus,
    DetectionWithTile,
    detectionControlStatuses,
    detectionValidationStatuses,
} from '@/models/detection';
import { DetectionObjectDetail } from '@/models/detection-object';
import api from '@/utils/api';
import {
    DETECTION_CONTROL_STATUSES_NAMES_MAP,
    DETECTION_VALIDATION_STATUSES_COLORS_MAP,
    DETECTION_VALIDATION_STATUSES_NAMES_MAP,
} from '@/utils/constants';
import { useMap } from '@/utils/map-context';
import { Button, Loader as MantineLoader, Select } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { bbox } from '@turf/turf';
import { AxiosError } from 'axios';
import React, { useMemo, useState } from 'react';
import classes from './index.module.scss';

interface FormValues {
    detectionControlStatus: DetectionControlStatus;
    detectionValidationStatus: DetectionValidationStatus;
}

const postForm = async (uuid: string, values: FormValues) => {
    const res = await api.patch(`${DETECTION_DATA_POST_ENDPOINT}${uuid}/`, values);
    return res.data;
};

interface FormProps {
    detectionObjectUuid: string;
    uuid: string;
    initialValues: FormValues;
}

const Form: React.FC<FormProps> = ({ detectionObjectUuid, uuid, initialValues }) => {
    const [error, setError] = useState<AxiosError>();
    const { eventEmitter } = useMap();

    const form: UseFormReturnType<FormValues> = useForm({
        initialValues,
    });
    const queryClient = useQueryClient();

    const mutation: UseMutationResult<FormValues, AxiosError, FormValues> = useMutation({
        mutationFn: (values: FormValues) => postForm(uuid, values),
        onSuccess: (values: FormValues) => {
            queryClient.setQueryData(
                [getDetectionObjectDetailEndpoint(String(detectionObjectUuid))],
                (prev: DetectionObjectDetail) => {
                    const detectionDataIndex = prev.detections.findIndex(
                        (detection) => detection.detectionData.uuid === uuid,
                    );

                    if (detectionDataIndex === -1) {
                        return prev;
                    }

                    prev.detections[detectionDataIndex].detectionData = {
                        ...prev.detections[detectionDataIndex].detectionData,
                        ...values,
                    };
                },
            );
            eventEmitter.emit('UPDATE_DETECTIONS');
        },
        onError: (error) => {
            setError(error);
            if (error.response?.data) {
                // @ts-expect-error types do not match
                form.setErrors(error.response?.data);
            }
        },
    });
    const submit = async () => {
        const formValues = form.getValues();
        await handleSubmit(formValues);
    };
    form.watch('detectionControlStatus', submit);
    form.watch('detectionValidationStatus', submit);

    const handleSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)} className={classes.form}>
            {error ? (
                <ErrorCard>
                    <p>Voir les indications ci-dessous pour plus d&apos;info</p>
                </ErrorCard>
            ) : null}
            <Select
                allowDeselect={false}
                label="Status du contrôle"
                data={detectionControlStatuses.map((status) => ({
                    value: status,
                    label: DETECTION_CONTROL_STATUSES_NAMES_MAP[status],
                }))}
                key={form.key('detectionControlStatus')}
                disabled={mutation.status === 'pending'}
                rightSection={mutation.status === 'pending' ? <MantineLoader size="xs" /> : null}
                {...form.getInputProps('detectionControlStatus')}
            />

            <div className={classes['detection-validation-status-select-container']}>
                {detectionValidationStatuses.map((status) => (
                    <Button
                        variant={form.values.detectionValidationStatus === status ? 'filled' : 'outline'}
                        color={DETECTION_VALIDATION_STATUSES_COLORS_MAP[status]}
                        key={status}
                        disabled={mutation.status === 'pending'}
                        onClick={() => form.setFieldValue('detectionValidationStatus', status)}
                    >
                        {DETECTION_VALIDATION_STATUSES_NAMES_MAP[status]}
                    </Button>
                ))}
            </div>
        </form>
    );
};

interface ComponentProps {
    detectionObject: DetectionObjectDetail;
}
const Component: React.FC<ComponentProps> = ({ detectionObject }) => {
    const [detectionSelected, setDetectionSelected] = useState<DetectionWithTile>(detectionObject.detections[0]);

    const previewBounds = useMemo(
        () => bbox(detectionObject.detections[0].tile.geometry) as [number, number, number, number],
        [detectionObject],
    );

    return (
        <div className={classes.container}>
            <h2 className={classes.title}>Editer une détection</h2>
            <Select
                allowDeselect={false}
                label="Source d'image"
                data={detectionObject.detections.map((detection) => ({
                    value: detection.uuid,
                    label: detection.tileSet.name,
                }))}
                value={detectionSelected.uuid}
                onChange={(detectionUuid) => {
                    const detection = detectionObject.detections.find((detection) => detection.uuid === detectionUuid);

                    if (!detection) {
                        return;
                    }
                    setDetectionSelected(detection);
                }}
                mb="md"
            />
            <div className={classes['detection-tile-preview-container']}>
                <DetectionTilePreview
                    bounds={previewBounds}
                    detection={detectionSelected}
                    color={detectionObject.objectType.color}
                    tileSet={detectionSelected.tileSet}
                    displayName={false}
                />
            </div>

            <Form
                key={detectionSelected.detectionData.uuid}
                detectionObjectUuid={detectionObject.uuid}
                uuid={detectionSelected.detectionData.uuid}
                initialValues={{
                    detectionControlStatus: detectionSelected.detectionData.detectionControlStatus,
                    detectionValidationStatus: detectionSelected.detectionData.detectionValidationStatus,
                }}
            />
        </div>
    );
};

export default Component;
