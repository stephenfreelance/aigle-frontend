import React, { PropsWithChildren } from 'react';

import { Alert } from '@mantine/core';
import { IconAlertCircleFilled } from '@tabler/icons-react';

interface ComponentProps {
    className?: string;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
    children,
    className,
}: PropsWithChildren<ComponentProps>) => {
    return (
        <Alert className={className} variant="light" color="red" icon={<IconAlertCircleFilled />} title="Erreur">
            {children}
        </Alert>
    );
};

export default Component;
