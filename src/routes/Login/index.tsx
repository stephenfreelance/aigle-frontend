import React from 'react';
import { useForm, UseFormReturnType } from '@mantine/form';
import { Button, TextInput } from '@mantine/core';
import axios, { AxiosError } from 'axios';

import classes from './index.module.scss';
import { AUTH_LOGIN_ENDPOINT } from '@/api-endpoints';
import { useMutation, UseMutationResult } from '@tanstack/react-query';

interface JwtAuthResponse {
  access: string;
  refresh: string;
}

interface FormValues {
  email: string;
  password: string;
}

const login = async (user: FormValues) => {
  const response = await axios.post<JwtAuthResponse>(AUTH_LOGIN_ENDPOINT, user);
  return response.data;
};

const Component: React.FC = () => {
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
        // Handle successful login (e.g., store token, redirect, etc.)
        console.log('Login successful:', data);
      },
      onError: (error) => {
        // Handle login error
        console.error('Login failed:', error);
      },
    });


  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className={classes.container}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
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
