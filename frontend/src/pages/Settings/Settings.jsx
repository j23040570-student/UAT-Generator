import { useEffect, useRef, useState } from "react";
import { getAccountProfile, changeName, changeEmail, changePassword } from "../../utils/demoAuth.js";
import "./Settings.css";

function SettingsIcon({ name, size = 26 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "user" && <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2z"/></>}
    {name === "mail" && <><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/></>}
    {name === "lock" && <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/></>}
    {name === "logout" && <><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M9 12h13m-5-5 5 5-5 5"/></>}
    {name === "chevron" && <path d="m9 6 6 6-6 6"/>}
    {name === "close" && <path d="m6 6 12 12M18 6 6 18"/>}
  </svg>;
}

function SettingsArt() {
  return <svg className="st-art" viewBox="0 0 290 130" aria-hidden="true">
    <ellipse cx="155" cy="113" rx="125" ry="15" fill="#ddd5fb"/>
    <circle cx="190" cy="57" r="44" fill="#ded6fb"/>
    <circle cx="69" cy="102" r="35" fill="#e1d9fb"/>
    <g stroke="#8b70ff" strokeWidth="3" strokeLinecap="round"><path d="m83 28-7-10M69 38l-11-3M99 24V12"/></g>
    <path d="M88 47h95l-10 64H77z" fill="#6345e8" stroke="#5534db" strokeWidth="3" strokeLinejoin="round"/>
    <path d="M93 53h82l-8 51H85z" fill="#fff"/>
    <g transform="translate(130 78)"><path d="M-4-17h8l2 5 5 2 5-2 4 7-4 4v5l4 4-4 7-5-2-5 2-2 5h-8l-2-5-5-2-5 2-4-7 4-4v-5l-4-4 4-7 5 2 5-2z" fill="#8060fa"/><circle r="7" fill="#fff"/></g>
    <rect x="63" y="109" width="125" height="7" rx="3.5" fill="#5534db"/>
    <g transform="translate(184 11)">
      <path d="M40 9v15" stroke="#6b4bea" strokeWidth="4"/><circle cx="40" cy="7" r="5" fill="#7854fa"/>
      <rect x="18" y="61" width="44" height="40" rx="17" fill="#fff" stroke="#d5ccf8" strokeWidth="2"/>
      <path d="M22 99l-5 13h16l3-12M48 100l3 12h16l-5-13" fill="#6b4bea"/>
      <path d="M18 69 4 58M63 69l13 20" stroke="#fff" strokeWidth="11" strokeLinecap="round"/>
      <circle cx="4" cy="58" r="6" fill="#34208d"/><circle cx="76" cy="89" r="6" fill="#34208d"/>
      <rect x="5" y="32" width="12" height="23" rx="6" fill="#8764fa"/><rect x="63" y="32" width="12" height="23" rx="6" fill="#8764fa"/>
      <rect x="10" y="20" width="60" height="46" rx="19" fill="#fff" stroke="#d5ccf8" strokeWidth="2"/>
      <rect x="18" y="28" width="44" height="29" rx="12" fill="#30207e"/><circle cx="31" cy="42" r="4" fill="#e5dfff"/><circle cx="49" cy="42" r="4" fill="#e5dfff"/>
    </g>
  </svg>;
}

const options = [
  { id: "name", title: "Change Name", description: "Update your display name.", icon: "user" },
  { id: "email", title: "Change Email", description: "Update your email address.", icon: "mail" },
  { id: "password", title: "Change Password", description: "Update your account password.", icon: "lock" }
];

function SettingsDialog({ mode, profile, onClose, onSaved, onLogout }) {
  const dialog = useRef(null);
  const [name, setName] = useState(profile.displayName);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = mode === "logout" ? "Log Out" : options.find(item => item.id === mode).title;
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    if (!element.open) element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "logout") { onLogout(); return; }
      if (mode === "name") {
        onSaved(changeName(name), "Display name updated successfully.");
      } else if (mode === "email") {
        onSaved(await changeEmail(email, currentPassword), "Email updated successfully.");
      } else {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        await changePassword(currentPassword, password);
        onSaved(getAccountProfile(), "Password updated successfully.");
      }
    } catch (err) {
      setError(err.message || "Unable to update your account.");
      setBusy(false);
    }
  }
  return <dialog ref={dialog} className="st-dialog" aria-labelledby="st-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <form className="st-dialog-content" onSubmit={submit}>
      <div className="st-dialog-heading"><h2 id="st-dialog-title">{title}</h2><button type="button" className="st-close" aria-label="Close" disabled={busy} onClick={onClose}><SettingsIcon name="close" size={20}/></button></div>
      {mode === "name" && <label>Display Name<input value={name} onChange={event => setName(event.target.value)} maxLength={60} autoComplete="name" required autoFocus/></label>}
      {mode === "email" && <><p className="st-current-email">Current email: {profile.email}</p><label>New Email Address<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="Enter new email" required autoFocus/></label></>}
      {(mode === "email" || mode === "password") && <label>Current Password<input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} placeholder="Enter current password" required/></label>}
      {mode === "password" && <><label>New Password<input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} placeholder="Enter new password" required/><small>Use 8+ characters with letters and numbers.</small></label><label>Confirm New Password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm new password" required/></label></>}
      {mode === "logout" && <p>Are you sure you want to log out?</p>}
      {error && <p className="st-error" role="alert">{error}</p>}
      <div className="st-dialog-actions"><button type="button" className="st-cancel" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className={mode === "logout" ? "st-confirm st-danger" : "st-confirm"} disabled={busy}>{busy ? "Please wait..." : mode === "logout" ? "Log Out" : "Save Changes"}</button></div>
    </form>
  </dialog>;
}

export default function Settings({ user, onAccountUpdated, onLogout }) {
  const [mode, setMode] = useState(null);
  const [message, setMessage] = useState("");
  const profile = getAccountProfile(user);
  function open(mode) { setMessage(""); setMode(mode); }
  function saved(updatedProfile, notice) {
    onAccountUpdated(updatedProfile);
    setMode(null);
    setMessage(notice);
  }
  if (!profile) return <section className="st-page"><h1 className="page-heading">Settings</h1><p>Your session is no longer available. Please log in again.</p><button className="st-confirm" onClick={onLogout}>Log Out</button></section>;
  return <section className="st-page">
    <h1 className="page-heading">Settings</h1>
    <div className="st-banner"><div><h2>Account Settings</h2><p>Manage your account information and security.</p></div><SettingsArt/></div>
    {message && <p className="st-success" role="status">{message}</p>}
    <div className="st-options">
      {options.map(item => <button type="button" className="st-option" key={item.id} onClick={() => open(item.id)}><span className="st-icon"><SettingsIcon name={item.icon}/></span><span className="st-copy"><strong>{item.title}</strong><small>{item.description}</small></span><SettingsIcon name="chevron" size={23}/></button>)}
    </div>
    <button type="button" className="st-logout" onClick={() => open("logout")}><SettingsIcon name="logout"/> <strong>Log Out</strong></button>
    {mode && <SettingsDialog key={mode} mode={mode} profile={profile} onClose={() => setMode(null)} onSaved={saved} onLogout={onLogout}/>}
  </section>;
}
