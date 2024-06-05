import React from 'react';

import { Loader } from '@mantine/core';
import clsx from 'clsx';
import classes from './index.module.scss';

interface ComponentProps {
    className?: string;
}

const Component: React.FC<ComponentProps> = ({ className }) => {
    return (
        <div className={clsx(classes.container, className)}>
            <Loader />
        </div>
    );
};

export default Component;
