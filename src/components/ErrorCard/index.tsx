import React, { PropsWithChildren } from 'react';

import classes from './index.module.scss';
import { Card } from '@mantine/core';
import clsx from 'clsx';
import { IconAlertCircleFilled } from '@tabler/icons-react';

interface ComponentProps {
    className?: string;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({ children, className }: PropsWithChildren<ComponentProps>) => {
    return <Card className={clsx(classes.container, className)} withBorder>
        <h2 className={classes.title}><IconAlertCircleFilled size={16} /> Erreur</h2>
        <p className={classes.content}>
            {children}
        </p>
    </Card>;
};

export default Component;