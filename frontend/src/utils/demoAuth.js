const ACCOUNTS_KEY = "uatgen_accounts";
const SESSION_KEY = "uatgen_current_user";

/* Load Accounts */

function loadAccounts() {
  const saved = localStorage.getItem(ACCOUNTS_KEY);
  const accounts = saved ? JSON.parse(saved) : [];

  if (!Array.isArray(accounts)) {
    throw new Error("Invalid account storage.");
  }

  return accounts;
}

/* Save Accounts */

function saveAccounts(accounts) {
  localStorage.setItem(
    ACCOUNTS_KEY,
    JSON.stringify(accounts)
  );
}

/* Normalize Email */

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/* Validate Email */

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
}

/* Validate Password */

function validatePassword(password) {
  if (
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    throw new Error(
      "Password must contain at least 8 characters, including letters and numbers."
    );
  }
}

/* Convert Bytes to Hex */

function toHex(bytes) {
  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

/* Hash Password */

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Authentication requires localhost or HTTPS."
    );
  }

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const result = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 600000,
      hash: "SHA-256"
    },
    key,
    256
  );

  return toHex(new Uint8Array(result));
}

/* Create Account */

export async function createAccount(email, password) {
  const normalizedEmail = normalizeEmail(email);

  validateEmail(normalizedEmail);
  validatePassword(password);

  const salt = toHex(
    crypto.getRandomValues(new Uint8Array(16))
  );

  const passwordHash = await hashPassword(
    password,
    salt
  );

  const accounts = loadAccounts();

  if (
    accounts.some(
      (account) => account.email === normalizedEmail
    )
  ) {
    throw new Error("This email is already registered.");
  }

  const newAccount = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    displayName: normalizedEmail.split("@")[0],
    salt,
    passwordHash,
    createdAt: Date.now()
  };

  saveAccounts([...accounts, newAccount]);

  return normalizedEmail;
}

/* Login Account */

export async function loginAccount(
  email,
  password,
  remember = false
) {
  const normalizedEmail = normalizeEmail(email);

  const accounts = loadAccounts();

  const account = accounts.find(
    (item) => item.email === normalizedEmail
  );

  if (!account) {
    throw new Error("Incorrect email or password.");
  }

  const enteredHash = await hashPassword(
    password,
    account.salt
  );

  if (enteredHash !== account.passwordHash) {
    throw new Error("Incorrect email or password.");
  }

  logoutAccount();

  if (remember) {
    localStorage.setItem(
      SESSION_KEY,
      account.email
    );
  } else {
    sessionStorage.setItem(
      SESSION_KEY,
      account.email
    );
  }

  return account.email;
}

/* Check Current Login Status */

export function getCurrentUser() {
  try {
    const email =
      sessionStorage.getItem(SESSION_KEY) ||
      localStorage.getItem(SESSION_KEY);

    if (!email) return null;

    const account = loadAccounts().find(
      (item) => item.email === email
    );

    return account ? account.email : null;

  } catch {
    return null;
  }
}

/* Logout Account */

export function logoutAccount() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/* Get Account Profile */

export function getAccountProfile(
  email = getCurrentUser()
) {
  if (!email || email !== getCurrentUser()) {
    return null;
  }

  const account = loadAccounts().find(
    (item) => item.email === email
  );

  if (!account) return null;

  return {
    email: account.email,

    displayName:
      account.displayName ||
      account.email.split("@")[0]
  };
}

/* Require Logged-in Account */

function requireAccount() {
  const email = getCurrentUser();

  const account = loadAccounts().find(
    (item) => item.email === email
  );

  if (!account) {
    throw new Error("Please log in again.");
  }

  return account;
}

/* Update Account Information */

function updateAccount(account, changes) {
  const accounts = loadAccounts();

  const current = accounts.find(
    (item) => item.id === account.id
  );

  if (
    !current ||
    getCurrentUser() !== account.email ||
    current.email !== account.email ||
    current.passwordHash !== account.passwordHash
  ) {
    throw new Error(
      "Account changed. Please log in again and retry."
    );
  }

  if (
    changes.email &&
    accounts.some(
      (item) =>
        item.id !== account.id &&
        item.email === changes.email
    )
  ) {
    throw new Error(
      "This email is already registered."
    );
  }

  const updatedAccounts = accounts.map(
    (item) =>
      item.id === account.id
        ? { ...item, ...changes }
        : item
  );

  saveAccounts(updatedAccounts);
}

/* Verify Current Password */

async function verifyPassword(account, password) {
  const enteredHash = await hashPassword(
    password,
    account.salt
  );

  if (enteredHash !== account.passwordHash) {
    throw new Error(
      "Current password is incorrect."
    );
  }
}

/* Change Display Name */

export function changeName(name) {
  const account = requireAccount();

  const displayName = name.trim();

  if (
    !displayName ||
    displayName.length > 60
  ) {
    throw new Error(
      "Enter a name between 1 and 60 characters."
    );
  }

  updateAccount(account, {
    displayName
  });

  return getAccountProfile();
}

/* Change Email Address */

export async function changeEmail(
  email,
  currentPassword
) {
  const account = requireAccount();

  const newEmail = normalizeEmail(email);

  validateEmail(newEmail);

  if (newEmail === account.email) {
    throw new Error(
      "Please enter a different email address."
    );
  }

  await verifyPassword(
    account,
    currentPassword
  );

  const remember =
    localStorage.getItem(SESSION_KEY) === account.email &&
    !sessionStorage.getItem(SESSION_KEY);

  updateAccount(account, {
    email: newEmail,

    displayName:
      account.displayName ||
      account.email.split("@")[0]
  });

  logoutAccount();

  if (remember) {
    localStorage.setItem(
      SESSION_KEY,
      newEmail
    );
  } else {
    sessionStorage.setItem(
      SESSION_KEY,
      newEmail
    );
  }

  return getAccountProfile();
}

/* Change Password */

export async function changePassword(
  currentPassword,
  newPassword
) {
  const account = requireAccount();

  validatePassword(newPassword);

  if (currentPassword === newPassword) {
    throw new Error(
      "Choose a different password."
    );
  }

  await verifyPassword(
    account,
    currentPassword
  );

  const salt = toHex(
    crypto.getRandomValues(new Uint8Array(16))
  );

  const passwordHash = await hashPassword(
    newPassword,
    salt
  );

  updateAccount(account, {
    salt,
    passwordHash
  });
}