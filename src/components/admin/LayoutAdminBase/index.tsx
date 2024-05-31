import React, { PropsWithChildren } from 'react';

import classes from './index.module.scss';
import Layout from '@/components/Layout';
import { NavLink } from '@mantine/core';
import { useLocation } from 'react-router-dom';

interface AdminSubheaderProps {
  actions?: React.ReactNode;
}

const AdminSubheader: React.FC<AdminSubheaderProps> = ({ actions }) => {
  const { pathname } = useLocation();

  return (
    <header className="admin-subheader">
      <div className="navigation-items">
        <NavLink
          label="Utilisateurs"
          href="/admin/users"
          active={pathname.includes('/admin/users')}
        />
        <NavLink
          label="Collectivités"
          href="/admin/collectivites"
          active={pathname.includes('/admin/collectivites')}
        />
        <NavLink
          label="Types d'objets"
          href="/admin/object-types"
          active={pathname.includes('/admin/object-types')}
        />
      </div>

      {actions ? <div className={classes.actions}>{actions}</div> : null}
    </header>
  );
};

interface ComponentProps extends AdminSubheaderProps {}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({
  actions,
  children,
}) => {
  return (
    <Layout subHeader={<AdminSubheader actions={actions} />}>{children}</Layout>
  );
};

export default Component;
