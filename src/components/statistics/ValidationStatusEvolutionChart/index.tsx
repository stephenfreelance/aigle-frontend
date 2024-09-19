import { STATISTICS_VALIDATION_STATUS_ENDPOINT } from '@/api-endpoints';
import Header from '@/components/Header';
import Loader from '@/components/ui/Loader';
import { ObjectsFilter } from '@/models/detection-filter';
import { ValidationStatusEvolution } from '@/models/statistics/valisation-status-evolution';
import { TileSet } from '@/models/tile-set';
import api from '@/utils/api';
import { DETECTION_VALIDATION_STATUSES_COLORS_MAP, DETECTION_VALIDATION_STATUSES_NAMES_MAP } from '@/utils/constants';
import { useStatistics } from '@/utils/context/statistics-context';
import { LineChart } from '@mantine/charts';
import { LoadingOverlay, MultiSelect } from '@mantine/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import classes from './index.module.scss';

const fetchData = async (
    signal: AbortSignal,
    objectsFilter: ObjectsFilter,
    tileSets: TileSet[],
    tileSetsUuids: string[],
): any => {
    console.log({
        objectsFilter,
        tileSets,
        tileSetsUuids,
    });
    const params: any = {
        detectionValidationStatuses: objectsFilter.detectionValidationStatuses.join(','),
        tileSetsUuids: tileSetsUuids.join(','),
        detectionControlStatuses: objectsFilter.detectionControlStatuses.join(','),
        score: objectsFilter.score,
        objectTypesUuids: objectsFilter.objectTypesUuids.join(','),
        customZonesUuids: objectsFilter.customZonesUuids.join(','),
    };

    if (objectsFilter.prescripted !== null) {
        params.prescripted = objectsFilter.prescripted;
    }

    const res = await api.get<ValidationStatusEvolution[]>(STATISTICS_VALIDATION_STATUS_ENDPOINT, {
        params,
        signal,
    });

    const chartData: any = tileSets.reduce((prev, current) => {
        if (!tileSetsUuids.includes(current.uuid)) {
            return prev;
        }

        const newItem = {
            [current.uuid]: objectsFilter.detectionValidationStatuses.reduce(
                (prev, curr) => ({
                    ...prev,
                    [DETECTION_VALIDATION_STATUSES_NAMES_MAP[curr]]: 0,
                }),
                {
                    date: new Date(current.date),
                    name: current.name,
                },
            ),
        };

        return {
            ...prev,
            ...newItem,
        };
    }, {});

    res.data.forEach(({ detectionValidationStatus, detectionsCount, uuid }) => {
        if (!chartData[uuid]) {
            return;
        }

        chartData[uuid][DETECTION_VALIDATION_STATUSES_NAMES_MAP[detectionValidationStatus]] = detectionsCount;
    });

    return Object.values(chartData).sort((a, b) => a.date.getTime() - b.date.getTime());
};

interface ComponentInnerProps {
    tileSets: TileSet[];
    objectsFilter: ObjectsFilter;
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ tileSets, objectsFilter }: ComponentInnerProps) => {
    const [tileSetsUuids, setTileSetsUuids] = useState<string[]>(
        tileSets.filter(({ tileSetType }) => tileSetType === 'BACKGROUND').map(({ uuid }) => uuid),
    );
    const tileSetsValues = useMemo(() => tileSets.map(({ name, uuid }) => ({ value: uuid, label: name })), [tileSets]);
    const series = useMemo(() => {
        return objectsFilter.detectionValidationStatuses.map((status) => ({
            name: DETECTION_VALIDATION_STATUSES_NAMES_MAP[status],
            color: DETECTION_VALIDATION_STATUSES_COLORS_MAP[status],
        }));
    }, [objectsFilter.detectionValidationStatuses]);

    const { data: statistics, isFetching } = useQuery({
        queryKey: [STATISTICS_VALIDATION_STATUS_ENDPOINT, Object.values(objectsFilter), tileSetsUuids.join(',')],
        placeholderData: keepPreviousData,
        queryFn: ({ signal }) => fetchData(signal, objectsFilter, tileSets, tileSetsUuids),
    });

    if (!statistics) {
        return <Loader />;
    }

    return (
        <div>
            <h2 className={classes.title}>Evolution du nombre de détections par status de validation</h2>
            <MultiSelect
                label="Fonds de carte"
                data={tileSetsValues}
                value={tileSetsUuids}
                onChange={(uuids) => {
                    setTileSetsUuids(uuids);
                    console.log('ONCHANGE');
                }}
            />
            <div className={classes['chart-container']}>
                <LoadingOverlay visible={isFetching}>
                    <Loader />
                </LoadingOverlay>
                <LineChart
                    lineProps={{
                        isAnimationActive: true,
                    }}
                    withLegend
                    h={300}
                    data={statistics}
                    dataKey="name"
                    series={series}
                    curveType="linear"
                />
            </div>
        </div>
    );
};

const Component: React.FC = () => {
    const { layers, objectsFilter } = useStatistics();
    const tileSets = useMemo(() => (layers || []).map((layer) => layer.tileSet), [layers]);

    return (
        <>
            <Header />
            <div className={classes.content}>
                {objectsFilter && tileSets && tileSets.length ? (
                    <ComponentInner objectsFilter={objectsFilter} tileSets={tileSets} />
                ) : (
                    <Loader />
                )}
            </div>
        </>
    );
};

export default Component;
