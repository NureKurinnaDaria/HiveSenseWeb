import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageLayout from "../../components/PageLayout";
import type { NavItem } from "../../components/Sidebar";

import UsersPage from "./UsersPage";
import SensorsPage from "./SensorsPage";
import ThresholdsPage from "./ThresholdsPage";
import AuditPage from "./AuditPage";

const adminNavItems: NavItem[] = [
  { key: "users", label: "", icon: "👥" },
  { key: "sensors", label: "", icon: "📡" },
  { key: "thresholds", label: "", icon: "⚙️" },
  { key: "divider", label: "", icon: "" },
  { key: "audit", label: "", icon: "📋" },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState("users");

  const labeledItems: NavItem[] = adminNavItems.map((item) => ({
    ...item,
    label: item.key === "divider" ? "" : t(`nav.${item.key}`),
  }));

  const pageTitle = activePage !== "divider" ? t(`nav.${activePage}`) : "";

  const renderPage = () => {
    switch (activePage) {
      case "users":
        return <UsersPage />;
      case "sensors":
        return <SensorsPage />;
      case "thresholds":
        return <ThresholdsPage />;
      case "audit":
        return <AuditPage />;
      default:
        return <UsersPage />;
    }
  };

  return (
    <PageLayout
      navItems={labeledItems}
      activePage={activePage}
      onNavigate={setActivePage}
      pageTitle={pageTitle}
    >
      {renderPage()}
    </PageLayout>
  );
}
