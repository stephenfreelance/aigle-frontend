import { DETECTION_POST_ENDPOINT } from '@/api-endpoints';
import Loader from '@/components/Loader';
import { DetectionObject } from '@/models/detection';
import { ObjectType } from '@/models/object-type';
import api from '@/utils/api';
import { useMap } from '@/utils/map-context';
import { Button, Modal, Select } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconShape } from '@tabler/icons-react';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import { Polygon } from 'geojson';
import React from 'react';
import classes from './index.module.scss';

interface FormValues {
    objectTypeUuid: string;
}

const postForm = async (values: FormValues) => {
    const response = await api.patch(`${DETECTION_POST_ENDPOINT}`, values);
    return response.data;
};

interface FormProps {
    objectTypes: ObjectType[];
    hide: () => void;
}

const Form: React.FC<FormProps> = ({ objectTypes, hide }) => {
    const { eventEmitter } = useMap();
    const form: UseFormReturnType<FormValues> = useForm({
        initialValues: {
            objectTypeUuid: objectTypes[0].uuid,
        },
    });

    const mutation: UseMutationResult<DetectionObject, AxiosError, FormValues> = useMutation({
        mutationFn: (values: FormValues) => postForm(values),
        onSuccess: (data) => {
            console.log({ data });
            eventEmitter.emit('UPDATE_DETECTIONS');
            notifications.show({
                title: "Ajout d'une annotation",
                message: `L'annotation a été créée avec succès`,
            });
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
const Component: React.FC<ComponentProps> = ({ isShowed, hide }) => {
    const { objectTypes } = useMap();

    if (!isShowed) {
        return null;
    }

    return (
        <Modal opened={isShowed} onClose={hide} title="Ajouter une annotation">
            {objectTypes ? <Form objectTypes={objectTypes} hide={hide} /> : <Loader />}
        </Modal>
    );
};

export default Component;
