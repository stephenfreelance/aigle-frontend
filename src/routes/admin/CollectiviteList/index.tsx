import React, { useEffect, useState } from 'react';

import classes from './index.module.scss';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { Button, Input, Table } from '@mantine/core';
import { COLLECTIVITY_TYPES_ENDPOINTS_MAP, COLLECTIVITY_TYPES_NAMES_MAP } from '@/utils/constants';
import FiltersSection from '@/components/admin/FiltersSection';
import isEqual from 'lodash/isEqual';
import { IconSearch } from '@tabler/icons-react';
import DataTable from '@/components/admin/DataTable';
import { CollectivityType, GeoCollectivity, collectivityTypes } from '@/models/geo/_common';



interface DataFilter {
  q: string;
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
  q: ''
};

const Component: React.FC = () => {
  const [filter, setFilter] = useState<DataFilter>(DATA_FILTER_INITIAL_VALUE);
  const [collectivityTypeSelected, setCollectivityTypeSelected] =
    useState<CollectivityType>(collectivityTypes[0]);
  const [endpoint, setEndpoint] = useState<string>(COLLECTIVITY_TYPES_ENDPOINTS_MAP[collectivityTypes[0]]);

  useEffect(() => {
    setEndpoint(COLLECTIVITY_TYPES_ENDPOINTS_MAP[collectivityTypeSelected]);
  }, [collectivityTypeSelected]);

  return (
    <LayoutAdminBase
    >
      <Button.Group className={classes["collectivity-type-selection"]}>
        {collectivityTypes.map((type) => (
          <Button
            key={type}
            variant={collectivityTypeSelected === type ? 'filled' : 'outline'}
            onClick={() => setCollectivityTypeSelected(type)}
            className={classes["collectivity-type-selection-button"]}
          >
            {COLLECTIVITY_TYPES_NAMES_MAP[type]}
          </Button>
        ))}
      </Button.Group>
      <DataTable<GeoCollectivity, DataFilter>
        endpoint={endpoint}
        filter={filter}
        filtersSection={
          <FiltersSection
            filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}
          >
            <Input
              placeholder={`Rechercher ${COLLECTIVITY_TYPES_NAMES_MAP[collectivityTypeSelected]}`}
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
          <Table.Th key="code">Code</Table.Th>,
          <Table.Th key="displayName">Nom</Table.Th>,
        ]}
        tableBodyRenderFns={[
          (item: GeoCollectivity) => item.code,
          (item: GeoCollectivity) => item.displayName,
        ]}
      />
    </LayoutAdminBase>
  );
};

export default Component;
