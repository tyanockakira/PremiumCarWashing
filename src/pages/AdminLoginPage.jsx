import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminContext, signOutAdmin } from '../lib/adminAuth';
import './AdminPage.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminContext().then(({ profile }) => {
      if (active && profile) navigate('/admin', { replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    const context = await getAdminContext();
    if (!context.supabase) {
      setError('Адміністративний вхід тимчасово недоступний.');
      setSending(false);
      return;
    }
    const { error: signInError } = await context.supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassword('');
    if (signInError) {
      setError('Не вдалося увійти. Перевірте дані та спробуйте ще раз.');
      setSending(false);
      return;
    }
    const { profile } = await getAdminContext();
    if (!profile) {
      await signOutAdmin();
      setError('Доступ дозволено лише активним адміністраторам.');
      setSending(false);
      return;
    }
    navigate('/admin', { replace: true });
    setSending(false);
  }

  return (
    <section className="admin-page admin-login" aria-labelledby="admin-login-title">
      <div className="admin-card admin-login__card">
        <p className="cinema-label">Адміністративна зона</p>
        <h1 className="cinema-heading" id="admin-login-title">Вхід для команди</h1>
        <p className="admin-muted">Увійдіть через Supabase Auth. Публічна реєстрація вимкнена.</p>
        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <label>
            Електронна пошта
            <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={sending} />
          </label>
          <label>
            Пароль
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={sending} />
          </label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="btn-platinum cinema-button" type="submit" disabled={sending}>
            {sending ? 'Перевіряємо…' : 'Увійти'}
          </button>
        </form>
      </div>
    </section>
  );
}
