import { Alert, Button, Image, TextInput } from '@mantine/core';
import { UseFormReturnType, isEmail, useForm } from '@mantine/form';
import { AxiosError } from 'axios';
import React, { useState } from 'react';

import { AUTH_RESET_PASSWORD_ENDPOINT } from '@/api-endpoints';
import logoImg from '@/assets/logo.png';
import ErrorCard from '@/components/ErrorCard';
import InfoCard from '@/components/InfoCard';
import api from '@/utils/api';
import { DEFAULT_ROUTE } from '@/utils/constants';
import { IconMailCheck } from '@tabler/icons-react';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import classes from './index.module.scss';

interface FormValues {
    email: string;
}

const resetPassword = async (user: FormValues) => {
    await api.post(AUTH_RESET_PASSWORD_ENDPOINT, user);
};

const Component: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState<AxiosError>();

    const form: UseFormReturnType<FormValues> = useForm({
        initialValues: {
            email: searchParams.get('email') || '',
        },
        validate: {
            email: isEmail("Le format de l'adresse mail est invalide"),
        },
    });

    const mutation: UseMutationResult<void, AxiosError, FormValues> = useMutation({
        mutationFn: resetPassword,
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
        <div className={classes.container}>
            <Link to={DEFAULT_ROUTE}>
                <Image src={logoImg} className={classes.logo} alt="Logo Aigle" h="100%" fit="contain" />
            </Link>

            {mutation.status === 'success' ? (
                <>
                    <Alert
                        mt="md"
                        variant="light"
                        color="green"
                        title="Email de réinitialisation envoyé"
                        className={classes['success-card']}
                        icon={<IconMailCheck />}
                    >
                        <p>
                            Un lien de réinitialisation de mot de passe vient d&apos;être envoyé à{' '}
                            <b>{form.getValues().email}</b> si votre addresse est bien associée à un compte
                        </p>
                    </Alert>

                    <Button component={Link} to={DEFAULT_ROUTE} mt="md">
                        Retour à la page d&apos;acueuil
                    </Button>
                </>
            ) : (
                <>
                    <InfoCard withCloseButton={false} className={classes['info-card']}>
                        <p>Entrer votre adresse email pour réinitialiser votre mot de passe</p>
                        <p>
                            Si votre addresse est associée à un compte, vous recevrez un recevoir un mail de
                            réinitialisation
                        </p>
                    </InfoCard>

                    <form className={classes.form} onSubmit={form.onSubmit(handleSubmit)}>
                        {error ? <ErrorCard className={classes['error-card']}>Identifiants invalides</ErrorCard> : null}
                        <TextInput
                            withAsterisk
                            label="Email"
                            placeholder="jean.dupont@email.com"
                            key={form.key('email')}
                            {...form.getInputProps('email')}
                        />
                        <div className="form-actions">
                            <Button disabled={mutation.status === 'pending'} type="submit">
                                Réinitialiser le mot de passe
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default Component;
