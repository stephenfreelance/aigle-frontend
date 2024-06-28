import React, { useMemo } from 'react';

import MapControlCustom from '@/components/Map/controls/MapControlCustom';
import { DetectionFilter } from '@/models/detection-filter';
import { ObjectType } from '@/models/object-type';
import { useMap } from '@/utils/map-context';
import { ActionIcon, Badge, ColorSwatch, Group, MultiSelect } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { IconCheck, IconFilter, IconX } from '@tabler/icons-react';
import classes from './index.module.scss';

interface FormValues {
    objectTypesUuids: DetectionFilter['objectTypesUuids'];
}

interface ComponentInnerProps {
    objectTypes: ObjectType[];
    objectTypesUuidsSelected: DetectionFilter['objectTypesUuids'];
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ objectTypes, objectTypesUuidsSelected }) => {
    const { updateDetectionFilter } = useMap();
    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues: {
            objectTypesUuids: objectTypesUuidsSelected,
        },
    });
    form.watch('objectTypesUuids', ({ value }) => {
        updateDetectionFilter({
            objectTypesUuids: value,
        });
    });

    const objectTypesMap: Record<string, ObjectType> = useMemo(() => {
        return (
            objectTypes?.reduce(
                (prev, curr) => ({
                    ...prev,
                    [curr.uuid]: curr,
                }),
                {},
            ) || {}
        );
    }, [objectTypes]);

    return (
        <form className={classes.form}>
            <h2>Filtrer les annotations</h2>
            <MultiSelect
                className="multiselect-pills-hidden"
                mt="md"
                label="Types d'objets"
                placeholder="Caravane, piscine,..."
                searchable
                data={(objectTypes || []).map(({ name, uuid }) => ({
                    value: uuid,
                    label: name,
                }))}
                renderOption={(item) => (
                    <div className="multi-select-item">
                        <div className="multi-select-item-label">
                            <ColorSwatch color={objectTypesMap[item.option.value].color} size={24} />
                            {item.option.label}
                        </div>
                        {item.checked ? <IconCheck className="multi-select-item-icon" color="grey" /> : null}
                    </div>
                )}
                key={form.key('objectTypesUuids')}
                {...form.getInputProps('objectTypesUuids')}
            />
            {form.getValues().objectTypesUuids.length ? (
                <Group gap="xs" mt="sm">
                    {form.getValues().objectTypesUuids.map((uuid) => (
                        <Badge
                            autoContrast
                            rightSection={
                                <ActionIcon
                                    variant="transparent"
                                    size={16}
                                    onClick={() => {
                                        form.setFieldValue('objectTypesUuids', (prev) =>
                                            prev.filter((typeUuid) => typeUuid !== uuid),
                                        );
                                    }}
                                >
                                    <IconX size={16} color="white" />
                                </ActionIcon>
                            }
                            radius={100}
                            key={uuid}
                            color={objectTypesMap[uuid].color}
                        >
                            {objectTypesMap[uuid].name}
                        </Badge>
                    ))}
                </Group>
            ) : (
                <p className={classes['empty-filter-text']}>Aucun filtre sur les types n&apos;est appliqué</p>
            )}
        </form>
    );
};

interface ComponentProps {
    isShowed: boolean;
    setIsShowed: (state: boolean) => void;
}

const Component: React.FC<ComponentProps> = ({ isShowed, setIsShowed }) => {
    const { objectTypes, detectionFilter } = useMap();

    if (!objectTypes || !detectionFilter) {
        return null;
    }

    return (
        <MapControlCustom
            controlInner={<IconFilter color="#777777" />}
            contentClassName={classes.content}
            containerClassName={classes.container}
            isShowed={isShowed}
            setIsShowed={setIsShowed}
        >
            <ComponentInner objectTypes={objectTypes} objectTypesUuidsSelected={detectionFilter.objectTypesUuids} />
        </MapControlCustom>
    );
};

export default Component;
