import React from 'react';

import MapControlCustom from '@/components/Map/controls/MapControlCustom';
import { useMap } from '@/utils/map-context';
import { SegmentedControl } from '@mantine/core';
import { format } from 'date-fns';
import classes from './index.module.scss';

const Component: React.FC = () => {
    const { getTileSets, setTileSetVisibility } = useMap();

    const backgroundTileSets = getTileSets(['BACKGROUND'], ['VISIBLE', 'HIDDEN']);

    return (
        <MapControlCustom
            contentClassName={classes.content}
            controlType="SIMPLE"
            position="bottom-left"
            isShowed={true}
        >
            <SegmentedControl
                className={classes['controller']}
                size="md"
                fullWidth
                color="#21e19b"
                orientation="vertical"
                data={backgroundTileSets.map((tileSet) => ({
                    label: format(tileSet.date, 'yyyy'),
                    value: tileSet.uuid,
                }))}
                onChange={(value) => setTileSetVisibility(value, true)}
            />
        </MapControlCustom>
    );
};

export default Component;
