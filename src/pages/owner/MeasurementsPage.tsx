import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Measurement, Warehouse } from "../../types";
import { getMeasurements } from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { Toast, useToast } from "../../components/Toast";

export default function MeasurementsPage() {
  const { t, i18n } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, w] = await Promise.all([getMeasurements(), getAllWarehouses()]);
      setMeasurements(m);
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
    );

  const getSensorWarehouse = (sensorId: number) => {
    const wh = warehouses.find((w) =>
      w.sensors?.some((s) => s.sensor_id === sensorId),
    );
    return wh?.name ?? "—";
  };

  const filtered = measurements.filter((m) =>
    filterWarehouse
      ? warehouses
          .find((w) => w.warehouse_id === Number(filterWarehouse))
          ?.sensors?.some((s) => s.sensor_id === m.sensor_id)
      : true,
  );

  const exportCSV = () => {
    const headers = [
      "ID",
      `${t("dashboard.temperature")} (°C)`,
      `${t("dashboard.humidity")} (%)`,
      t("common.sensor"),
      t("common.date"),
    ];
    const rows = filtered.map((m) => [
      m.measurement_id,
      m.temperature_c,
      m.humidity_percent,
      m.sensor_id,
      formatDate(m.measured_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurements-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: "measurement_id", label: "ID" },
    { key: "temperature_c", label: `${t("dashboard.temperature")} (°C)` },
    { key: "humidity_percent", label: `${t("dashboard.humidity")} (%)` },
    {
      key: "sensor_id",
      label: t("common.sensor"),
      render: (m: Measurement) => `#${m.sensor_id}`,
    },
    {
      key: "warehouse",
      label: t("common.warehouse"),
      render: (m: Measurement) => getSensorWarehouse(m.sensor_id),
    },
    {
      key: "measured_at",
      label: t("common.date"),
      render: (m: Measurement) => formatDate(m.measured_at),
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
        rowKey={(m) => m.measurement_id}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
