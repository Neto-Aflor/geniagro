/* AFlow: fechamento com confirmação e formatPhoneLiteBR adaptados.
   Envio público preparado, desabilitado até a integração ser autorizada. */
(() => {
  'use strict';
  const ENVIO_ATIVO = true;
  const ROTA_SOLICITACAO = 'https://ia-flow-gateway.analderneto.workers.dev/public/geniagro';
  const modal = document.getElementById('geniagroModal');
  const form = document.getElementById('geniagroForm');
  const submitButton = form.querySelector('button[type="submit"]');
  const title = document.getElementById('geniagroModalTitle');
  const titleText = document.getElementById('geniagroModalTitleText');
  const status = document.getElementById('geniagroFormStatus');
  const fields = [...form.querySelectorAll('input, select, textarea')];
  let opener = null;
  let previousOverflow = '';
  let envioEmAndamento = false;
  let successTimer = null;
  const successNotice = document.createElement('div');
  const successTitle = document.createElement('strong');
  const successText = document.createElement('span');
  successNotice.className = 'geniagro-success-notice';
  successNotice.setAttribute('role', 'status');
  successNotice.setAttribute('aria-live', 'polite');
  successNotice.setAttribute('aria-atomic', 'true');
  successNotice.hidden = true;
  successNotice.append(successTitle, successText);
  document.body.append(successNotice);

  function hideSuccessNotice() {
    if (successTimer !== null) clearTimeout(successTimer);
    successTimer = null;
    successNotice.hidden = true;
    successTitle.textContent = '';
    successText.textContent = '';
  }

  function showSuccessNotice() {
    hideSuccessNotice();
    successNotice.hidden = false;
    successTitle.textContent = 'Solicitação enviada com sucesso!';
    successText.textContent = 'Recebemos suas informações. Nossa equipe entrará em contato.';
    successTimer = setTimeout(hideSuccessNotice, 7000);
  }

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
      hideSuccessNotice();
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

  function montarSolicitacao() {
    const data = new FormData(form);
    const texto = key => String(data.get(key) ?? '');
    return {
      nome: texto('nome'),
      empresa: texto('empresa'),
      cargo: texto('cargo'),
      endereco: texto('endereco'),
      cidade: texto('cidade'),
      uf: texto('uf'),
      contato: texto('contato'),
      email: texto('email'),
      categoria: form.dataset.modalidade || '',
      produto_servico: texto('produto_servico'),
      tipo_negocio: texto('tipo_negocio'),
      campo_pers_01: texto('campo_pers_01'),
    };
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (envioEmAndamento) return;
    const invalid = fields.filter(field => !validateField(field));
    status.className = invalid.length ? 'save-status err' : 'save-status';
    status.textContent = invalid.length
      ? 'Revise os campos destacados. Os dados não foram enviados.'
      : 'Formulário validado para teste. Nenhum dado foi enviado.';
    if (invalid.length) {
      invalid[0].focus();
      invalid[0].reportValidity();
      return;
    }
    if (!ENVIO_ATIVO) return;

    envioEmAndamento = true;
    submitButton.disabled = true;
    status.textContent = 'Enviando solicitação...';
    try {
      const response = await fetch(ROTA_SOLICITACAO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(montarSolicitacao()),
      });
      const result = await response.json();
      if (!response.ok || result?.success !== true) throw new Error('envio_nao_confirmado');
      modal.close();
      showSuccessNotice();
    } catch {
      status.className = 'save-status err';
      status.textContent = 'Não foi possível confirmar o envio. Verifique antes de tentar novamente.';
    } finally {
      envioEmAndamento = false;
      submitButton.disabled = false;
    }
  });
})();
