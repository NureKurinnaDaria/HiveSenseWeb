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
const iconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 6,
  border: "1.5px solid var(--gray-200)",
  background: "#fff",
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  const openEdit = (th: Threshold) => {
    setEditingThreshold(th);
    setForm({
      warehouse_id: String(th.warehouse_id),
      temp_min: String(th.temp_min),
      temp_max: String(th.temp_max),
      humidity_min: String(th.humidity_min),
      humidity_max: String(th.humidity_max),
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

  const rangeCell = (min: number, max: number) => (
    <span>
      <span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{min}</span>
      {" — "}
      <span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{max}</span>
    </span>
  );

  const columns = [
    {
      key: "warehouse_id",
      label: "Склад",
      render: (th: Threshold) => getWarehouseName(th.warehouse_id),
    },
    {
      key: "temperature",
      label: "Температура (°C)",
      render: (th: Threshold) => rangeCell(th.temp_min, th.temp_max),
    },
    {
      key: "humidity",
      label: "Вологість (%)",
      render: (th: Threshold) => rangeCell(th.humidity_min, th.humidity_max),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (th: Threshold) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={iconBtn}
            onClick={() => openEdit(th)}
            title={t("common.edit")}
          >
            ✏️
          </button>
          <button
            style={iconBtn}
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
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
          <p style={{ fontSize: 14, color: "var(--gray-700)" }}>
            {t("common.confirm_delete")} порогові значення для складу{" "}
            <strong>{getWarehouseName(confirmDelete.warehouse_id)}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
