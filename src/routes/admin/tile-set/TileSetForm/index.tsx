import React, { useState } from 'react';

import { TILE_SET_POST_ENDPOINT, getTileSetDetailEndpoint } from '@/api-endpoints';
import ErrorCard from '@/components/ErrorCard';
import InfoCard from '@/components/InfoCard';
import Loader from '@/components/Loader';
import Map from '@/components/Map';
import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import { MapLayer } from '@/models/map-layer';
import {
    TileSet,
    TileSetScheme,
    TileSetStatus,
    TileSetType,
    tileSetSchemes,
    tileSetStatuses,
    tileSetTypes,
} from '@/models/tile-set';
import api from '@/utils/api';
import { TILE_SET_STATUSES_NAMES_MAP, TILE_SET_TYPES_NAMES_MAP } from '@/utils/constants';
import { isPolygon } from '@/utils/geojson';
import { Button, Card, JsonInput, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { UseFormReturnType, isNotEmpty, useForm } from '@mantine/form';
import { IconMapPlus } from '@tabler/icons-react';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { formatISO, parse } from 'date-fns';
import { Polygon } from 'geojson';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classes from './index.module.scss';

const BACK_URL = '/admin/tile-sets';

interface MapPreviewProps {
    url?: string;
    type: TileSetType;
    scheme: TileSetScheme;
    name: string;
    geometry?: Polygon;
}

const MapPreview: React.FC<MapPreviewProps> = ({ url, scheme, name, type, geometry }) => {
    const fakeDate = formatISO(new Date());
    const layers: MapLayer[] = [
        {
            displayed: true,
            tileSet: {
                createdAt: fakeDate,
                updatedAt: fakeDate,
                uuid: 'fake-uuid',
                date: fakeDate,
                name: name,
                url: url || '',
                tileSetStatus: 'VISIBLE',
                tileSetScheme: scheme,
                tileSetType: type,
                geometry,
            },
        },
    ];

    return (
        <Card withBorder className={classes['map-preview-container']}>
            <h2>Aperçu du fond de carte</h2>
            <InfoCard title="Paramètres de l'apperçu">
                <p>La carte est centrée sur la préfecture de l&apos;Hérault avec un zoom 16 par défault</p>
                <p>
                    Le carré autour de la zone de limite définie la zone dans laquelle les tuiles seront chargées pour
                    l&apos;affichage de la carte
                </p>
            </InfoCard>
            <div>
                {url ? (
                    <div className={classes['map-preview-content']}>
                        <Map
                            displayDetections={false}
                            layers={layers}
                            displayLayersGeometry={true}
                            boundLayers={false}
                        />
                    </div>
                ) : (
                    <p>L&apos;aperçu du fond de carte apparaîtra ici quand un url valide sera spécifié</p>
                )}
            </div>
        </Card>
    );
};
interface FormValues {
    name: string;
    url: string;
    tileSetStatus: TileSetStatus;
    tileSetScheme: TileSetScheme;
    tileSetType: TileSetType;
    date?: Date;
    geometry?: string;
}

const postForm = async (values: FormValues, uuid?: string) => {
    let response: AxiosResponse<TileSet>;
    const values_ = {
        ...values,
        geometry: values.geometry ? JSON.parse(values.geometry) : null,
    };

    if (uuid) {
        response = await api.patch(getTileSetDetailEndpoint(uuid), values_);
    } else {
        response = await api.post(TILE_SET_POST_ENDPOINT, values_);
    }

    return response.data;
};

interface FormProps {
    uuid?: string;
    initialValues: FormValues;
}

const Form: React.FC<FormProps> = ({ uuid, initialValues }) => {
    const [error, setError] = useState<AxiosError>();
    const navigate = useNavigate();
    const [mapPreviewProps, setMapPreviewProps] = useState<MapPreviewProps>({
        url: initialValues.url,
        scheme: initialValues.tileSetScheme,
        name: initialValues.name,
        type: initialValues.tileSetType,
        geometry: initialValues.geometry ? JSON.parse(initialValues.geometry) : null,
    });

    const form: UseFormReturnType<FormValues> = useForm({
        initialValues,
        validate: {
            name: isNotEmpty('Le nom du type est requis'),
            url: (value) => {
                try {
                    new URL(value);

                    if (
                        (!value.includes('{x}') || !value.includes('{y}') || !value.includes('{z}')) &&
                        !value.includes('{bbox-epsg-3857}')
                    ) {
                        return "L'url doit contenir {x}, {y} et {z} si c'est un raster xyz OU {bbox-epsg-3857} pour un WMS";
                    }

                    return null;
                } catch {
                    return "Le format de l'url est invalide";
                }
            },
            tileSetStatus: isNotEmpty('Le status du fond de carte est requis'),
            tileSetScheme: isNotEmpty('Le scheme du fond de carte est requis'),
            tileSetType: isNotEmpty('Le type du fond de carte est requis'),
            geometry: (value) => {
                const error = 'Le format de la geométrie est invalide';

                if (!value) {
                    return null;
                }

                try {
                    const isValid = isPolygon(JSON.parse(value));

                    if (isValid) {
                        return null;
                    }

                    return error;
                } catch {
                    return error;
                }
            },
        },
        validateInputOnChange: ['url'],
    });
    form.watch('url', ({ value }) =>
        setMapPreviewProps((prev) => ({
            ...prev,
            url: form.isValid('url') ? value : undefined,
        })),
    );
    form.watch('name', ({ value }) =>
        setMapPreviewProps((prev) => ({
            ...prev,
            name: value,
        })),
    );
    form.watch('tileSetScheme', ({ value }) =>
        setMapPreviewProps((prev) => ({
            ...prev,
            scheme: value,
        })),
    );
    form.watch('tileSetType', ({ value }) =>
        setMapPreviewProps((prev) => ({
            ...prev,
            type: value,
        })),
    );
    form.watch('geometry', ({ value }) =>
        setMapPreviewProps((prev) => ({
            ...prev,
            geometry: form.isValid('geometry') && value ? JSON.parse(value) : null,
        })),
    );

    const mutation: UseMutationResult<TileSet, AxiosError, FormValues> = useMutation({
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

    const label = uuid ? 'Modifier un fond de carte' : 'Ajouter un fond de carte';

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
                label="Nom du fond de carte"
                placeholder="Mon fond de carte"
                key={form.key('name')}
                {...form.getInputProps('name')}
            />
            <TextInput
                mt="md"
                withAsterisk
                label="URL du fond de carte"
                placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                description="Doit contenir {x}, {y} et {z} pour les coordonnées des tuiles"
                type="url"
                key={form.key('url')}
                {...form.getInputProps('url')}
            />
            <Select
                allowDeselect={false}
                label="Scheme"
                withAsterisk
                mt="md"
                mb="md"
                data={tileSetSchemes.map((scheme) => ({
                    value: scheme,
                    label: scheme,
                }))}
                key={form.key('tileSetScheme')}
                {...form.getInputProps('tileSetScheme')}
            />
            <Select
                allowDeselect={false}
                label="Type"
                withAsterisk
                mt="md"
                mb="md"
                data={tileSetTypes.map((type) => ({
                    value: type,
                    label: TILE_SET_TYPES_NAMES_MAP[type],
                }))}
                key={form.key('tileSetType')}
                {...form.getInputProps('tileSetType')}
            />
            <DateInput
                mt="md"
                withAsterisk
                label="Date du fond de carte"
                dateParser={(value: string) => parse(value, 'dd/MM/yyyy', new Date())}
                valueFormat="DD/MM/YYYY"
                placeholder="26/02/2023"
                description="La date est utilisée pour l'ordre d'affichage sur la carte"
                key={form.key('date')}
                {...form.getInputProps('date')}
            />
            <Select
                allowDeselect={false}
                label="Status"
                withAsterisk
                mt="md"
                mb="md"
                data={tileSetStatuses.map((status) => ({
                    value: status,
                    label: TILE_SET_STATUSES_NAMES_MAP[status],
                }))}
                key={form.key('tileSetStatus')}
                {...form.getInputProps('tileSetStatus')}
            />
            <JsonInput
                label="Géométrie des limite"
                description="GeoJson de type 'Polygon' correspondant aux limites du fond de carte. Laisser vide s'il n'y a pas de limite d'affichage."
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

            <MapPreview {...mapPreviewProps} key={mapPreviewProps.scheme} />

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

                <Button disabled={mutation.status === 'pending'} type="submit" leftSection={<IconMapPlus />}>
                    {label}
                </Button>
            </div>
        </form>
    );
};

const EMPTY_FORM_VALUES: FormValues = {
    name: '',
    url: '',
    tileSetStatus: 'VISIBLE',
    tileSetScheme: 'xyz',
    tileSetType: 'BACKGROUND',
    date: undefined,
    geometry: undefined,
};

const ComponentInner: React.FC = () => {
    const { uuid } = useParams();

    const fetchData = async () => {
        if (!uuid) {
            return;
        }

        const res = await api.get<TileSet>(getTileSetDetailEndpoint(uuid));
        const initialValues: FormValues = {
            ...res.data,
            geometry: res.data.geometry ? JSON.stringify(res.data.geometry, null, 2) : undefined,
            date: new Date(res.data.date),
        };

        return initialValues;
    };

    const {
        isLoading,
        error,
        data: initialValues,
    } = useQuery({
        queryKey: [getTileSetDetailEndpoint(String(uuid))],
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
    return (
        <LayoutAdminForm backText="Liste des fonds de carte" backUrl={BACK_URL}>
            <ComponentInner />
        </LayoutAdminForm>
    );
};

export default Component;
