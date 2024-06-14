import React from 'react';

import MapControlCustom from '@/components/Map/MapControlCustom';
import { ObjectType } from '@/models/object-type';
import { useMap } from '@/utils/map-context';
import classes from './index.module.scss';

interface ObjectTypeLegendProps {
    objectType: ObjectType;
}

const ObjectTypeLegend: React.FC<ObjectTypeLegendProps> = ({ objectType }) => {
    return (
        <li className={classes['object-type-legend-item']}>
            <div
                className={classes['object-type-legend-item-square']}
                style={{
                    borderColor: objectType.color,
                }}
            />
            {objectType.name}
        </li>
    );
};

interface ComponentInnerProps {
    objectTypes: ObjectType[];
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ objectTypes }) => {
    return (
        <>
            <h2>Types d&apos;objets</h2>

            <ul className={classes['object-type-legends']}>
                {objectTypes.map((type) => (
                    <ObjectTypeLegend key={type.uuid} objectType={type} />
                ))}
            </ul>
        </>
    );
};

interface ComponentProps {
    isShowed: boolean;
    setIsShowed: (state: boolean) => void;
}

const Component: React.FC<ComponentProps> = ({ isShowed, setIsShowed }) => {
    const { objectTypes } = useMap();

    if (!objectTypes) {
        return null;
    }

    return (
        <MapControlCustom
            controlInner="Afficher la légende"
            controlType="SWITCH"
            position="bottom-left"
            contentClassName={classes.content}
            containerClassName={classes.container}
            isShowed={isShowed}
            setIsShowed={setIsShowed}
        >
            <ComponentInner objectTypes={objectTypes} />
        </MapControlCustom>
    );
};

export default Component;
