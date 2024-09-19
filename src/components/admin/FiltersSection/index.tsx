import React, { PropsWithChildren } from 'react';

import { Accordion, Indicator } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import clsx from 'clsx';
import classes from './index.module.scss';

interface ComponentProps {
    filtersSet?: boolean;
    className?: string;
    opened?: boolean;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
    children,
    filtersSet,
    className,
    opened,
}: PropsWithChildren<ComponentProps>) => {
    return (
        <Accordion
            className={clsx(classes.container, className)}
            variant="contained"
            defaultValue={opened ? 'filters' : undefined}
        >
            <Accordion.Item key="filters" value="filters">
                <Accordion.Control
                    icon={
                        <Indicator disabled={!filtersSet}>
                            <IconAdjustments />
                        </Indicator>
                    }
                >
                    Filtres
                </Accordion.Control>
                <Accordion.Panel className={classes.content}>{children}</Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
};

export default Component;
