import React, { useState } from 'react';

import { TILE_SET_LIST_ENDPOINT } from '@/api-endpoints';
import DateInfo from '@/components/DateInfo';
import DataTable from '@/components/admin/DataTable';
import FiltersSection from '@/components/admin/FiltersSection';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { TileSet, TileSetStatus, tileSetStatuses } from '@/models/tile-set';
import { TILE_SET_STATUSES_NAMES_MAP } from '@/utils/constants';
import { Button, Checkbox, Input, Stack, Table, Tooltip } from '@mantine/core';
import { IconLink, IconMapPlus, IconSearch } from '@tabler/icons-react';
import isEqual from 'lodash/isEqual';
import { Link, useNavigate } from 'react-router-dom';

interface DataFilter {
    q: string;
    statuses: TileSetStatus[];
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
    q: '',
    statuses: [...tileSetStatuses].sort(),
};

const Component: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<DataFilter>(DATA_FILTER_INITIAL_VALUE);

    return (
        <LayoutAdminBase
            actions={
                <>
                    <Button leftSection={<IconMapPlus />} component={Link} to="/admin/tile-sets/form">
                        Ajouter un fond de carte
                    </Button>
                </>
            }
        >
            <DataTable<TileSet, DataFilter>
                endpoint={TILE_SET_LIST_ENDPOINT}
                filter={filter}
                filtersSection={
                    <FiltersSection filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}>
                        <Input
                            placeholder="Rechercher un fond de carte"
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

                        <Checkbox.Group
                            label="Status"
                            value={filter.statuses}
                            onChange={(statuses) => {
                                setFilter((filter) => ({
                                    ...filter,
                                    statuses: (statuses as TileSetStatus[]).sort(),
                                }));
                            }}
                        >
                            <Stack gap={0}>
                                {tileSetStatuses.map((status) => (
                                    <Checkbox
                                        mt="xs"
                                        key={status}
                                        value={status}
                                        label={TILE_SET_STATUSES_NAMES_MAP[status]}
                                    />
                                ))}
                            </Stack>
                        </Checkbox.Group>
                    </FiltersSection>
                }
                tableHeader={[
                    <Table.Th key="date">Date</Table.Th>,
                    <Table.Th key="name">Nom</Table.Th>,
                    <Table.Th key="status">Status</Table.Th>,
                    <Table.Th key="url">URL</Table.Th>,
                ]}
                tableBodyRenderFns={[
                    (item: TileSet) => <DateInfo date={item.date} hideTooltip={true} />,
                    (item: TileSet) => item.name,
                    (item: TileSet) => TILE_SET_STATUSES_NAMES_MAP[item.tileSetStatus],
                    (item: TileSet) => (
                        <Tooltip label={item.url}>
                            <Button
                                onClick={(e) => e.stopPropagation()}
                                leftSection={<IconLink size={16} />}
                                color="grey"
                                size="compact-xs"
                                variant="outline"
                                component={Link}
                                to={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                URL
                            </Button>
                        </Tooltip>
                    ),
                ]}
                onItemClick={({ uuid }) => navigate(`/admin/tile-sets/form/${uuid}`)}
            />
        </LayoutAdminBase>
    );
};

export default Component;
