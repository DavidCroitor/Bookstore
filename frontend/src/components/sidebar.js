import styles from '../styles/sidebar.module.css';
import Image from 'next/image';
import Logo from '../../assets/68f90fda7448eb1344d892b8b3543d20.jpg'
import HomeIcon from '../../assets/home.png';
import HeartIcon from '../../assets/heart.png';
import FilterIcon from '../../assets/filter.png';
import SettignsIcon from '../../assets/settings.png';
import StatsIcon from '../../assets/stats.png'
import SignOutIcon from '../../assets/signout.png';
import Link from 'next/link';
import { useFilter } from '@/context/filter-context';
import { useRouter } from 'next/router';


const Sidebar = () => {
    const { toggleFilterPanel, isFilterPanelOpen } = useFilter();

    const router = useRouter();
    const handleNavigation = (path) => {
        if (path) {
            router.push(path);
        }
    };

    return (
        <div className={styles.sidebar}>
            <header className={styles.header}>
                <Image
                style={{
                    borderRadius: '10px',
                }}
                priority={true}
                src={Logo}
                width={75}
                height={75}
                alt="Logo"/>
            </header>
            <ul className={styles.menu}>
                <li>
                    <div className={styles.menuItemBox}
                        onClick={() => handleNavigation('/')}
                    >
                        <Image
                            src={HomeIcon}
                            width={25}
                            height={25}
                            alt="HomeIcon"
                        />
                    </div>
                </li>
                <li>
                <div className={styles.menuItemBox}
                    onClick={toggleFilterPanel}>
                            <Image
                                src={FilterIcon}
                                width={25}
                                height={25}
                                alt="FilterIcon"
                            />
                    </div>
                </li>
                <li>
                    <div className={styles.menuItemBox}>
                        <Image
                            src={HeartIcon}
                            width={25}
                            height={25}
                            alt="HeartIcon"
                        />
                    </div>
                    </li>
                <li>
                    <div className={styles.menuItemBox}>
                        <Image
                            src={SettignsIcon}
                            width={25}
                            height={25}
                            alt="SettingsIcon"
                        />
                    </div>    
                </li>
                <li>
                    <div className={styles.menuItemBox}
                        onClick={() => handleNavigation('/statistics')}
                    >
                        <Image
                            src={StatsIcon}
                            width={25}
                            height={25}
                            alt="StatsIcon"
                        />
                    </div>    
                </li>
                <li><a href="#">
                    <div className={styles.menuItemBox}>
                        <Image
                            src={SignOutIcon}
                            width={25}
                            height={25}
                            alt="SignOutIcon"
                        />
                    </div>    
                </a></li>
            </ul>
        </div>
    );
};

export default Sidebar;
