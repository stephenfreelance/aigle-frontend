import React from 'react';

import { UserGroupRight } from '@/models/user';
import { IconEye, IconMessage, IconPencil, IconProps } from '@tabler/icons-react';

interface ComponentProps {
    userGroupRight: UserGroupRight;
}
const Component: React.FC<ComponentProps & IconProps> = ({ userGroupRight, ...iconProps }: ComponentProps) => {
    if (userGroupRight === 'WRITE') {
        return <IconPencil {...iconProps} />;
    }
    if (userGroupRight === 'ANNOTATE') {
        return <IconMessage {...iconProps} />;
    }
    if (userGroupRight === 'READ') {
        return <IconEye {...iconProps} />;
    }

    return null;
};

export default Component;
