import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../types";
import { getAuditLogs } from "../../api/index";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { Toast, useToast } from "../../components/Toast";

export default function AuditPage() {
  const { t, i18n } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({
        entity: filterEntity || undefined,
        action: filterAction || undefined,
      });
      setLogs(data);
    } catch {
      showToast(t("common.load_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const actionBadge = (action: string) => {
    const lower = action.toLowerCase();
    const colors: [string, string] = lower.includes("create")
      ? ["var(--green-100)", "var(--green-600)"]
      : lower.includes("update")
        ? ["var(--blue-100)", "var(--blue-600)"]
        : lower.includes("delete")
          ? ["var(--red-100)", "var(--red-600)"]
          : ["var(--gray-100)", "var(--gray-600)"];
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: colors[0],
          color: colors[1],
        }}
      >
        {action}
      </span>
    );
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["ID", "Entity", "Action", "Actor ID", "Date"];
    const rows = logs.map((l) => [
      l.id,
      l.entity,
      l.action,
      l.actor_user_id,
      formatDate(l.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputStyle: React.CSSProperties = {
    padding: "9px 14px",
    borderRadius: 8,
    border: "1.5px solid var(--gray-200)",
    fontSize: 13.5,
    width: 200,
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "entity", label: t("common.entity") },
    {
      key: "action",
      label: t("common.action"),
      render: (l: AuditLog) => actionBadge(l.action),
    },
    { key: "actor_user_id", label: t("common.user_id") },
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
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            style={inputStyle}
            placeholder={t("audit.filter_entity")}
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder={t("audit.filter_action")}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          />
          <Button variant="secondary" onClick={load}>
            {t("common.search")}
          </Button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" icon="📥" onClick={exportCSV}>
            CSV
          </Button>
          <Button variant="ghost" icon="📥" onClick={exportJSON}>
            JSON
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={logs}
        loading={loading}
        rowKey={(l) => l.id}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
