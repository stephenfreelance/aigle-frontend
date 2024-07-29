import React from 'react';

import logoSmallImg from '@/assets/logo_small.png';
import { useAuth } from '@/utils/auth-context';
import { DEFAULT_ROUTE, ROLES_NAMES_MAP } from '@/utils/constants';
import { Avatar, Burger, Button, Divider, Image, Menu, NavLink } from '@mantine/core';
import { IconAdjustments, IconLogout, IconMap } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import classes from './index.module.scss';

interface BurgerState {
    opened: boolean;
    toggle: () => void;
}

interface ComponentProps {
    burgerState?: BurgerState;
}

const Component: React.FC<ComponentProps> = ({ burgerState }) => {
    const { userMe, logout } = useAuth();
    const { pathname } = useLocation();

    return (
        <header className={classes.container}>
            {burgerState ? (
                <Burger opened={burgerState.opened} onClick={burgerState.toggle} hiddenFrom="sm" size="sm" />
            ) : null}
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

            {userMe ? (
                <Menu position="bottom-end">
                    <Menu.Target>
                        <div className={classes['user-infos']}>
                            <div className={classes['user-infos-details']}>
                                <p className={classes['user-infos-details-email']}>{userMe.email}</p>
                                <p className={classes['user-infos-details-role']}>{ROLES_NAMES_MAP[userMe.userRole]}</p>
                            </div>
                            <Avatar className={classes['avatar-button']} />
                        </div>
                    </Menu.Target>

                    <Menu.Dropdown className={classes.menu}>
                        <div className={classes['user-infos']}>
                            <div className={classes['user-infos-details']}>
                                <p className={classes['user-infos-details-email']}>{userMe.email}</p>
                                <p className={classes['user-infos-details-role']}>{ROLES_NAMES_MAP[userMe.userRole]}</p>
                            </div>
                        </div>
                        <Button variant="outline" leftSection={<IconLogout />} onClick={() => logout()}>
                            Déconnexion
                        </Button>
                    </Menu.Dropdown>
                </Menu>
            ) : null}
        </header>
    );
};

export default Component;
