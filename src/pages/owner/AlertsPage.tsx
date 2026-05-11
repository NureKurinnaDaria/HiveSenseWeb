import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Alert, Warehouse } from "../../types";
import { getAlerts } from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { Toast, useToast } from "../../components/Toast";
import StatusBadge from "../../components/StatusBadge";

export default function AlertsPage() {
  const { t, i18n } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, w] = await Promise.all([getAlerts(), getAllWarehouses()]);
      setAlerts(a);
      setWarehouses(w);
    } catch {
      showToast(t("common.load_error"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
    );
  };

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.warehouse_id === id)?.name ?? "—";

  const filtered = alerts.filter((a) =>
    filterWarehouse ? a.warehouse_id === Number(filterWarehouse) : true,
  );

  const exportCSV = () => {
    const headers = [
      "ID",
      t("common.type"),
      t("common.status"),
      t("common.warehouse"),
      t("common.sensor"),
      t("common.created_at"),
      t("common.resolved_at"),
    ];
    const rows = filtered.map((a) => [
      a.alert_id,
      a.type,
      a.status,
      getWarehouseName(a.warehouse_id),
      a.sensor_id ?? "—",
      formatDate(a.created_at),
      formatDate(a.resolved_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alerts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: "alert_id", label: "ID" },
    {
      key: "type",
      label: t("common.type"),
      render: (a: Alert) => (
        <StatusBadge
          label={t(`alert.${a.type}`)}
          variant={a.type.includes("HIGH") ? "danger" : "info"}
        />
      ),
    },
    {
      key: "status",
      label: t("common.status"),
      render: (a: Alert) => (
        <StatusBadge
          label={t(`alert.${a.status}`)}
          variant={
            a.status === "NEW"
              ? "warning"
              : a.status === "ACKNOWLEDGED"
                ? "info"
                : "success"
          }
        />
      ),
    },
    {
      key: "warehouse_id",
      label: t("common.warehouse"),
      render: (a: Alert) => getWarehouseName(a.warehouse_id),
    },
    {
      key: "sensor_id",
      label: t("common.sensor"),
      render: (a: Alert) => (a.sensor_id ? `#${a.sensor_id}` : "—"),
    },
    {
      key: "created_at",
      label: t("common.created_at"),
      render: (a: Alert) => formatDate(a.created_at),
    },
    {
      key: "resolved_at",
      label: t("common.resolved_at"),
      render: (a: Alert) => formatDate(a.resolved_at),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <select
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            border: "1.5px solid var(--gray-200)",
            fontSize: 13.5,
          }}
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
        >
          <option value="">{t("common.all_warehouses")}</option>
          {warehouses.map((w) => (
            <option key={w.warehouse_id} value={w.warehouse_id}>
              {w.name}
            </option>
          ))}
        </select>
        <Button variant="ghost" icon="📥" onClick={exportCSV}>
          CSV
        </Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(a) => a.alert_id}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
