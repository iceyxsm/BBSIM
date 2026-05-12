import { useEffect, useRef, useState } from 'react';
import { User, Lock, ArrowRight, Mail, Info, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import '../styles/login.css';

// --- WebGL smokey background shader -----------------------------------------

const vertexSmokeySource = `
attribute vec4 a_position;
void main() { gl_Position = a_position; }
`;

const fragmentSmokeySource = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
  float time = iTime * 0.5;
  vec2 mouse = iMouse / iResolution;
  vec2 rippleCenter = 2.0 * mouse - 1.0;
  vec2 distortion = centeredUV;
  for (float i = 1.0; i < 8.0; i++) {
    distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
    distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
  }
  float wave = abs(sin(distortion.x + distortion.y + time));
  float glow = smoothstep(0.9, 0.2, wave);
  fragColor = vec4(u_color * glow, 1.0);
}

void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
`;

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  return [r, g, b];
}

function SmokeyBackground({ color = '#1E40AF' }: { color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mouseX: 0, mouseY: 0, hovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, vertexSmokeySource);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSmokeySource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'iResolution');
    const uTime = gl.getUniformLocation(program, 'iTime');
    const uMouse = gl.getUniformLocation(program, 'iMouse');
    const uColor = gl.getUniformLocation(program, 'u_color');

    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColor, r, g, b);

    const start = Date.now();
    let rafId = 0;

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      const t = (Date.now() - start) / 1000;
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, t);
      const { mouseX, mouseY, hovering } = stateRef.current;
      gl.uniform2f(uMouse, hovering ? mouseX : w / 2, hovering ? h - mouseY : h / 2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = e.clientX - rect.left;
      stateRef.current.mouseY = e.clientY - rect.top;
    };
    const onEnter = () => (stateRef.current.hovering = true);
    const onLeave = () => (stateRef.current.hovering = false);

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseenter', onEnter);
    canvas.addEventListener('mouseleave', onLeave);
    render();

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseenter', onEnter);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [color]);

  return (
    <div className="smokey-bg">
      <canvas ref={canvasRef} />
      <div className="smokey-blur" />
    </div>
  );
}

// --- Login / Sign Up form ----------------------------------------------------

interface Props {
  onLogin: (token: string, user: any, remember: boolean) => void;
}

type Mode = 'login' | 'signup';

const REMEMBERED_EMAIL_KEY = 'qalgo_remembered_email';

export function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(
    () => !!localStorage.getItem(REMEMBERED_EMAIL_KEY)
  );
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setError('');
    setShowForgot(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.post('/api/auth/login', { email, password });
        if (res.success) {
          if (res.data.trader.role !== 'firm') {
            setError('Firm access only');
            setLoading(false);
            return;
          }
          if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
          else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          onLogin(res.data.token, res.data.trader, remember);
        } else {
          setError(res.error || 'Invalid credentials');
        }
      } else {
        const res = await api.post('/api/auth/register-self', {
          name,
          email,
          password,
          role: 'firm',
        });
        if (res.success) {
          if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
          else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
          onLogin(res.data.token, res.data.trader, remember);
        } else {
          setError(res.error || 'Sign up failed');
        }
      }
    } catch {
      setError('Server unavailable');
    }

    setLoading(false);
  };

  const isSignup = mode === 'signup';

  return (
    <main className="login-page">
      <SmokeyBackground color="#1E40AF" />

      <div className="login-content">
        <div className="glass-card">
          <div className="auth-header">
            <h1 className="logo-text">QALGO</h1>
            <p className="welcome-text">Trading Platform</p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              className={`auth-tab ${!isSignup ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              className={`auth-tab ${isSignup ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
            <div className={`tab-indicator ${isSignup ? 'right' : 'left'}`} />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="floating-field">
                <input
                  type="text"
                  id="signup-name"
                  className="floating-input"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <label htmlFor="signup-name" className="floating-label">
                  <User size={14} />
                  <span>Full Name</span>
                </label>
              </div>
            )}

            <div className="floating-field">
              <input
                type="email"
                id="auth-email"
                className="floating-input"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label htmlFor="auth-email" className="floating-label">
                <Mail size={14} />
                <span>Email Address</span>
              </label>
            </div>

            <div className="floating-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="auth-password"
                className="floating-input has-toggle"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 6 : undefined}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <label htmlFor="auth-password" className="floating-label">
                <Lock size={14} />
                <span>Password</span>
              </label>
              <button
                type="button"
                className="password-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {!isSignup && (
              <div className="auth-row">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="checkbox-box" aria-hidden>
                    <svg viewBox="0 0 12 12" width="10" height="10">
                      <path
                        d="M2 6.5L5 9.5L10 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setShowForgot((v) => !v)}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {!isSignup && showForgot && (
              <div className="forgot-panel" role="status">
                <Info size={14} />
                <p>
                  Contact your system administrator to reset your password.
                  Firm admin recovery is not available through this portal.
                </p>
              </div>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="signin-btn" disabled={loading}>
              <span>
                {loading
                  ? isSignup
                    ? 'Creating account'
                    : 'Authenticating'
                  : isSignup
                    ? 'Create Account'
                    : 'Sign In'}
              </span>
              <ArrowRight size={18} className="signin-arrow" />
            </button>
          </form>

          <p className="auth-footnote">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button type="button" className="switch-mode" onClick={() => switchMode('login')}>
                  Log in
                </button>
              </>
            ) : (
              <>
                New firm admin?{' '}
                <button type="button" className="switch-mode" onClick={() => switchMode('signup')}>
                  Create account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
