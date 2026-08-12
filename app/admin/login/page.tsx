import { LockKeyhole, ShieldCheck } from "lucide-react";
import { loginAdmin } from "./actions";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <main className="admin-login-shell">
      <section className="admin-login-panel">
        <div className="admin-login-copy">
          <span className="eyebrow">RedTours Admin</span>
          <h1>Работна среда за оферти и съдържание</h1>
          <p>
            Входът е ограничен до упълномощени служители. Публикуването на оферти, импортите и редакционният контрол
            остават отделени от публичния сайт.
          </p>
          <div className="admin-login-assurance">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Защитена административна сесия</span>
          </div>
        </div>

        <form className="admin-login-form" action={loginAdmin}>
          <input type="hidden" name="next" value={params.next || "/admin/offers"} />
          <div className="admin-login-lock" aria-hidden="true">
            <LockKeyhole size={22} />
          </div>
          <div>
            <span className="eyebrow">Вход</span>
            <h2>Администрация</h2>
          </div>
          {hasError ? <p className="admin-login-error">Невалидно потребителско име или парола.</p> : null}
          <label>
            <span>Потребител</span>
            <input name="user" autoComplete="username" required />
          </label>
          <label>
            <span>Парола</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button type="submit">Влез в админ панела</button>
        </form>
      </section>
    </main>
  );
}
