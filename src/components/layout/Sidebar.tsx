import { NavLink } from "react-router-dom";
import { CreateIcon, HomeIcon, ProfileIcon, SearchIcon, StudyIcon } from "@/components/icons/Icon";
import CampusLogo from "@/components/common/CampusLogo";
import styles from "./Sidebar.module.css";

const navItems = [
  { to: "/", label: "广场", Icon: HomeIcon },
  { to: "/search", label: "搜索", Icon: SearchIcon },
  { to: "/create", label: "发布", Icon: CreateIcon },
  { to: "/campus/notifications", label: "通知", Icon: StudyIcon },
  { to: "/campus/account", label: "我的", Icon: ProfileIcon }
] as const;

const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <NavLink to="/" className={styles.logo} aria-label="校声首页">
        <CampusLogo />
      </NavLink>
      <nav className={styles.nav}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.divider} />
      <div className={styles.footer}>
        <span>校声</span>
        <div>连接校园生活</div>
      </div>
    </aside>
  );
};

export default Sidebar;
