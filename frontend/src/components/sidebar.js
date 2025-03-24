import styles from '../styles/sidebar.module.css';
import Image from 'next/image';
import Logo from '../../assets/68f90fda7448eb1344d892b8b3543d20.jpg'
import HomeIcon from '../../assets/home.png';
import HeartIcon from '../../assets/heart.png';
import FilterIcon from '../../assets/filter.png';
import SettignsIcon from '../../assets/settings.png';
import SignOutIcon from '../../assets/signout.png';
import Link from 'next/link';

const Sidebar = () => {
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
                <li><Link href="../">
                    <div className={styles.menuItemBox}>
                        <Image
                            src={HomeIcon}
                            width={25}
                            height={25}
                            alt="HomeIcon"
                        />
                    </div>
                </Link></li>
                <li><a href="#">
                    <div className={styles.menuItemBox}>
                        <Image
                            src={FilterIcon}
                            width={25}
                            height={25}
                            alt="FilterIcon"
                        />
                    </div>
                </a></li>
                <li><a href="#">
                    <div className={styles.menuItemBox}>
                        <Image
                            src={HeartIcon}
                            width={25}
                            height={25}
                            alt="HeartIcon"
                        />
                    </div>
                    </a></li>
                <li><a href="#">
                    <div className={styles.menuItemBox}>
                        <Image
                            src={SettignsIcon}
                            width={25}
                            height={25}
                            alt="SettingsIcon"
                        />
                    </div>    
                </a></li>
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
