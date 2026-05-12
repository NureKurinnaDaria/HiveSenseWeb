import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toast, useToast } from "../../components/Toast";
import Button from "../../components/Button";
import { getAllUsers } from "../../api/users";
import { getAllWarehouses } from "../../api/warehouses";
import {
  getAllSensors,
  getAllThresholds,
  getAlerts,
  getHoneyBatches,
  getAuditLogs,
} from "../../api/index";

type Status = "idle" | "loading" | "success" | "error";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function nowStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

const sectionStyle: React.CSSProperties = {
  background: "var(--surface, #fff)",
  border: "1.5px solid var(--gray-200, #e5e7eb)",
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--gray-900, #111)",
  margin: "0 0 6px 0",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const descStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--gray-500, #6b7280)",
  margin: "0 0 16px 0",
};

export default function BackupPage() {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();

  const [backupStatus, setBackupStatus] = useState<Status>("idle");
  const [exportStatus, setExportStatus] = useState<Status>("idle");
  const [importStatus, setImportStatus] = useState<Status>("idle");
  const [importPreview, setImportPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFullBackup = async () => {
    setBackupStatus("loading");
    try {
      const [users, warehouses, sensors, thresholds, alerts, batches, audit] =
        await Promise.all([
          getAllUsers(),
          getAllWarehouses(),
          getAllSensors(),
          getAllThresholds(),
          getAlerts(),
          getHoneyBatches(),
          getAuditLogs(),
        ]);

      const backup = {
        meta: {
          created_at: new Date().toISOString(),
          version: "1.0",
          system: "HiveSense",
        },
        data: {
          users,
          warehouses,
          sensors,
          thresholds,
          alerts,
          batches,
          audit,
        },
      };

      downloadJson(backup, `hivesense-backup-${nowStamp()}.json`);
      setBackupStatus("success");
      showToast(t("backup.backup_success"), "success");
    } catch {
      setBackupStatus("error");
      showToast(t("backup.backup_error"), "error");
    }
  };

  const handleExportSettings = async () => {
    setExportStatus("loading");
    try {
      const [sensors, thresholds, warehouses] = await Promise.all([
        getAllSensors(),
        getAllThresholds(),
        getAllWarehouses(),
      ]);

      const settings = {
        meta: {
          exported_at: new Date().toISOString(),
          type: "settings",
        },
        sensors,
        thresholds,
        warehouses,
      };

      downloadJson(settings, `hivesense-settings-${nowStamp()}.json`);
      setExportStatus("success");
      showToast(t("backup.export_success"), "success");
    } catch {
      setExportStatus("error");
      showToast(t("backup.export_error"), "error");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("loading");
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Record<string, unknown>;

        setImportPreview(
          parsed.meta
            ? JSON.stringify(parsed.meta, null, 2)
            : JSON.stringify(Object.keys(parsed), null, 2),
        );

        setImportStatus("success");
        showToast(t("backup.import_success"), "success");
      } catch {
        setImportStatus("error");
        showToast(t("backup.import_error"), "error");
      }
    };
    reader.onerror = () => {
      setImportStatus("error");
      showToast(t("backup.import_error"), "error");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const statusText = (status: Status, successKey: string, errorKey: string) => {
    if (status === "loading")
      return (
        <p style={{ fontSize: 13, color: "var(--gray-500)", marginTop: 10 }}>
          {t("common.loading")}
        </p>
      );
    if (status === "success")
      return (
        <p
          style={{
            fontSize: 13,
            color: "var(--green-500, #22c55e)",
            marginTop: 10,
            fontWeight: 500,
          }}
        >
          ✓ {t(successKey)}
        </p>
      );
    if (status === "error")
      return (
        <p
          style={{
            fontSize: 13,
            color: "var(--red-500, #ef4444)",
            marginTop: 10,
            fontWeight: 500,
          }}
        >
          ✕ {t(errorKey)}
        </p>
      );
    return null;
  };

  return (
    <div>
      {/* Резервна копія */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>💾 {t("backup.full_backup_title")}</h2>
        <p style={descStyle}>{t("backup.full_backup_desc")}</p>
        <Button
          onClick={() => void handleFullBackup()}
          disabled={backupStatus === "loading"}
          icon="⬇️"
        >
          {t("backup.create_backup")}
        </Button>
        {statusText(
          backupStatus,
          "backup.backup_success",
          "backup.backup_error",
        )}
      </div>

      {/* Експорт налаштувань */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>📤 {t("backup.export_title")}</h2>
        <p style={descStyle}>{t("backup.export_desc")}</p>
        <Button
          onClick={() => void handleExportSettings()}
          disabled={exportStatus === "loading"}
          variant="secondary"
          icon="📋"
        >
          {t("backup.export_settings")}
        </Button>
        {statusText(
          exportStatus,
          "backup.export_success",
          "backup.export_error",
        )}
      </div>

      {/* Імпорт */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>📥 {t("backup.import_title")}</h2>
        <p style={descStyle}>{t("backup.import_desc")}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
        <Button
          variant="secondary"
          icon="📂"
          onClick={() => fileInputRef.current?.click()}
          disabled={importStatus === "loading"}
        >
          {t("backup.choose_file")}
        </Button>

        {statusText(
          importStatus,
          "backup.import_success",
          "backup.import_error",
        )}

        {importPreview && (
          <pre
            style={{
              marginTop: 12,
              background: "var(--gray-50, #f9fafb)",
              border: "1.5px solid var(--gray-200, #e5e7eb)",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: "var(--gray-600, #4b5563)",
              maxHeight: 120,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {importPreview}
          </pre>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
