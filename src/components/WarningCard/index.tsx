import React, { PropsWithChildren } from 'react';

import { Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ComponentProps {
    className?: string;
    title?: string;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
    title,
    children,
    className,
}: PropsWithChildren<ComponentProps>) => {
    return (
        <Alert
            className={className}
            variant="light"
            color="orange"
            icon={<IconAlertTriangle />}
            title={title ? title : 'Avertissement'}
        >
            {children}
        </Alert>
    );
};

export default Component;
