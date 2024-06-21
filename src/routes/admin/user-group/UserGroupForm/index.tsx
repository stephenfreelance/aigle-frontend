import React, { useMemo, useState } from 'react';

import {
    OBJECT_TYPE_CATEGORY_LIST_ENDPOINT,
    USER_GROUP_POST_ENDPOINT,
    getGeoListEndpoint,
    getUserDetailEndpoint,
    getUserGroupDetailEndpoint,
} from '@/api-endpoints';
import ErrorCard from '@/components/ErrorCard';
import Loader from '@/components/Loader';
import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import { Paginated } from '@/models/data';
import { CollectivityType, GeoCollectivity, collectivityTypes } from '@/models/geo/_common';
import { GeoCommune } from '@/models/geo/geo-commune';
import { GeoDepartment } from '@/models/geo/geo-department';
import { GeoRegion } from '@/models/geo/geo-region';
import { ObjectType } from '@/models/object-type';
import { ObjectTypeCategory } from '@/models/object-type-category';
import { UserGroup } from '@/models/user-group';
import api from '@/utils/api';
import { Button, Loader as MantineLoader, MultiSelect, TextInput } from '@mantine/core';
import { UseFormReturnType, isNotEmpty, useForm } from '@mantine/form';
import { useDebouncedValue } from '@mantine/hooks';
import { IconCheck, IconUserPlus } from '@tabler/icons-react';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classes from './index.module.scss';

const BACK_URL = '/admin/user-groups';

const GEO_COLLECTIVITIES_LIMIT = 10;

const fetchGeoCollectivities = async <T extends GeoCollectivity>(
    collectivityType: CollectivityType,
    q: string,
): Promise<T[]> => {
    const endpoint = getGeoListEndpoint(collectivityType);
    const res = await api.get<Paginated<T>>(endpoint, {
        params: {
            q,
            limit: GEO_COLLECTIVITIES_LIMIT,
            offset: 0,
        },
    });
    return res.data.results;
};

interface GeoOption {
    value: string;
    label: string;
}
const geoCollectivityToGeoOption = (geoCollectivity: GeoCollectivity): GeoOption => ({
    value: geoCollectivity.uuid,
    label: geoCollectivity.name,
});

type GeoValues = {
    [key in CollectivityType]: GeoOption[];
};

const getGeoSelectedUuids = (
    geoSelectedValues: GeoValues,
): {
    [key in CollectivityType]: string[];
} => {
    return {
        region: geoSelectedValues.region.map((geo) => geo.value),
        department: geoSelectedValues.department.map((geo) => geo.value),
        commune: geoSelectedValues.commune.map((geo) => geo.value),
    };
};

const getGeoMultiSelectValues = (
    geoResults: {
        [key in CollectivityType]: GeoCollectivity[];
    },
    geoSelectedValues: GeoValues,
): {
    [key in CollectivityType]: GeoOption[];
} => {
    const geoSelectedUuids = getGeoSelectedUuids(geoSelectedValues);

    const res: {
        [key in CollectivityType]: GeoOption[];
    } = {
        region: [],
        department: [],
        commune: [],
    };

    collectivityTypes.forEach((collectivityType) => {
        res[collectivityType] = [
            ...geoSelectedValues[collectivityType],
            ...(geoResults[collectivityType] || [])
                .filter((geo) => !geoSelectedUuids[collectivityType].includes(geo.uuid))
                .map((geo) => geoCollectivityToGeoOption(geo)),
        ];
    });

    return res;
};

interface FormValues {
    name: string;
    communesUuids: string[];
    departmentsUuids: string[];
    regionsUuids: string[];
    objectTypeCategoriesUuids: string[];
}

const postForm = async (values: FormValues, uuid?: string) => {
    let response: AxiosResponse<ObjectType>;

    if (uuid) {
        response = await api.patch(getUserGroupDetailEndpoint(uuid), values);
    } else {
        response = await api.post(USER_GROUP_POST_ENDPOINT, values);
    }

    return response.data;
};

interface FormProps {
    uuid?: string;
    initialValues: FormValues;
    initialGeoSelectedValues?: GeoValues;
    categories?: ObjectTypeCategory[];
}

