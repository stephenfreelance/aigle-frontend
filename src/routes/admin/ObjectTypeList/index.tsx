import React, { useState } from 'react';

import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { OBJECT_TYPE_LIST } from '@/api-endpoints';
import { Button, ColorSwatch, Input, Table } from '@mantine/core';
import FiltersSection from '@/components/admin/FiltersSection';
import isEqual from 'lodash/isEqual';
import { IconCubePlus, IconSearch } from '@tabler/icons-react';
import DataTable from '@/components/admin/DataTable';
import DateInfo from '@/components/DateInfo';
import { ObjectType } from '@/models/object-type';
import { Link, useNavigate } from 'react-router-dom';
import classes from './index.module.scss';

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
          <Button
            leftSection={<IconCubePlus />}
            component={Link}
            to="/admin/object-types/form"
          >
            Ajouter un type d'objet
          </Button>
        </>
      }
    >
      <DataTable<ObjectType, DataFilter>
        endpoint={OBJECT_TYPE_LIST}
        filter={filter}
        filtersSection={
          <FiltersSection
            filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}
          >
            <Input
              placeholder="Rechercher type d'objet"
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
          <Table.Th key="color">Couleur</Table.Th>,
          <Table.Th key="name">Nom</Table.Th>,
          <Table.Th key="createdAt">Date création</Table.Th>,
        ]}
        tableBodyRenderFns={[
          (item: ObjectType) => (
            <div className={classes['color-cell']}>
              <ColorSwatch color={item.color} size={24} /> {item.color}
            </div>
          ),
          (item: ObjectType) => item.name,
          (item: ObjectType) => <DateInfo date={item.createdAt} />,
        ]}
        onItemClick={({ uuid }) => navigate(`/admin/object-types/form/${uuid}`)}
      />
    </LayoutAdminBase>
  );
};

export default Component;
