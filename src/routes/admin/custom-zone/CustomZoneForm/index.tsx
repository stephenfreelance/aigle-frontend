import React, { useState } from 'react';

import { GEO_CUSTOM_ZONE_POST_ENDPOINT, getGeoCustomZoneDetailEndpoint } from '@/api-endpoints';
import Map from '@/components/Map';
import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import ErrorCard from '@/components/ui/ErrorCard';
import Loader from '@/components/ui/Loader';
import { MapTileSetLayer } from '@/models/map-layer';
import api from '@/utils/api';
import { TILES_URL_FALLBACK } from '@/utils/constants';
import { Button, Card, ColorInput, JsonInput, TextInput } from '@mantine/core';
import { UseFormReturnType, isNotEmpty, useForm } from '@mantine/form';
import { IconHexagonPlus2 } from '@tabler/icons-react';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { formatISO } from 'date-fns';
import { Geometry } from 'geojson';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { GeoCustomZoneDetail } from '@/models/geo/geo-custom-zone';
import { geojsonType } from '@turf/turf';
import classes from './index.module.scss';

const BACK_URL = '/admin/custom-zones';

interface MapPreviewProps {
    key: string;
    name: string;
    geometry: Geometry;
}

const MapPreview: React.FC<MapPreviewProps> = ({ name, geometry }) => {
    const fakeDate = formatISO(new Date());
    const layers: MapTileSetLayer[] = [
        {
            displayed: true,
            tileSet: {
                createdAt: fakeDate,
                updatedAt: fakeDate,
                uuid: 'fake-uuid',
                date: fakeDate,
                name: name,
                url: TILES_URL_FALLBACK,
                tileSetStatus: 'VISIBLE',
                tileSetScheme: 'xyz',
                tileSetType: 'BACKGROUND',
                geometry,
            },
        },
    ];

    return (
        <Card withBorder className={classes['map-preview-container']}>
            <h2>Aperçu des limites</h2>
            <div className={classes['map-preview-content']}>
                <Map
                    displayDetections={false}
                    layers={layers}
                    displayLayersGeometry={true}
                    boundLayers={false}
                    fitBoundsFirstLayer={true}
                />
            </div>
        </Card>
    );
};

interface FormValues {
    name: string;
    color: string;
    geometry: string;
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
    const [mapPreviewProps, setMapPreviewProps] = useState<MapPreviewProps>({
        name: initialValues.name,
        geometry: initialValues.geometry ? JSON.parse(initialValues.geometry) : null,
        key: crypto.randomUUID(),
    });

    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues,
        validate: {
            name: isNotEmpty("Le nom d'de la zone est requis"),
            geometry: (value) => {
                if (!value) {
                    return null;
                }

                let isValid = false;
                let valueParsed: object;

                const error = 'Le format de la geométrie est invalide';

                try {
                    valueParsed = JSON.parse(value);
                } catch {
                    return error;
                }

                try {
                    geojsonType(valueParsed, 'Polygon', 'isGeoJsonPolygon');
                    isValid = true;
                } catch {}

                try {
                    geojsonType(valueParsed, 'MultiPolygon', 'isGeoJsonMultiPolygon');
                    isValid = true;
                } catch {}

                if (!isValid) {
                    return error;
                }

                return null;
            },
        },
    });
    form.watch('geometry', ({ value }) =>
        setMapPreviewProps((prev) => {
            const newGeometry = form.isValid('geometry') && value ? JSON.parse(value) : null;

            return {
                ...prev,
                geometry: newGeometry,
                key: newGeometry !== prev.geometry ? crypto.randomUUID() : prev.key,
            };
        }),
    );
    form.watch('name', ({ value }) =>
        setMapPreviewProps((prev) => ({
            ...prev,
            name: value,
        })),
    );

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
            <JsonInput
                mt="md"
                label="Géométrie de la zone"
                description="GeoJson de type 'Polygon' correspondant aux limites du fond de carte."
                formatOnBlur
                autosize
                resize="vertical"
                minRows={4}
                maxRows={8}
                mb="md"
                validationError="Le format de la geométrie est invalide"
                key={form.key('geometry')}
                {...form.getInputProps('geometry')}
            />

            <MapPreview {...mapPreviewProps} key={mapPreviewProps.key} />

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
    geometry: '',
};

interface ComponentInnerProps {
    uuid?: string;
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ uuid }) => {
    const fetchData = async () => {
        if (!uuid) {
            return;
        }

        const res = await api.get<GeoCustomZoneDetail>(getGeoCustomZoneDetailEndpoint(uuid));
        const initialValues: FormValues = {
            name: res.data.name,
            color: res.data.color,
            geometry: JSON.stringify(res.data.geometry, null, 2),
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
