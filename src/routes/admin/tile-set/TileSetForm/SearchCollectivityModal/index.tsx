import { getGeoDetailEndpoint, getGeoListEndpoint } from '@/api-endpoints';
import { Paginated } from '@/models/data';
import { CollectivityType, GeoCollectivity, GeoCollectivityDetail, collectivityTypes } from '@/models/geo/_common';
import api from '@/utils/api';
import { COLLECTIVITY_TYPES_NAMES_MAP } from '@/utils/constants';
import { Button, Loader as MantineLoader, Modal, Select } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { Geometry } from 'geojson';
import React, { useState } from 'react';

const GEO_COLLECTIVITIES_LIMIT = 10;

const fetchGeoCollectivities = async <T extends GeoCollectivity>(
    collectivityType: CollectivityType,
    q: string,
): Promise<T[]> => {
    const endpoint = getGeoListEndpoint(collectivityType);
    const res = await api.get<Paginated<T>>(endpoint, {
        params: {
            q,
            limit: GEO_COLLECTIVITIES_LIMIT,
            offset: 0,
        },
    });
    return res.data.results;
};

interface ComponentProps {
    showed: boolean;
    onClose: (geometry?: Geometry) => void;
}
const Component: React.FC<ComponentProps> = ({ showed, onClose }: ComponentProps) => {
    const [collectivityTypeSelected, setCollectivityTypeSelected] = useState<CollectivityType>(collectivityTypes[0]);
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue] = useDebouncedValue(searchValue, 250);
    const [collectvityUuid, setCollectvityUuid] = useState<string | null>();

    const { data, isLoading } = useQuery<GeoCollectivity[]>({
        queryKey: [collectivityTypeSelected, debouncedSearchValue],
        enabled: !!searchValue,
        queryFn: () => fetchGeoCollectivities(collectivityTypeSelected, debouncedSearchValue),
    });

    const fetchGeoDetail = async () => {
        const res = await api.get<GeoCollectivityDetail>(
            getGeoDetailEndpoint(collectivityTypeSelected, String(collectvityUuid)),
        );

        return res.data;
    };
    const { isLoading: isLoadingGeoDetail, refetch: refetchGeoDetail } = useQuery({
        enabled: false,
        queryKey: [getGeoDetailEndpoint(collectivityTypeSelected, String(collectvityUuid))],
        queryFn: () => fetchGeoDetail(),
    });

    return (
        <Modal opened={showed} onClose={onClose} title="Rechercher une collectivité">
            <Select
                mt="md"
                data={collectivityTypes.map((type) => ({
                    value: type,
                    label: COLLECTIVITY_TYPES_NAMES_MAP[type],
                }))}
                value={collectivityTypeSelected}
                allowDeselect={false}
                onChange={(collectivityType) => setCollectivityTypeSelected(collectivityType as CollectivityType)}
            />

            <Select
                mt="md"
                placeholder={`Rechercher ${COLLECTIVITY_TYPES_NAMES_MAP[collectivityTypeSelected]}`}
                searchable
                data={(data || []).map((geo) => ({
                    value: geo.uuid,
                    label: geo.displayName,
                }))}
                onSearchChange={setSearchValue}
                onChange={(uuid) => setCollectvityUuid(uuid)}
                value={collectvityUuid}
                rightSection={isLoading ? <MantineLoader size="xs" /> : null}
                filter={({ options }) => options}
            />

            <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => onClose()}>
                    Annuler
                </Button>

                <Button
                    disabled={!collectvityUuid || isLoadingGeoDetail}
                    rightSection={isLoadingGeoDetail ? <MantineLoader size="xs" /> : null}
                    onClick={async () => {
                        const geoDetail = await refetchGeoDetail();
                        onClose(geoDetail.data?.geometry);
                    }}
                >
                    Remplir la géométrie
                </Button>
            </div>
        </Modal>
    );
};

export default Component;
