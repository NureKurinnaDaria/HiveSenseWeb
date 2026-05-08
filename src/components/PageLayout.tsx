import { useTranslation } from "react-i18next";
import Sidebar, { type NavItem } from "./Sidebar";
import styles from "./PageLayout.module.css";

interface PageLayoutProps {
  navItems: NavItem[];
  activePage: string;
  onNavigate: (key: string) => void;
  pageTitle: string;
  children: React.ReactNode;
}

export default function PageLayout({
  navItems,
  activePage,
  onNavigate,
  pageTitle,
  children,
}: PageLayoutProps) {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === "uk" ? "en" : "uk";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar items={navItems} active={activePage} onNavigate={onNavigate} />

      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>{pageTitle}</h1>
          <div className={styles.headerRight}>
            <button className={styles.langBtn} onClick={toggleLang}>
              {i18n.language === "uk" ? "EN" : "UA"}
            </button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
