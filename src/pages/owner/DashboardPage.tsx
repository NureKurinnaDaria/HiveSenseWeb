import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getAllWarehouses } from "../../api/warehouses";
import { getAlerts, getMeasurements, getHoneyBatches } from "../../api/index";
import type { Warehouse, Alert, Measurement, HoneyBatch } from "../../types";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [batches, setBatches] = useState<HoneyBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, a, m, b] = await Promise.all([
          getAllWarehouses(),
          getAlerts(),
          getMeasurements(),
          getHoneyBatches(),
        ]);
        setWarehouses(w);
        setAlerts(a);
        setMeasurements(m);
        setBatches(b);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className={styles.loading}>{t("common.loading")}</div>;
  }

  const activeAlerts = alerts.filter((a) => a.status === "NEW");
  const activeBatches = batches.filter((b) => b.status === "ACTIVE");

  const latestMeasurement =
    measurements.length > 0
      ? measurements.sort(
          (a, b) =>
            new Date(b.measured_at).getTime() -
            new Date(a.measured_at).getTime(),
        )[0]
      : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const alertTypeLabel = (type: string) => t(`alert.${type}`) || type;

  return (
    <div>
      {/* Статистика */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Склади</span>
            <span className={styles.cardIcon}>🏭</span>
          </div>
          <div className={styles.statValue}>{warehouses.length}</div>
          <div className={styles.statLabel}>всього складів</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{t("nav.alerts")}</span>
            <span className={styles.cardIcon}>🚨</span>
          </div>
          <div
            className={styles.statValue}
            style={{
              color:
                activeAlerts.length > 0 ? "var(--red-500)" : "var(--green-500)",
            }}
          >
            {activeAlerts.length}
          </div>
          <div className={styles.statLabel}>активних тривог</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>{t("nav.batches")}</span>
            <span className={styles.cardIcon}>🍯</span>
          </div>
          <div className={styles.statValue}>{activeBatches.length}</div>
          <div className={styles.statLabel}>активних партій</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Температура</span>
            <span className={styles.cardIcon}>🌡️</span>
          </div>
          <div className={styles.statValue}>
            {latestMeasurement ? `${latestMeasurement.temperature_c}°C` : "—"}
          </div>
          <div className={styles.statLabel}>останній вимір</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Вологість</span>
            <span className={styles.cardIcon}>💧</span>
          </div>
          <div className={styles.statValue}>
            {latestMeasurement ? `${latestMeasurement.humidity_percent}%` : "—"}
          </div>
          <div className={styles.statLabel}>останній вимір</div>
        </div>
      </div>

      {/* Склади */}
      <h2 className={styles.sectionTitle}>Склади</h2>
      {warehouses.map((w) => (
        <div key={w.warehouse_id} className={styles.warehouseCard}>
          <div className={styles.warehouseHeader}>
            <span className={styles.warehouseName}>{w.name}</span>
            <span
              className={`${styles.badge} ${w.status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive}`}
            >
              {w.status === "ACTIVE"
                ? t("common.active")
                : t("common.inactive")}
            </span>
          </div>
          <div className={styles.warehouseLocation}>📍 {w.location}</div>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Температура</span>
              <span className={styles.metricValue}>
                {latestMeasurement
                  ? `${latestMeasurement.temperature_c}°C`
                  : "—"}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Вологість</span>
              <span className={styles.metricValue}>
                {latestMeasurement
                  ? `${latestMeasurement.humidity_percent}%`
                  : "—"}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Тривоги</span>
              <span
                className={styles.metricValue}
                style={{
                  color:
                    activeAlerts.length > 0
                      ? "var(--red-500)"
                      : "var(--green-500)",
                }}
              >
                {
                  activeAlerts.filter((a) => a.warehouse_id === w.warehouse_id)
                    .length
                }
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Активні тривоги */}
      {activeAlerts.length > 0 && (
        <>
          <h2 className={styles.sectionTitle} style={{ marginTop: 32 }}>
            Активні тривоги
          </h2>
          {activeAlerts.slice(0, 5).map((alert) => (
            <div key={alert.alert_id} className={styles.alertItem}>
              <div className={styles.alertDot} />
              <span className={styles.alertText}>
                {alertTypeLabel(alert.type)}
              </span>
              <span className={styles.alertTime}>
                {formatDate(alert.created_at)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
