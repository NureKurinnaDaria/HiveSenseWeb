import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { User, Warehouse } from "../../types";
import {
  blockUser,
  createUser,
  deleteUser,
  getAllUsers,
  unblockUser,
  updateUser,
} from "../../api/users";
import { getAllWarehouses } from "../../api/warehouses";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import IconButton from "../../components/IconButton";
import RoleBadge from "../../components/RoleBadge";
import StatusBadge from "../../components/StatusBadge";
import { Toast, useToast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

interface UserForm {
  email: string;
  password: string;
  full_name: string;
  role: string;
  warehouse_id: string;
}

interface UsersPageBaseProps {
  showIdColumn?: boolean;
  hideOwnerActions?: boolean;
  useRelationWarehouseName?: boolean;
  readOnlySearchWhenModal?: boolean;
  blurOnCreate?: boolean;
}

const emptyForm: UserForm = {
  email: "",
  password: "",
  full_name: "",
  role: "EMPLOYEE",
  warehouse_id: "",
};

export default function UsersPageBase({
  showIdColumn = false,
  hideOwnerActions = false,
  useRelationWarehouseName = false,
  readOnlySearchWhenModal = false,
  blurOnCreate = false,
}: UsersPageBaseProps) {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [loadedUsers, loadedWarehouses] = await Promise.all([
        getAllUsers(),
        getAllWarehouses(),
      ]);

      setUsers(loadedUsers);
      setWarehouses(loadedWarehouses);
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
    setEditingUser(null);
    setForm(emptyForm);
    setShowModal(true);

    if (blurOnCreate) {
      (document.activeElement as HTMLElement | null)?.blur();
    }
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
        name: form.full_name,
        role: form.role,
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

  const getWarehouseName = (user: User) => {
    if (useRelationWarehouseName) {
      return user.warehouse?.name ?? "—";
    }

    return user.warehouse_id
      ? (warehouses.find((w) => w.warehouse_id === user.warehouse_id)?.name ??
          "—")
      : "—";
  };

  const filtered = users.filter(
    (user) =>
      (user.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const warehouseOptions = [
    { value: "", label: "—" },
    ...warehouses.map((warehouse) => ({
      value: warehouse.warehouse_id,
      label: warehouse.name,
    })),
  ];

  const roleOptions = [
    { value: "EMPLOYEE", label: t("roles.EMPLOYEE") },
    { value: "ADMIN", label: t("roles.ADMIN") },
    { value: "OWNER", label: t("roles.OWNER") },
  ];

  const columns = [
    ...(showIdColumn ? [{ key: "user_id", label: "ID" }] : []),
    { key: "full_name", label: i18n.language === "uk" ? "Ім'я" : "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: t("common.role"),
      render: (user: User) => (
        <RoleBadge role={user.role} label={t(`roles.${user.role}`)} />
      ),
    },
    {
      key: "warehouse",
      label: t("common.warehouse"),
      render: (user: User) => getWarehouseName(user),
    },
    {
      key: "is_active",
      label: t("common.status"),
      render: (user: User) => (
        <StatusBadge
          label={user.is_active ? t("common.active") : t("common.blocked")}
          variant={user.is_active ? "success" : "danger"}
          uppercase
        />
      ),
    },
    {
      key: "actions",
      label: t("common.actions"),
      render: (user: User) => {
        if (hideOwnerActions && user.role === "OWNER") {
          return (
            <span style={{ color: "var(--gray-400)", fontSize: 13 }}>—</span>
          );
        }

        const isSelf =
          user.user_id === currentUser?.user_id ||
          user.user_id === currentUser?.id;

        return (
          <div style={{ display: "flex", gap: 6 }}>
            <IconButton onClick={() => openEdit(user)} title={t("common.edit")}>
              ✏️
            </IconButton>

            {!isSelf && (
              <IconButton
                onClick={() => handleToggleBlock(user)}
                title={user.is_active ? t("common.block") : t("common.unblock")}
              >
                {user.is_active ? "🔒" : "🔓"}
              </IconButton>
            )}

            {!isSelf && (
              <IconButton
                onClick={() => setConfirmDelete(user)}
                title={t("common.delete")}
              >
                🗑️
              </IconButton>
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
          readOnly={readOnlySearchWhenModal && showModal}
        />

        <Button icon="+" onClick={openCreate}>
          {t("common.create")}
        </Button>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(user) => user.user_id}
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
            onChange={(value) =>
              setForm((current) => ({ ...current, full_name: value }))
            }
            required
          />

          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) =>
              setForm((current) => ({ ...current, email: value }))
            }
            required
          />

          <FormField
            label={t("common.password")}
            type="password"
            value={form.password}
            onChange={(value) =>
              setForm((current) => ({ ...current, password: value }))
            }
            placeholder={editingUser ? t("common.leave_blank") : ""}
            required={!editingUser}
          />

          <FormField
            label={t("common.role")}
            value={form.role}
            onChange={(value) =>
              setForm((current) => ({ ...current, role: value }))
            }
            options={roleOptions}
          />

          <FormField
            label={t("common.warehouse")}
            value={form.warehouse_id}
            onChange={(value) =>
              setForm((current) => ({ ...current, warehouse_id: value }))
            }
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
