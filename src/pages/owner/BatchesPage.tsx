import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { HoneyBatch, Warehouse } from "../../types";
import {
  getHoneyBatches,
  createHoneyBatch,
  updateHoneyBatch,
  deleteHoneyBatch,
} from "../../api/index";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";

interface BatchForm {
  variety: string;
  quantity_kg: string;
  received_at: string;
  expiry_date: string;
  status: string;
  warehouse_id: string;
}

const emptyForm: BatchForm = {
  variety: "",
  quantity_kg: "",
  received_at: "",
  expiry_date: "",
  status: "ACTIVE",
  warehouse_id: "",
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

export default function BatchesPage() {
  const { t, i18n } = useTranslation();
  const [batches, setBatches] = useState<HoneyBatch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<HoneyBatch | null>(null);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<HoneyBatch | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, w] = await Promise.all([getHoneyBatches(), getAllWarehouses()]);
      setBatches(b);
      setWarehouses(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingBatch(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (batch: HoneyBatch) => {
    setEditingBatch(batch);
    setForm({
      variety: batch.variety,
      quantity_kg: String(batch.quantity_kg),
      received_at: batch.received_date?.slice(0, 10) ?? "",
      expiry_date: batch.expiration_date?.slice(0, 10) ?? "",
      status: batch.status,
      warehouse_id: String(batch.warehouse_id),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        variety: form.variety,
        quantity_kg: Number(form.quantity_kg),
        received_date: form.received_at,
        expiration_date: form.expiry_date,
        status: form.status as "ACTIVE" | "EXPIRED" | "SOLD",
        warehouse_id: Number(form.warehouse_id),
      };
      if (editingBatch) {
        await updateHoneyBatch(editingBatch.batch_id, payload);
      } else {
        await createHoneyBatch(payload);
      }
      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteHoneyBatch(confirmDelete.batch_id);
    setConfirmDelete(null);
    await load();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "uk" ? "uk-UA" : "en-GB",
    );
  };

  const getWarehouseName = (id: number) =>
    warehouses.find((w) => w.warehouse_id === id)?.name ?? "—";

  const statusBadge = (status: string) => {
    const colors: Record<string, [string, string]> = {
      ACTIVE: ["var(--green-100)", "var(--green-600)"],
      EXPIRED: ["var(--red-100)", "var(--red-600)"],
      SOLD: ["var(--blue-100)", "var(--blue-600)"],
    };
    const [bg, color] = colors[status] ?? [
      "var(--gray-100)",
      "var(--gray-600)",
    ];
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          background: bg,
          color,
        }}
      >
        {t(`batch.${status}`)}
      </span>
    );
  };

  const exportCSV = () => {
    const headers = [
      t("ID"),
      t("batch.variety"),
      t("batch.quantity"),
      t("batch.received"),
      t("batch.expiry"),
      t("batch.status"),
      t("common.warehouse"),
    ];
    const rows = batches.map((b) => [
      b.batch_id,
      b.variety,
      b.quantity_kg,
      formatDate(b.received_date),
      formatDate(b.expiration_date),
      b.status,
      getWarehouseName(b.warehouse_id),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `honey-batches-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = batches.filter((b) =>
    (b.variety ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.name })),
  ];
  const statusOptions = [
    { value: "ACTIVE", label: t("batch.ACTIVE") },
    { value: "EXPIRED", label: t("batch.EXPIRED") },
    { value: "SOLD", label: t("batch.SOLD") },
  ];

  const columns = [
    { key: "batch_id", label: t("ID") },
    { key: "variety", label: t("batch.variety") },
    { key: "quantity_kg", label: t("batch.quantity") },
    {
      key: "received_date",
      label: t("batch.received"),
      render: (b: HoneyBatch) => formatDate(b.received_date),
    },
    {
      key: "expiration_date",
      label: t("batch.expiry"),
      render: (b: HoneyBatch) => formatDate(b.expiration_date),
    },
    {
      key: "status",
      label: t("batch.status"),
      render: (b: HoneyBatch) => statusBadge(b.status),
    },
    {
      key: "warehouse_id",
      label: t("common.warehouse"),
      render: (b: HoneyBatch) => getWarehouseName(b.warehouse_id),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (b: HoneyBatch) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={iconBtn}
            onClick={() => openEdit(b)}
            title={t("common.edit")}
          >
            ✏️
          </button>
          <button
            style={iconBtn}
            onClick={() => setConfirmDelete(b)}
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
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="ghost" icon="📥" onClick={exportCSV}>
            CSV
          </Button>
          <Button icon="+" onClick={openCreate}>
            {t("common.create")}
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(b) => b.batch_id}
      />

      {showModal && (
        <Modal
          title={editingBatch ? t("common.edit") : t("common.create")}
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
            label={t("batch.variety")}
            value={form.variety}
            onChange={(v) => setForm((f) => ({ ...f, variety: v }))}
            required
          />
          <FormField
            label={t("batch.quantity")}
            type="number"
            value={form.quantity_kg}
            onChange={(v) => setForm((f) => ({ ...f, quantity_kg: v }))}
            required
          />
          <FormField
            label={t("batch.received")}
            type="date"
            value={form.received_at}
            onChange={(v) => setForm((f) => ({ ...f, received_at: v }))}
            required
          />
          <FormField
            label={t("batch.expiry")}
            type="date"
            value={form.expiry_date}
            onChange={(v) => setForm((f) => ({ ...f, expiry_date: v }))}
            required
          />
          <FormField
            label={t("batch.status")}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            options={statusOptions}
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
            <strong>{confirmDelete.variety}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
