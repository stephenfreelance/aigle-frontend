import { DETECTION_POST_ENDPOINT } from '@/api-endpoints';
import { DetectionDetail, DetectionObject } from '@/models/detection';
import api from '@/utils/api';
import { useMap } from '@/utils/map-context';
import { Select } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import React, { useState } from 'react';
import classes from './index.module.scss';

interface FormValues {
    objectTypeUuid: string;
}

const postForm = async (detectionUuid: string, values: FormValues) => {
    const response = await api.patch(`${DETECTION_POST_ENDPOINT}${detectionUuid}/`, values);
    return response.data;
};

interface ComponentProps {
    detection: DetectionDetail;
}
const Component: React.FC<ComponentProps> = ({ detection }) => {
    const [error, setError] = useState<AxiosError>();
    const { objectTypes, eventEmitter } = useMap();
    const form: UseFormReturnType<FormValues> = useForm({
        initialValues: {
            objectTypeUuid: detection.detectionObject.objectType.uuid,
        },
    });
    form.watch('objectTypeUuid', () => {
        const formValues = form.getValues();
        handleSubmit(formValues);
    });

    const mutation: UseMutationResult<DetectionObject, AxiosError, FormValues> = useMutation({
        mutationFn: (values: FormValues) => postForm(detection.uuid, values),
        onSuccess: () => {
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

    const handleSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    return (
        <form className={classes.container} onSubmit={form.onSubmit(handleSubmit)}>
            {objectTypes ? (
                <Select
                    label="Type d'objet"
                    data={objectTypes.map((type) => ({
                        value: type.uuid,
                        label: type.name,
                    }))}
                    key={form.key('objectTypeUuid')}
                    {...form.getInputProps('objectTypeUuid')}
                />
            ) : undefined}
        </form>
    );
};

export default Component;
