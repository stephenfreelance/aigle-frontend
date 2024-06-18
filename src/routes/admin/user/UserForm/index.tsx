import React, { useState } from 'react';

import { AUTH_REGISTER_ENDPOINT, getUserDetailEndpoint } from '@/api-endpoints';
import ErrorCard from '@/components/ErrorCard';
import Loader from '@/components/Loader';
import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import { ObjectType } from '@/models/object-type';
import { User, UserRole, userRoles } from '@/models/user';
import api from '@/utils/api';
import { ROLES_NAMES_MAP } from '@/utils/constants';
import { Button, Select, TextInput } from '@mantine/core';
import { UseFormReturnType, isEmail, isNotEmpty, useForm } from '@mantine/form';
import { IconUserPlus } from '@tabler/icons-react';
import { UseMutationResult, useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import omit from 'lodash/omit';
import { Link, useNavigate, useParams } from 'react-router-dom';

const BACK_URL = '/admin/users';
const PASSWORD_MIN_LENGTH = 8;

interface FormValues {
    email: string;
    userRole: UserRole;
    password: string;
}

const postForm = async (values: FormValues, uuid?: string) => {
    let response: AxiosResponse<ObjectType>;

    if (uuid) {
        let values_: object;

        if (values.password.length === 0) {
            values_ = omit(values, 'password');
        } else {
            values_ = values;
        }

        response = await api.patch(getUserDetailEndpoint(uuid), values_);
    } else {
        response = await api.post(AUTH_REGISTER_ENDPOINT, values);
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

    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues,
        validate: {
            email: isEmail("Le format de l'adresse mail est invalide"),
            userRole: isNotEmpty("Le rôle de l'utilisateur est requis"),
            password: (value) => {
                if (uuid && !value.length) {
                    return null;
                }

                if (value.length < PASSWORD_MIN_LENGTH) {
                    return `Le mot de passe doit faire minimum ${PASSWORD_MIN_LENGTH} caractères`;
                }

                return null;
            },
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

    const label = uuid ? 'Modifier un utilisateur' : 'Ajouter un utilisateur';

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <h1>{label}</h1>
            {error ? (
                <ErrorCard>
                    <p>Erreur lors de l&apos;ajout de l&apos;utilisateur</p>
                    <p>Voir les indications ci-dessous pour plus d&apos;info</p>
                </ErrorCard>
            ) : null}
            <TextInput
                mt="md"
                withAsterisk
                label="Email"
                autoComplete="off"
                placeholder="john.doe@mail.com"
                key={form.key('email')}
                {...form.getInputProps('email')}
            />
            <TextInput
                mt="md"
                withAsterisk={!uuid}
                label="Mot de passe"
                description={uuid ? 'Remplir ce champ pour modifier le mot de passe' : undefined}
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
                key={form.key('password')}
                {...form.getInputProps('password')}
            />
            <Select
                allowDeselect={false}
                label="Rôle"
                withAsterisk
                mt="md"
                data={userRoles.map((role) => ({
                    value: role,
                    label: ROLES_NAMES_MAP[role],
                }))}
                key={form.key('userRole')}
                {...form.getInputProps('userRole')}
            />

            <div className="form-actions">
                <Button type="button" variant="outline" component={Link} to={BACK_URL}>
                    Annuler
                </Button>

                <Button type="submit" leftSection={<IconUserPlus />}>
                    {label}
                </Button>
            </div>
        </form>
    );
};

const EMPTY_FORM_VALUES: FormValues = {
    email: '',
    userRole: 'REGULAR',
    password: '',
};

const ComponentInner: React.FC = () => {
    const { uuid } = useParams();

    const fetchData = async () => {
        if (!uuid) {
            return;
        }

        const res = await api.get<User>(getUserDetailEndpoint(uuid));
        const initialValues = {
            ...res.data,
            password: '',
        };

        return initialValues;
    };

    const {
        isLoading,
        error,
        data: initialValues,
    } = useQuery({
        queryKey: [getUserDetailEndpoint(String(uuid))],
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
        <LayoutAdminForm backText="Liste des utilisateurs" backUrl={BACK_URL}>
            <ComponentInner />
        </LayoutAdminForm>
    );
};

export default Component;
