import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Measurement,
  Alert,
  HoneyBatch,
  Warehouse,
  Sensor,
} from "../../types";
import {
  getMeasurements,
  getAlerts,
  getHoneyBatches,
  getAllSensors,
} from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Button from "../../components/Button";
import Table from "../../components/Table";
import { Toast, useToast } from "../../components/Toast";

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [batches, setBatches] = useState<HoneyBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allSensors, setAllSensors] = useState<Sensor[]>([]);

  const [dateFrom, setDateFrom] = useState(() =>
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [dateTo, setDateTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const loadInitialData = useCallback(async () => {
    try {
      const [w, s] = await Promise.all([getAllWarehouses(), getAllSensors()]);
      setWarehouses(w);
      setAllSensors(s);
      if (w.length > 0) setSelected(w[0].warehouse_id);
    } catch {
      showToast(t("common.load_error"), "error");
    }
  }, [showToast, t]);

  useEffect(() => {
    (async () => {
      await loadInitialData();
    })();
  }, [loadInitialData]);

  const loadReportData = useCallback(
    async (warehouseId: number) => {
      setLoading(true);
      try {
        const [m, a, b] = await Promise.all([
          getMeasurements(warehouseId),
          getAlerts(warehouseId),
          getHoneyBatches(warehouseId),
        ]);

        setMeasurements(m);
        setAlerts(a);
        setBatches(b);
      } catch {
        showToast(t("common.load_error"), "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast, t],
  );

  useEffect(() => {
    if (!selected) return;

    (async () => {
      await loadReportData(selected);
    })();
  }, [selected, loadReportData]);

  const inRange = (dateStr: string) => {
    const d = dateStr?.slice(0, 10);
    return d >= dateFrom && d <= dateTo;
  };

  const warehouseSensorIds = allSensors
    .filter((s) => s.warehouse_id === selected)
    .map((s) => s.sensor_id);

  const filteredMeasurements = measurements.filter(
    (m) => inRange(m.measured_at) && warehouseSensorIds.includes(m.sensor_id),
  );
  const filteredAlerts = alerts.filter(
    (a) => inRange(a.created_at) && a.warehouse_id === selected,
  );
  const filteredBatches = batches.filter(
    (b) => inRange(b.received_date) && b.warehouse_id === selected,
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
    );

  const formatDateShort = (dateStr: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString(
          i18n.language === "uk" ? "uk-UA" : "en-GB",
        )
      : "—";

  const temps = filteredMeasurements.map((m) => Number(m.temperature_c));
  const humids = filteredMeasurements.map((m) => Number(m.humidity_percent));
  const avg = (arr: number[]) =>
    arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "—";
  const min = (arr: number[]) =>
    arr.length ? Math.min(...arr).toFixed(2) : "—";
  const max = (arr: number[]) =>
    arr.length ? Math.max(...arr).toFixed(2) : "—";

  const exportJSON = () => {
    const data = {
      period: { from: dateFrom, to: dateTo },
      warehouse_id: selected,
      measurements: filteredMeasurements,
      alerts: filteredAlerts,
      batches: filteredBatches,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${selected}-${dateFrom}-${dateTo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      t("reports.measurements"),
      t("dashboard.temperature"),
      t("dashboard.humidity"),
    ];
    const rows = filteredMeasurements.map((m) => [
      formatDate(m.measured_at),
      m.temperature_c,
      m.humidity_percent,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurements-${selected}-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCard = (label: string, value: React.ReactNode, icon: string) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "16px 20px",
        border: "1.5px solid var(--gray-200)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--amber-700)" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );

  const sectionTitle = (title: string, count: number) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "28px 0 14px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 700,
          color: "var(--gray-900)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: "var(--amber-100)",
          color: "var(--amber-700)",
        }}
      >
        {count}
      </span>
    </div>
  );

  const measurementColumns = [
    {
      key: "measured_at",
      label: t("common.date"),
      render: (m: Measurement) => formatDate(m.measured_at),
    },
    { key: "temperature_c", label: `${t("dashboard.temperature")} (°C)` },
    { key: "humidity_percent", label: `${t("dashboard.humidity")} (%)` },
    {
      key: "sensor_id",
      label: t("nav.sensors"),
      render: (m: Measurement) => `#${m.sensor_id}`,
    },
  ];

  const alertColumns = [
    { key: "alert_id", label: "ID" },
    {
      key: "type",
      label: t("common.type"),
      render: (a: Alert) => t(`alert.${a.type}`),
    },
    {
      key: "status",
      label: t("common.status"),
      render: (a: Alert) => {
        const colors: Record<string, [string, string]> = {
          NEW: ["var(--amber-100)", "var(--amber-700)"],
          RESOLVED: ["var(--green-100)", "var(--green-600)"],
          ACKNOWLEDGED: ["var(--blue-100)", "var(--blue-600)"],
        };
        const [bg, color] = colors[a.status] ?? [
          "var(--gray-100)",
          "var(--gray-600)",
        ];
        return (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: bg,
              color,
            }}
          >
            {t(`alert.${a.status}`)}
          </span>
        );
      },
    },
    {
      key: "created_at",
      label: t("common.date"),
      render: (a: Alert) => formatDate(a.created_at),
    },
  ];

  const batchColumns = [
    { key: "variety", label: t("batch.variety") },
    { key: "quantity_kg", label: t("batch.quantity") },
    {
      key: "received_date",
      label: t("batch.received"),
      render: (b: HoneyBatch) => formatDateShort(b.received_date),
    },
    {
      key: "expiration_date",
      label: t("batch.expiry"),
      render: (b: HoneyBatch) => formatDateShort(b.expiration_date),
    },
    {
      key: "status",
      label: t("batch.status"),
      render: (b: HoneyBatch) => {
        const colors: Record<string, [string, string]> = {
          ACTIVE: ["var(--green-100)", "var(--green-600)"],
          EXPIRED: ["var(--red-100)", "var(--red-600)"],
          SOLD: ["var(--blue-100)", "var(--blue-600)"],
        };
        const [bg, color] = colors[b.status] ?? [
          "var(--gray-100)",
          "var(--gray-600)",
        ];
        return (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: bg,
              color,
            }}
          >
            {t(`batch.${b.status}`)}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <select
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            border: "1.5px solid var(--gray-200)",
            fontSize: 13.5,
          }}
          value={selected ?? ""}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {warehouses.map((w: Warehouse) => (
            <option key={w.warehouse_id} value={w.warehouse_id}>
              {w.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            border: "1.5px solid var(--gray-200)",
            fontSize: 13.5,
          }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <span style={{ color: "var(--gray-400)", fontSize: 13 }}>—</span>
        <input
          type="date"
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            border: "1.5px solid var(--gray-200)",
            fontSize: 13.5,
          }}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <Button
          variant="ghost"
          icon="📥"
          onClick={exportCSV}
          disabled={!filteredMeasurements.length}
        >
          CSV
        </Button>
        <Button
          variant="ghost"
          icon="📥"
          onClick={exportJSON}
          disabled={!selected}
        >
          JSON
        </Button>
      </div>

      {loading && (
        <p style={{ color: "var(--gray-500)" }}>{t("common.loading")}</p>
      )}

      {!loading && selected && (
        <>
          {sectionTitle(t("reports.measurements"), filteredMeasurements.length)}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {statCard(
              t("reports.avg_temp"),
              temps.length ? `${avg(temps)}°C` : "—",
              "🌡️",
            )}
            {statCard(
              t("reports.min_temp"),
              temps.length ? `${min(temps)}°C` : "—",
              "🔽",
            )}
            {statCard(
              t("reports.max_temp"),
              temps.length ? `${max(temps)}°C` : "—",
              "🔼",
            )}
            {statCard(
              t("reports.avg_humidity"),
              humids.length ? `${avg(humids)}%` : "—",
              "💧",
            )}
            {statCard(
              t("reports.min_humidity"),
              humids.length ? `${min(humids)}%` : "—",
              "🔽",
            )}
            {statCard(
              t("reports.max_humidity"),
              humids.length ? `${max(humids)}%` : "—",
              "🔼",
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <Table
              columns={measurementColumns}
              data={filteredMeasurements}
              loading={false}
              rowKey={(m) => m.measurement_id}
            />
          </div>

          {sectionTitle(t("reports.alerts_title"), filteredAlerts.length)}
          {filteredAlerts.length > 0 ? (
            <Table
              columns={alertColumns}
              data={filteredAlerts}
              loading={false}
              rowKey={(a) => a.alert_id}
            />
          ) : (
            <p style={{ fontSize: 13, color: "var(--gray-400)" }}>
              {t("reports.no_alerts")}
            </p>
          )}

          {sectionTitle(t("reports.batches_title"), filteredBatches.length)}
          {filteredBatches.length > 0 ? (
            <Table
              columns={batchColumns}
              data={filteredBatches}
              loading={false}
              rowKey={(b) => b.batch_id}
            />
          ) : (
            <p style={{ fontSize: 13, color: "var(--gray-400)" }}>
              {t("reports.no_batches")}
            </p>
          )}
        </>
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
