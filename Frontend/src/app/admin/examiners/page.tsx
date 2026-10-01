"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Plus, UsersRound } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TopNavigation from "@/components/examiner/TopNavigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./ExaminerAccounts.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

interface ExaminerAccount {
  id: string;
  fullName: string;
  email: string;
  status: string;
  department: string | null;
  createdAt: string;
}

function ExaminerAccountsContent() {
  const { accessToken } = useAuth();
  const isDemoSession = accessToken?.startsWith("demo-token-") ?? false;
  const [accounts, setAccounts] = useState<ExaminerAccount[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    if (isDemoSession) {
      setError("Demo sessions cannot create permanent accounts. Start the backend and sign in with the database admin account.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();

    async function loadAccounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/examiner-accounts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || "Examiner accounts could not be loaded.");
        }
        setAccounts(payload.data);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof TypeError
          ? "Authentication server is unavailable. Start the backend and sign in with an admin account."
          : caught instanceof Error ? caught.message : "Examiner accounts could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAccounts();
    return () => controller.abort();
  }, [accessToken, isDemoSession]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!accessToken) {
      setError("Please sign in again as an admin.");
      return;
    }
    if (isDemoSession) {
      setError("Sign in with the database admin account to create an examiner login.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/examiner-accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fullName, email, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "Account could not be created.");
      }

      const created = payload.data as ExaminerAccount;
      setAccounts((current) => [created, ...current]);
      setSuccess(`${created.fullName} can now sign in using ${created.email} and the password you set.`);
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(caught instanceof TypeError
        ? "Authentication server is unavailable. Start the backend and try again."
        : caught instanceof Error ? caught.message : "Account could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`workspace-shell ${styles.page}`}>
      <TopNavigation activeTab="admin-examiners" />
      <main className={styles.main}>
        <header className={styles.intro}>
          <span className={styles.eyebrow}>Administration / Access</span>
          <h1>Examiner accounts</h1>
          <p>Create a login for each examiner. They will use this email and password on the portal login page.</p>
        </header>

        <div className={styles.layout}>
          <section className={styles.card} aria-labelledby="create-account-heading">
            <div className={styles.cardHeading}>
              <span className={styles.icon}><Plus size={21} aria-hidden="true" /></span>
              <div><h2 id="create-account-heading">Create examiner login</h2><p>Only admins can create accounts.</p></div>
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {success && <p className={styles.success} role="status">{success}</p>}

            <form onSubmit={handleCreate} className={styles.form}>
              <label>Examiner name
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} maxLength={120} autoComplete="name" placeholder="Full name" />
              </label>
              <label>Login ID (email)
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="off" placeholder="examiner@institution.edu" />
              </label>
              <label>Password
                <span className={styles.passwordField}>
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" placeholder="At least 12 characters" />
                  <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
              <label>Confirm password
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={128} autoComplete="new-password" placeholder="Repeat password" />
              </label>
              <p className={styles.hint}>The password is stored as a secure hash. Share it with the examiner through your institution&apos;s approved channel.</p>
              <button className={styles.submit} type="submit" disabled={submitting || isDemoSession}>{submitting ? "Creating account..." : "Create examiner account"}</button>
            </form>
          </section>

          <section className={styles.card} aria-labelledby="accounts-heading">
            <div className={styles.cardHeading}>
              <span className={styles.icon}><UsersRound size={21} aria-hidden="true" /></span>
              <div><h2 id="accounts-heading">Examiner directory</h2><p>Accounts available for portal sign in.</p></div>
              <span className={styles.count}>{accounts.length}</span>
            </div>
            {loading ? <p className={styles.empty}>Loading examiner accounts...</p> : accounts.length === 0 ? <p className={styles.empty}>No examiner accounts found.</p> : (
              <ul className={styles.list}>
                {accounts.map((account) => (
                  <li key={account.id}>
                    <span className={styles.avatar}>{account.fullName.trim().charAt(0).toUpperCase()}</span>
                    <span className={styles.person}><strong>{account.fullName}</strong><small>{account.email}</small></span>
                    <span className={styles.status}>{account.status === "ACTIVE" ? "Active" : account.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ExaminerAccountsPage() {
  return <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}><ExaminerAccountsContent /></ProtectedRoute>;
}
