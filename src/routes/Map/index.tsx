import React from 'react';

import Layout from '@/components/Layout';
import MapComponent from '@/components/Map';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const Component: React.FC = () => {
    return (
        <Layout>
            <MapComponent urls={['https://tile.openstreetmap.org/{z}/{x}/{y}.png']} />
        </Layout>
    );
};

export default Component;
