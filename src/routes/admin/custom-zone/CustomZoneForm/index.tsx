import React, { useState } from 'react';

import { GEO_CUSTOM_ZONE_POST_ENDPOINT, getGeoCustomZoneDetailEndpoint } from '@/api-endpoints';
import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import ErrorCard from '@/components/ui/ErrorCard';
import Loader from '@/components/ui/Loader';
import api from '@/utils/api';
import { Button, ColorInput, Select, TextInput } from '@mantine/core';
import { UseFormReturnType, isNotEmpty, useForm } from '@mantine/form';
import { IconHexagonPlus2 } from '@tabler/icons-react';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
    GeoCustomZone,
    GeoCustomZoneDetail,
    GeoCustomZoneStatus,
    geoCustomZoneStatuses,
} from '@/models/geo/geo-custom-zone';
import { GEO_CUSTOM_ZONE_STATUSES_NAMES_MAP } from '@/utils/constants';

const BACK_URL = '/admin/custom-zones';

interface FormValues {
    name: string;
    color: string;
    geoCustomZoneStatus: GeoCustomZoneStatus;
}

const postForm = async (values: FormValues, uuid?: string) => {
    if (!uuid) {
        const response = await api.post(GEO_CUSTOM_ZONE_POST_ENDPOINT, values);
        return response.data;
    } else {
        const response = await api.patch(getGeoCustomZoneDetailEndpoint(uuid), values);
        return response.data;
    }
};

interface FormProps {
    uuid?: string;
    initialValues: FormValues;
}

const Form: React.FC<FormProps> = ({ uuid, initialValues }) => {
    const [error, setError] = useState<AxiosError>();
    const navigate = useNavigate();

    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues,
        validate: {
            name: isNotEmpty("Le nom d'de la zone est requis"),
        },
    });

    const mutation: UseMutationResult<GeoCustomZoneDetail, AxiosError, FormValues> = useMutation({
        mutationFn: (values: FormValues) => postForm(values, uuid),
        onSuccess: () => {
            navigate(BACK_URL);
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

    const label = uuid ? 'Modifier une zone' : 'Ajouter une zone';

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <h1>{label}</h1>
            {error ? (
                <ErrorCard>
                    <p>Voir les indications ci-dessous pour plus d&apos;info</p>
                </ErrorCard>
            ) : null}
            <TextInput
                mt="md"
                withAsterisk
                label="Nom de la zone"
                placeholder="Ma zone"
                key={form.key('name')}
                {...form.getInputProps('name')}
            />
            <ColorInput
                mt="md"
                withAsterisk
                label="Couleur de la zone"
                placeholder="#000000"
                key={form.key('color')}
                {...form.getInputProps('color')}
            />

            <Select
                allowDeselect={false}
                label="Statut"
                withAsterisk
                mt="md"
                data={geoCustomZoneStatuses.map((role) => ({
                    value: role,
                    label: GEO_CUSTOM_ZONE_STATUSES_NAMES_MAP[role],
                }))}
                key={form.key('geoCustomZoneStatus')}
                {...form.getInputProps('geoCustomZoneStatus')}
            />

            <div className="form-actions">
                <Button
                    disabled={mutation.status === 'pending'}
                    type="button"
                    variant="outline"
                    component={Link}
                    to={BACK_URL}
                >
                    Annuler
                </Button>

                <Button disabled={mutation.status === 'pending'} type="submit" leftSection={<IconHexagonPlus2 />}>
                    {label}
                </Button>
            </div>
        </form>
    );
};

const EMPTY_FORM_VALUES: FormValues = {
    name: '',
    color: '',
    geoCustomZoneStatus: 'ACTIVE',
};

interface ComponentInnerProps {
    uuid?: string;
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ uuid }) => {
    const fetchData = async () => {
        if (!uuid) {
            return;
        }

        const res = await api.get<GeoCustomZone>(getGeoCustomZoneDetailEndpoint(uuid));
        const initialValues: FormValues = {
            name: res.data.name,
            color: res.data.color,
            geoCustomZoneStatus: res.data.geoCustomZoneStatus,
        };

        return initialValues;
    };

    const {
        isLoading,
        error,
        data: initialValues,
    } = useQuery({
        queryKey: [getGeoCustomZoneDetailEndpoint(String(uuid))],
        enabled: !!uuid,
        queryFn: () => fetchData(),
    });

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <ErrorCard>{error.message}</ErrorCard>;
    }

    return <Form uuid={uuid} initialValues={initialValues || EMPTY_FORM_VALUES} />;
};

const Component: React.FC = () => {
    const { uuid } = useParams();

    return (
        <LayoutAdminForm backText="Liste des zones" backUrl={BACK_URL}>
            <ComponentInner uuid={uuid} />
        </LayoutAdminForm>
    );
};

export default Component;
