import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Warehouse } from "../../types";
import {
  getAllWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import styles from "./WarehousesPage.module.css";

interface WarehouseForm {
  name: string;
  location: string;
  status: string;
}

const emptyForm: WarehouseForm = {
  name: "",
  location: "",
  status: "ACTIVE",
};

export default function WarehousesPage() {
  const { t } = useTranslation();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [form, setForm] = useState<WarehouseForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Warehouse | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllWarehouses();
      setWarehouses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingWarehouse(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setForm({
      name: warehouse.name,
      location: warehouse.location,
      status: warehouse.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.warehouse_id, {
          ...form,
          status: form.status as "ACTIVE" | "INACTIVE",
        });
      } else {
        await createWarehouse({
          ...form,
          status: form.status as "ACTIVE" | "INACTIVE",
        });
      }
      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteWarehouse(confirmDelete.warehouse_id);
    setConfirmDelete(null);
    await load();
  };

  const filtered = warehouses.filter(
    (w) =>
      (w.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (w.location ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const statusBadge = (status: string) => (
    <span
      className={`${styles.badge} ${status === "ACTIVE" ? styles.badgeActive : styles.badgeInactive}`}
    >
      {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
    </span>
  );

  const statusOptions = [
    { value: "ACTIVE", label: t("common.active") },
    { value: "INACTIVE", label: t("common.inactive") },
  ];

  const columns = [
    { key: "warehouse_id", label: "ID" },
    { key: "name", label: t("common.name") },
    { key: "location", label: t("warehouse.location") },
    {
      key: "status",
      label: t("common.status"),
      render: (w: Warehouse) => statusBadge(w.status),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (w: Warehouse) => (
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => openEdit(w)}
            title={t("common.edit")}
          >
            ✏️
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => setConfirmDelete(w)}
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
        rowKey={(w) => w.warehouse_id}
      />

      {showModal && (
        <Modal
          title={editingWarehouse ? t("common.edit") : t("warehouse.create")}
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
            label={t("warehouse.name")}
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            required
          />
          <FormField
            label={t("warehouse.location")}
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            required
          />
          <FormField
            label={t("warehouse.status")}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            options={statusOptions}
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
            {t("common.confirm_delete")} <strong>{confirmDelete.name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
