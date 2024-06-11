import { PropsWithChildren } from 'react';

interface ComponentProps {
    detectionUuid: string;
}

const Component: React.FC<ComponentProps> = ({ detectionUuid }: PropsWithChildren<ComponentProps>) => {
    return <>{detectionUuid}</>;
};

export default Component;
