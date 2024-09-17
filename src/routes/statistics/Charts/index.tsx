import Header from '@/components/Header';
import classes from './index.module.scss';

const Component: React.FC = () => {
    return (
        <>
            <Header />
            <div className={classes.content}>stats</div>
        </>
    );
};

export default Component;
