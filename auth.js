/* ==================================================
   ShopEase - Frontend Auth Helper (MongoDB-backed)
   Replaces supabase-client.js
   Uses JWT tokens stored in localStorage
================================================== */

var API_BASE = (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "3000")))
    ? "http://localhost:3000"
    : "";

/* ── Token / Session Helpers ── */

function getToken() {
    return localStorage.getItem("shopease_token");
}

function getCurrentUser() {
    const raw = localStorage.getItem("shopease_user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function clearSession() {
    localStorage.removeItem("shopease_token");
    localStorage.removeItem("shopease_user");
}

/* ── Auth Guard: call at top of every protected page ── */
function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
    }
}

/* ── API Call Helper ── */
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }
    return fetch(API_BASE + url, { ...options, headers });
}

/* ── Verify token with server ── */
async function verifySession() {
    const token = getToken();
    if (!token) return null;

    try {
        const res = await authFetch("/api/auth/me");
        if (!res.ok) {
            clearSession();
            return null;
        }
        const data = await res.json();
        // Refresh stored user data
        localStorage.setItem("shopease_user", JSON.stringify(data.user));
        return data.user;
    } catch {
        return getCurrentUser(); // offline fallback
    }
}

/* ── Logout ── */
async function authLogout() {
    try {
        await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
        // Still clear locally even if server call fails
    }
    clearSession();
}
