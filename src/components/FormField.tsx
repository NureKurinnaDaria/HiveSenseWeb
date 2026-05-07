import styles from "./FormField.module.css";

interface Option {
  value: string | number;
  label: string;
}

interface FormFieldProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  options?: Option[];
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  options,
  error,
  placeholder,
  required,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && " *"}
      </label>
      {options ? (
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={styles.input}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
