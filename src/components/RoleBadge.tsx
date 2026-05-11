import type { User } from "../types";

interface RoleBadgeProps {
  role: User["role"];
  label: string;
}

const roleVariants: Record<
  User["role"],
  { background: string; color: string }
> = {
  ADMIN: {
    background: "var(--amber-100)",
    color: "var(--amber-700)",
  },
  OWNER: {
    background: "var(--blue-100)",
    color: "var(--blue-600)",
  },
  EMPLOYEE: {
    background: "var(--gray-100)",
    color: "var(--gray-600)",
  },
};

export default function RoleBadge({ role, label }: RoleBadgeProps) {
  const selected = roleVariants[role];

  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        background: selected.background,
        color: selected.color,
      }}
    >
      {label}
    </span>
  );
}
