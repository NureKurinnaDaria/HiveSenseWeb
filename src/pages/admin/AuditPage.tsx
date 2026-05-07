import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../types";
import { getAuditLogs } from "../../api/index";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import styles from "./AuditPage.module.css";

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

  const handleSearch = () => {
    load();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(i18n.language === "uk" ? "uk-UA" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const actionBadge = (action: string) => {
    const lower = action.toLowerCase();
    const cls = lower.includes("create")
      ? styles.badgeCreate
      : lower.includes("update")
        ? styles.badgeUpdate
        : lower.includes("delete")
          ? styles.badgeDelete
          : styles.badgeOther;
    return <span className={`${styles.badge} ${cls}`}>{action}</span>;
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
          className={styles.payload}
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
      <div className={styles.header}>
        <div className={styles.filters}>
          <input
            className={styles.filterInput}
            placeholder="Сутність (users, sensors...)"
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
          />
          <input
            className={styles.filterInput}
            placeholder="Дія (create, update...)"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          />
          <Button variant="secondary" onClick={handleSearch}>
            {t("common.search")}
          </Button>
        </div>
        <div className={styles.exportRow}>
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
          <pre className={styles.payloadPre}>
            {JSON.stringify(selectedLog.payload, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}
