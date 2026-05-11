import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function IconButton({
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      {...props}
      style={{
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
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}
