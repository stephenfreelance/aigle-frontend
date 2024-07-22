import React, { useMemo } from 'react';

import { getGeoCustomZoneDetailEndpoint } from '@/api-endpoints';
import MapControlCustom from '@/components/Map/controls/MapControlCustom';
import { GeoCustomZoneGeojsonData } from '@/models/geo/geo-custom-zone';
import { MapGeoCustomZoneLayer, MapTileSetLayer } from '@/models/map-layer';
import { TileSetType, tileSetTypes } from '@/models/tile-set';
import api from '@/utils/api';
import { TILE_SET_TYPES_NAMES_MAP } from '@/utils/constants';
import { useMap } from '@/utils/map-context';
import { Checkbox, Loader as MantineLoader, Radio, Stack } from '@mantine/core';
import { IconBoxMultiple } from '@tabler/icons-react';
import classes from './index.module.scss';

const CONTROL_LABEL = 'Affichage des couches';

type LayersMap = Record<TileSetType, MapTileSetLayer[]>;

const fetchGeoCustomZone = async (geoCustomZoneUuid: string): Promise<GeoCustomZoneGeojsonData> => {
    const endpoint = getGeoCustomZoneDetailEndpoint(geoCustomZoneUuid);
    const res = await api.get<GeoCustomZoneGeojsonData>(endpoint, {
        params: {
            geometry: true,
        },
    });
    return res.data;
};

interface ComponentInnerProps {
    layers: MapTileSetLayer[];
    customZoneLayers: MapGeoCustomZoneLayer[];
}

const ComponentInner: React.FC<ComponentInnerProps> = ({ layers, customZoneLayers }) => {
    const {
        setTileSetVisibility,
        setCustomZoneVisibility,
        setGeoCustomZoneGeojson,
        geoCustomZonesGeojsonLoading,
        setGeoCustomZoneGeojsonLoading,
        geoCustomZoneUuidGeoCustomZoneGeojsonDataMap,
    } = useMap();

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
            <h2>{CONTROL_LABEL}</h2>
            {layersMap.BACKGROUND.length ? (
                <div className={classes['layers-section']}>
                    <h3 className={classes['layers-section-title']}>Arrière-plan</h3>
                    <Radio.Group
                        value={backgroundTileSetUuidDisplayed}
                        onChange={(uuid) => setTileSetVisibility(uuid, true)}
                    >
                        <Stack className={classes['layers-section-group']} gap="xs">
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
                            <Stack className={classes['layers-section-group']} gap="xs">
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
            <div className={classes['layers-section']}>
                <h3 className={classes['layers-section-title']}>Contours des zones à enjeux</h3>
                <Stack className={classes['layers-section-group']} gap="xs">
                    {customZoneLayers.map((customZoneLayer) => (
                        <Checkbox
                            key={customZoneLayer.geoCustomZone.uuid}
                            checked={customZoneLayer.displayed}
                            label={
                                <div className={classes['checkbox-label']}>
                                    {customZoneLayer.geoCustomZone.name}
                                    {geoCustomZonesGeojsonLoading.includes(customZoneLayer.geoCustomZone.uuid) ? (
                                        <MantineLoader size="xs" ml="sm" />
                                    ) : null}
                                </div>
                            }
                            color={customZoneLayer.geoCustomZone.color}
                            onChange={async (event) => {
                                setCustomZoneVisibility(
                                    customZoneLayer.geoCustomZone.uuid,
                                    event.currentTarget.checked,
                                );
                                if (geoCustomZoneUuidGeoCustomZoneGeojsonDataMap[customZoneLayer.geoCustomZone.uuid]) {
                                    return;
                                }
                                setGeoCustomZoneGeojsonLoading(customZoneLayer.geoCustomZone.uuid, true);
                                const geoCustomZone = await fetchGeoCustomZone(customZoneLayer.geoCustomZone.uuid);
                                setGeoCustomZoneGeojson(geoCustomZone);
                            }}
                        />
                    ))}
                </Stack>
            </div>
        </>
    );
};

interface ComponentProps {
    disabled?: boolean;
    isShowed: boolean;
    setIsShowed: (state: boolean) => void;
}

const Component: React.FC<ComponentProps> = ({ isShowed, setIsShowed, disabled }) => {
    const { layers, customZoneLayers } = useMap();

    if (!layers || !customZoneLayers) {
        return null;
    }

    return (
        <MapControlCustom
            controlInner={<IconBoxMultiple color="#777777" />}
            contentClassName={classes.content}
            containerClassName={classes.container}
            isShowed={isShowed}
            setIsShowed={setIsShowed}
            label={CONTROL_LABEL}
            disabled={disabled}
        >
            <ComponentInner layers={layers} customZoneLayers={customZoneLayers} />
        </MapControlCustom>
    );
};

export default Component;
