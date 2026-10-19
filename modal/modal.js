/* AFlow: fechamento com confirmação e formatPhoneLiteBR adaptados.
   Sem CRM, rede, autenticação ou persistência. Estado apenas em memória. */
(() => {
  'use strict';
  const modal = document.getElementById('geniagroModal');
  const form = document.getElementById('geniagroForm');
  const title = document.getElementById('geniagroModalTitle');
  const titleText = document.getElementById('geniagroModalTitleText');
  const status = document.getElementById('geniagroFormStatus');
  const fields = [...form.querySelectorAll('input, select, textarea')];
  let opener = null;
  let previousOverflow = '';

  function hasFilledData() {
    return fields.some(field => field.value.trim() !== '');
  }

  function clearStatus() {
    status.textContent = '';
    status.className = 'save-status';
  }

  function closeModal() {
    if (hasFilledData() && !window.confirm('Há dados preenchidos. Deseja sair e descartá-los?')) return;
    modal.close();
  }

  document.querySelectorAll('[data-geniagro-modal]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      opener = trigger;
      // Modalidade definida exclusivamente pelo CTA, sem campo adicional.
      form.dataset.modalidade = trigger.dataset.geniagroModal;
      titleText.textContent = form.dataset.modalidade === 'Compra' ? 'Solicitar cotação' : 'Sou fornecedor';
      document.querySelector('label[for="gEndereco"]').textContent = form.dataset.modalidade === 'Compra'
        ? 'Endereço de entrega' : 'Localização de fornecimento';
      document.querySelector('label[for="gSolicitacao"]').textContent = form.dataset.modalidade === 'Compra'
        ? 'O que você precisa? *' : 'O que você oferece? *';
      document.getElementById('gSolicitacao').placeholder = form.dataset.modalidade === 'Compra'
        ? 'Ex.: Preciso de 100 kg de MAP para a cultura de trigo.'
        : 'Ex.: Fornecemos fertilizantes NPK e MAP, com entregas regionais.';
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      modal.showModal();
      modal.querySelector('.mbody').scrollTop = 0;
      title.focus({ preventScroll: true });
    });
  });

  modal.querySelector('.mclose').addEventListener('click', closeModal);
  modal.addEventListener('cancel', event => {
    event.preventDefault();
    closeModal();
  });
  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button, input, select, textarea')]
      .filter(control => !control.disabled && control.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === title)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  let pointerStartedOutside = false;
  function outsideDialog(event) {
    const bounds = modal.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  modal.addEventListener('pointerdown', event => {
    pointerStartedOutside = event.target === modal && outsideDialog(event);
  });
  modal.addEventListener('click', event => {
    if (pointerStartedOutside && event.target === modal && outsideDialog(event)) closeModal();
    pointerStartedOutside = false;
  });
  modal.addEventListener('close', () => {
    form.reset();
    delete form.dataset.modalidade;
    fields.forEach(field => {
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
    });
    clearStatus();
    document.body.style.overflow = previousOverflow;
    opener?.focus({ preventScroll: true });
  });

  function formatPhoneLiteBR(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
    digits = digits.slice(0, 11);
    if (digits.length <= 2) return digits;
    const firstSize = digits.length > 10 ? 5 : 4;
    return [digits.slice(0, 2), digits.slice(2, 2 + firstSize), digits.slice(2 + firstSize)].filter(Boolean).join(' ');
  }

  function validateField(field) {
    field.setCustomValidity('');
    if (field.required && !field.value.trim()) field.setCustomValidity('Preencha este campo.');
    else if (field.id === 'gContato' && !/^\d{10,11}$/.test(field.value.replace(/\D/g, ''))) {
      field.setCustomValidity('Informe o telefone com DDD e 10 ou 11 dígitos.');
    }
    const valid = field.validity.valid;
    if (valid) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', 'true');
    return valid;
  }

  form.addEventListener('input', event => {
    const field = event.target;
    clearStatus();
    if (field.id === 'gUf') field.value = field.value.toUpperCase();
    if (fields.includes(field)) {
      field.setCustomValidity('');
      if (field.hasAttribute('aria-invalid')) validateField(field);
    }
  });
  // Formata ao sair do campo para preservar a edição e a posição do cursor.
  document.getElementById('gContato').addEventListener('blur', event => {
    event.target.value = formatPhoneLiteBR(event.target.value);
    if (event.target.hasAttribute('aria-invalid')) validateField(event.target);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = fields.filter(field => !validateField(field));
    status.className = invalid.length ? 'save-status err' : 'save-status';
    status.textContent = invalid.length
      ? 'Revise os campos destacados. Os dados não foram enviados.'
      : 'Formulário validado para teste. Nenhum dado foi enviado.';
    if (invalid.length) {
      invalid[0].focus();
      invalid[0].reportValidity();
    }
  });
})();
