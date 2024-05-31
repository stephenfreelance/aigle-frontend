import React, { PropsWithChildren } from 'react';

import classes from './index.module.scss';
import Layout from '@/components/Layout';
import { Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconChevronLeft } from '@tabler/icons-react';

interface AdminSubheaderProps {
  backText: string;
  backUrl: string;
}

const AdminSubheader: React.FC<AdminSubheaderProps> = ({
  backText,
  backUrl,
}) => {
  return (
    <header className="admin-subheader">
      <Button
        component={Link}
        to={backUrl}
        variant="transparent"
        leftSection={<IconChevronLeft />}
      >
        {backText}
      </Button>
    </header>
  );
};

interface ComponentProps extends AdminSubheaderProps {}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
  backText,
  backUrl,
  children,
}) => {
  return (
    <Layout
      subHeader={<AdminSubheader backText={backText} backUrl={backUrl} />}
    >
      {children}
    </Layout>
  );
};

export default Component;