const Form: React.FC<FormProps> = ({ uuid, initialValues, initialGeoSelectedValues, categories }) => {
    const [error, setError] = useState<AxiosError>();
    const navigate = useNavigate();

    const form: UseFormReturnType<FormValues> = useForm({
        initialValues,
        validate: {
            name: isNotEmpty('Le nom du groupe est requis'),
        },
    });

    const mutation: UseMutationResult<ObjectType, AxiosError, FormValues> = useMutation({
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

    const label = uuid ? 'Modifier un groupe utilisateurs' : 'Ajouter un groupe utilisateurs';

    // geo data

    const [geoInputValues, setGeoInputValues] = useState<{
        [key in CollectivityType]: string;
    }>({
        region: '',
        department: '',
        commune: '',
    });
    const [debouncedGeoInputValues] = useDebouncedValue(geoInputValues, 250);

    const { data: regions, isLoading: regionsIsLoading } = useQuery<GeoRegion[]>({
        queryKey: ['regions', debouncedGeoInputValues.region],
        enabled: !!debouncedGeoInputValues.region,
        queryFn: () => fetchGeoCollectivities<GeoRegion>('region', debouncedGeoInputValues.region),
    });
    const { data: departments, isLoading: departmentsIsLoading } = useQuery<GeoDepartment[]>({
        queryKey: ['departments', debouncedGeoInputValues.department],
        enabled: !!debouncedGeoInputValues.department,
        queryFn: () => fetchGeoCollectivities<GeoDepartment>('department', debouncedGeoInputValues.department),
    });
    const { data: communes, isLoading: communesIsLoading } = useQuery<GeoCommune[]>({
        queryKey: ['communes', debouncedGeoInputValues.commune],
        enabled: !!debouncedGeoInputValues.commune,
        queryFn: () => fetchGeoCollectivities<GeoCommune>('commune', debouncedGeoInputValues.commune),
    });

    const [geoSelectedValues, setGeoSelectedValues] = useState<GeoValues>(
        initialGeoSelectedValues || {
            region: [],
            department: [],
            commune: [],
        },
    );

    const geoMultiSelectValues = useMemo(
        () =>
            getGeoMultiSelectValues(
                {
                    region: regions || [],
                    department: departments || [],
                    commune: communes || [],
                },
                geoSelectedValues,
            ),
        [regions, departments, communes, geoSelectedValues],
    );

    const geoOnOptionSubmit = (uuid: string, collectivityType: CollectivityType, geoItems?: GeoCollectivity[]) => {
        const option = geoItems?.find((geo) => geo.uuid === uuid);

        if (!option) {
            return;
        }

        setGeoSelectedValues((prev) => ({
            ...prev,
            [collectivityType]: [...prev[collectivityType], geoCollectivityToGeoOption(option)],
        }));
    };

    const geoOnRemove = (uuid: string, collectivityType: CollectivityType) => {
        setGeoSelectedValues((prev) => ({
            ...prev,
            [collectivityType]: prev[collectivityType].filter((geo) => geo.value !== uuid),
        }));
    };

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
                label="Nom du groupe"
                placeholder="Mon groupe"
                key={form.key('name')}
                {...form.getInputProps('name')}
            />
            <MultiSelect
                mt="md"
                label="Thématiques"
                placeholder="Déchets, constructions,..."
                searchable
                data={(categories || []).map(({ name, uuid }) => ({
                    value: uuid,
                    label: name,
                }))}
                renderOption={(item) => (
                    <div className="multi-select-item">
                        <div className="multi-select-item-label">{item.option.label}</div>
                        {item.checked ? <IconCheck className="multi-select-item-icon" color="grey" /> : null}
                    </div>
                )}
                key={form.key('objectTypeCategoriesUuids')}
                {...form.getInputProps('objectTypeCategoriesUuids')}
            />

            <h2 className={classes['sub-title']}>Collectivités accessibles par le groupe</h2>

            <MultiSelect
                mt="md"
                label="Regions"
                placeholder="Rechercher une région"
                searchable
                data={geoMultiSelectValues.region}
                onSearchChange={(value) => {
                    setGeoInputValues((prev) => ({
                        ...prev,
                        region: value,
                    }));
                }}
                rightSection={regionsIsLoading ? <MantineLoader size="xs" /> : null}
                hidePickedOptions={true}
                key={form.key('regionsUuids')}
                {...form.getInputProps('regionsUuids')}
                onOptionSubmit={(uuid) => geoOnOptionSubmit(uuid, 'region', regions)}
                onRemove={(uuid) => geoOnRemove(uuid, 'region')}
            />
            <MultiSelect
                mt="md"
                label="Departments"
                placeholder="Rechercher un département"
                searchable
                data={geoMultiSelectValues.department}
                onSearchChange={(value) => {
                    setGeoInputValues((prev) => ({
                        ...prev,
                        department: value,
                    }));
                }}
                rightSection={departmentsIsLoading ? <MantineLoader size="xs" /> : null}
                hidePickedOptions={true}
                key={form.key('departmentsUuids')}
                {...form.getInputProps('departmentsUuids')}
                onOptionSubmit={(uuid) => geoOnOptionSubmit(uuid, 'department', departments)}
                onRemove={(uuid) => geoOnRemove(uuid, 'department')}
            />
            <MultiSelect
                mt="md"
                label="Communes"
                placeholder="Rechercher une commune"
                searchable
                data={geoMultiSelectValues.commune}
                onSearchChange={(value) => {
                    setGeoInputValues((prev) => ({
                        ...prev,
                        commune: value,
                    }));
                }}
                rightSection={communesIsLoading ? <MantineLoader size="xs" /> : null}
                hidePickedOptions={true}
                key={form.key('communesUuids')}
                {...form.getInputProps('communesUuids')}
                onOptionSubmit={(uuid) => geoOnOptionSubmit(uuid, 'commune', communes)}
                onRemove={(uuid) => geoOnRemove(uuid, 'commune')}
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

                <Button disabled={mutation.status === 'pending'} type="submit" leftSection={<IconUserPlus />}>
                    {label}
                </Button>
            </div>
        </form>
    );
};

const EMPTY_FORM_VALUES: FormValues = {
    name: '',
    communesUuids: [],
    departmentsUuids: [],
    regionsUuids: [],
    objectTypeCategoriesUuids: [],
};

const ComponentInner: React.FC = () => {
    // user group

    const { uuid } = useParams();

    const fetchData = async () => {
        if (!uuid) {
            return;
        }

        const res = await api.get<UserGroup>(getUserGroupDetailEndpoint(uuid));
        const initialValues = {
            ...res.data,
            communesUuids: res.data.communes.map((commune) => commune.uuid),
            departmentsUuids: res.data.departments.map((department) => department.uuid),
            regionsUuids: res.data.regions.map((region) => region.uuid),
            objectTypeCategoriesUuids: res.data.objectTypeCategories.map(
                (objectTypeCategory) => objectTypeCategory.uuid,
            ),
        };
        const initialGeoSelectedValues: GeoValues = {
            region: res.data.regions.map((region) => geoCollectivityToGeoOption(region)),
            department: res.data.departments.map((department) => geoCollectivityToGeoOption(department)),
            commune: res.data.communes.map((commune) => geoCollectivityToGeoOption(commune)),
        };

        return { initialValues, initialGeoSelectedValues };
    };

    const { isLoading, error, data } = useQuery({
        queryKey: [getUserDetailEndpoint(String(uuid))],
        enabled: !!uuid,
        queryFn: () => fetchData(),
    });

    // additional data

    const fetchObjectTypeCategories = async () => {
        const res = await api.get<ObjectTypeCategory[]>(OBJECT_TYPE_CATEGORY_LIST_ENDPOINT);
        return res.data;
    };

    const { data: categories } = useQuery({
        queryKey: [OBJECT_TYPE_CATEGORY_LIST_ENDPOINT],
        queryFn: () => fetchObjectTypeCategories(),
    });

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <ErrorCard>{error.message}</ErrorCard>;
    }

    return (
        <Form
            uuid={uuid}
            initialValues={data?.initialValues || EMPTY_FORM_VALUES}
            initialGeoSelectedValues={data?.initialGeoSelectedValues}
            categories={categories}
        />
    );
};

const Component: React.FC = () => {
    return (
        <LayoutAdminForm backText="Liste des groupes" backUrl={BACK_URL}>
            <ComponentInner />
        </LayoutAdminForm>
    );
};

export default Component;
