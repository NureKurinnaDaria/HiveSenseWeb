import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { User, Warehouse } from "../../types";
import {
  getAllUsers,
  createUser,
  updateUser,
  blockUser,
  unblockUser,
  deleteUser,
} from "../../api/users";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { Toast, useToast } from "../../components/Toast";

interface UserForm {
  email: string;
  password: string;
  full_name: string;
  role: string;
  warehouse_id: string;
}

const emptyForm: UserForm = {
  email: "",
  password: "",
  full_name: "",
  role: "EMPLOYEE",
  warehouse_id: "",
};

const iconBtn: React.CSSProperties = {
  padding: "4px 8px",
  cursor: "pointer",
  borderRadius: 6,
  border: "1.5px solid var(--gray-200)",
  background: "#fff",
  fontSize: 13,
};

export default function OwnerUsersPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [u, w] = await Promise.all([getAllUsers(), getAllWarehouses()]);
      setUsers(u);
      setWarehouses(w);
    } catch {
      showToast(t("common.load_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowModal(true);
    (document.activeElement as HTMLElement)?.blur();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      full_name: user.full_name,
      role: user.role,
      warehouse_id: user.warehouse_id ? String(user.warehouse_id) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        const payload = {
          email: form.email,
          name: form.full_name,
          role: form.role,
          is_active: true,
          warehouse_id: form.warehouse_id
            ? Number(form.warehouse_id)
            : undefined,
          ...(form.password ? { password: form.password } : {}),
        };
        await updateUser(editingUser.user_id, payload);
      } else {
        await createUser({
          email: form.email,
          password: form.password,
          name: form.full_name,
          role: form.role,
          is_active: true,
          warehouse_id: form.warehouse_id
            ? Number(form.warehouse_id)
            : undefined,
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

  const handleToggleBlock = async (user: User) => {
    try {
      await (user.is_active
        ? blockUser(user.user_id)
        : unblockUser(user.user_id));
      await load();
    } catch {
      showToast(t("common.save_error"), "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteUser(confirmDelete.user_id);
      showToast(t("common.delete_success"), "success");
      setConfirmDelete(null);
      await load();
    } catch {
      showToast(t("common.delete_error"), "error");
    }
  };

  const getWarehouseName = (id: number | null) =>
    id ? (warehouses.find((w) => w.warehouse_id === id)?.name ?? "—") : "—";

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const roleBadge = (role: string) => {
    const colors: Record<string, [string, string]> = {
      ADMIN: ["var(--amber-100)", "var(--amber-700)"],
      OWNER: ["var(--blue-100)", "var(--blue-600)"],
      EMPLOYEE: ["var(--gray-100)", "var(--gray-600)"],
    };
    const [bg, color] = colors[role] ?? ["var(--gray-100)", "var(--gray-600)"];
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
        {t(`roles.${role}`)}
      </span>
    );
  };

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.name })),
  ];

  const roleOptions = [
    { value: "EMPLOYEE", label: t("roles.EMPLOYEE") },
    { value: "ADMIN", label: t("roles.ADMIN") },
    { value: "OWNER", label: t("roles.OWNER") },
  ];

  const columns = [
    { key: "user_id", label: "ID" },
    { key: "full_name", label: i18n.language === "uk" ? "Ім'я" : "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: t("common.role"),
      render: (u: User) => roleBadge(u.role),
    },
    {
      key: "warehouse_id",
      label: t("common.warehouse"),
      render: (u: User) => getWarehouseName(u.warehouse_id),
    },
    {
      key: "is_active",
      label: t("common.status"),
      render: (u: User) => (
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            background: u.is_active ? "var(--green-100)" : "var(--red-100)",
            color: u.is_active ? "var(--green-600)" : "var(--red-600)",
          }}
        >
          {u.is_active ? t("common.active") : t("common.blocked")}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (u: User) => {
        const isSelf =
          u.user_id === currentUser?.user_id ||
          u.user_id === (currentUser as { id?: number })?.id;
        return (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={iconBtn}
              onClick={() => openEdit(u)}
              title={t("common.edit")}
            >
              ✏️
            </button>
            {!isSelf && (
              <button
                style={iconBtn}
                onClick={() => handleToggleBlock(u)}
                title={u.is_active ? t("common.block") : t("common.unblock")}
              >
                {u.is_active ? "🔒" : "🔓"}
              </button>
            )}
            {!isSelf && (
              <button
                style={iconBtn}
                onClick={() => setConfirmDelete(u)}
                title={t("common.delete")}
              >
                🗑️
              </button>
            )}
          </div>
        );
      },
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
          readOnly={showModal}
        />
        <Button icon="+" onClick={openCreate}>
          {t("common.create")}
        </Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(u) => u.user_id}
      />

      {showModal && (
        <Modal
          title={editingUser ? t("common.edit") : t("common.create")}
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
            label={i18n.language === "uk" ? "Ім'я" : "Name"}
            value={form.full_name}
            onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
            required
          />
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            required
          />
          <FormField
            label={t("common.password")}
            type="password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            placeholder={editingUser ? t("common.leave_blank") : ""}
            required={!editingUser}
          />
          <FormField
            label={t("common.role")}
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            options={roleOptions}
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
            <strong>{confirmDelete.full_name}</strong>?
          </p>
        </Modal>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}
