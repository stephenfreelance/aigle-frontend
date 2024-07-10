import { ColorSwatch, ComboboxItem, ComboboxLikeRenderOptionInput } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import React from 'react';
import classes from './index.module.scss';

interface ComponentProps {
    item: ComboboxLikeRenderOptionInput<ComboboxItem>;
    color?: string;
}
const Component: React.FC<ComponentProps> = ({ item, color }) => {
    return (
        <div className={classes.container}>
            <div className={classes.label}>
                {color ? <ColorSwatch color={color} size={20} /> : null}
                {item.option.label}
            </div>
            {item.checked ? <IconCheck size={20} className={classes.icon} color="grey" /> : null}
        </div>
    );
};

export default Component;
