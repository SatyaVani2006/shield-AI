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
});
