import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { login as apiLogin } from "../../api/auth";
import styles from "./LoginPage.module.css";

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
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon}>🍯</span>
          <h1 className={styles.logoText}>HiveSense</h1>
        </div>

        <h2 className={styles.title}>{t("login.title")}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t("login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="admin@hivesense.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t("login.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? t("common.loading") : t("login.submit")}
          </button>
        </form>

        <button onClick={toggleLang} className={styles.langBtn}>
          {i18n.language === "uk" ? "🇺🇦 Українська" : "🇬🇧 English"}
        </button>
      </div>

      <div className={styles.bgCircle1} />
      <div className={styles.bgCircle2} />
    </div>
  );
}
