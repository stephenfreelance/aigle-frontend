import React, { PropsWithChildren } from 'react';

import Layout from '@/components/Layout';
import { Button, Menu, NavLink } from '@mantine/core';
import { IconCategory, IconUsers, IconWorld } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';
import classes from './index.module.scss';

interface AdminSubheaderProps {
    actions?: React.ReactNode;
}

const AdminSubheader: React.FC<AdminSubheaderProps> = ({ actions }) => {
    const { pathname } = useLocation();

    return (
        <header className="admin-subheader">
            <div className="navigation-items">
                <Menu trigger="hover" openDelay={100} closeDelay={500}>
                    <Menu.Target>
                        <Button w={200} variant="subtle">
                            <IconUsers size={16} />
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <NavLink label="Utilisateurs" href="/admin/users" active={pathname.includes('/admin/users')} />
                        <NavLink
                            label="Groupes utilisateurs"
                            href="/admin/user-groups"
                            active={pathname.includes('/admin/user-groups')}
                        />
                    </Menu.Dropdown>
                </Menu>

                <Menu trigger="hover" openDelay={100} closeDelay={500} width={200}>
                    <Menu.Target>
                        <Button w={200} variant="subtle">
                            <IconWorld size={16} />
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <NavLink
                            label="Collectivités"
                            href="/admin/collectivites"
                            active={pathname.includes('/admin/collectivites')}
                        />
                        <NavLink
                            label="Zones"
                            href="/admin/custom-zones"
                            active={pathname.includes('/admin/custom-zones')}
                        />
                    </Menu.Dropdown>
                </Menu>

                <Menu trigger="hover" openDelay={100} closeDelay={500} width={200}>
                    <Menu.Target>
                        <Button w={200} variant="subtle">
                            <IconCategory size={16} />
                        </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <NavLink
                            label="Types d'objets"
                            href="/admin/object-types"
                            active={pathname.includes('/admin/object-types')}
                        />
                        <NavLink
                            label="Thématiques"
                            href="/admin/object-type-categories"
                            active={pathname.includes('/admin/object-type-categories')}
                        />
                    </Menu.Dropdown>
                </Menu>

                <NavLink
                    label="Fonds de carte"
                    href="/admin/tile-sets"
                    active={pathname.includes('/admin/tile-sets')}
                />

                <NavLink label="Imports" href="/admin/imports" active={pathname.includes('/admin/imports')} />
            </div>

            {actions ? <div className={classes.actions}>{actions}</div> : null}
        </header>
    );
};

interface ComponentProps extends AdminSubheaderProps {}

const Component: React.FC<PropsWithChildren<ComponentProps>> = ({ actions, children }) => {
    return <Layout subHeader={<AdminSubheader actions={actions} />}>{children}</Layout>;
};

export default Component;
