import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../types";
import { getAuditLogs } from "../../api/index";
import Table from "../../components/Table";
import Button from "../../components/Button";

export default function AuditPage() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");

  useEffect(() => {
    setLoading(true);
    getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
    );

  const entities = [...new Set(logs.map((l) => l.entity))];
  const filtered = logs.filter((l) =>
    filterEntity ? l.entity === filterEntity : true,
  );

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionBadge = (action: string) => {
    const colors: Record<string, [string, string]> = {
      CREATE: ["var(--green-100)", "var(--green-600)"],
      UPDATE: ["var(--blue-100)", "var(--blue-600)"],
      DELETE: ["var(--red-100)", "var(--red-600)"],
    };
    const [bg, color] = colors[action] ?? [
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
        {action}
      </span>
    );
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "entity", label: t("common.entity") },
    {
      key: "action",
      label: t("common.action"),
      render: (l: AuditLog) => actionBadge(l.action),
    },
    {
      key: "actor_user_id",
      label: t("nav.users"),
      render: (l: AuditLog) => `#${l.actor_user_id}`,
    },
    {
      key: "created_at",
      label: t("common.date"),
      render: (l: AuditLog) => formatDate(l.created_at),
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
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
        >
          <option value="">{t("common.all_entities")}</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <Button variant="ghost" icon="📥" onClick={exportJSON}>
          JSON
        </Button>
      </div>
      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(l) => l.id}
      />
    </div>
  );
}
