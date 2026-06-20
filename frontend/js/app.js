/**
 * SHIELD AI — Core app utilities (API, auth, storage)
 */

const ShieldApp = (() => {

  const API_BASE = window.location.origin.includes('localhost')
    ? 'http://localhost:5000'
    : window.location.origin;

  const TOKEN_KEY =
    'shield_token';

  const USER_KEY =
    'shield_user';

  const SESSION_KEY =
    'shield_session';

  // =========================
  // GET TOKEN
  // =========================

  const getToken = () =>
    localStorage.getItem(
      TOKEN_KEY
    );

  // =========================
  // GET USER
  // =========================

  const getUser = () => {

    try {

      return JSON.parse(
        localStorage.getItem(
          USER_KEY
        ) || 'null'
      );

    } catch {

      return null;

    }

  };

  // =========================
  // SAVE AUTH
  // =========================

  const setAuth = (
    token,
    user
  ) => {

    // SAVE TOKEN

    localStorage.setItem(
      TOKEN_KEY,
      token
    );

    // SAVE USER

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );

    // REMOVE OLD CUSTOMER ID

    localStorage.removeItem(
      'customerId'
    );

    // SAVE ONLY IF USER HAS CUSTOMER ID

    if (
      user.customerId &&
      user.customerId !== 'null'
    ) {

      localStorage.setItem(
        'customerId',
        user.customerId
      );

    }

  };

  // =========================
  // UPDATE USER
  // =========================

  const setUser = (user) => {

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );

  };

  // =========================
  // CLEAR AUTH
  // =========================

  const clearAuth = () => {

    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    localStorage.removeItem(
      SESSION_KEY
    );

    localStorage.removeItem(
      'customerId'
    );

  };

  // =========================
  // SESSION ID
  // =========================

  const getSessionId = () => {

    let id =
      localStorage.getItem(
        SESSION_KEY
      );

    if (!id) {

      id =
        `sess_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;

      localStorage.setItem(
        SESSION_KEY,
        id
      );

    }

    return id;

  };

  // =========================
  // NEW SESSION
  // =========================

  const newSession = () => {

    const id =
      `sess_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;

    localStorage.setItem(
      SESSION_KEY,
      id
    );

    return id;

  };

  // =========================
  // API REQUEST
  // =========================

  const api = async (
    path,
    options = {}
  ) => {

    const headers = {

      'Content-Type':
        'application/json',

      ...(options.headers || {}),

    };

    const token =
      getToken();

    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }

    const res =
      await fetch(
        `${API_BASE}${path}`,
        {
          ...options,
          headers,
        }
      );

    const data =
      await res.json()
        .catch(() => ({}));

    if (!res.ok) {

      throw new Error(

        data.message ||

        data.errors?.[0]?.msg ||

        'Request failed'

      );

    }

    return data;

  };

  // =========================
  // AUTH CHECK
  // =========================

  const requireAuth = () => {

    if (!getToken()) {

      window.location.href =
        'login.html';

      return false;

    }

    return true;

  };

  // =========================
  // LOGOUT
  // =========================

  const initLogout = () => {

    document
      .querySelectorAll(
        '#logout-btn'
      )
      .forEach((btn) => {

        btn.addEventListener(
          'click',
          () => {

            clearAuth();

            window.location.href =
              'login.html';

          }
        );

      });

  };

  document.addEventListener(
    'DOMContentLoaded',
    initLogout
  );

  // =========================
  // EXPORTS
  // =========================

  return {

    api,

    getToken,

    getUser,

    setAuth,

    setUser,

    clearAuth,

    requireAuth,

    getSessionId,

    newSession,

  };

})();

window.ShieldApp =
  ShieldApp;