import React from 'react';

import classes from './index.module.scss';
import { format } from 'date-fns';
import { DEFAULT_DATETIME_FORMAT, DEFAULT_DATE_FORMAT } from '@/utils/constants';
import { Tooltip } from '@mantine/core';

interface ComponentProps {
    date: string;
}
const Component: React.FC<ComponentProps> = ({ date }) => {
    return <Tooltip label={format(date, DEFAULT_DATETIME_FORMAT)}>
        <div>{format(date, DEFAULT_DATE_FORMAT)}</div>
    </Tooltip>;
};

export default Component;