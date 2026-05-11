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
  role: "worker",
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

export default function UsersPage() {
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

  const load = async () => {
    setLoading(true);
    try {
      const [u, w] = await Promise.all([getAllUsers(), getAllWarehouses()]);
      setUsers(u);
      setWarehouses(w);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowModal(true);
  };
  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      full_name: user.full_name,
      role: user.role.toLowerCase(),
      warehouse_id: user.warehouse_id ? String(user.warehouse_id) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        email: form.email,
        name: form.full_name,
        role: form.role as "worker" | "admin" | "owner",
        is_active: true,
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : undefined,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editingUser) {
        await updateUser(editingUser.user_id, payload);
      } else {
        await createUser({
          email: payload.email,
          password: form.password,
          name: payload.name,
          role: payload.role,
          is_active: true,
          warehouse_id: payload.warehouse_id,
        });
      }
      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async (user: User) => {
    user.is_active
      ? await blockUser(user.user_id)
      : await unblockUser(user.user_id);
    await load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteUser(confirmDelete.user_id);
    setConfirmDelete(null);
    await load();
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()),
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

  const statusBadge = (isActive: boolean) => (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        background: isActive ? "var(--green-100)" : "var(--red-100)",
        color: isActive ? "var(--green-600)" : "var(--red-600)",
      }}
    >
      {isActive ? t("common.active") : t("common.blocked")}
    </span>
  );

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((w) => ({ value: w.warehouse_id, label: w.name })),
  ];
  const roleOptions = [
    { value: "worker", label: t("roles.EMPLOYEE") },
    { value: "admin", label: t("roles.ADMIN") },
    { value: "owner", label: t("roles.OWNER") },
  ];

  const columns = [
    { key: "full_name", label: i18n.language === "uk" ? "Ім'я" : "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: t("common.role"),
      render: (u: User) => roleBadge(u.role),
    },
    {
      key: "is_active",
      label: t("common.status"),
      render: (u: User) => statusBadge(u.is_active),
    },
    {
      key: "warehouse",
      label: i18n.language === "uk" ? "Склад" : "Warehouse",
      render: (u: User) => u.warehouse?.name ?? "—",
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (u: User) => {
        if (u.role === "OWNER")
          return (
            <span style={{ color: "var(--gray-400)", fontSize: 13 }}>—</span>
          );
        const isSelf =
          u.user_id === currentUser?.user_id ||
          u.user_id === (currentUser as any)?.id;
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
                onClick={() => handleBlock(u)}
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
            label={t("login.password")}
            type="password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            placeholder={editingUser ? "(залиш порожнім щоб не змінювати)" : ""}
            required={!editingUser}
          />
          <FormField
            label={t("common.role")}
            value={form.role}
            onChange={(v) => setForm((f) => ({ ...f, role: v }))}
            options={roleOptions}
          />
          <FormField
            label={i18n.language === "uk" ? "Склад" : "Warehouse"}
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
    </div>
  );
}
