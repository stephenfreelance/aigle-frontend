import { PropsWithChildren } from 'react';

interface ComponentProps {
    title: string;
}

const Component: React.FC<ComponentProps> = ({ title, children }: PropsWithChildren<ComponentProps>) => {
    

    return <>{children}</>;
};

export default Component;
