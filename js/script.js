// ===== INCLUDES DE HEADER E FOOTER =====
fetch('/header.html')
  .then(resposta => resposta.text())
  .then(html => {
    document.getElementById('header-placeholder').innerHTML = html;
  });

fetch('/footer.html')
  .then(resposta => resposta.text())
  .then(html => {
    document.getElementById('footer-placeholder').innerHTML = html;
  });

// ===== SOM SINTETIZADO (SEM ARQUIVO DE ÁUDIO) =====
function playClickSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContextClass();

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);

  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.15);
}

// ===== FILTRAGEM DO CARDÁPIO =====
function initMenuFilter() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const menuCards = document.querySelectorAll(".menu-card");

  if (!filterBtns.length) return; // Se não estiver na página de menu, ignora

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const selectedCategory = btn.getAttribute("data-category");

      menuCards.forEach(card => {
        const cardCategory = card.getAttribute("data-category");

        if (selectedCategory === "todos" || cardCategory === selectedCategory) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
}

// ===== BADGE DO CARRINHO =====
let cartItemsCount = 0;

function updateCartBadge(quantity) {
  cartItemsCount += quantity;
  const cartBadge = document.getElementById("cart-count");

  if (cartBadge) {
    cartBadge.innerText = cartItemsCount;
    cartBadge.classList.add("bump");
    setTimeout(() => cartBadge.classList.remove("bump"), 300);
  }
}

// ===== ESTADO E LÓGICA DO CARRINHO =====
let cartState = [];

function updateCartUI() {
  const cartBadge = document.getElementById("cart-count");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartTotalPrice = document.getElementById("cart-total-price");

  const totalItems = cartState.reduce((acc, item) => acc + item.qty, 0);
  if (cartBadge) {
    cartBadge.innerText = totalItems;
    cartBadge.classList.add("bump");
    setTimeout(() => cartBadge.classList.remove("bump"), 300);
  }

  const totalAmount = cartState.reduce((acc, item) => {
    const priceNum = parseFloat(item.price.replace("R$", "").replace(",", ".").trim());
    return acc + priceNum * item.qty;
  }, 0);

  if (cartTotalPrice) {
    cartTotalPrice.innerText = `R$ ${totalAmount.toFixed(2).replace(".", ",")}`;
  }

  if (!cartItemsContainer) return;

  if (cartState.length === 0) {
    cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Seu carrinho está vazio.</p>`;
    return;
  }

  cartItemsContainer.innerHTML = cartState.map((item, index) => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.title}">
      <div class="cart-item-details">
        <h4>${item.title}</h4>
        <span class="item-price">${item.price}</span>
      </div>
      <div class="cart-item-actions">
        <div class="cart-item-qty">
          <button onclick="changeQty(${index}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${index}, 1)">+</button>
        </div>
        <button class="btn-remove-item" onclick="removeItem(${index})">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function addToCart(product) {
  const existingIndex = cartState.findIndex(item => item.title === product.title);

  if (existingIndex > -1) {
    cartState[existingIndex].qty += product.qty;
  } else {
    cartState.push(product);
  }

  updateCartUI();
}

function changeQty(index, delta) {
  cartState[index].qty += delta;
  if (cartState[index].qty <= 0) {
    cartState.splice(index, 1);
  }
  updateCartUI();
}

function removeItem(index) {
  cartState.splice(index, 1);
  updateCartUI();
}

// ===== GAVETA (SIDEBAR) DO CARRINHO =====
function initCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");
  const closeBtn = document.getElementById("close-cart");

  const openDrawer = () => {
    drawer.classList.add("open");
    overlay.classList.add("active");
  };

  const closeDrawer = () => {
    drawer.classList.remove("open");
    overlay.classList.remove("active");
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest('.cart-link')) {
      e.preventDefault();
      openDrawer();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (overlay) overlay.addEventListener("click", closeDrawer);
}

// ===== MODAL DO PRODUTO =====
function initProductModal() {
  const modal = document.getElementById("product-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const menuCards = document.querySelectorAll(".menu-card");
  const btnConfirmAdd = document.getElementById("btn-confirm-add");

  if (!modal) return;

  let currentQty = 1;
  let activeProduct = {};

  menuCards.forEach(card => {
    card.addEventListener("click", () => {
      playClickSound(); // 🔊 som ao abrir o card

      activeProduct = {
        img: card.querySelector(".card-img img").src,
        title: card.querySelector("h3").innerText,
        desc: card.querySelector("p").innerText,
        price: card.querySelector(".price").innerText,
      };

      document.getElementById("modal-img").src = activeProduct.img;
      document.getElementById("modal-title").innerText = activeProduct.title;
      document.getElementById("modal-desc").innerText = activeProduct.desc;
      document.getElementById("modal-price").innerText = activeProduct.price;

      currentQty = 1;
      document.getElementById("qty-value").innerText = currentQty;

      modal.classList.add("active");
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  document.getElementById("qty-plus")?.addEventListener("click", () => {
    currentQty++;
    document.getElementById("qty-value").innerText = currentQty;
  });

  document.getElementById("qty-minus")?.addEventListener("click", () => {
    if (currentQty > 1) {
      currentQty--;
      document.getElementById("qty-value").innerText = currentQty;
    }
  });

  btnConfirmAdd?.addEventListener("click", () => {
    addToCart({
      ...activeProduct,
      qty: currentQty
    });

    modal.classList.remove("active");
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-overlay").classList.add("active");
  });
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener("DOMContentLoaded", () => {
  initMenuFilter();
  initCartDrawer();
  initProductModal();
});