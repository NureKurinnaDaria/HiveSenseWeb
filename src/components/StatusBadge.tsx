type StatusBadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  uppercase?: boolean;
}

const colors: Record<
  StatusBadgeVariant,
  { background: string; color: string }
> = {
  success: {
    background: "var(--green-100)",
    color: "var(--green-600)",
  },
  danger: {
    background: "var(--red-100)",
    color: "var(--red-600)",
  },
  warning: {
    background: "var(--amber-100)",
    color: "var(--amber-700)",
  },
  info: {
    background: "var(--blue-100)",
    color: "var(--blue-600)",
  },
  neutral: {
    background: "var(--gray-100)",
    color: "var(--gray-600)",
  },
};

export default function StatusBadge({
  label,
  variant = "neutral",
  uppercase = false,
}: StatusBadgeProps) {
  const selected = colors[variant];

  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        textTransform: uppercase ? "uppercase" : "none",
        background: selected.background,
        color: selected.color,
      }}
    >
      {label}
    </span>
  );
}
