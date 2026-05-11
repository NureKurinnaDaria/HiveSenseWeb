import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAllWarehouses } from "../../api/warehouses";
import {
  getAlerts,
  getMeasurements,
  getHoneyBatches,
  getAllSensors,
} from "../../api/index";
import type {
  Warehouse,
  Alert,
  Measurement,
  HoneyBatch,
  Sensor,
} from "../../types";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [batches, setBatches] = useState<HoneyBatch[]>([]);
  const [allSensors, setAllSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, a, m, b, s] = await Promise.all([
          getAllWarehouses(),
          getAlerts(),
          getMeasurements(),
          getHoneyBatches(),
          getAllSensors(),
        ]);
        setWarehouses(w);
        setAlerts(a);
        setMeasurements(m);
        setBatches(b);
        setAllSensors(s);
      } catch {
        // тихо — dashboard показує порожні дані
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div
        style={{ textAlign: "center", padding: 48, color: "var(--gray-400)" }}
      >
        {t("common.loading")}
      </div>
    );

  const activeAlerts = alerts.filter((a) => a.status === "NEW");
  const activeBatches = batches.filter((b) => b.status === "ACTIVE");
  const latestMeasurement =
    measurements.length > 0
      ? [...measurements].sort(
          (a, b) =>
            new Date(b.measured_at).getTime() -
            new Date(a.measured_at).getTime(),
        )[0]
      : null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

  const card = (
    icon: string,
    title: string,
    value: React.ReactNode,
    label: string,
  ) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid var(--gray-200)",
        padding: 24,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--gray-900)",
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 800,
          color: "var(--gray-900)",
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {card(
          "🏭",
          t("nav.warehouses"),
          warehouses.length,
          t("dashboard.total_warehouses"),
        )}
        {card(
          "🚨",
          t("nav.alerts"),
          <span
            style={{
              color:
                activeAlerts.length > 0 ? "var(--red-500)" : "var(--green-500)",
            }}
          >
            {activeAlerts.length}
          </span>,
          t("dashboard.active_alerts"),
        )}
        {card(
          "🍯",
          t("nav.batches"),
          activeBatches.length,
          t("dashboard.active_batches"),
        )}
        {card(
          "🌡️",
          t("dashboard.temperature"),
          latestMeasurement ? `${latestMeasurement.temperature_c}°C` : "—",
          t("dashboard.last_reading"),
        )}
        {card(
          "💧",
          t("dashboard.humidity"),
          latestMeasurement ? `${latestMeasurement.humidity_percent}%` : "—",
          t("dashboard.last_reading"),
        )}
      </div>

      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--gray-900)",
          marginBottom: 16,
        }}
      >
        {t("dashboard.warehouses_title")}
      </h2>

      {warehouses.map((w) => {
        const warehouseSensorIds = allSensors
          .filter((s) => s.warehouse_id === w.warehouse_id)
          .map((s) => s.sensor_id);

        const warehouseMeasurements = measurements.filter((m) =>
          warehouseSensorIds.includes(m.sensor_id),
        );

        const latestM =
          warehouseMeasurements.length > 0
            ? [...warehouseMeasurements].sort(
                (a, b) =>
                  new Date(b.measured_at).getTime() -
                  new Date(a.measured_at).getTime(),
              )[0]
            : null;

        return (
          <div
            key={w.warehouse_id}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid var(--gray-200)",
              padding: "20px 24px",
              boxShadow: "var(--shadow-sm)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--gray-900)",
                }}
              >
                {w.name}
              </span>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  background:
                    w.status === "ACTIVE"
                      ? "var(--green-100)"
                      : "var(--gray-100)",
                  color:
                    w.status === "ACTIVE"
                      ? "var(--green-600)"
                      : "var(--gray-600)",
                }}
              >
                {w.status === "ACTIVE"
                  ? t("common.active")
                  : t("common.inactive")}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--gray-500)",
                marginBottom: 12,
              }}
            >
              📍 {w.location}
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                {
                  label: t("dashboard.temperature"),
                  value: latestM ? `${latestM.temperature_c}°C` : "—",
                },
                {
                  label: t("dashboard.humidity"),
                  value: latestM ? `${latestM.humidity_percent}%` : "—",
                },
                {
                  label: t("dashboard.alerts_count"),
                  value: (
                    <span
                      style={{
                        color:
                          activeAlerts.filter(
                            (a) => a.warehouse_id === w.warehouse_id,
                          ).length > 0
                            ? "var(--red-500)"
                            : "var(--green-500)",
                      }}
                    >
                      {
                        activeAlerts.filter(
                          (a) => a.warehouse_id === w.warehouse_id,
                        ).length
                      }
                    </span>
                  ),
                },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--gray-400)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {m.label}
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      color: "var(--gray-900)",
                    }}
                  >
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {activeAlerts.length > 0 && (
        <>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--gray-900)",
              margin: "32px 0 16px",
            }}
          >
            {t("dashboard.active_alerts_title")}
          </h2>
          {activeAlerts.slice(0, 5).map((alert) => (
            <div
              key={alert.alert_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "#fff",
                border: "1px solid var(--gray-200)",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--red-500)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: 13.5, color: "var(--gray-700)", flex: 1 }}
              >
                {t(`alert.${alert.type}`)}
              </span>
              <span style={{ fontSize: 12, color: "var(--gray-400)" }}>
                {formatDate(alert.created_at)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
