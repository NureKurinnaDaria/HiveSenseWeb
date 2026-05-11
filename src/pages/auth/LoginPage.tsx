import { useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { login as apiLogin } from "../../api/auth";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fff7ed 100%)",
  position: "relative",
  overflow: "hidden",
};

const cardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: "48px 40px",
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12)",
  position: "relative",
  zIndex: 1,
};

const logoWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 32,
  justifyContent: "center",
};

const logoIconStyle: CSSProperties = {
  fontSize: 36,
};

const logoTextStyle: CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontSize: 28,
  fontWeight: 800,
  color: "#b45309",
  letterSpacing: -0.5,
};

const titleStyle: CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontSize: 20,
  fontWeight: 600,
  color: "#1f2937",
  marginBottom: 28,
  textAlign: "center",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1.5px solid #e5e7eb",
  fontSize: 14,
  color: "#111827",
  background: "#f9fafb",
};

const errorStyle: CSSProperties = {
  background: "#fee2e2",
  color: "#dc2626",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  textAlign: "center",
};

const buttonStyle: CSSProperties = {
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "#fff",
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  fontSize: 15,
  padding: 14,
  borderRadius: 10,
  marginTop: 4,
  border: "none",
  cursor: "pointer",
};

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  opacity: 0.7,
  cursor: "not-allowed",
};

const langButtonStyle: CSSProperties = {
  marginTop: 24,
  width: "100%",
  background: "transparent",
  border: "1.5px solid #e5e7eb",
  borderRadius: 8,
  padding: 10,
  fontSize: 13,
  color: "#6b7280",
  cursor: "pointer",
};

const bgCircle1Style: CSSProperties = {
  position: "absolute",
  width: 400,
  height: 400,
  borderRadius: "50%",
  background: "rgba(251, 191, 36, 0.15)",
  top: -100,
  right: -100,
};

const bgCircle2Style: CSSProperties = {
  position: "absolute",
  width: 300,
  height: 300,
  borderRadius: "50%",
  background: "rgba(217, 119, 6, 0.1)",
  bottom: -80,
  left: -80,
};

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin(email, password);
      login(data.access_token, data.user);

      if (data.user.role === "ADMIN") navigate("/admin");
      else if (data.user.role === "OWNER") navigate("/owner");
      else setError(t("login.error"));
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const next = i18n.language === "uk" ? "en" : "uk";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoWrapStyle}>
          <span style={logoIconStyle}>🍯</span>
          <h1 style={logoTextStyle}>HiveSense</h1>
        </div>

        <h2 style={titleStyle}>{t("login.title")}</h2>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t("login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="admin@hivesense.com"
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t("login.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {error && <div style={errorStyle}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={loading ? disabledButtonStyle : buttonStyle}
          >
            {loading ? t("common.loading") : t("login.submit")}
          </button>
        </form>

        <button onClick={toggleLang} style={langButtonStyle}>
          {i18n.language === "uk" ? "🇺🇦 Українська" : "🇬🇧 English"}
        </button>
      </div>

      <div style={bgCircle1Style} />
      <div style={bgCircle2Style} />
    </div>
  );
}
