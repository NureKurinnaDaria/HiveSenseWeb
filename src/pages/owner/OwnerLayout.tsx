import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageLayout from "../../components/PageLayout";
import type { NavItem } from "../../components/Sidebar";

import DashboardPage from "./DashboardPage";
import WarehousesPage from "./WarehousesPage";
import BatchesPage from "./BatchesPage";
import AlertsPage from "./AlertsPage";
import MeasurementsPage from "./MeasurementsPage";
import ReportsPage from "./ReportsPage";
import AuditPage from "./AuditPage";
import UsersPage from "./UsersPage";

const ownerNavItems: NavItem[] = [
  { key: "dashboard", label: "", icon: "📊" },
  { key: "warehouses", label: "", icon: "🏭" },
  { key: "users", label: "", icon: "👥" },
  { key: "batches", label: "", icon: "🍯" },
  { key: "divider", label: "", icon: "" },
  { key: "alerts", label: "", icon: "🚨" },
  { key: "measurements", label: "", icon: "🌡️" },
  { key: "divider2", label: "", icon: "" },
  { key: "reports", label: "", icon: "📈" },
  { key: "audit", label: "", icon: "📋" },
];

export default function OwnerLayout() {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState("dashboard");

  const labeledItems: NavItem[] = ownerNavItems.map((item) => ({
    ...item,
    label: item.key.startsWith("divider") ? "" : t(`nav.${item.key}`),
  }));

  const pageTitle = !activePage.startsWith("divider")
    ? t(`nav.${activePage}`)
    : "";

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "warehouses":
        return <WarehousesPage />;
      case "users":
        return <UsersPage />;
      case "batches":
        return <BatchesPage />;
      case "alerts":
        return <AlertsPage />;
      case "measurements":
        return <MeasurementsPage />;
      case "reports":
        return <ReportsPage />;
      case "audit":
        return <AuditPage />;
      default:
        return <DashboardPage />;
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
