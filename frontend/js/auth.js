/**
 * SHIELD AI — Authentication (login / register)
 */

document.addEventListener('DOMContentLoaded', () => {

  const form =
    document.getElementById('auth-form');

  const title =
    document.getElementById('auth-title');

  const subtitle =
    document.getElementById('auth-subtitle');

  const submitBtn =
    document.getElementById('auth-submit');

  const toggleLink =
    document.getElementById('toggle-auth');

  const toggleText =
    document.getElementById('toggle-text');

  const usernameGroup =
    document.getElementById('username-group');

  const langGroup =
    document.getElementById('lang-group');

  const alertEl =
    document.getElementById('auth-alert');

  let isRegister =
    window.location.hash === '#register';

  const showAlert = (
    msg,
    type = 'error'
  ) => {

    alertEl.textContent = msg;

    alertEl.className =
      `alert alert-${type}`;

    alertEl.classList.remove('hidden');
  };

  const setMode = (
    register
  ) => {

    isRegister = register;

    title.textContent =
      register
        ? 'Create Account'
        : 'Sign In';

    subtitle.textContent =
      register
        ? 'Join SHIELD AI cybersecurity workspace'
        : 'Access your SHIELD AI security workspace';

    submitBtn.textContent =
      register
        ? 'Register'
        : 'Sign In';

    toggleText.textContent =
      register
        ? 'Already have an account?'
        : "Don't have an account?";

    toggleLink.textContent =
      register
        ? 'Sign In'
        : 'Register';

    usernameGroup.style.display =
      register
        ? 'block'
        : 'none';

    langGroup.style.display =
      register
        ? 'block'
        : 'none';
  };

  if (ShieldApp.getToken()) {

    window.location.href =
      'dashboard.html';

    return;
  }

  setMode(isRegister);

  toggleLink.addEventListener(
    'click',
    (e) => {

      e.preventDefault();

      setMode(!isRegister);

      alertEl.classList.add('hidden');
    }
  );

  form.addEventListener(
    'submit',
    async (e) => {

      e.preventDefault();

      alertEl.classList.add('hidden');

      submitBtn.disabled = true;

      try {

        const email =
          document
            .getElementById('email')
            .value
            .trim();

        const password =
          document
            .getElementById('password')
            .value;

        // =========================
        // REGISTER
        // =========================

        if (isRegister) {

          const username =
            document
              .getElementById('username')
              .value
              .trim();

          const preferredLanguage =
            document
              .getElementById('preferredLanguage')
              .value;

          const data =
            await ShieldApp.api(
              '/api/auth/register',
              {
                method: 'POST',

                body: JSON.stringify({
                  username,
                  email,
                  password,
                  preferredLanguage
                }),
              }
            );

          ShieldApp.setAuth(
            data.token,
            data.user
          );

          // SAVE CUSTOMER ID

          if (
            data.user &&
            data.user.customerId
          ) {

            localStorage.setItem(
              'customerId',
              data.user.customerId
            );

            console.log(
              'CUSTOMER ID SAVED:',
              data.user.customerId
            );
          }
        }

        // =========================
        // LOGIN
        // =========================

        else {

          const data =
            await ShieldApp.api(
              '/api/auth/login',
              {
                method: 'POST',

                body: JSON.stringify({
                  email,
                  password
                }),
              }
            );

          ShieldApp.setAuth(
            data.token,
            data.user
          );

          // SAVE CUSTOMER ID

          if (
            data.user &&
            data.user.customerId
          ) {

            localStorage.setItem(
              'customerId',
              data.user.customerId
            );

            console.log(
              'CUSTOMER ID SAVED:',
              data.user.customerId
            );
          }
        }

        window.location.href =
          'dashboard.html';

      } catch (err) {

        showAlert(err.message);

      } finally {
        submitBtn.disabled = false;
      }
    }
  );

  // Password visibility toggle handler
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('password-toggle');
  const toggleEyeIcon = document.getElementById('toggle-eye-icon');

  if (passwordToggle && passwordInput && toggleEyeIcon) {
    passwordToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      if (isPassword) {
        // SVG for eye-slash (hidden state -> visual reveal)
        toggleEyeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.863 7.863L21 21m-2.228-2.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        `;
      } else {
        // SVG for eye (visible state -> visual hide)
        toggleEyeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        `;
      }
    });
  }
});
