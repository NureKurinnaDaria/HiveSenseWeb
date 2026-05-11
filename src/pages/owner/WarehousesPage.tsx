import { useCallback, useEffect, useState } from "react";
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
import { Toast, useToast } from "../../components/Toast";
import IconButton from "../../components/IconButton";
import StatusBadge from "../../components/StatusBadge";

interface WarehouseForm {
  name: string;
  location: string;
  status: string;
}

const emptyForm: WarehouseForm = { name: "", location: "", status: "ACTIVE" };

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
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWarehouses(await getAllWarehouses());
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
    setEditingWarehouse(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setForm({ name: w.name, location: w.location, status: w.status });
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
      await deleteWarehouse(confirmDelete.warehouse_id);
      showToast(t("common.delete_success"), "success");
      setConfirmDelete(null);
      await load();
    } catch {
      showToast(t("common.delete_error"), "error");
    }
  };

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    { key: "warehouse_id", label: "ID" },
    { key: "name", label: t("common.name") },
    { key: "location", label: t("warehouse.location") },
    {
      key: "status",
      label: t("common.status"),
      render: (w: Warehouse) => (
        <StatusBadge
          label={
            w.status === "ACTIVE" ? t("common.active") : t("common.inactive")
          }
          variant={w.status === "ACTIVE" ? "success" : "neutral"}
          uppercase
        />
      ),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (w: Warehouse) => (
        <div style={{ display: "flex", gap: 6 }}>
          <IconButton onClick={() => openEdit(w)} title={t("common.edit")}>
            ✏️
          </IconButton>
          <IconButton
            onClick={() => setConfirmDelete(w)}
            title={t("common.delete")}
          >
            🗑️
          </IconButton>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: t("common.active") },
    { value: "INACTIVE", label: t("common.inactive") },
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
          <p style={{ fontSize: 14, color: "var(--gray-700)" }}>
            {t("common.confirm_delete")} <strong>{confirmDelete.name}</strong>?
          </p>
        </Modal>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
