const TEMPLATE_DATA = [
  {
    id: 'wedding_001',
    name: 'Classic Romantic Wedding',
    folder: 'wedding_001',
    demoId: 'demo_wedding_001',
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1100',
    description: 'Template klasik, lembut, dan formal untuk undangan digital bernuansa romantis.',
    tags: ['Classic', 'Elegant', 'Soft Romantic'],
    features: ['Countdown', 'Gallery', 'Ucapan Tamu', 'Amplop Digital']
  },
  {
    id: 'wedding_002',
    name: 'Dark Luxury Cinematic',
    folder: 'wedding_002',
    demoId: 'demo_wedding_002',
    status: 'New Template',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1100',
    description: 'Template premium bernuansa gelap, cinematic, glassmorphism, fingerprint opening, dan particle animation.',
    tags: ['Dark Luxury', 'Cinematic', 'Premium'],
    features: ['Fingerprint Opening', 'Particle Canvas', 'Gallery Marquee', 'Amplop Digital']
  }
];

const SELECTORS = {
  grid: document.getElementById('templateGrid'),
  total: document.getElementById('totalTemplates'),
  search: document.getElementById('templateSearch'),
  guestInput: document.getElementById('guestNameInput'),
  yearNow: document.getElementById('yearNow'),
  modal: document.getElementById('templateModal'),
  modalTemplateId: document.getElementById('modalTemplateId'),
  modalTitle: document.getElementById('modalTitle'),
  modalDescription: document.getElementById('modalDescription'),
  modalFolder: document.getElementById('modalFolder'),
  modalDemoId: document.getElementById('modalDemoId'),
  modalPreviewLink: document.getElementById('modalPreviewLink'),
  modalAdminLink: document.getElementById('modalAdminLink'),
  copyTemplateBtn: document.getElementById('copyTemplateBtn'),
  toast: document.getElementById('toast')
};

const state = {
  activeTemplate: null,
  toastTimer: null
};

function sanitizeText(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#039;',
      '"': '&quot;'
    };
    return map[char];
  });
}

function getGuestName() {
  const value = SELECTORS.guestInput?.value?.trim();
  return value || 'Bapak/Ibu/Saudara/i';
}

function buildPreviewUrl(template) {
  const guestName = encodeURIComponent(getGuestName());
  return `./${template.folder}/index.html?id=${encodeURIComponent(template.demoId)}&to=${guestName}`;
}

function buildAdminUrl(template) {
  return `./admin/index.html?template=${encodeURIComponent(template.id)}`;
}

function renderTemplates(list = TEMPLATE_DATA) {
  if (!SELECTORS.grid) return;

  SELECTORS.total.textContent = String(TEMPLATE_DATA.length).padStart(2, '0');

  if (!list.length) {
    SELECTORS.grid.innerHTML = `
      <div class="empty-state">
        <h3>Template tidak ditemukan</h3>
        <p>Coba gunakan kata kunci lain ya, Bos.</p>
      </div>
    `;
    return;
  }

  SELECTORS.grid.innerHTML = list.map((template) => {
    const tags = template.tags.map((tag) => `<span>${sanitizeText(tag)}</span>`).join('');
    const features = template.features.map((feature) => `<span>${sanitizeText(feature)}</span>`).join('');

    return `
      <article class="template-card" data-template-card="${sanitizeText(template.id)}">
        <div class="template-preview">
          <span class="template-badge">${sanitizeText(template.status)}</span>
          <img src="${sanitizeText(template.image)}" alt="Preview ${sanitizeText(template.name)}" loading="lazy" />
        </div>
        <div class="template-content">
          <p class="eyebrow">${sanitizeText(template.id)}</p>
          <h3>${sanitizeText(template.name)}</h3>
          <p>${sanitizeText(template.description)}</p>

          <div class="template-meta" aria-label="Kategori template">
            ${tags}
          </div>

          <div class="template-meta" aria-label="Fitur template">
            ${features}
          </div>

          <div class="template-actions">
            <a class="btn btn-primary" href="${buildPreviewUrl(template)}" target="_blank" rel="noopener" data-preview-link="${sanitizeText(template.id)}">Preview Demo</a>
            <button class="btn btn-soft" type="button" data-open-template="${sanitizeText(template.id)}">Pilih Template</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function filterTemplates() {
  const keyword = SELECTORS.search.value.trim().toLowerCase();

  const filtered = TEMPLATE_DATA.filter((template) => {
    const searchable = [
      template.id,
      template.name,
      template.description,
      ...template.tags,
      ...template.features
    ].join(' ').toLowerCase();

    return searchable.includes(keyword);
  });

  renderTemplates(filtered);
}

function refreshPreviewLinks() {
  document.querySelectorAll('[data-preview-link]').forEach((link) => {
    const template = TEMPLATE_DATA.find((item) => item.id === link.dataset.previewLink);
    if (template) link.href = buildPreviewUrl(template);
  });

  if (state.activeTemplate) {
    SELECTORS.modalPreviewLink.href = buildPreviewUrl(state.activeTemplate);
  }
}

function openTemplateModal(templateId) {
  const template = TEMPLATE_DATA.find((item) => item.id === templateId);
  if (!template) return;

  state.activeTemplate = template;

  SELECTORS.modalTemplateId.textContent = template.id;
  SELECTORS.modalTitle.textContent = template.name;
  SELECTORS.modalDescription.textContent = template.description;
  SELECTORS.modalFolder.textContent = `/weddings/${template.folder}/`;
  SELECTORS.modalDemoId.textContent = template.demoId;
  SELECTORS.modalPreviewLink.href = buildPreviewUrl(template);
  SELECTORS.modalAdminLink.href = buildAdminUrl(template);

  SELECTORS.modal.classList.add('show');
  SELECTORS.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeTemplateModal() {
  SELECTORS.modal.classList.remove('show');
  SELECTORS.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showToast(message) {
  SELECTORS.toast.textContent = message;
  SELECTORS.toast.classList.add('show');

  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    SELECTORS.toast.classList.remove('show');
  }, 1700);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement('input');
  input.value = text;
  input.setAttribute('readonly', '');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function bindEvents() {
  SELECTORS.search?.addEventListener('input', filterTemplates);
  SELECTORS.guestInput?.addEventListener('input', refreshPreviewLinks);

  document.addEventListener('click', (event) => {
    const openButton = event.target.closest('[data-open-template]');
    const closeButton = event.target.closest('[data-close-modal]');

    if (openButton) {
      openTemplateModal(openButton.dataset.openTemplate);
    }

    if (closeButton) {
      closeTemplateModal();
    }
  });

  SELECTORS.copyTemplateBtn?.addEventListener('click', async () => {
    if (!state.activeTemplate) return;

    try {
      await copyText(state.activeTemplate.id);
      showToast(`Template ID ${state.activeTemplate.id} berhasil disalin ✨`);
    } catch (error) {
      console.warn('Gagal menyalin template ID:', error);
      showToast('Gagal menyalin template ID');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeTemplateModal();
    }
  });
}

function initPage() {
  SELECTORS.yearNow.textContent = new Date().getFullYear();
  renderTemplates();
  bindEvents();
}

initPage();