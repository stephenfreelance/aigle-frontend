import React, { useState } from 'react';

import { USER_GROUP_LIST_ENDPOINT } from '@/api-endpoints';
import DataTable from '@/components/admin/DataTable';
import FiltersSection from '@/components/admin/FiltersSection';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import PillsDataCell from '@/components/admin/data-cells/PillsDataCell';
import DateInfo from '@/components/ui/DateInfo';
import { GeoCollectivity } from '@/models/geo/_common';
import { ObjectTypeCategory } from '@/models/object-type-category';
import { UserGroupDetail } from '@/models/user-group';
import { Button, Input, Table } from '@mantine/core';
import { IconSearch, IconUserPlus } from '@tabler/icons-react';
import isEqual from 'lodash/isEqual';
import { Link, useNavigate } from 'react-router-dom';

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
            <DataTable<UserGroupDetail, DataFilter>
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
                    (item: UserGroupDetail) => <DateInfo date={item.createdAt} />,
                    (item: UserGroupDetail) => item.name,
                    (item: UserGroupDetail) => (
                        <PillsDataCell<ObjectTypeCategory>
                            items={item.objectTypeCategories}
                            toLink={(cat) => `/admin/object-type-categories/form/${cat.uuid}`}
                            getLabel={(cat) => cat.name}
                        />
                    ),
                    (item: UserGroupDetail) => (
                        <PillsDataCell<GeoCollectivity>
                            items={[...item.regions, ...item.departments, ...item.communes]}
                            getLabel={(geo) => geo.name}
                        />
                    ),
                ]}
                onItemClick={({ uuid }) => navigate(`/admin/user-groups/form/${uuid}`)}
            />
        </LayoutAdminBase>
    );
};

export default Component;
