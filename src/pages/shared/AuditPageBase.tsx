import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AuditLog } from "../../types";
import { getAuditLogs } from "../../api/index";
import Table from "../../components/Table";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import { Toast, useToast } from "../../components/Toast";

type AuditPageVariant = "admin" | "owner";

interface AuditPageBaseProps {
  variant: AuditPageVariant;
}

export default function AuditPageBase({ variant }: AuditPageBaseProps) {
  const { t, i18n } = useTranslation();
  const { toast, showToast, hideToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const isAdmin = variant === "admin";

  const load = useCallback(
    async (entity?: string, action?: string) => {
      setLoading(true);

      try {
        const data = await getAuditLogs(
          isAdmin
            ? {
                entity: entity || undefined,
                action: action || undefined,
              }
            : undefined,
        );

        setLogs(data);
      } catch {
        showToast(t("common.load_error"), "error");
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, showToast, t],
  );

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

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

  const actionVariant = (action: string) => {
    const lower = action.toLowerCase();

    if (lower.includes("create")) return "success";
    if (lower.includes("update")) return "info";
    if (lower.includes("delete")) return "danger";

    return "neutral";
  };

  const entities = useMemo(
    () => [...new Set(logs.map((l) => l.entity))],
    [logs],
  );

  const visibleLogs = useMemo(() => {
    if (isAdmin) return logs;

    return logs.filter((l) =>
      filterEntity ? l.entity === filterEntity : true,
    );
  }, [filterEntity, isAdmin, logs]);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(visibleLogs, null, 2)], {
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

    const rows = visibleLogs.map((l) => [
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
      render: (l: AuditLog) => (
        <StatusBadge label={l.action} variant={actionVariant(l.action)} />
      ),
    },
    {
      key: "actor_user_id",
      label: t("common.user_id"),
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
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {isAdmin ? (
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

            <Button
              variant="secondary"
              onClick={() => load(filterEntity, filterAction)}
            >
              {t("common.search")}
            </Button>
          </div>
        ) : (
          <select
            style={inputStyle}
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
          >
            <option value="">{t("common.all_entities")}</option>
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <Button variant="ghost" icon="📥" onClick={exportCSV}>
              CSV
            </Button>
          )}

          <Button variant="ghost" icon="📥" onClick={exportJSON}>
            JSON
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={visibleLogs}
        loading={loading}
        rowKey={(l) => l.id}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
