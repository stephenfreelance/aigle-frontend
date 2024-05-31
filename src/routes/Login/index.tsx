import React, { useState } from 'react';
import { useForm, UseFormReturnType } from '@mantine/form';
import { Button, TextInput } from '@mantine/core';
import { AxiosError } from 'axios';

import classes from './index.module.scss';
import { AUTH_LOGIN_ENDPOINT } from '@/api-endpoints';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useAuth } from '@/utils/auth';
import api from '@/utils/api';
import ErrorCard from '@/components/ErrorCard';

interface JwtAuthResponse {
  access: string;
  refresh: string;
}

interface FormValues {
  email: string;
  password: string;
}

const login = async (user: FormValues) => {
  const response = await api.post<JwtAuthResponse>(AUTH_LOGIN_ENDPOINT, user);
  return response.data;
};

const Component: React.FC = () => {
  const { setAccessToken, setRefreshToken } = useAuth();
  const [error, setError] = useState<AxiosError>();

  const form: UseFormReturnType<FormValues> = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email invalide'),
    },
  });

  const mutation: UseMutationResult<JwtAuthResponse, AxiosError, FormValues> =
    useMutation({
      mutationFn: login,
      onSuccess: (data) => {
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
      },
      onError: (error) => {
        setError(error);
      },
    });

  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className={classes.container}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {error ? <ErrorCard>Identifiants invalides</ErrorCard> : null}
        <TextInput
          withAsterisk
          label="Email"
          placeholder="jean.dupont@email.com"
          key={form.key('email')}
          {...form.getInputProps('email')}
        />
        <TextInput
          withAsterisk
          type="password"
          label="Mot de passe"
          placeholder="your@email.com"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <Button type="submit">Connexion</Button>
      </form>
    </div>
  );
};

export default Component;
