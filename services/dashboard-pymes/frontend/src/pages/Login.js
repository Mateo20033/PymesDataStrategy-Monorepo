import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/authService';
import LogoUCompensar from '../components/LogoUCompensar';

const Login = () => {
  const [tab, setTab]       = useState('login');   // 'login' | 'register'
  const [form, setForm]     = useState({ nombre: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (tab === 'login') {
        res = await loginUser({ email: form.email, password: form.password });
      } else {
        if (!form.nombre.trim()) {
          setError('El nombre es obligatorio');
          setLoading(false);
          return;
        }
        res = await registerUser({ nombre: form.nombre, email: form.email, password: form.password });
      }

      const { user, token } = res.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Panel izquierdo — branding */}
      <div className="login-branding">
        <div className="login-branding__inner">
          <div className="login-branding__logo">
            <LogoUCompensar size={30} color="#fff" />
          </div>
          <h1 className="login-branding__title">PYMES-AI</h1>
          <p className="login-branding__subtitle">
            Analiza tus datos empresariales con inteligencia artificial.
            Carga tus archivos CSV y consulta tu asistente inteligente.
          </p>
          <ul className="login-branding__features">
            <li>✦ Visualización interactiva de datos</li>
            <li>✦ Carga masiva de CSV</li>
            <li>✦ Agente IA con lenguaje natural</li>
          </ul>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <h2 className="login-form-card__title">
            {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === 'login' ? 'login-tab--active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
              type="button"
            >
              Iniciar sesión
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}
              type="button"
            >
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="form" noValidate>
            {tab === 'register' && (
              <div className="form__group">
                <label className="form__label" htmlFor="nombre">Nombre completo</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  className="form__input"
                  placeholder="María García"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form__group">
              <label className="form__label" htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form__input"
                placeholder="correo@empresa.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form__group">
              <label className="form__label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form__input"
                placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <p className="form__error">{error}</p>}

            <button className="btn btn--primary btn--full" type="submit" disabled={loading}>
              {loading ? 'Procesando…' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
