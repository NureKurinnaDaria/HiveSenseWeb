import { useEffect, useState } from "react";
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
import styles from "./SensorsPage.module.css";

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

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [form, setForm] = useState<SensorForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Sensor | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([getAllSensors(), getAllWarehouses()]);
      setSensors(s);
      setWarehouses(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingSensor(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setForm({
      serial_number: sensor.serial_number,
      type: sensor.type,
      warehouse_id: String(sensor.warehouse_id),
      is_active: sensor.is_active,
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

      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteSensor(confirmDelete.sensor_id);
    setConfirmDelete(null);
    await load();
  };

  const filtered = sensors.filter(
    (s) =>
      (s.serial_number ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.type ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.name })),
  ];

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.warehouse_id === id)?.name ?? "—";

  const columns = [
    { key: "sensor_id", label: "ID" },
    { key: "serial_number", label: "Серійний номер" },
    { key: "type", label: "Тип" },
    {
      key: "is_active",
      label: t("common.status"),
      render: (s: Sensor) => (
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: s.is_active ? "var(--green-100)" : "var(--red-100)",
            color: s.is_active ? "var(--green-600)" : "var(--red-600)",
          }}
        >
          {s.is_active ? t("common.active") : t("common.inactive")}
        </span>
      ),
    },
    {
      key: "warehouse_id",
      label: "Склад",
      render: (s: Sensor) => getWarehouseName(s.warehouse_id),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (s: Sensor) => (
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => openEdit(s)}
            title={t("common.edit")}
          >
            ✏️
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => setConfirmDelete(s)}
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
        <input
          className={styles.searchInput}
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
            label="Серійний номер"
            value={form.serial_number}
            onChange={(v) => setForm((f) => ({ ...f, serial_number: v }))}
            placeholder="SN-001-XYZ"
            required
          />
          <FormField
            label="Тип датчика"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            options={[{ value: "COMBINED", label: "COMBINED" }]}
          />
          <FormField
            label="Склад"
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
          <p className={styles.confirmText}>
            {t("common.confirm_delete")}{" "}
            <strong>{confirmDelete.serial_number}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
