document.addEventListener('DOMContentLoaded', () => {
  const modalBackdrop = document.getElementById('leadModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const openModalBtns = document.querySelectorAll('.js-open-modal');
  const modalForm = document.getElementById('modalLeadForm');
  const heroForm = document.getElementById('heroLeadForm');
  const modalFormContainer = document.getElementById('modalFormContainer');
  const modalSuccessContainer = document.getElementById('modalSuccessContainer');
  const modalSuccessBtn = document.getElementById('modalSuccessBtn');

  function openModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (modalFormContainer && modalSuccessContainer) {
        modalFormContainer.style.display = 'block';
        modalSuccessContainer.style.display = 'none';
      }
    }
  }

  function closeModal() {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalSuccessBtn) modalSuccessBtn.addEventListener('click', closeModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });

  // Маска телефона +7 (XXX) XXX-XX-XX
  function applyPhoneMask(input) {
    input.addEventListener('input', function () {
      let val = this.value.replace(/\D/g, '');
      if (!val) {
        this.value = '';
        return;
      }
      if (val[0] === '9') val = '7' + val;
      if (val[0] === '8') val = '7' + val.substring(1);
      if (val[0] !== '7') val = '7' + val;

      let formatted = '+7 (';
      if (val.length > 1) formatted += val.substring(1, 4);
      if (val.length >= 4) formatted += ') ' + val.substring(4, 7);
      if (val.length >= 7) formatted += '-' + val.substring(7, 9);
      if (val.length >= 9) formatted += '-' + val.substring(9, 11);

      this.value = formatted;
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && this.value.length <= 4) {
        this.value = '';
      }
    });
  }

  document.querySelectorAll('input[type="tel"]').forEach(applyPhoneMask);

  // Отправка заявки на бэкенд
  async function submitLead(formData, submitBtn) {
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Отправка...</span>';

    try {
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        openModal();
        if (modalFormContainer && modalSuccessContainer) {
          modalFormContainer.style.display = 'none';
          modalSuccessContainer.style.display = 'block';
          const orderNumElem = document.getElementById('successOrderNumber');
          if (orderNumElem && result.lead_id) {
            orderNumElem.textContent = `#FX-${result.lead_id}`;
          }
        }
      } else {
        alert(result.message || 'Ошибка отправки заявки.');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при связи с сервером.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  if (modalForm) {
    modalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = modalForm.querySelector('button[type="submit"]');
      submitLead(new FormData(modalForm), submitBtn);
    });
  }

  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const submitBtn = heroForm.querySelector('button[type="submit"]');
      submitLead(new FormData(heroForm), submitBtn);
    });
  }
});