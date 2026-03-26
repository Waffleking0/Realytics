/**
 * auth.js — Handles login, signup, token storage, and logout.
 * Shared by login.html and index.html.
 */

const API = "http://localhost:8000/api";

/* ── Token helpers ─────────────────────────────────────────────── */

function saveToken(token) {
  localStorage.setItem("mt_token", token);
}

function getToken() {
  return localStorage.getItem("mt_token");
}

function clearToken() {
  localStorage.removeItem("mt_token");
}

function isLoggedIn() {
  return !!getToken();
}

/* ── Redirect guards ───────────────────────────────────────────── */

/** Call on protected pages — redirects to login if not authenticated. */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "/static/login.html";
  }
}

/** Call on auth pages — redirects to dashboard if already logged in. */
function redirectIfAuth() {
  if (isLoggedIn()) {
    window.location.href = "/static/index.html";
  }
}

/* ── API calls ─────────────────────────────────────────────────── */

async function apiLogin(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data.access_token;
}

async function apiSignup(email, username, password) {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Signup failed");
  return data;
}

/* ── Auth headers helper (used by app.js) ──────────────────────── */

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/* ── Logout ────────────────────────────────────────────────────── */

function logout() {
  clearToken();
  window.location.href = "/static/login.html";
}
