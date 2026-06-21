/**
 * SHIELD AI — FAQ contributions and matching dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!ShieldApp.requireAuth()) return;

  const listEl = document.getElementById('faq-list');
  const form = document.getElementById('faq-form');
  const alertEl = document.getElementById('faq-alert');
  const editIdEl = document.getElementById('faq-edit-id');
  const submitBtn = document.getElementById('faq-submit-btn');
  const cancelBtn = document.getElementById('faq-cancel-btn');

  const showAlert = (msg, type = 'success') => {
    alertEl.textContent = msg;
    alertEl.className = `alert alert-${type}`;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 5000);
  };

  const escapeHtml = (s) => {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  };

  // Helper to reset the form to "Add FAQ" mode
  const resetForm = () => {
    form.reset();
    editIdEl.value = '';
    submitBtn.textContent = 'Add FAQ';
    cancelBtn.classList.add('hidden');
  };

  const loadFaqs = async () => {
    try {
      const data = await ShieldApp.api(`/api/faq?t=${Date.now()}`);
      listEl.innerHTML = '';
      
      const faqs = data.faqs || [];
      if (faqs.length === 0) {
        listEl.innerHTML = `
          <div class="welcome-screen" style="padding: 30px; text-align: center;">
            <p style="color: var(--text-secondary);">You have not contributed any cybersecurity FAQs yet. Use the form above to add your first FAQ!</p>
          </div>
        `;
        return;
      }

      faqs.forEach((faq) => {
        const article = document.createElement('article');
        article.className = 'faq-item glass';
        article.innerHTML = `
          <h4>${escapeHtml(faq.question)}</h4>
          <div class="meta">${faq.category} · ${new Date(faq.updatedAt || faq.createdAt).toLocaleDateString()}</div>
          <p>${escapeHtml(faq.answer)}</p>
          <div class="actions" style="margin-top: 10px;">
            <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${faq._id}">✏️ Edit</button>
          </div>
        `;

        // Handle editing event
        article.querySelector('.btn-edit').addEventListener('click', () => {
          editIdEl.value = faq._id;
          document.getElementById('faq-question').value = faq.question;
          document.getElementById('faq-answer').value = faq.answer;
          document.getElementById('faq-category').value = faq.category || 'general';
          document.getElementById('faq-keywords').value = (faq.keywords || []).join(', ');
          
          submitBtn.textContent = 'Update FAQ';
          cancelBtn.classList.remove('hidden');
          
          // Scroll up to the form
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        listEl.appendChild(article);
      });
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // Submit form handler (Add or Update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = editIdEl.value;
    const question = document.getElementById('faq-question').value.trim();
    const answer = document.getElementById('faq-answer').value.trim();
    const category = document.getElementById('faq-category').value;
    const kw = document.getElementById('faq-keywords').value;
    const keywords = kw ? kw.split(',').map((k) => k.trim()).filter(Boolean) : [];

    try {
      if (editId) {
        // Update existing FAQ
        await ShieldApp.api(`/api/faq/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ question, answer, category, keywords }),
        });
        showAlert('FAQ updated successfully');
      } else {
        // Create new FAQ
        await ShieldApp.api('/api/faq', {
          method: 'POST',
          body: JSON.stringify({ question, answer, category, keywords }),
        });
        showAlert('FAQ added successfully! It is now active for all users.');
      }
      
      resetForm();
      loadFaqs();
    } catch (err) {
      showAlert(err.message, 'error');
    }
  });

  // Cancel edit mode
  cancelBtn.addEventListener('click', resetForm);

  // Initial load
  loadFaqs();
});
