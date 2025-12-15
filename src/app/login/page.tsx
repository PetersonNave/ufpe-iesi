"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import styles from "./login.module.scss";
import { api } from "@/services/api";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ login: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/login", {
        login: formData.login,
        senha: formData.senha,
      });

      const data = response.data;

      const { access_token, user } = data;
      const userName = user?.name;

      Cookies.set("auth_token", access_token, { expires: 1 });

      if (userName) {
        localStorage.setItem("user_name", userName);
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Falha ao realizar login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bem-vindo</h1>
          <p className={styles.subtitle}>Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="login">Login</label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Digite seu login"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Entrando..." : "Acessar Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
