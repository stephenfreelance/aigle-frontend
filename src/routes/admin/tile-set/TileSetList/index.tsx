import React, { useState } from 'react';

import { TILE_SET_LIST_ENDPOINT } from '@/api-endpoints';
import DateInfo from '@/components/DateInfo';
import InfoCard from '@/components/InfoCard';
import DataTable from '@/components/admin/DataTable';
import FiltersSection from '@/components/admin/FiltersSection';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { TileSet, TileSetScheme, TileSetStatus, tileSetSchemes, tileSetStatuses } from '@/models/tile-set';
import { TILE_SET_STATUSES_NAMES_MAP, TILE_SET_TYPES_NAMES_MAP } from '@/utils/constants';
import { Button, Checkbox, Input, Stack, Table, Tooltip } from '@mantine/core';
import { IconCheck, IconLink, IconMapPlus, IconSearch, IconX } from '@tabler/icons-react';
import isEqual from 'lodash/isEqual';
import { Link, useNavigate } from 'react-router-dom';

interface DataFilter {
    q: string;
    statuses: TileSetStatus[];
    schemes: TileSetScheme[];
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
    q: '',
    statuses: [...tileSetStatuses].sort(),
    schemes: [...tileSetSchemes].sort(),
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
            <InfoCard title="Ordre d'affichage des couches">
                <p>
                    Les fonds de carte sont ordonnés selon leur types dans l&apos;ordre suivant (de plus au fond au
                    premier plan): {TILE_SET_TYPES_NAMES_MAP.BACKGROUND}, {TILE_SET_TYPES_NAMES_MAP.PARTIAL},{' '}
                    {TILE_SET_TYPES_NAMES_MAP.INDICATIVE}
                </p>
                <p>
                    Les couches du même type sont ensuite ordonnées du plus ancien (au fond) au plus récent (au premier
                    plan).
                </p>
            </InfoCard>
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

                        <Checkbox.Group
                            label="Schemes"
                            value={filter.schemes}
                            onChange={(schemes) => {
                                setFilter((filter) => ({
                                    ...filter,
                                    schemes: (schemes as TileSetScheme[]).sort(),
                                }));
                            }}
                        >
                            <Stack gap={0}>
                                {tileSetSchemes.map((scheme) => (
                                    <Checkbox mt="xs" key={scheme} value={scheme} label={scheme} />
                                ))}
                            </Stack>
                        </Checkbox.Group>
                    </FiltersSection>
                }
                tableHeader={[
                    <Table.Th key="date">Date</Table.Th>,
                    <Table.Th key="name">Nom</Table.Th>,
                    <Table.Th key="type">Type</Table.Th>,
                    <Table.Th key="status">Status</Table.Th>,
                    <Table.Th key="scheme">Scheme</Table.Th>,
                    <Table.Th key="geometry">Limites géo</Table.Th>,
                    <Table.Th key="url">URL</Table.Th>,
                ]}
                tableBodyRenderFns={[
                    (item: TileSet) => <DateInfo date={item.date} hideTooltip={true} />,
                    (item: TileSet) => item.name,
                    (item: TileSet) => TILE_SET_TYPES_NAMES_MAP[item.tileSetType],
                    (item: TileSet) => TILE_SET_STATUSES_NAMES_MAP[item.tileSetStatus],
                    (item: TileSet) => item.tileSetScheme,
                    (item: TileSet) => <>{item.geometry ? <IconCheck /> : <IconX />}</>,
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
