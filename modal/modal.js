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
  const productList = document.getElementById('gProductList');
  const addProductButton = document.getElementById('gAddProduct');
  const fields = () => [...form.querySelectorAll('input, select, textarea')];
  let opener = null;
  let previousOverflow = '';
  let envioEmAndamento = false;
  let successTimer = null;
  let nextProductId = 1;
  let hoverReady = true;
  let pointerFocus = false;

  function setHelpOpen(toggle, open) {
    const help = document.getElementById(toggle.getAttribute('aria-controls'));
    const label = toggle.closest('.solicitation-label');
    label.classList.remove('tooltip-above');
    help.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      const bodyRect = modal.querySelector('.mbody').getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      const helpRect = help.getBoundingClientRect();
      if (bodyRect.bottom - labelRect.bottom < helpRect.height + 8 &&
          labelRect.top - bodyRect.top > helpRect.height + 8) {
        label.classList.add('tooltip-above');
      }
    }
  }

  function closeHelp() {
    modal.querySelectorAll('.solicitation-help-toggle').forEach(toggle => setHelpOpen(toggle, false));
  }

  function openHelp(toggle) {
    closeHelp();
    setHelpOpen(toggle, true);
  }
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
    return fields().some(field => field.value.trim() !== '');
  }

  function clearStatus() {
    status.textContent = '';
    status.className = 'save-status';
  }

  function closeModal() {
    if (hasFilledData() && !window.confirm('Há dados preenchidos. Deseja sair e descartá-los?')) return;
    modal.close();
  }

  function setConditionalField(idOrField, visible, required = false) {
    const field = typeof idOrField === 'string' ? document.getElementById(idOrField) : idOrField;
    field.closest('.mfield').hidden = !visible;
    field.disabled = !visible;
    field.required = visible && required;
    if (!visible) {
      field.value = '';
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
    }
  }

  function updateCommercialConditions() {
    const sale = form.dataset.modalidade === 'Venda';
    document.getElementById('gComercialTitle').textContent = sale ? 'Sobre a venda' : 'Sobre a compra';
    productList.querySelectorAll('[data-product-row]').forEach(row => {
      setConditionalField(row.querySelector('[data-product-field="price"]'), sale, true);
    });
    document.getElementById('gEntregaSection').hidden = !sale;
    setConditionalField('gEntrega', sale, true);
    setConditionalField('gSiteRede', sale);
    const delivery = sale && document.getElementById('gEntrega').value === 'Sim';
    setConditionalField('gRegiaoEntrega', delivery, true);
    setConditionalField('gFrete', delivery, true);
  }

  function updateProductControls() {
    const rows = [...productList.querySelectorAll('[data-product-row]')];
    rows.forEach((row, index) => {
      const removeButton = row.querySelector('.product-remove');
      removeButton.hidden = index === 0;
      removeButton.setAttribute('aria-label', `Excluir produto ${index + 1}`);
    });
    addProductButton.hidden = rows.length >= 5;
  }

  addProductButton.addEventListener('click', () => {
    if (productList.querySelectorAll('[data-product-row]').length >= 5) return;
    closeHelp();
    const row = productList.firstElementChild.cloneNode(true);
    nextProductId += 1;
    const idMap = new Map();
    row.querySelectorAll('[id]').forEach(element => {
      const oldId = element.id;
      element.id = `${oldId}_${nextProductId}`;
      idMap.set(oldId, element.id);
    });
    row.querySelectorAll('[for]').forEach(label => {
      label.htmlFor = idMap.get(label.htmlFor);
    });
    row.querySelectorAll('[aria-describedby]').forEach(element => {
      element.setAttribute('aria-describedby', element.getAttribute('aria-describedby')
        .split(/\s+/).map(id => idMap.get(id) || id).join(' '));
    });
    row.querySelectorAll('[aria-controls]').forEach(element => {
      element.setAttribute('aria-controls', idMap.get(element.getAttribute('aria-controls')));
    });
    row.querySelectorAll('input, select').forEach(field => {
      field.value = '';
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
    });
    productList.append(row);
    updateCommercialConditions();
    updateProductControls();
    clearStatus();
    row.querySelector('[data-product-field="name"]').focus();
  });

  productList.addEventListener('click', event => {
    const removeButton = event.target.closest('.product-remove');
    if (!removeButton) return;
    const row = removeButton.closest('[data-product-row]');
    if (row === productList.firstElementChild) return;
    closeHelp();
    row.remove();
    updateProductControls();
    clearStatus();
    addProductButton.focus();
  });

  document.querySelectorAll('[data-geniagro-modal]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      hideSuccessNotice();
      closeHelp();
      opener = trigger;
      // Modalidade definida exclusivamente pelo CTA, sem campo adicional.
      form.dataset.modalidade = trigger.dataset.geniagroModal;
      titleText.textContent = form.dataset.modalidade === 'Compra' ? 'Quero comprar' : 'Quero vender';
      document.querySelector('label[for="gEndereco"]').textContent = form.dataset.modalidade === 'Compra'
        ? 'Endereço de entrega *' : 'Localização de fornecimento *';
      updateCommercialConditions();
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      modal.showModal();
      modal.querySelector('.mbody').scrollTop = 0;
      title.focus({ preventScroll: true });
    });
  });

  modal.addEventListener('click', event => {
    const toggle = event.target.closest('.solicitation-help-toggle');
    pointerFocus = false;
    if (toggle) {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      closeHelp();
      if (open) setHelpOpen(toggle, true);
    } else {
      closeHelp();
    }
  });
  modal.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && hoverReady && event.target.matches('.solicitation-help-toggle')) {
      openHelp(event.target);
    }
  }, true);
  modal.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && event.target.matches('.solicitation-help-toggle') &&
        !event.target.matches(':focus-visible')) closeHelp();
  }, true);
  modal.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || hoverReady || (!event.movementX && !event.movementY)) return;
    hoverReady = true;
    const toggle = event.target.closest('.solicitation-help-toggle');
    if (toggle) openHelp(toggle);
  });
  modal.addEventListener('focusin', event => {
    if (!pointerFocus && event.target.matches('.solicitation-help-toggle:focus-visible')) openHelp(event.target);
  });
  modal.addEventListener('focusout', event => {
    if (event.target.matches('.solicitation-help-toggle') && !event.target.matches(':hover')) closeHelp();
  });
  modal.querySelector('.mbody').addEventListener('scroll', () => {
    closeHelp();
    hoverReady = false;
  }, { passive: true });

  modal.querySelector('.mclose').addEventListener('click', closeModal);
  modal.addEventListener('cancel', event => {
    event.preventDefault();
    const toggle = modal.querySelector('.solicitation-help-toggle[aria-expanded="true"]');
    if (toggle) {
      closeHelp();
      toggle.focus();
      return;
    }
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
    pointerFocus = Boolean(event.target.closest('.solicitation-help-toggle'));
    pointerStartedOutside = event.target === modal && outsideDialog(event);
  });
  modal.addEventListener('pointercancel', () => { pointerFocus = false; });
  modal.addEventListener('click', event => {
    if (pointerStartedOutside && event.target === modal && outsideDialog(event)) closeModal();
    pointerStartedOutside = false;
  });
  modal.addEventListener('close', () => {
    closeHelp();
    hoverReady = true;
    form.reset();
    productList.querySelectorAll('[data-product-row]:not(:first-child)').forEach(row => row.remove());
    nextProductId = 1;
    updateProductControls();
    delete form.dataset.modalidade;
    updateCommercialConditions();
    fields().forEach(field => {
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
    if (field.disabled) {
      field.removeAttribute('aria-invalid');
      return true;
    }
    if (field.required && !field.value.trim()) field.setCustomValidity('Preencha este campo.');
    else if (['quantity', 'price'].includes(field.dataset.productField) && field.value !== '' &&
        (!Number.isFinite(Number(field.value)) || Number(field.value) <= 0)) {
      field.setCustomValidity('Informe um número maior que zero.');
    }
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
    if (field.id === 'gEntrega') updateCommercialConditions();
    if (field.id === 'gUf') field.value = field.value.toUpperCase();
    if (fields().includes(field)) {
      field.setCustomValidity('');
      if (field.hasAttribute('aria-invalid')) validateField(field);
    }
  });
  form.addEventListener('change', event => {
    if (event.target.id === 'gEntrega') {
      clearStatus();
      updateCommercialConditions();
    }
  });
  // Formata ao sair do campo para preservar a edição e a posição do cursor.
  document.getElementById('gContato').addEventListener('blur', event => {
    event.target.value = formatPhoneLiteBR(event.target.value);
    if (event.target.hasAttribute('aria-invalid')) validateField(event.target);
  });

  function montarDescricaoComercial() {
    const value = id => document.getElementById(id).value.trim();
    const lines = ['PRODUTOS', ''];
    productList.querySelectorAll('[data-product-row]').forEach((row, index) => {
      const productValue = kind => row.querySelector(`[data-product-field="${kind}"]`).value.trim();
      const unit = productValue('unit');
      const quantity = new Intl.NumberFormat('pt-BR', { useGrouping: false, maximumFractionDigits: 20 })
        .format(Number(productValue('quantity')));
      lines.push(`${index + 1}. ${productValue('name')}`, 'Quantidade: ' + quantity + ' ' + unit);
      if (form.dataset.modalidade === 'Venda' && productValue('price')) {
        const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
          .format(Number(productValue('price'))).replace(/\u00a0/g, ' ');
        lines.push('Preço unitário: ' + price);
      }
      lines.push('');
    });
    if (form.dataset.modalidade === 'Venda') {
      lines.push('ENTREGA E FRETE');
      if (value('gEntrega') === 'Sim') {
        lines.push('Entrega: Sim', 'Região de entrega: ' + value('gRegiaoEntrega'), 'Frete: ' + value('gFrete'));
      } else {
        lines.push('Entrega: Não', 'Retirada no local');
      }
      lines.push('');
      const siteRede = value('gSiteRede');
      if (siteRede) lines.push('Site/Rede social: ' + siteRede, '');
    }
    const observations = value('gSolicitacao');
    if (observations) lines.push('OBSERVAÇÕES', observations);
    return lines.join('\n').trim();
  }

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
      campo_pers_01: montarDescricaoComercial(),
    };
  }

  updateProductControls();
  updateCommercialConditions();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (envioEmAndamento) return;
    const invalid = fields().filter(field => !validateField(field));
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
