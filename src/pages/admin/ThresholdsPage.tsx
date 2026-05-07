import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Threshold, Warehouse } from "../../types";
import {
  getAllThresholds,
  createThreshold,
  updateThreshold,
  deleteThreshold,
} from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import styles from "./ThresholdsPage.module.css";

interface ThresholdForm {
  warehouse_id: string;
  temp_min: string;
  temp_max: string;
  humidity_min: string;
  humidity_max: string;
}

const emptyForm: ThresholdForm = {
  warehouse_id: "",
  temp_min: "",
  temp_max: "",
  humidity_min: "",
  humidity_max: "",
};

export default function ThresholdsPage() {
  const { t } = useTranslation();

  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<Threshold | null>(
    null,
  );
  const [form, setForm] = useState<ThresholdForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Threshold | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [th, w] = await Promise.all([
        getAllThresholds(),
        getAllWarehouses(),
      ]);
      setThresholds(th);
      setWarehouses(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingThreshold(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (threshold: Threshold) => {
    setEditingThreshold(threshold);
    setForm({
      warehouse_id: String(threshold.warehouse_id),
      temp_min: String(threshold.temp_min),
      temp_max: String(threshold.temp_max),
      humidity_min: String(threshold.humidity_min),
      humidity_max: String(threshold.humidity_max),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        temp_min: Number(form.temp_min),
        temp_max: Number(form.temp_max),
        humidity_min: Number(form.humidity_min),
        humidity_max: Number(form.humidity_max),
        warehouse_id: Number(form.warehouse_id),
      };

      if (editingThreshold) {
        await updateThreshold(editingThreshold.warehouse_id, payload);
      } else {
        await createThreshold(payload);
      }

      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteThreshold(confirmDelete.warehouse_id);
    setConfirmDelete(null);
    await load();
  };

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.warehouse_id === id)?.name ?? "—";

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.name })),
  ];

  const columns = [
    {
      key: "warehouse_id",
      label: "Склад",
      render: (th: Threshold) => getWarehouseName(th.warehouse_id),
    },
    {
      key: "temperature",
      label: "Температура (°C)",
      render: (th: Threshold) => (
        <span className={styles.rangeCell}>
          <span className={styles.rangeValue}>{th.temp_min}</span>
          {" — "}
          <span className={styles.rangeValue}>{th.temp_max}</span>
        </span>
      ),
    },
    {
      key: "humidity",
      label: "Вологість (%)",
      render: (th: Threshold) => (
        <span className={styles.rangeCell}>
          <span className={styles.rangeValue}>{th.humidity_min}</span>
          {" — "}
          <span className={styles.rangeValue}>{th.humidity_max}</span>
        </span>
      ),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (th: Threshold) => (
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => openEdit(th)}
            title={t("common.edit")}
          >
            ✏️
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => setConfirmDelete(th)}
            title={t("common.delete")}
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header}>
        <span style={{ fontSize: 14, color: "var(--gray-500)" }}>
          Порогові значення температури та вологості для кожного складу
        </span>
        <Button icon="+" onClick={openCreate}>
          {t("common.create")}
        </Button>
      </div>

      <Table
        columns={columns}
        data={thresholds}
        loading={loading}
        rowKey={(th) => th.warehouse_id}
      />

      {showModal && (
        <Modal
          title={editingThreshold ? t("common.edit") : t("common.create")}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t("common.loading") : t("common.save")}
              </Button>
            </>
          }
        >
          {!editingThreshold && (
            <FormField
              label="Склад"
              value={form.warehouse_id}
              onChange={(v) => setForm((f) => ({ ...f, warehouse_id: v }))}
              options={warehouseOptions}
              required
            />
          )}
          <FormField
            label={t("threshold.temp_min") + " (°C)"}
            type="number"
            value={form.temp_min}
            onChange={(v) => setForm((f) => ({ ...f, temp_min: v }))}
            required
          />
          <FormField
            label={t("threshold.temp_max") + " (°C)"}
            type="number"
            value={form.temp_max}
            onChange={(v) => setForm((f) => ({ ...f, temp_max: v }))}
            required
          />
          <FormField
            label={t("threshold.humidity_min") + " (%)"}
            type="number"
            value={form.humidity_min}
            onChange={(v) => setForm((f) => ({ ...f, humidity_min: v }))}
            required
          />
          <FormField
            label={t("threshold.humidity_max") + " (%)"}
            type="number"
            value={form.humidity_max}
            onChange={(v) => setForm((f) => ({ ...f, humidity_max: v }))}
            required
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title={t("common.delete")}
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                {t("common.cancel")}
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                {t("common.delete")}
              </Button>
            </>
          }
        >
          <p className={styles.confirmText}>
            {t("common.confirm_delete")} порогові значення для складу{" "}
            <strong>{getWarehouseName(confirmDelete.warehouse_id)}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
