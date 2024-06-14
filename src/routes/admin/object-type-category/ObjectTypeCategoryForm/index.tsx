import React, { useMemo, useState } from 'react';

import {
    OBJECT_TYPE_CATEGORY_POST_ENDPOINT,
    OBJECT_TYPE_LIST_ENDPOINT,
    getObjectTypeCategoryDetailEndpoint,
} from '@/api-endpoints';
import ErrorCard from '@/components/ErrorCard';
import Loader from '@/components/Loader';
import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import { ObjectType } from '@/models/object-type';
import { ObjectTypeCategory, ObjectTypeCategoryDetail } from '@/models/object-type-category';
import api from '@/utils/api';
import { Button, ColorSwatch, MultiSelect, TextInput } from '@mantine/core';
import { UseFormReturnType, isNotEmpty, useForm } from '@mantine/form';
import { IconCheck, IconCubePlus } from '@tabler/icons-react';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';

const BACK_URL = '/admin/object-type-categories';

interface FormValues {
    name: string;
    objectTypesUuids: string[];
}

const postForm = async (values: FormValues, uuid?: string) => {
    let response: AxiosResponse<ObjectTypeCategory>;

    if (uuid) {
        response = await api.patch(getObjectTypeCategoryDetailEndpoint(uuid), values);
    } else {
        response = await api.post(OBJECT_TYPE_CATEGORY_POST_ENDPOINT, values);
    }

    return response.data;
};

interface FormProps {
    uuid?: string;
    initialValues: FormValues;
    objectTypes?: ObjectType[];
}

const Form: React.FC<FormProps> = ({ uuid, initialValues, objectTypes }) => {
    const [error, setError] = useState<AxiosError>();
    const navigate = useNavigate();

    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues,
        validate: {
            name: isNotEmpty('Le nom de la thématique est requis'),
        },
    });

    const mutation: UseMutationResult<ObjectTypeCategory, AxiosError, FormValues> = useMutation({
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

    const label = uuid ? 'Modifier une thématique' : 'Ajouter une thématique';

    const objectTypesUuidsColorsMap: Record<string, string> = useMemo(() => {
        return (
            objectTypes?.reduce(
                (prev, curr) => ({
                    ...prev,
                    [curr.uuid]: curr.color,
                }),
                {},
            ) || {}
        );
    }, [objectTypes]);

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <h1>{label}</h1>
            {error ? (
                <ErrorCard>
                    <p>Erreur lors de l&apos;ajout de la thématique</p>
                    <p>Voir les indications ci-dessous pour plus d&apos;info</p>
                </ErrorCard>
            ) : null}
            <TextInput
                mt="md"
                withAsterisk
                label="Nom de la thématique"
                placeholder="Ma thématique"
                key={form.key('name')}
                {...form.getInputProps('name')}
            />
            <MultiSelect
                mt="md"
                label="Types d'objets"
                placeholder="Caravane, piscine,..."
                searchable
                data={(objectTypes || []).map(({ name, uuid }) => ({
                    value: uuid,
                    label: name,
                }))}
                renderOption={(item) => (
                    <div className="multi-select-item">
                        <div className="multi-select-item-label">
                            <ColorSwatch color={objectTypesUuidsColorsMap[item.option.value]} size={24} />
                            {item.option.label}
                        </div>
                        {item.checked ? <IconCheck className="multi-select-item-icon" color="grey" /> : null}
                    </div>
                )}
                key={form.key('objectTypesUuids')}
                {...form.getInputProps('objectTypesUuids')}
            />

            <div className="form-actions">
                <Button type="button" variant="outline" component={Link} to={BACK_URL}>
                    Annuler
                </Button>

                <Button type="submit" leftSection={<IconCubePlus />}>
                    {label}
                </Button>
            </div>
        </form>
    );
};

const EMPTY_FORM_VALUES: FormValues = {
    name: '',
    objectTypesUuids: [],
} as const;

const ComponentInner: React.FC = () => {
    const { uuid } = useParams();

    const fetchData = async () => {
        if (!uuid) {
            return;
        }

        const res = await api.get<ObjectTypeCategoryDetail>(getObjectTypeCategoryDetailEndpoint(uuid));
        const initialValues: FormValues = {
            objectTypesUuids: res.data.objectTypes.map((type) => type.uuid),
            ...res.data,
        };

        return initialValues;
    };

    const {
        isLoading,
        error,
        data: initialValues,
    } = useQuery({
        queryKey: [getObjectTypeCategoryDetailEndpoint(String(uuid))],
        enabled: !!uuid,
        queryFn: () => fetchData(),
    });

    const fetchObjectTypes = async () => {
        const res = await api.get<ObjectType[]>(OBJECT_TYPE_LIST_ENDPOINT);
        return res.data;
    };

    const { data: objectTypes } = useQuery({
        queryKey: [OBJECT_TYPE_LIST_ENDPOINT],
        queryFn: () => fetchObjectTypes(),
    });

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <ErrorCard>{error.message}</ErrorCard>;
    }

    return <Form uuid={uuid} initialValues={initialValues || EMPTY_FORM_VALUES} objectTypes={objectTypes} />;
};

const Component: React.FC = () => {
    return (
        <LayoutAdminForm backText="Liste des thématiques" backUrl={BACK_URL}>
            <ComponentInner />
        </LayoutAdminForm>
    );
};

export default Component;
