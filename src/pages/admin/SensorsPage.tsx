import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Sensor, Warehouse } from "../../types";
import {
  getAllSensors,
  createSensor,
  updateSensor,
  deleteSensor,
} from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import { Toast, useToast } from "../../components/Toast";
import IconButton from "../../components/IconButton";
import StatusBadge from "../../components/StatusBadge";

interface SensorForm {
  serial_number: string;
  type: string;
  warehouse_id: string;
  is_active: boolean;
}

const emptyForm: SensorForm = {
  serial_number: "",
  type: "COMBINED",
  warehouse_id: "",
  is_active: true,
};

export default function SensorsPage() {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [form, setForm] = useState<SensorForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Sensor | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([getAllSensors(), getAllWarehouses()]);
      setSensors(s);
      setWarehouses(w);
    } catch {
      showToast(t("common.load_error"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const openCreate = () => {
    setEditingSensor(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (s: Sensor) => {
    setEditingSensor(s);
    setForm({
      serial_number: s.serial_number,
      type: s.type,
      warehouse_id: String(s.warehouse_id),
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        serial_number: form.serial_number,
        type: form.type,
        warehouse_id: Number(form.warehouse_id),
        is_active: form.is_active,
      };
      if (editingSensor) {
        await updateSensor(editingSensor.sensor_id, payload);
      } else {
        await createSensor(payload);
      }
      showToast(t("common.save_success"), "success");
      setShowModal(false);
      await load();
    } catch {
      showToast(t("common.save_error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSensor(confirmDelete.sensor_id);
      showToast(t("common.delete_success"), "success");
      setConfirmDelete(null);
      await load();
    } catch {
      showToast(t("common.delete_error"), "error");
    }
  };

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.warehouse_id === id)?.name ?? "—";

  const filtered = sensors.filter(
    (s) =>
      (s.serial_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.type ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.name })),
  ];

  const columns = [
    { key: "sensor_id", label: "ID" },
    { key: "serial_number", label: t("sensor.serial") },
    { key: "type", label: t("sensor.type") },
    {
      key: "is_active",
      label: t("common.status"),
      render: (s: Sensor) => (
        <StatusBadge
          label={s.is_active ? t("common.active") : t("common.inactive")}
          variant={s.is_active ? "success" : "danger"}
        />
      ),
    },
    {
      key: "warehouse_id",
      label: t("common.warehouse"),
      render: (s: Sensor) => getWarehouseName(s.warehouse_id),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (s: Sensor) => (
        <div style={{ display: "flex", gap: 6 }}>
          <IconButton onClick={() => openEdit(s)} title={t("common.edit")}>
            ✏️
          </IconButton>
          <IconButton
            onClick={() => setConfirmDelete(s)}
            title={t("common.delete")}
          >
            🗑️
          </IconButton>
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
        <input
          style={{
            padding: "9px 14px",
            borderRadius: 8,
            border: "1.5px solid var(--gray-200)",
            fontSize: 13.5,
            width: 260,
          }}
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button icon="+" onClick={openCreate}>
          {t("common.create")}
        </Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(s) => s.sensor_id}
      />

      {showModal && (
        <Modal
          title={editingSensor ? t("common.edit") : t("common.create")}
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
          <FormField
            label={t("sensor.serial_number")}
            value={form.serial_number}
            onChange={(v) => setForm((f) => ({ ...f, serial_number: v }))}
            placeholder={t("sensor.serial_number_placeholder")}
            required
          />
          <FormField
            label={t("sensor.type")}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            options={[{ value: "COMBINED", label: t("sensor.combined") }]}
          />
          <FormField
            label={t("common.warehouse")}
            value={form.warehouse_id}
            onChange={(v) => setForm((f) => ({ ...f, warehouse_id: v }))}
            options={warehouseOptions}
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
            {t("common.confirm_delete")}{" "}
            <strong>{confirmDelete.serial_number}</strong>?
          </p>
        </Modal>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
