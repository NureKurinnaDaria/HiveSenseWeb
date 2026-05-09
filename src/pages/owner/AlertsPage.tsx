import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Alert, Warehouse } from "../../types";
import { getAlerts } from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";

export default function AlertsPage() {
  const { t, i18n } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [a, w] = await Promise.all([getAlerts(), getAllWarehouses()]);
      setAlerts(a);
      setWarehouses(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const typeBadge = (type: string) => {
    const isHigh = type.includes("HIGH");
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: isHigh ? "var(--red-100)" : "var(--blue-100)",
          color: isHigh ? "var(--red-600)" : "var(--blue-600)",
        }}
      >
        {t(`alert.${type}`)}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, [string, string]> = {
      NEW: ["var(--amber-100)", "var(--amber-700)"],
      ACKNOWLEDGED: ["var(--blue-100)", "var(--blue-600)"],
      RESOLVED: ["var(--green-100)", "var(--green-600)"],
    };
    const [bg, color] = colors[status] ?? [
      "var(--gray-100)",
      "var(--gray-600)",
    ];
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: bg,
          color,
        }}
      >
        {t(`alert.${status}`)}
      </span>
    );
  };

  const exportCSV = () => {
    const headers = [
      "ID",
      "Тип",
      "Статус",
      "Склад",
      "Датчик",
      "Створено",
      "Закрито",
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
    { key: "type", label: "Тип", render: (a: Alert) => typeBadge(a.type) },
    {
      key: "status",
      label: t("common.status"),
      render: (a: Alert) => statusBadge(a.status),
    },
    {
      key: "warehouse_id",
      label: "Склад",
      render: (a: Alert) => getWarehouseName(a.warehouse_id),
    },
    {
      key: "sensor_id",
      label: "Датчик",
      render: (a: Alert) => (a.sensor_id ? `#${a.sensor_id}` : "—"),
    },
    {
      key: "created_at",
      label: "Створено",
      render: (a: Alert) => formatDate(a.created_at),
    },
    {
      key: "resolved_at",
      label: "Закрито",
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
          <option value="">Всі склади</option>
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
    </div>
  );
}
