/* Kofi — script principal */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const EXTRAS = { aveia: 4, baunilha: 3, caramelo: 3, shot_extra: 4 };

let cart = [];
try { cart = JSON.parse(localStorage.getItem('kofi-cart')) || []; } catch (e) {}

/* ---------- Header e footer compartilhados ---------- */
async function loadPart(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    el.innerHTML = await (await fetch(file)).text();
  } catch (e) {
    console.error('Abra o site por um servidor (Live Server / GitHub Pages).', e);
  }
}

/* ---------- Carrinho ---------- */
function saveCart() {
  try { localStorage.setItem('kofi-cart', JSON.stringify(cart)); } catch (e) {}
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const badge = $('#cart-count');
  if (badge) { badge.textContent = count; badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  renderCart();
}

function renderCart() {
  const box = $('#cart-items');
  if (!box) return;
  if (!cart.length) box.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
  else box.innerHTML = cart.map((it, i) => `
    <div class="cart-item">
      <img src="${it.img}" alt="">
      <div class="cart-item-details">
        <h4>${it.title}</h4>
        ${it.notes ? `<small>${it.notes}</small>` : ''}
        <span class="item-price">${brl(it.price * it.qty)}</span>
      </div>
      <div class="cart-item-actions">
        <div class="cart-item-qty">
          <button data-i="${i}" data-d="-1" aria-label="Diminuir">-</button>
          <span>${it.qty}</span>
          <button data-i="${i}" data-d="1" aria-label="Aumentar">+</button>
        </div>
        <button class="btn-remove-item" data-i="${i}" data-d="0" aria-label="Remover"><i class="ph ph-trash"></i></button>
      </div>
    </div>`).join('');
  $('#cart-total-price').textContent = brl(cart.reduce((s, i) => s + i.price * i.qty, 0));
}

function toggleCart(open) {
  $('#cart-drawer')?.classList.toggle('open', open);
  $('#cart-overlay')?.classList.toggle('active', open);
}

/* ---------- Menu: filtros, pop-up e carrinho ---------- */
function initMenu() {
  if (!$('#product-modal')) return;
  let current = null, qty = 1;
  const modal = $('#product-modal');

  $$('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.menu-card').forEach(c =>
      c.classList.toggle('hidden', btn.dataset.category !== 'todos' && c.dataset.category !== btn.dataset.category));
  }));

  const updateTotal = () => {
    const extras = $$('#product-modal input:checked').reduce((s, i) => s + (EXTRAS[i.value] || 0), 0);
    current.unit = current.base + extras;
    $('#modal-price').textContent = brl(current.unit * qty);
  };

  $$('.menu-card').forEach(card => card.addEventListener('click', () => {
    const cat = card.dataset.category, drink = cat === 'quentes' || cat === 'gelados';
    current = {
      title: $('h3', card).textContent,
      img: $('img', card).src,
      desc: $('p', card).textContent,
      base: parseFloat($('.price', card).textContent.replace(/[^\d,]/g, '').replace(',', '.'))
    };
    qty = 1;
    $('#qty-value').textContent = 1;
    $('#modal-title').textContent = current.title;
    $('#modal-desc').textContent = current.desc;
    $('#modal-img').src = current.img;
    $$('.option-group:not(.qty-group)').forEach(g => g.style.display = drink ? '' : 'none');
    $$('#product-modal input').forEach(i => i.checked = i.defaultChecked);
    updateTotal();
    modal.classList.add('active');
  }));

  const closeModal = () => modal.classList.remove('active');
  $('#close-modal').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); toggleCart(false); } });
  modal.addEventListener('change', updateTotal);
  $('#qty-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qty-value').textContent = qty; updateTotal(); });
  $('#qty-plus').addEventListener('click', () => { qty++; $('#qty-value').textContent = qty; updateTotal(); });

  $('#btn-confirm-add').addEventListener('click', () => {
    const notes = $$('#product-modal .option-group:not(.qty-group)')
      .filter(g => g.style.display !== 'none')
      .flatMap(g => $$('input:checked', g).map(i => i.nextElementSibling.textContent.replace(/\s*\(.*\)/, '')))
      .join(', ');
    const found = cart.find(i => i.title === current.title && i.notes === notes && i.price === current.unit);
    if (found) found.qty += qty;
    else cart.push({ title: current.title, img: current.img, notes, price: current.unit, qty });
    closeModal();
    saveCart();
    toggleCart(true);
  });

  $('#cart-items').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const i = +b.dataset.i, d = +b.dataset.d;
    if (d === 0) cart.splice(i, 1);
    else { cart[i].qty += d; if (cart[i].qty < 1) cart.splice(i, 1); }
    saveCart();
  });
  $('#close-cart').addEventListener('click', () => toggleCart(false));
  $('#cart-overlay').addEventListener('click', () => toggleCart(false));
  $('#btn-checkout').addEventListener('click', () => {
    if (!cart.length) return;
    cart = [];
    saveCart();
    $('#cart-items').innerHTML = '<p class="empty-cart-msg">Pedido recebido! Obrigada pela preferência. (Demonstração)</p>';
  });
  renderCart();
  if (location.hash === '#carrinho') toggleCart(true);
}

/* ---------- Formulário de contato ---------- */
function initContact() {
  const form = $('#contact-form');
  if (!form) return;
  const rules = {
    nome: v => v.trim().length >= 3 || 'Informe seu nome completo.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Informe um e-mail válido.',
    assunto: v => v !== '' || 'Escolha um assunto.',
    mensagem: v => v.trim().length >= 10 || 'Escreva pelo menos 10 caracteres.'
  };
  const check = name => {
    const field = form.elements[name], res = rules[name](field.value);
    $(`[data-error="${name}"]`).textContent = res === true ? '' : res;
    field.classList.toggle('invalid', res !== true);
    return res === true;
  };
  Object.keys(rules).forEach(n => form.elements[n].addEventListener('blur', () => check(n)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!Object.keys(rules).map(check).every(Boolean)) return;
    form.reset();
    $('#form-success').hidden = false;
  });
}

/* ---------- Inicialização ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadPart('header-placeholder', 'header.html'), loadPart('footer-placeholder', 'footer.html')]);
  const header = $('header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll); onScroll();

  const cartLink = $('.cart-link');
  cartLink?.addEventListener('click', e => {
    e.preventDefault();
    if ($('#cart-drawer')) toggleCart(true); else location.href = 'menu.html#carrinho';
  });
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if ($('#cart-count')) $('#cart-count').textContent = count;

  initMenu();
  initContact();
});
