import { IMPORTS_INFOS_ENDPOINT } from '@/api-endpoints';
import InfoCard from '@/components/InfoCard';
import LayoutAdminBase from '@/components/admin/LayoutAdminBase';
import Loader from '@/components/ui/Loader';
import { ImportsInfos } from '@/models/info-imports';
import api from '@/utils/api';
import { Code } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import classes from './index.module.scss';

const fetchImportInfos = async (): Promise<ImportsInfos> => {
    const res = await api.get<ImportsInfos>(IMPORTS_INFOS_ENDPOINT);
    return res.data;
};

interface ImportsElementProps {
    title: string;
    items: string[];
}

const ImportElement: React.FC<ImportsElementProps> = ({ title, items }) => {
    return (
        <>
            <h2>{title}</h2>
            <Code block mb="md">
                {items.map((item) => (
                    <div key={item}>{item}</div>
                ))}
            </Code>
        </>
    );
};

const Component: React.FC = () => {
    const { data, isLoading } = useQuery<ImportsInfos>({
        queryKey: ['imports-infos'],
        queryFn: () => fetchImportInfos(),
    });

    return (
        <LayoutAdminBase>
            {isLoading || !data ? (
                <Loader />
            ) : (
                <div className={classes.container}>
                    <h1>Informations pour lancer un import</h1>

                    <InfoCard withCloseButton={false}>
                        Les champs suivants sont à renseigner dans le CSV pour lancer un import:
                        <Code block>
                            <div>score</div>
                            <div>address</div>
                            <div>objectType</div>
                            <div>geometry</div>
                            <div>score</div>
                            <div>tileSet</div>
                            <div>detectionSource</div>
                            <div>detectionControlStatus</div>
                            <div>detectionValidationStatus</div>
                            <div>detectionPrescriptionStatus</div>
                            <div>userReviewed</div>
                        </Code>
                        Les valeurs possibles sont décrites ci-dessous pour les champs concernés.
                    </InfoCard>

                    {Object.keys(data).map((key) => (
                        <ImportElement key={key} title={key} items={data[key as keyof ImportsInfos] as string[]} />
                    ))}
                </div>
            )}
        </LayoutAdminBase>
    );
};

export default Component;
