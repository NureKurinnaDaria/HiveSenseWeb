import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Warehouse } from "../../types";
import { getAllWarehouses } from "../../api/warehouses";
import { getWarehouseSummary } from "../../api/index";
import Button from "../../components/Button";

interface Summary {
  warehouse: {
    warehouse_id: number;
    name: string;
    location: string;
    status: string;
  };
  sensor_count: number;
  active_alerts: number;
  honey_batches: number;
  total_honey_kg: number;
  latest_measurement?: {
    temperature_c: string;
    humidity_percent: string;
    measured_at: string;
  };
  threshold?: {
    temp_min: number;
    temp_max: number;
    humidity_min: number;
    humidity_max: number;
  };
}

export default function ReportsPage() {
  const { i18n } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllWarehouses().then((w) => {
      setWarehouses(w);
      if (w.length > 0) setSelected(w[0].warehouse_id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    getWarehouseSummary(selected)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [selected]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
    );

  const exportJSON = () => {
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-warehouse-${selected}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 12,
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
          value={selected ?? ""}
          onChange={(e) => setSelected(Number(e.target.value))}
        >
          {warehouses.map((w) => (
            <option key={w.warehouse_id} value={w.warehouse_id}>
              {w.name}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          icon="📥"
          onClick={exportJSON}
          disabled={!summary}
        >
          JSON
        </Button>
      </div>

      {loading && <p style={{ color: "var(--gray-500)" }}>Завантаження...</p>}

      {summary && !loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "Датчики", value: summary.sensor_count, icon: "📡" },
            {
              label: "Активні тривоги",
              value: summary.active_alerts,
              icon: "🚨",
            },
            { label: "Партій меду", value: summary.honey_batches, icon: "🍯" },
            { label: "Мед (кг)", value: summary.total_honey_kg, icon: "⚖️" },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "20px 24px",
                border: "1.5px solid var(--gray-200)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--amber-700)",
                }}
              >
                {card.value}
              </div>
              <div
                style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 4 }}
              >
                {card.label}
              </div>
            </div>
          ))}

          {summary.latest_measurement && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "20px 24px",
                border: "1.5px solid var(--gray-200)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                gridColumn: "span 2",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--gray-500)",
                  marginBottom: 12,
                }}
              >
                ОСТАННІЙ ВИМІР —{" "}
                {formatDate(summary.latest_measurement.measured_at)}
              </div>
              <div style={{ display: "flex", gap: 32 }}>
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "var(--amber-700)",
                    }}
                  >
                    {summary.latest_measurement.temperature_c}°C
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    Температура
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "var(--amber-700)",
                    }}
                  >
                    {summary.latest_measurement.humidity_percent}%
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    Вологість
                  </div>
                </div>
              </div>
            </div>
          )}

          {summary.threshold && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "20px 24px",
                border: "1.5px solid var(--gray-200)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                gridColumn: "span 2",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--gray-500)",
                  marginBottom: 12,
                }}
              >
                ПОРОГОВІ ЗНАЧЕННЯ
              </div>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                {[
                  {
                    label: "Темп. мін",
                    value: `${summary.threshold.temp_min}°C`,
                  },
                  {
                    label: "Темп. макс",
                    value: `${summary.threshold.temp_max}°C`,
                  },
                  {
                    label: "Волог. мін",
                    value: `${summary.threshold.humidity_min}%`,
                  },
                  {
                    label: "Волог. макс",
                    value: `${summary.threshold.humidity_max}%`,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--gray-800)",
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
