import React from 'react';

import logoSmallImg from '@/assets/logo_small.png';
import { useAuth } from '@/utils/auth-context';
import { DEFAULT_ROUTE, ROLES_NAMES_MAP } from '@/utils/constants';
import { Avatar, Button, Divider, Image, Menu, NavLink } from '@mantine/core';
import { IconAdjustments, IconLogout, IconMap } from '@tabler/icons-react';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import classes from './index.module.scss';

interface ComponentProps {
    hasSubHeader?: boolean;
}

const Component: React.FC<ComponentProps> = ({ hasSubHeader }) => {
    const { userMe, logout } = useAuth();
    const { pathname } = useLocation();

    return (
        <header
            className={clsx(classes.container, {
                [classes['has-subheader']]: hasSubHeader,
            })}
        >
            <div className="navigation-items">
                <Link to={DEFAULT_ROUTE} className={classes['logo-container']}>
                    <Image src={logoSmallImg} alt="Logo Aigle" h="100%" fit="contain" />
                </Link>

                <Divider className="navigation-items-divider" orientation="vertical" />

                <NavLink
                    leftSection={<IconMap size={16} />}
                    href="/map"
                    label="Carte"
                    active={pathname.includes('/map')}
                />
                {userMe?.userRole && ['ADMIN', 'SUPER_ADMIN'].includes(userMe.userRole) ? (
                    <NavLink
                        leftSection={<IconAdjustments size={16} />}
                        href="/admin"
                        label="Admin"
                        active={pathname.includes('/admin')}
                    />
                ) : null}
            </div>

            <Menu>
                <Menu.Target>
                    <Avatar className={classes['avatar-button']} component="button" disabled={!userMe} />
                </Menu.Target>

                {userMe ? (
                    <Menu.Dropdown className={classes.menu}>
                        <p className={classes['menu-email']}>{userMe.email}</p>
                        <p className={classes['menu-role']}>{ROLES_NAMES_MAP[userMe.userRole]}</p>
                        <Button mt="sm" variant="outline" leftSection={<IconLogout />} onClick={() => logout()}>
                            Déconnexion
                        </Button>
                    </Menu.Dropdown>
                ) : null}
            </Menu>
        </header>
    );
};

export default Component;
