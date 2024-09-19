import FilterObjects from '@/components/FilterObjects';
import FiltersSection from '@/components/admin/FiltersSection';
import ValidationStatusEvolutionChart from '@/components/statistics/ValidationStatusEvolutionChart';
import { useStatistics } from '@/utils/context/statistics-context';
import React from 'react';
import classes from './index.module.scss';

const Component: React.FC = () => {
    const { allObjectTypes, objectsFilter, geoCustomZones, updateObjectsFilter } = useStatistics();

    if (!allObjectTypes || !objectsFilter || !geoCustomZones) {
        return null;
    }

    return (
        <div className={classes.container}>
            <FiltersSection opened>
                <FilterObjects
                    objectTypes={allObjectTypes}
                    objectsFilter={objectsFilter}
                    geoCustomZones={geoCustomZones}
                    updateObjectsFilter={updateObjectsFilter}
                />
            </FiltersSection>
            <ValidationStatusEvolutionChart />
        </div>
    );
};

export default Component;
