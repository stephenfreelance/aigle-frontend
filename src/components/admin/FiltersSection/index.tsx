import React, { PropsWithChildren } from 'react';

import classes from './index.module.scss';
import { Accordion, Indicator } from '@mantine/core';
import { IconAdjustments } from '@tabler/icons-react';
import clsx from 'clsx';

interface ComponentProps {
  filtersSet?: boolean;
  className?: string;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
  children,
  filtersSet,
  className
}: PropsWithChildren<ComponentProps>) => {
  return (
    <Accordion className={clsx(classes.container, className)} variant="contained">
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
