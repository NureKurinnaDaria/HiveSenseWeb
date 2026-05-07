import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import styles from "./Sidebar.module.css";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
}

export default function Sidebar({ items, active, onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🍯</span>
        <span className={styles.logoText}>HiveSense</span>
      </div>

      <div className={styles.roleTag}>{t(`roles.${user?.role}`)}</div>

      <nav className={styles.nav}>
        {items.map((item, index) =>
          item.key === "divider" ? (
            <div key={index} className={styles.divider} />
          ) : (
            <button
              key={item.key}
              className={`${styles.navItem} ${active === item.key ? styles.active : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ),
        )}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{user?.full_name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={logout}>
          <span className={styles.navIcon}>🚪</span>
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
