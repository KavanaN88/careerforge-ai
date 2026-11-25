function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-fade pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0) 65%)" }} />
      <div className="relative w-full max-w-md fade-up">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center">
            <Icon name="target" size={18} className="text-white" />
          </div>
          <span className="font-display font-semibold text-xl tracking-tight">SkillPilot <span className="text-gradient">AI</span></span>
        </div>
        <Card className="p-7 md:p-8" glow>{children}</Card>
      </div>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-bad mt-1.5 flex items-center gap-1"><Icon name="alert-triangle" size={11} />{msg}</p>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login({ onLogin, onGoSignup, onBackHome }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [forgotMsg, setForgotMsg] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "That doesn't look like a valid email.";
    if (!password) e.password = "Enter your password.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const err = await onLogin({ email: email.trim(), password });
    setSubmitting(false);
    if (err) setErrors({ form: err });
  };

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold mb-1.5">Welcome back</h1>
      <p className="text-mute text-sm mb-6">Log in to pick up where your Career Digital Twin left off.</p>

      <form onSubmit={submit} noValidate>
        <Field label="Email">
          <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <FieldError msg={errors.email} />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input type={showPassword ? "text" : "password"} className={inputCls + " pr-11"} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink">
              <Icon name={showPassword ? "eye-off" : "eye"} size={15} />
            </button>
          </div>
          <FieldError msg={errors.password} />
        </Field>

        <div className="flex items-center justify-between mb-6 -mt-1">
          <label className="flex items-center gap-2 text-xs text-mute cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="accent-indigo w-3.5 h-3.5" />
            Remember me
          </label>
          <button type="button" onClick={() => setForgotMsg(true)} className="text-xs text-cyan hover:underline">Forgot password?</button>
        </div>
        {forgotMsg && (
          <div className="text-xs text-mute glass rounded-lg p-3 mb-5">{API.available ? "Password reset by email isn't set up yet — contact the site admin to reset your password." : "Password reset isn't wired up in this demo build — just log in with any email/password to continue."}</div>
        )}

        <FieldError msg={errors.form} />
        <Button type="submit" className="w-full mb-3 mt-2" size="lg" disabled={submitting}>
          {submitting ? <><Spinner size={15} /> Logging in…</> : "Log In"}
        </Button>
        <Button type="button" variant="secondary" className="w-full mb-6" size="lg" onClick={() => setErrors(e => ({ ...e, google: "Google sign-in isn't connected in this demo." }))}>
          Continue with Google
        </Button>
        <FieldError msg={errors.google} />
      </form>

      <p className="text-center text-sm text-mute">Don't have an account? <button onClick={onGoSignup} className="text-cyan hover:underline">Create one</button></p>
      <button onClick={onBackHome} className="w-full text-center text-xs text-mute hover:text-ink mt-6">← Back to home</button>
      <p className="text-center text-[11px] text-mute/70 mt-4">{API.available ? "Your account is stored securely in the SkillPilot database." : "Demo authentication — no real account is created or verified."}</p>
    </AuthShell>
  );
}

function Signup({ onSignup, onGoLogin, onBackHome }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Enter your full name.";
    if (!email.trim()) e.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "That doesn't look like a valid email.";
    if (!password) e.password = "Choose a password.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    if (confirm !== password || !confirm) e.confirm = "Passwords don't match.";
    if (!agree) e.agree = "You need to accept the Terms & Privacy Policy to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const err = await onSignup({ name: name.trim(), email: email.trim(), password });
    setSubmitting(false);
    if (err) setErrors({ form: err });
  };

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold mb-1.5">Create your account</h1>
      <p className="text-mute text-sm mb-6">Start building an evidence-based Career Digital Twin.</p>

      <form onSubmit={submit} noValidate>
        <Field label="Full name">
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chetan Kumar" autoComplete="name" />
          <FieldError msg={errors.name} />
        </Field>
        <Field label="Email">
          <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          <FieldError msg={errors.email} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Password">
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            <FieldError msg={errors.password} />
          </Field>
          <Field label="Confirm password">
            <input type="password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            <FieldError msg={errors.confirm} />
          </Field>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-mute mb-6 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="accent-indigo w-3.5 h-3.5 mt-0.5" />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        <FieldError msg={errors.agree} />
        <FieldError msg={errors.form} />

        <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
          {submitting ? <><Spinner size={15} /> Creating account…</> : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-mute mt-6">Already have an account? <button onClick={onGoLogin} className="text-cyan hover:underline">Log in</button></p>
      <button onClick={onBackHome} className="w-full text-center text-xs text-mute hover:text-ink mt-6">← Back to home</button>
      <p className="text-center text-[11px] text-mute/70 mt-4">{API.available ? "Your account is stored securely in the SkillPilot database." : "Demo authentication — no real account is created or verified."}</p>
    </AuthShell>
  );
}
