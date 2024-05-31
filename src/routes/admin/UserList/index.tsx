import React, { useState } from 'react';

import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { USERS_LIST } from '@/api-endpoints';
import { Button, Checkbox, Input, Stack, Table } from '@mantine/core';
import { User, UserRole, userRoles } from '@/models/user';
import { ROLES_NAMES_MAP } from '@/utils/constants';
import FiltersSection from '@/components/admin/FiltersSection';
import isEqual from 'lodash/isEqual';
import { IconSearch, IconUserPlus } from '@tabler/icons-react';
import DataTable from '@/components/admin/DataTable';
import { Link } from 'react-router-dom';
import DateInfo from '@/components/DateInfo';

interface DataFilter {
  email: string;
  roles: UserRole[];
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
  email: '',
  roles: [...userRoles].sort(),
};

const Component: React.FC = () => {
  const [filter, setFilter] = useState<DataFilter>(DATA_FILTER_INITIAL_VALUE);

  return (
    <LayoutAdminBase
      actions={
        <>
          <Button leftSection={<IconUserPlus />} component={Link} to={'/admin/users/form'}>Ajouter un utilisateur</Button>
        </>
      }
    >
      <DataTable<User, DataFilter>
        endpoint={USERS_LIST}
        filter={filter}
        filtersSection={
          <FiltersSection
            filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}
          >
            <Input
              placeholder="Rechercher un utilisateur"
              leftSection={<IconSearch size={16} />}
              value={filter.email}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setFilter((filter) => ({
                  ...filter,
                  email: value,
                }));
              }}
            />

            <Checkbox.Group
              label="Rôles"
              value={filter.roles}
              onChange={(roles) => {
                setFilter((filter) => ({
                  ...filter,
                  roles: (roles as UserRole[]).sort(),
                }));
              }}
            >
              <Stack gap="xs">
                {userRoles.map((role) => (
                  <Checkbox
                    key={role}
                    value={role}
                    label={ROLES_NAMES_MAP[role]}
                  />
                ))}
              </Stack>
            </Checkbox.Group>
          </FiltersSection>
        }
        tableHeader={[
          <Table.Th key="email">Email</Table.Th>,
          <Table.Th key="createdAt">Date création</Table.Th>,
          <Table.Th key="role">Rôle</Table.Th>,
        ]}
        tableBodyRenderFns={[
          (item: User) => item.email,
          (item: User) => <DateInfo date={item.createdAt} />,
          (item: User) => ROLES_NAMES_MAP[item.userRole],
        ]}
      />
    </LayoutAdminBase>
  );
};

export default Component;
