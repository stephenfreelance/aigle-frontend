import React, { PropsWithChildren } from 'react';

import { Card } from '@mantine/core';
import { IconAlertCircleFilled } from '@tabler/icons-react';
import clsx from 'clsx';
import classes from './index.module.scss';

interface ComponentProps {
    className?: string;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
    children,
    className,
}: PropsWithChildren<ComponentProps>) => {
    return (
        <Card className={clsx(classes.container, className)} withBorder>
            <h2 className={classes.title}>
                <IconAlertCircleFilled size={16} /> Erreur
            </h2>
            <div className={classes.content}>{children}</div>
        </Card>
    );
};

export default Component;
