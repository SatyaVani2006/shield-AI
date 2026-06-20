/**
 * SHIELD AI — FAQ training UI
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!ShieldApp.requireAuth()) return;

  const listEl = document.getElementById('faq-list');
  const form = document.getElementById('faq-form');
  const trainBtn = document.getElementById('train-btn');
  const alertEl = document.getElementById('faq-alert');

  const showAlert = (msg, type = 'success') => {
    alertEl.textContent = msg;
    alertEl.className = `alert alert-${type}`;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 4000);
  };

  const loadFaqs = async () => {
    try {
      const data = await ShieldApp.api(`/api/faq?t=${Date.now()}`);
      listEl.innerHTML = '';
      (data.faqs || []).forEach((faq) => {
        const article = document.createElement('article');
        article.className = 'faq-item glass';
        article.innerHTML = `
          <h4>${escapeHtml(faq.question)}</h4>
          <div class="meta">${faq.category} · ${new Date(faq.updatedAt || faq.createdAt).toLocaleDateString()}</div>
          <p>${escapeHtml(faq.answer)}</p>
          <div class="actions">
            <button type="button" class="btn btn-ghost btn-sm btn-delete" data-id="${faq._id}">Delete</button>
          </div>
        `;
        article.querySelector('.btn-delete').addEventListener('click', () => deleteFaq(faq._id));
        listEl.appendChild(article);
      });
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  const escapeHtml = (s) => {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  };

  const deleteFaq = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await ShieldApp.api(`/api/faq/${id}`, { method: 'DELETE' });
      showAlert('FAQ deleted');
      loadFaqs();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = document.getElementById('faq-question').value.trim();
    const answer = document.getElementById('faq-answer').value.trim();
    const category = document.getElementById('faq-category').value;
    const kw = document.getElementById('faq-keywords').value;
    const keywords = kw ? kw.split(',').map((k) => k.trim()).filter(Boolean) : [];

    try {
      await ShieldApp.api('/api/faq', {
        method: 'POST',
        body: JSON.stringify({ question, answer, category, keywords }),
      });
      showAlert('FAQ added and NLP will use it for matching');
      form.reset();
      loadFaqs();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });

  trainBtn.addEventListener('click', async () => {
    trainBtn.disabled = true;
    try {
      const data = await ShieldApp.api('/api/faq/train', { method: 'POST' });
      showAlert(data.message || 'Training complete');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      trainBtn.disabled = false;
    }
  });

  loadFaqs();
});
