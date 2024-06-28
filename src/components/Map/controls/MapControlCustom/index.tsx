import { ActionIcon, Switch } from '@mantine/core';
import clsx from 'clsx';
import React, { PropsWithChildren, useRef } from 'react';
import { ControlPosition, useControl } from 'react-map-gl';
import classes from './index.module.scss';

type ControlType = 'ACTION_BUTTON' | 'SWITCH';

interface ComponentProps extends PropsWithChildren {
    position?: ControlPosition;
    controlType?: ControlType;
    controlInner?: React.ReactNode;
    contentClassName?: string;
    containerClassName?: string;
    isShowed: boolean;
    setIsShowed: (state: boolean) => void;
}

const Component: React.FC<ComponentProps> = ({
    position = 'top-left',
    controlType = 'ACTION_BUTTON',
    controlInner,
    containerClassName,
    contentClassName,
    isShowed,
    setIsShowed,
    children,
}) => {
    const containerRef = useRef<HTMLDivElement>(document.createElement('div'));
    const controlContainerRef = useRef<HTMLDivElement>(null);

    class CustomMapControl implements mapboxgl.IControl {
        public map?: mapboxgl.Map;

        onAdd(map: mapboxgl.Map): HTMLElement {
            this.map = map;

            if (controlContainerRef.current) {
                containerRef.current.appendChild(controlContainerRef.current);
            }
            containerRef.current.classList.add('mapboxgl-ctrl');
            containerRef.current.style.pointerEvents = 'auto'; // Ensure the container allows pointer events
            return containerRef.current;
        }

        onRemove(): void {
            if (containerRef.current.parentNode) {
                containerRef.current.parentNode.removeChild(containerRef.current);
            }
            this.map = undefined;
        }
    }

    useControl(() => new CustomMapControl(), { position });

    return (
        <>
            <div className={containerClassName} ref={controlContainerRef}>
                {controlType === 'ACTION_BUTTON' ? (
                    <ActionIcon
                        className={classes.button}
                        size={36}
                        variant="white"
                        onClick={() => setIsShowed(!isShowed)}
                    >
                        {controlInner}
                    </ActionIcon>
                ) : null}
                {controlType === 'SWITCH' ? (
                    <Switch
                        label={controlInner}
                        checked={isShowed}
                        onChange={(event) => setIsShowed(event.currentTarget.checked)}
                    />
                ) : null}
            </div>
            <div
                className={clsx(classes.content, contentClassName, {
                    [classes.showed]: isShowed,
                })}
            >
                {children}
            </div>
        </>
    );
};

export default Component;
