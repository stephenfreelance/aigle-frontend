import React, { useState } from 'react';

import LayoutAdminForm from '@/components/admin/LayoutAdminForm';
import api from '@/utils/api';
import { OBJECT_TYPE_POST } from '@/api-endpoints';
import { UseFormReturnType, isNotEmpty, useForm } from '@mantine/form';
import { UseMutationResult, useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ErrorCard from '@/components/ErrorCard';
import { TextInput, Button, ColorInput } from '@mantine/core';
import { IconCubePlus } from '@tabler/icons-react';
import { ObjectType } from '@/models/object-type';
import classes from './index.module.scss';

const BACK_URL = '/admin/object-types';

interface FormValues {
  name: string;
  color: string;
}

const postForm = async (values: FormValues) => {
  const response = await api.post(OBJECT_TYPE_POST, values);
  return response.data;
};

const Component: React.FC = () => {
  const [error, setError] = useState<AxiosError>();
  const navigate = useNavigate();
  const { uuid } = useParams();

  console.log({uuid});

  const form: UseFormReturnType<FormValues> = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      color: '',
    },
    validate: {
      name: isNotEmpty('Le nom du type est requis'),
      color: isNotEmpty('La couleur du type est requise'),
    },
  });

  const mutation: UseMutationResult<ObjectType, AxiosError, FormValues> =
    useMutation({
      mutationFn: postForm,
      onSuccess: () => {
        navigate(BACK_URL);
      },
      onError: (error) => {
        console.log({error});
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
    <LayoutAdminForm backText="Liste des types d'objets" backUrl={BACK_URL}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {error ? <ErrorCard>
          <p>Erreur lors de l'ajout du type</p>
          <p>Voir les indications ci-dessous pour plus d'info</p>
          </ErrorCard> : null}
        <TextInput
          mt="md"
          withAsterisk
          label="Nom du type d'objet"
          placeholder="Mon nouveau type"
          key={form.key('name')}
          {...form.getInputProps('name')}
        />
        <ColorInput
          mt="md"
          withAsterisk
          label="Couleur du type d'objet"
          placeholder="#000000"
          key={form.key('color')}
          {...form.getInputProps('color')}
        />

        <div className={classes['form-actions']}>
          <Button type="button" variant="outline" onClick={() => navigate(BACK_URL)}>
            Annuler
          </Button>

          <Button type="submit" leftSection={<IconCubePlus />}>
            Ajouter un type d'objet
          </Button>
        </div>
      </form>
    </LayoutAdminForm>
  );
};

export default Component;
