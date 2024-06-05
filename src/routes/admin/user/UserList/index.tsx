import React, { useState } from 'react';

import { USERS_LIST_ENDPOINT } from '@/api-endpoints';
import DateInfo from '@/components/DateInfo';
import DataTable from '@/components/admin/DataTable';
import FiltersSection from '@/components/admin/FiltersSection';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { User, UserRole, userRoles } from '@/models/user';
import { ROLES_NAMES_MAP } from '@/utils/constants';
import { Button, Checkbox, Input, Stack, Table } from '@mantine/core';
import { IconSearch, IconUserPlus } from '@tabler/icons-react';
import isEqual from 'lodash/isEqual';
import { Link, useNavigate } from 'react-router-dom';

interface DataFilter {
    email: string;
    roles: UserRole[];
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
    email: '',
    roles: [...userRoles].sort(),
};

const Component: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<DataFilter>(DATA_FILTER_INITIAL_VALUE);

    return (
        <LayoutAdminBase
            actions={
                <>
                    <Button leftSection={<IconUserPlus />} component={Link} to={'/admin/users/form'}>
                        Ajouter un utilisateur
                    </Button>
                </>
            }
        >
            <DataTable<User, DataFilter>
                endpoint={USERS_LIST_ENDPOINT}
                filter={filter}
                filtersSection={
                    <FiltersSection filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}>
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
                            <Stack gap={0}>
                                {userRoles.map((role) => (
                                    <Checkbox mt="xs" key={role} value={role} label={ROLES_NAMES_MAP[role]} />
                                ))}
                            </Stack>
                        </Checkbox.Group>
                    </FiltersSection>
                }
                tableHeader={[
                    <Table.Th key="createdAt">Date création</Table.Th>,
                    <Table.Th key="email">Email</Table.Th>,
                    <Table.Th key="role">Rôle</Table.Th>,
                ]}
                tableBodyRenderFns={[
                    (item: User) => <DateInfo date={item.createdAt} />,
                    (item: User) => item.email,
                    (item: User) => ROLES_NAMES_MAP[item.userRole],
                ]}
                onItemClick={({ uuid }) => navigate(`/admin/users/form/${uuid}`)}
            />
        </LayoutAdminBase>
    );
};

export default Component;
