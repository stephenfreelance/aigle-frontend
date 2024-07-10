import React from 'react';

import { MAP_SETTINGS_ENDPOINT } from '@/api-endpoints';
import Header from '@/components/Header';
import MapComponent from '@/components/Map';
import Loader from '@/components/ui/Loader';
import { MapSettings } from '@/models/map-settings';
import api from '@/utils/api';
import { useMap } from '@/utils/map-context';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { useQuery } from '@tanstack/react-query';
import classes from './index.module.scss';

const Component: React.FC = () => {
    const { setMapSettings, layers } = useMap();
    const fetchMapSettings = async () => {
        const res = await api.get<MapSettings>(MAP_SETTINGS_ENDPOINT);
        setMapSettings(res.data);
        return res.data;
    };

    useQuery({
        queryKey: [MAP_SETTINGS_ENDPOINT],
        queryFn: () => fetchMapSettings(),
    });

    return (
        <>
            <Header />
            <div className={classes['map-container']}>
                {layers ? <MapComponent layers={layers} /> : <Loader className={classes.loader} />}
            </div>
        </>
    );
};

export default Component;
