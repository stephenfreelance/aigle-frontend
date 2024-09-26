import React, { useMemo } from 'react';

import SelectItem from '@/components/ui/SelectItem';
import { detectionControlStatuses, detectionValidationStatuses } from '@/models/detection';
import { ObjectsFilter } from '@/models/detection-filter';
import { GeoCustomZone } from '@/models/geo/geo-custom-zone';
import { ObjectType } from '@/models/object-type';
import {
    DETECTION_CONTROL_STATUSES_NAMES_MAP,
    DETECTION_VALIDATION_STATUSES_COLORS_MAP,
    DETECTION_VALIDATION_STATUSES_NAMES_MAP,
} from '@/utils/constants';
import { ActionIcon, Badge, Button, Checkbox, Group, MultiSelect, Slider, Stack, Text } from '@mantine/core';
import { UseFormReturnType, useForm } from '@mantine/form';
import { IconX } from '@tabler/icons-react';
import clsx from 'clsx';
import classes from './index.module.scss';

const CONTROL_LABEL = 'Filtrer les objets';

interface FormValues {
    objectTypesUuids: ObjectsFilter['objectTypesUuids'];
    detectionValidationStatuses: ObjectsFilter['detectionValidationStatuses'];
    detectionControlStatuses: ObjectsFilter['detectionControlStatuses'];
    score: ObjectsFilter['score'];
    prescripted: ObjectsFilter['prescripted'];
    customZonesUuids: ObjectsFilter['customZonesUuids'];
}

const formatScore = (score: number) => Math.round(score * 100);

interface ComponentProps {
    objectTypes: ObjectType[];
    objectsFilter: ObjectsFilter;
    geoCustomZones: GeoCustomZone[];
    updateObjectsFilter: (objectsFilter: ObjectsFilter) => void;
}

const Component: React.FC<ComponentProps> = ({ objectTypes, objectsFilter, geoCustomZones, updateObjectsFilter }) => {
    const {
        objectTypesUuids,
        detectionValidationStatuses: detectionValidationStatusesFilter,
        detectionControlStatuses: detectionControlStatusesFilter,
        score,
        prescripted,
        customZonesUuids,
    } = objectsFilter;

    const form: UseFormReturnType<FormValues> = useForm({
        mode: 'uncontrolled',
        initialValues: {
            objectTypesUuids,
            detectionValidationStatuses: detectionValidationStatusesFilter,
            detectionControlStatuses: detectionControlStatusesFilter,
            score,
            prescripted,
            customZonesUuids: customZonesUuids,
        },
    });
    form.watch('objectTypesUuids', ({ value }) => {
        updateObjectsFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: value,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
            score: form.getValues().score,
            prescripted: form.getValues().prescripted,
            customZonesUuids: form.getValues().customZonesUuids,
        });
    });
    form.watch('detectionValidationStatuses', ({ value }) => {
        updateObjectsFilter({
            detectionValidationStatuses: value,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
            score: form.getValues().score,
            prescripted: form.getValues().prescripted,
            customZonesUuids: form.getValues().customZonesUuids,
        });
    });
    form.watch('detectionControlStatuses', ({ value }) => {
        updateObjectsFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: value,
            score: form.getValues().score,
            prescripted: form.getValues().prescripted,
            customZonesUuids: form.getValues().customZonesUuids,
        });
    });
    form.watch('score', ({ value }) => {
        updateObjectsFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
            score: value,
            prescripted: form.getValues().prescripted,
            customZonesUuids: form.getValues().customZonesUuids,
        });
    });
    form.watch('prescripted', ({ value }) => {
        updateObjectsFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
            score: form.getValues().score,
            prescripted: value,
            customZonesUuids: form.getValues().customZonesUuids,
        });
    });
    form.watch('customZonesUuids', ({ value }) => {
        updateObjectsFilter({
            detectionValidationStatuses: form.getValues().detectionValidationStatuses,
            objectTypesUuids: form.getValues().objectTypesUuids,
            detectionControlStatuses: form.getValues().detectionControlStatuses,
            score: form.getValues().score,
            prescripted: form.getValues().prescripted,
            customZonesUuids: value,
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

            <div className={classes['filters-container']}>
                <div className={classes['filters-section']}>
                    <Text mt="md" className="input-label">
                        Score
                    </Text>
                    <div className={classes['score-slider-value-container']}>
                        <Slider
                            className={classes['score-slider']}
                            label={formatScore}
                            min={0}
                            max={1}
                            step={0.05}
                            key={form.key('score')}
                            {...form.getInputProps('score')}
                            onChange={undefined}
                            onChangeEnd={(value) => form.setFieldValue('score', value)}
                        />
                        {formatScore(form.getValues().score)}
                    </div>

                    <Text mt="md" className="input-label">
                        Prescription
                    </Text>
                    <Button.Group className={classes['prescription-selection-container']}>
                        <Button
                            fullWidth
                            size="xs"
                            variant={form.getValues().prescripted === null ? 'filled' : 'outline'}
                            type="button"
                            onClick={() => form.setFieldValue('prescripted', null)}
                        >
                            Tous les objets
                        </Button>
                        <Button
                            fullWidth
                            size="xs"
                            variant={form.getValues().prescripted === true ? 'filled' : 'outline'}
                            type="button"
                            onClick={() => form.setFieldValue('prescripted', true)}
                        >
                            Prescrits
                        </Button>
                        <Button
                            fullWidth
                            size="xs"
                            variant={form.getValues().prescripted === false ? 'filled' : 'outline'}
                            type="button"
                            onClick={() => form.setFieldValue('prescripted', false)}
                        >
                            Non-prescrits
                        </Button>
                    </Button.Group>

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
                            <SelectItem item={item} color={objectTypesMap[item.option.value].color} />
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
                </div>

                <div className={clsx(classes['statuses-filters-container'], classes['filters-section'])}>
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
                            <div className={classes['empty-filter-text']}>
                                <p>Aucun filtre sur les statuts</p>
                                <p>de validation n&apos;est appliqué</p>
                            </div>
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
                            <div className={classes['empty-filter-text']}>
                                <p>Aucun filtre sur les statuts</p>
                                <p>de contrôle n&apos;est appliqué</p>
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <Checkbox.Group
                            mt="xl"
                            label="Zones à enjeux"
                            key={form.key('customZonesUuids')}
                            {...form.getInputProps('customZonesUuids')}
                        >
                            <Stack gap="xs" mt="sm">
                                {geoCustomZones.map((zone) => (
                                    <Checkbox key={zone.uuid} value={zone.uuid} label={zone.name} color={zone.color} />
                                ))}
                            </Stack>
                        </Checkbox.Group>

                        {form.getValues().customZonesUuids.length === 0 ? (
                            <div className={classes['empty-filter-text']}>
                                <p>Aucune zone à enjeux n&apos;est sélectionnée</p>
                                <p>tous les objets sont affichés</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </form>
    );
};

export default Component;