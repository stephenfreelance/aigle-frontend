import React, { useMemo } from 'react';

import MapControlCustom from '@/components/Map/controls/MapControlCustom';
import { MapLayer } from '@/models/map-layer';
import { TileSetType, tileSetTypes } from '@/models/tile-set';
import { TILE_SET_TYPES_NAMES_MAP } from '@/utils/constants';
import { useMap } from '@/utils/map-context';
import { Checkbox, Radio, Stack } from '@mantine/core';
import { IconBoxMultiple } from '@tabler/icons-react';
import classes from './index.module.scss';

type LayersMap = Record<TileSetType, MapLayer[]>;

interface ComponentInnerProps {
    layers: MapLayer[];
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ layers }) => {
    const { setTileSetVisibility } = useMap();

    const layersMap: LayersMap = useMemo(
        () =>
            layers.reduce<LayersMap>(
                (prev, curr) => {
                    prev[curr.tileSet.tileSetType].push(curr);
                    return prev;
                },
                {
                    BACKGROUND: [],
                    PARTIAL: [],
                    INDICATIVE: [],
                },
            ),
        [layers],
    );

    const backgroundTileSetUuidDisplayed = layersMap.BACKGROUND.find((layer) => layer.displayed)?.tileSet.uuid;

    return (
        <>
            <h2>Affichage des couches</h2>
            {layersMap.BACKGROUND.length ? (
                <div className={classes['layers-section']}>
                    <h3 className={classes['layers-section-title']}>Arrière-plan</h3>
                    <Radio.Group
                        value={backgroundTileSetUuidDisplayed}
                        onChange={(uuid) => setTileSetVisibility(uuid, true)}
                    >
                        <Stack className={classes['layers-section-group']}>
                            {layersMap.BACKGROUND.map((layer) => (
                                <Radio key={layer.tileSet.uuid} label={layer.tileSet.name} value={layer.tileSet.uuid} />
                            ))}
                        </Stack>
                    </Radio.Group>
                </div>
            ) : null}
            {tileSetTypes
                .filter((type) => type !== 'BACKGROUND')
                .map((type) =>
                    layersMap[type].length ? (
                        <div key={type} className={classes['layers-section']}>
                            <h3 className={classes['layers-section-title']}>{TILE_SET_TYPES_NAMES_MAP[type]}</h3>
                            <Stack className={classes['layers-section-group']}>
                                {layersMap[type].map((layer) => (
                                    <Checkbox
                                        key={layer.tileSet.uuid}
                                        checked={layer.displayed}
                                        label={layer.tileSet.name}
                                        onChange={(event) =>
                                            setTileSetVisibility(layer.tileSet.uuid, event.currentTarget.checked)
                                        }
                                    />
                                ))}
                            </Stack>
                        </div>
                    ) : null,
                )}
        </>
    );
};

interface ComponentProps {
    isShowed: boolean;
    setIsShowed: (state: boolean) => void;
}

const Component: React.FC<ComponentProps> = ({ isShowed, setIsShowed }) => {
    const { layers } = useMap();

    if (!layers) {
        return null;
    }

    return (
        <MapControlCustom
            controlInner={<IconBoxMultiple color="#777777" />}
            contentClassName={classes.content}
            containerClassName={classes.container}
            isShowed={isShowed}
            setIsShowed={setIsShowed}
        >
            <ComponentInner layers={layers} />
        </MapControlCustom>
    );
};

export default Component;
