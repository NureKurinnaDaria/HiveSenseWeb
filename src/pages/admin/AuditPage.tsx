import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../types";
import { getAuditLogs } from "../../api/index";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";

export default function AuditPage() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({
        entity: filterEntity || undefined,
        action: filterAction || undefined,
      });
      setLogs(data);
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
    { key: "entity", label: "Сутність" },
    {
      key: "action",
      label: "Дія",
      render: (l: AuditLog) => actionBadge(l.action),
    },
    { key: "actor_user_id", label: "Користувач ID" },
    {
      key: "created_at",
      label: "Дата",
      render: (l: AuditLog) => formatDate(l.created_at),
    },
    {
      key: "payload",
      label: "Дані",
      render: (l: AuditLog) => (
        <span
          style={{
            fontSize: 12,
            color: "var(--gray-500)",
            cursor: "pointer",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
          onClick={() => setSelectedLog(l)}
          title="Натисни для перегляду"
        >
          {JSON.stringify(l.payload)}
        </span>
      ),
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
            placeholder="Сутність (users, sensors...)"
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="Дія (create, update...)"
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

      {selectedLog && (
        <Modal
          title={`Payload — ${selectedLog.entity} / ${selectedLog.action}`}
          onClose={() => setSelectedLog(null)}
        >
          <pre
            style={{
              fontSize: 12,
              color: "var(--gray-700)",
              background: "var(--gray-100)",
              padding: 16,
              borderRadius: 8,
              overflow: "auto",
              maxHeight: 400,
            }}
          >
            {JSON.stringify(selectedLog.payload, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}
