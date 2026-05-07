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
import styles from "./UsersPage.module.css";

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

export default function UsersPage() {
  const { t } = useTranslation();

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
      role: user.role,
      warehouse_id: user.warehouse_id ? String(user.warehouse_id) : "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        email: form.email,
        full_name: form.full_name,
        role: form.role as "EMPLOYEE" | "ADMIN" | "OWNER",
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editingUser) {
        await updateUser(editingUser.user_id, payload);
      } else {
        await createUser({ ...payload, password: form.password });
      }

      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async (user: User) => {
    if (user.is_active) {
      await blockUser(user.user_id);
    } else {
      await unblockUser(user.user_id);
    }
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
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const roleBadge = (role: string) => {
    const cls =
      role === "ADMIN"
        ? styles.badgeAdmin
        : role === "OWNER"
          ? styles.badgeOwner
          : styles.badgeEmployee;
    return (
      <span className={`${styles.badge} ${cls}`}>{t(`roles.${role}`)}</span>
    );
  };

  const statusBadge = (isActive: boolean) => (
    <span
      className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeBlocked}`}
    >
      {isActive ? t("common.active") : t("common.blocked")}
    </span>
  );

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
    { key: "full_name", label: t("common.name") },
    { key: "email", label: t("common.email") },
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
      label: "Склад",
      render: (u: User) => u.warehouse?.name ?? "—",
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (u: User) => (
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={() => openEdit(u)}
            title={t("common.edit")}
          >
            ✏️
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => handleBlock(u)}
            title={u.is_active ? t("common.block") : t("common.unblock")}
          >
            {u.is_active ? "🔒" : "🔓"}
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => setConfirmDelete(u)}
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
        rowKey={(u) => u.user_id}
      />

      {/* Модалка створення / редагування */}
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
            label={t("common.name")}
            value={form.full_name}
            onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
            required
          />
          <FormField
            label={t("common.email")}
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
            label="Склад"
            value={form.warehouse_id}
            onChange={(v) => setForm((f) => ({ ...f, warehouse_id: v }))}
            options={warehouseOptions}
          />
        </Modal>
      )}

      {/* Модалка підтвердження видалення */}
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
            <strong>{confirmDelete.full_name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
