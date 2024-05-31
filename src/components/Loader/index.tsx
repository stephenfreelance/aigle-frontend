import React from 'react';

import classes from './index.module.scss';
import { Loader } from '@mantine/core';
import clsx from 'clsx';

interface ComponentProps {
    className?: string;
}

const Component: React.FC<ComponentProps> = ({
    className
}) => {
    return <div className={clsx(classes.container, className)}>
        <Loader />
    </div>;
};

export default Component;