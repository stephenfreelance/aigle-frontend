import { DETECTION_OBJECT_POST_ENDPOINT, getDetectionObjectDetailEndpoint } from '@/api-endpoints';
import { DetectionObjectDetail } from '@/models/detection-object';
import api from '@/utils/api';
import { useMap } from '@/utils/map-context';
import { Loader as MantineLoader, Select } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import React from 'react';
import classes from './index.module.scss';

interface FormValues {
    objectTypeUuid: string;
}

const postForm = async (detectionUuid: string, values: FormValues) => {
    await api.patch(`${DETECTION_OBJECT_POST_ENDPOINT}${detectionUuid}/`, values);
};

interface ComponentProps {
    detectionObject: DetectionObjectDetail;
}
const Component: React.FC<ComponentProps> = ({ detectionObject }) => {
    const { objectTypes, eventEmitter } = useMap();
    const form: UseFormReturnType<FormValues> = useForm({
        initialValues: {
            objectTypeUuid: detectionObject.objectType.uuid,
        },
    });
    form.watch('objectTypeUuid', () => {
        const formValues = form.getValues();
        handleSubmit(formValues);
    });

    const queryClient = useQueryClient();

    const mutation: UseMutationResult<void, AxiosError, FormValues> = useMutation({
        mutationFn: (values: FormValues) => postForm(detectionObject.uuid, values),
        onSuccess: () => {
            queryClient.setQueryData(
                [getDetectionObjectDetailEndpoint(detectionObject.uuid)],
                (prev: DetectionObjectDetail) => {
                    const objectTypeUuid = form.getValues().objectTypeUuid;
                    const objectType = (objectTypes || []).find((ot) => ot.uuid === objectTypeUuid);

                    if (!objectType) {
                        return prev;
                    }

                    return {
                        ...prev,
                        objectType,
                    };
                },
            );
            eventEmitter.emit('UPDATE_DETECTIONS');
            notifications.show({
                title: 'Mise à jour de la détection',
                message: `L'objet #${detectionObject.id} a été mise à jour avec succès.`,
            });
        },
        onError: (error) => {
            if (error.response?.data) {
                // @ts-expect-error types do not match
                form.setErrors(error.response?.data);
                notifications.show({
                    color: 'red',
                    title: 'Erreur',
                    message: "Une erreur est survenue lors de la mise à jour de l'objet",
                });
            }
        },
    });

    const handleSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    return (
        <form className={classes.container} onSubmit={form.onSubmit(handleSubmit)}>
            {objectTypes ? (
                <Select
                    allowDeselect={false}
                    label="Type d'objet"
                    data={objectTypes.map((type) => ({
                        value: type.uuid,
                        label: type.name,
                    }))}
                    key={form.key('objectTypeUuid')}
                    disabled={mutation.status === 'pending'}
                    rightSection={mutation.status === 'pending' ? <MantineLoader size="xs" /> : null}
                    {...form.getInputProps('objectTypeUuid')}
                />
            ) : undefined}
        </form>
    );
};

export default Component;
