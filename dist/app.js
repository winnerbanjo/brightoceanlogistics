(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const menu = $('.menu-toggle');
  const nav = $('#main-nav');
  const setMenu = (open) => {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('open', open);
  };
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  document.addEventListener('click', e => {
    if (menu?.getAttribute('aria-expanded') === 'true' && !e.target.closest('header')) setMenu(false);
  });
  document.addEventListener('focusin', e => {
    if (menu?.getAttribute('aria-expanded') === 'true' && !e.target.closest('header')) setMenu(false);
  });
  const mobile = window.matchMedia('(max-width: 900px)');
  mobile.addEventListener('change', () => setMenu(false));
  const header = $('header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  const revealAll = () => {
    observer?.disconnect();
    document.querySelectorAll('.reveal-ready').forEach(el => el.classList.add('is-visible'));
  };
  if (!motion.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .service-card, .location-card, .steps article, .detail-card, .journey-steps article, .editorial-split > div, .network-row, .label-guide, .page-cta > div, .contact-options article').forEach((el) => {
      // Only animate content not already visible on arrival; keep all content readable without JS.
      if (el.getBoundingClientRect().top < window.innerHeight - 25) return;
      el.classList.add('reveal-ready');
      observer.observe(el);
    });
    motion.addEventListener('change', e => { if (e.matches) revealAll(); });
    window.addEventListener('beforeprint', revealAll);
  }

  const copyButton = $('.copy-address');
  copyButton?.addEventListener('click', async () => {
    const status = $('#copy-status');
    try {
      await navigator.clipboard.writeText($('[lang="zh"]').textContent);
      status.textContent = 'Address copied.';
    } catch {
      status.textContent = 'Please select and copy the address above.';
    }
  });

  const form = $('#quote-form');
  if (!form) return;
  const services = ['Sea shipping', 'Air freight', 'Help me choose'];
  const destinations = ['Lagos', 'Onitsha', 'Other Nigerian city'];
  const serviceField = form.elements.namedItem('service');
  const destinationField = form.elements.namedItem('destination');
  const cityField = form.elements.namedItem('city');
  const serviceParam = new URLSearchParams(window.location.search).get('service');
  if (serviceParam === 'sea') serviceField.value = 'Sea shipping';
  if (serviceParam === 'air') serviceField.value = 'Air freight';
  const updateCity = () => {
    if (!cityField) return;
    const needsCity = destinationField.value === 'Other Nigerian city';
    cityField.closest('label').hidden = !needsCity;
    cityField.required = needsCity;
    cityField.disabled = !needsCity;
  };
  destinationField.addEventListener('change', updateCity);
  updateCity();

  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    form.append(status);
  }
  form.addEventListener('input', () => { status.hidden = true; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = new FormData(form);
    const name = String(d.get('name') || '').trim();
    const phone = String(d.get('phone') || '').trim();
    const cargo = String(d.get('cargo') || '').trim();
    const city = String(d.get('city') || '').trim();
    if (!name || !phone || !cargo || (cityField?.required && !city)) {
      status.textContent = 'Please enter your name, contact number, cargo details, and destination city where required.';
      status.hidden = false;
      return;
    }
    const destination = d.get('destination') === 'Other Nigerian city' && city ? city : d.get('destination');
    const message = `Hello Bright Ocean Logistics, I would like a shipping quote.\n\nName: ${name}\nPhone: ${phone}\nShipping method: ${d.get('service')}\nDestination: ${destination}\nCargo details: ${cargo}`;
    const url = 'https://wa.me/2348060227854?text=' + encodeURIComponent(message);
    // Keep a visible link as a fallback when a browser blocks a new window.
    status.replaceChildren(document.createTextNode('Your message is ready. '));
    const fallback = document.createElement('a');
    fallback.href = url;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Open WhatsApp to review and send';
    status.append(fallback, document.createTextNode('. Nothing is sent until you send it in WhatsApp.'));
    status.hidden = false;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const tool = {
      name: 'prepare_shipping_quote',
      description: 'Fill the visible shipping quote form for review. Does not send a message or contact the company.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', maxLength: 100 }, phone: { type: 'string', maxLength: 30 }, service: { type: 'string', enum: services }, destination: { type: 'string', enum: destinations }, city: { type: 'string', maxLength: 100 }, cargo: { type: 'string', maxLength: 2000 } },
        required: ['name', 'phone', 'service', 'destination', 'cargo'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false },
      execute(input) {
        const allowed = ['name', 'phone', 'service', 'destination', 'city', 'cargo'];
        if (!input || typeof input !== 'object' || Object.keys(input).some(k => !allowed.includes(k)) ||
          ['name', 'phone', 'cargo'].some(k => typeof input[k] !== 'string' || !input[k].trim()) ||
          input.name.length > 100 || input.phone.length > 30 || input.cargo.length > 2000 ||
          !services.includes(input.service) || !destinations.includes(input.destination) ||
          (input.city !== undefined && (typeof input.city !== 'string' || input.city.length > 100)) ||
          (cityField && input.destination === 'Other Nigerian city' && !input.city?.trim())) {
          throw new Error('Provide valid quote details, including a city for other destinations.');
        }
        ['name', 'phone', 'service', 'destination', 'cargo'].forEach(k => { form.elements.namedItem(k).value = input[k]; });
        if (cityField) cityField.value = input.city || '';
        updateCity();
        status.hidden = true;
        $('#quote').scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth' });
        return { status: 'prepared', message: 'Review the form and continue on WhatsApp to send.' };
      }
    };
    try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
})();
