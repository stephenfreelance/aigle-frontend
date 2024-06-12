import React from 'react';

import { DEFAULT_DATETIME_FORMAT, DEFAULT_DATE_FORMAT } from '@/utils/constants';
import { Tooltip } from '@mantine/core';
import { format } from 'date-fns';

interface ComponentProps {
    date: string;
    hideTooltip?: boolean;
}
const Component: React.FC<ComponentProps> = ({ date, hideTooltip }) => {
    const content = <span>{format(date, DEFAULT_DATE_FORMAT)}</span>;

    if (hideTooltip) {
        return content;
    }

    return (
        <Tooltip label={format(date, DEFAULT_DATETIME_FORMAT)} position="top-start">
            {content}
        </Tooltip>
    );
};

export default Component;
