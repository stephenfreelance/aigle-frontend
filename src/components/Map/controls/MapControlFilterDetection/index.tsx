import React, { useMemo } from 'react';

import MapControlCustom from '@/components/Map/controls/MapControlCustom';
import SelectItem from '@/components/ui/SelectItem';
import { detectionControlStatuses, detectionValidationStatuses } from '@/models/detection';
import { DetectionFilter } from '@/models/detection-filter';
import { ObjectType } from '@/models/object-type';
import {
    DETECTION_CONTROL_STATUSES_NAMES_MAP,
    DETECTION_VALIDATION_STATUSES_COLORS_MAP,
    DETECTION_VALIDATION_STATUSES_NAMES_MAP,
} from '@/utils/constants';
import { useMap } from '@/utils/map-context';
import { ActionIcon, Badge, Checkbox, Group, MultiSelect, Stack } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { IconFilter, IconX } from '@tabler/icons-react';
import classes from './index.module.scss';

const CONTROL_LABEL = 'Filtrer les objets';

interface FormValues {
    objectTypesUuids: DetectionFilter['objectTypesUuids'];
    detectionValidationStatuses: DetectionFilter['detectionValidationStatuses'];
    detectionControlStatuses: DetectionFilter['detectionControlStatuses'];
}

interface ComponentInnerProps {
    objectTypes: ObjectType[];
    objectTypesUuidsSelected: DetectionFilter['objectTypesUuids'];
    detectionValidationStatusesSelected: DetectionFilter['detectionValidationStatuses'];
    detectionControlStatusesSelected: DetectionFilter['detectionControlStatuses'];
}

const ComponentInner: React.FC<ComponentInnerProps> = ({
    objectTypes,
    objectTypesUuidsSelected,
    detectionValidationStatusesSelected,
    detectionControlStatusesSelected,
}) => {
    const { updateDetectionFilter } = useMap();
    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues: {
            objectTypesUuids: objectTypesUuidsSelected,
            detectionValidationStatuses: detectionValidationStatusesSelected,
            detectionControlStatuses: detectionControlStatusesSelected,
        },
    });
    form.watch('objectTypesUuids', ({ value }) => {
        updateDetectionFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: value,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
        });
    });
    form.watch('detectionValidationStatuses', ({ value }) => {
        updateDetectionFilter({
            detectionValidationStatuses: value,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
        });
    });
    form.watch('detectionControlStatuses', ({ value }) => {
        updateDetectionFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: value,
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
            <h2>{CONTROL_LABEL}</h2>
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
                renderOption={(item) => <SelectItem item={item} color={objectTypesMap[item.option.value].color} />}
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

            <div className={classes['statuses-filters-container']}>
                <div>
                    <Checkbox.Group
                        mt="xl"
                        label="Statuts de validation"
                        key={form.key('detectionValidationStatuses')}
                        {...form.getInputProps('detectionValidationStatuses')}
                    >
                        <Stack gap="xs" mt="sm">
                            {detectionValidationStatuses.map((status) => (
                                <Checkbox
                                    key={status}
                                    value={status}
                                    label={DETECTION_VALIDATION_STATUSES_NAMES_MAP[status]}
                                    color={DETECTION_VALIDATION_STATUSES_COLORS_MAP[status]}
                                />
                            ))}
                        </Stack>
                    </Checkbox.Group>

                    {form.getValues().detectionValidationStatuses.length === 0 ? (
                        <p className={classes['empty-filter-text']}>
                            Aucun filtre sur les statuts de validation n&apos;est appliqué
                        </p>
                    ) : null}
                </div>

                <div>
                    <Checkbox.Group
                        mt="xl"
                        label="Statuts de contrôle"
                        key={form.key('detectionControlStatuses')}
                        {...form.getInputProps('detectionControlStatuses')}
                    >
                        <Stack gap="xs" mt="sm">
                            {detectionControlStatuses.map((status) => (
                                <Checkbox
                                    key={status}
                                    value={status}
                                    label={DETECTION_CONTROL_STATUSES_NAMES_MAP[status]}
                                />
                            ))}
                        </Stack>
                    </Checkbox.Group>

                    {form.getValues().detectionControlStatuses.length === 0 ? (
                        <p className={classes['empty-filter-text']}>
                            Aucun filtre sur les statuts de contrôle n&apos;est appliqué
                        </p>
                    ) : null}
                </div>
            </div>
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
            label={CONTROL_LABEL}
            controlInner={<IconFilter color="#777777" />}
            contentClassName={classes.content}
            containerClassName={classes.container}
            isShowed={isShowed}
            setIsShowed={setIsShowed}
        >
            <ComponentInner
                objectTypes={objectTypes}
                objectTypesUuidsSelected={detectionFilter.objectTypesUuids}
                detectionValidationStatusesSelected={detectionFilter.detectionValidationStatuses}
                detectionControlStatusesSelected={detectionFilter.detectionControlStatuses}
            />
        </MapControlCustom>
    );
};

export default Component;
