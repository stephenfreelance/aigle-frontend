import React, { useMemo } from 'react';

import logoSmallImg from '@/assets/logo_small.png';
import { useAuth } from '@/utils/auth-context';
import { DEFAULT_ROUTE, ROLES_NAMES_MAP } from '@/utils/constants';
import { getColorFromString, getEmailInitials } from '@/utils/string';
import { Avatar, Burger, Button, Image, Menu, Tabs } from '@mantine/core';
import { IconAdjustments, IconLogout, IconMap } from '@tabler/icons-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import classes from './index.module.scss';

type TabValue = 'map' | 'admin';

const getTabeValue = (pathname: string): TabValue => {
    if (pathname.includes('/map')) {
        return 'map';
    }

    return 'admin';
};

interface AvatarState {
    initials?: string;
    color?: string;
}

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
    const navigate = useNavigate();

    const avatarState: AvatarState = useMemo(
        () =>
            userMe?.email
                ? {
                      initials: getEmailInitials(userMe.email),
                      color: getColorFromString(userMe.email),
                  }
                : {},
        [userMe?.email],
    );

    const onTabChange = (tab: TabValue) => {
        if (tab === 'map') {
            navigate('/map');
        } else {
            navigate('/admin');
        }
    };

    return (
        <header className={classes.container}>
            <div className="navigation-items">
                {burgerState ? (
                    <Burger
                        opened={burgerState.opened}
                        onClick={burgerState.toggle}
                        hiddenFrom="md"
                        size="sm"
                        mr="md"
                        ml="md"
                    />
                ) : null}

                <Link to={DEFAULT_ROUTE} className={classes['logo-container']}>
                    <Image src={logoSmallImg} alt="Logo Aigle" h="100%" fit="contain" />
                </Link>

                <Tabs
                    className={classes.tabs}
                    ml="xl"
                    value={getTabeValue(pathname)}
                    onChange={(value) => onTabChange(value as TabValue)}
                >
                    <Tabs.List className={classes['tabs-list']}>
                        <Tabs.Tab
                            pl="xl"
                            pr="xl"
                            className={classes.tab}
                            leftSection={<IconMap size={16} />}
                            value="map"
                        >
                            Carte
                        </Tabs.Tab>
                        {userMe?.userRole && ['ADMIN', 'SUPER_ADMIN'].includes(userMe.userRole) ? (
                            <Tabs.Tab
                                pl="xl"
                                pr="xl"
                                className={classes.tab}
                                leftSection={<IconAdjustments size={16} />}
                                value="admin"
                            >
                                Admin
                            </Tabs.Tab>
                        ) : null}
                    </Tabs.List>
                </Tabs>
            </div>

            {userMe ? (
                <Menu position="bottom-end">
                    <Menu.Target>
                        <div className={classes['user-infos']}>
                            <div className={classes['user-infos-details']}>
                                <p className={classes['user-infos-details-email']}>{userMe.email}</p>
                                <p className={classes['user-infos-details-role']}>{ROLES_NAMES_MAP[userMe.userRole]}</p>
                            </div>
                            <Avatar className={classes['avatar-button']} color={avatarState.color}>
                                {avatarState.initials}
                            </Avatar>
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
