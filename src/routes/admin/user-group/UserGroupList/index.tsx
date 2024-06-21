import React, { useState } from 'react';

import { USER_GROUP_LIST_ENDPOINT } from '@/api-endpoints';
import DateInfo from '@/components/DateInfo';
import DataTable from '@/components/admin/DataTable';
import FiltersSection from '@/components/admin/FiltersSection';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import PillsDataCells from '@/components/admin/data-cells/PillsDataCells';
import { ObjectTypeCategory } from '@/models/object-type-category';
import { UserGroup } from '@/models/user-group';
import { Button, Input, Table } from '@mantine/core';
import { IconSearch, IconUserPlus } from '@tabler/icons-react';
import isEqual from 'lodash/isEqual';
import { Link, useNavigate } from 'react-router-dom';
import { GeoCollectivity } from '@/models/geo/_common';

interface DataFilter {
    q: string;
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
    q: '',
};

const Component: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<DataFilter>(DATA_FILTER_INITIAL_VALUE);

    return (
        <LayoutAdminBase
            actions={
                <>
                    <Button leftSection={<IconUserPlus />} component={Link} to={'/admin/user-groups/form'}>
                        Ajouter un groupe
                    </Button>
                </>
            }
        >
            <DataTable<UserGroup, DataFilter>
                endpoint={USER_GROUP_LIST_ENDPOINT}
                filter={filter}
                filtersSection={
                    <FiltersSection filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}>
                        <Input
                            placeholder="Rechercher un groupe"
                            leftSection={<IconSearch size={16} />}
                            value={filter.q}
                            onChange={(event) => {
                                const value = event.currentTarget.value;
                                setFilter((filter) => ({
                                    ...filter,
                                    q: value,
                                }));
                            }}
                        />
                    </FiltersSection>
                }
                tableHeader={[
                    <Table.Th key="createdAt">Date création</Table.Th>,
                    <Table.Th key="name">Nom</Table.Th>,
                    <Table.Th key="categories">Thématiques</Table.Th>,
                    <Table.Th key="collectivities">Collectivités</Table.Th>,
                ]}
                tableBodyRenderFns={[
                    (item: UserGroup) => <DateInfo date={item.createdAt} />,
                    (item: UserGroup) => item.name,
                    (item: UserGroup) => (
                        <PillsDataCells<ObjectTypeCategory>
                            items={item.objectTypeCategories}
                            toLink={(cat) => `/admin/object-type-categories/form/${cat.uuid}`}
                            getLabel={(cat) => cat.name}
                        />
                    ),
                    (item: UserGroup) => (
                        <PillsDataCells<GeoCollectivity>
                            items={[...item.regions, ...item.departments, ...item.communes]}
                            getLabel={(cat) => cat.name}
                        />
                    ),
                ]}
                onItemClick={({ uuid }) => navigate(`/admin/user-groups/form/${uuid}`)}
            />
        </LayoutAdminBase>
    );
};

export default Component;
