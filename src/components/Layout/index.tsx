import React, { PropsWithChildren } from 'react';

import classes from './index.module.scss';
import Header from '@/components/Header';

import clsx from 'clsx';

interface ComponentProps {
  subHeader?: React.ReactNode;
}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
  children,
  subHeader,
}) => {
  return (
    <>
      <Header />
      {subHeader ? subHeader : null}
      <div
        className={clsx(classes['content-container'], {
          [classes['has-subheader']]: !!subHeader,
        })}
      >
        <div className={classes.content}>{children}</div>
      </div>
    </>
  );
};

export default Component;
