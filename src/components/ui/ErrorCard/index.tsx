import React, { PropsWithChildren } from 'react';

import { Alert } from '@mantine/core';
import { IconAlertCircleFilled } from '@tabler/icons-react';

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
            color="red"
            icon={<IconAlertCircleFilled />}
            title={title ? title : 'Une erreur est survenue'}
        >
            {children}
        </Alert>
    );
};

export default Component;
