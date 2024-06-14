import React, { useState } from 'react';

import { OBJECT_TYPE_CATEGORY_LIST_ENDPOINT, OBJECT_TYPE_LIST_ENDPOINT } from '@/api-endpoints';
import DateInfo from '@/components/DateInfo';
import DataTable from '@/components/admin/DataTable';
import FiltersSection from '@/components/admin/FiltersSection';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import { ObjectType, ObjectTypeDetail } from '@/models/object-type';
import api from '@/utils/api';
import { Button, ColorSwatch, Group, Input, MultiSelect, ScrollArea, Table } from '@mantine/core';
import { IconCheck, IconCubePlus, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import isEqual from 'lodash/isEqual';
import { Link, useNavigate } from 'react-router-dom';
import classes from './index.module.scss';

interface DataFilter {
    q: string;
    objectTypeCategoriesUuids: string[];
}

const DATA_FILTER_INITIAL_VALUE: DataFilter = {
    q: '',
    objectTypeCategoriesUuids: [],
};

const Component: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<DataFilter>(DATA_FILTER_INITIAL_VALUE);

    const fetchObjectTypeCategories = async () => {
        const res = await api.get<ObjectType[]>(OBJECT_TYPE_CATEGORY_LIST_ENDPOINT);
        return res.data;
    };

    const { data: objectTypeCategories } = useQuery({
        queryKey: [OBJECT_TYPE_CATEGORY_LIST_ENDPOINT],
        queryFn: () => fetchObjectTypeCategories(),
    });

    return (
        <LayoutAdminBase
            actions={
                <>
                    <Button leftSection={<IconCubePlus />} component={Link} to="/admin/object-types/form">
                        Ajouter un type d&apos;objet
                    </Button>
                </>
            }
        >
            <DataTable<ObjectTypeDetail, DataFilter>
                endpoint={OBJECT_TYPE_LIST_ENDPOINT}
                filter={filter}
                filtersSection={
                    <FiltersSection filtersSet={!isEqual(filter, DATA_FILTER_INITIAL_VALUE)}>
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
                        <MultiSelect
                            mt="md"
                            label="Thématiques"
                            placeholder="Déchets, constructions,..."
                            searchable
                            data={(objectTypeCategories || []).map(({ name, uuid }) => ({
                                value: uuid,
                                label: name,
                            }))}
                            renderOption={(item) => (
                                <div className="multi-select-item">
                                    <div className="multi-select-item-label">{item.option.label}</div>
                                    {item.checked ? (
                                        <IconCheck className="multi-select-item-icon" color="grey" />
                                    ) : null}
                                </div>
                            )}
                            value={filter.objectTypeCategoriesUuids}
                            onChange={(objectTypeCategoriesUuids: string[]) =>
                                setFilter((prev) => ({
                                    ...prev,
                                    objectTypeCategoriesUuids,
                                }))
                            }
                        />
                    </FiltersSection>
                }
                tableHeader={[
                    <Table.Th key="createdAt">Date création</Table.Th>,
                    <Table.Th key="color">Couleur</Table.Th>,
                    <Table.Th key="name">Nom</Table.Th>,
                    <Table.Th key="categories">Thématiques</Table.Th>,
                ]}
                tableBodyRenderFns={[
                    (item: ObjectTypeDetail) => <DateInfo date={item.createdAt} />,
                    (item: ObjectTypeDetail) => (
                        <div className={classes['color-cell']}>
                            <ColorSwatch color={item.color} size={24} /> {item.color}
                        </div>
                    ),
                    (item: ObjectTypeDetail) => item.name,
                    (item: ObjectTypeDetail) => (
                        <ScrollArea scrollbars="x" offsetScrollbars>
                            <Group gap="xs" className={classes['categories-cell']}>
                                {item.categories.map((cat) => (
                                    <Button
                                        component={Link}
                                        autoContrast
                                        radius={100}
                                        key={cat.uuid}
                                        to={`/admin/object-type-categories/form/${cat.uuid}`}
                                        onClick={(e) => e.stopPropagation()}
                                        target="_blank"
                                        size="compact-xs"
                                        color="gray"
                                    >
                                        {cat.name}
                                    </Button>
                                ))}
                            </Group>
                        </ScrollArea>
                    ),
                ]}
                onItemClick={({ uuid }) => navigate(`/admin/object-types/form/${uuid}`)}
            />
        </LayoutAdminBase>
    );
};

export default Component;
