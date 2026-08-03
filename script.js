/* =========================
   FIFO VIRTUAL - script.js
   Carrinho + Busca + WhatsApp
   (1 arquivo para todas as páginas)
   ========================= */
async function testarConexao() {
  const { data, error } = await window.db
    .from("avaliacoes")
    .select("*");

  console.log(data);
  console.log(error);
}

testarConexao();
(function () {
  "use strict";

  // ===== CONFIG =====
  const STORAGE_KEY = "fifo_cart_v1";

  // WhatsApp do mercado (DDD + número, só dígitos)
  // Número: 55 47 9103-3447 => 554791033447
  const WHATS_NUMBER = "5547992472537";

  // ===== HELPERS =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizeText(s) {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function toCents(value) {
    // aceita:
    // "3.00" (ponto decimal)
    // "3,00" (vírgula decimal)
    // "R$ 3,00"
    // "1.234,56" (BR)
    // "1,234.56" (US) -> tenta se virar
    let s = String(value);

    // mantém só números, vírgula, ponto e sinal
    s = s.replace(/[^\d.,-]/g, "").trim();

    if (!s) return 0;

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      // Se tem os dois, decide qual é o decimal pelo último separador
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (lastComma > lastDot) {
        // "1.234,56" => remove pontos (milhar), troca vírgula por ponto
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        // "1,234.56" => remove vírgulas (milhar), mantém ponto decimal
        s = s.replace(/,/g, "");
      }
    } else if (hasComma && !hasDot) {
      // "3,00" => vírgula decimal
      s = s.replace(",", ".");
    } else if (!hasComma && hasDot) {
      // "3.00" => ponto decimal (ok)
      // se tiver mais de um ponto, remove todos menos o último (milhar doido)
      const parts = s.split(".");
      if (parts.length > 2) {
        const dec = parts.pop();
        s = parts.join("") + "." + dec;
      }
    } // else: só dígitos

    const num = Number.parseFloat(s);
    if (Number.isNaN(num)) return 0;
    return Math.round(num * 100);
  }

  function centsToBRL(cents) {
    const v = (cents / 100).toFixed(2).replace(".", ",");
    return `R$ ${v}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function getCartCount(cart = loadCart()) {
    return cart.reduce((acc, item) => acc + (item.qty || 0), 0);
  }

  function updateCartCount() {
    const countEl = $(".cart-count");
    if (!countEl) return;
    countEl.textContent = String(getCartCount());
  }

  function upsertItem({ id, name, priceCents, qty }) {
    const cart = loadCart();
    const idx = cart.findIndex((i) => i.id === id);

    if (idx >= 0) {
      cart[idx].qty += qty;
    } else {
      cart.push({ id, name, priceCents, qty });
    }

    const cleaned = cart.filter((i) => (i.qty || 0) > 0);
    saveCart(cleaned);
  }

  function removeItem(id) {
    const cart = loadCart().filter((i) => i.id !== id);
    saveCart(cart);
  }

  function setItemQty(id, qty) {
    const cart = loadCart();
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    item.qty = qty;
    const cleaned = cart.filter((i) => (i.qty || 0) > 0);
    saveCart(cleaned);
  }

  function calcTotal(cart = loadCart()) {
    return cart.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  }

  // ===== ADD TO CART (todas páginas) =====
  function setupAddButtons() {
    // padroniza inputs e dados
    $$(".product-card").forEach((card, index) => {
      // garante .quantity
      const qtyInput = $(".quantity", card) || $('input[type="number"]', card);
      if (qtyInput && !qtyInput.classList.contains("quantity")) {
        qtyInput.classList.add("quantity");
      }

      // data-name fallback (serve pra ofertas)
      if (!card.dataset.name) {
        const name = $("h3", card)?.textContent?.trim();
        if (name) card.dataset.name = name;
      }

      // data-price fallback (serve pra ofertas)
      if (!card.dataset.price) {
        const priceText =
          $(".new", card)?.textContent?.trim() ||
          $(".price", card)?.textContent?.trim();
        if (priceText) {
          const cents = toCents(priceText);
          card.dataset.price = String((cents / 100).toFixed(2));
        }
      }

      // data-id fallback
      if (!card.dataset.id) {
        const base = normalizeText(card.dataset.name || `produto-${index + 1}`).replace(/\s+/g, "-");
        card.dataset.id = `auto-${base}-${index}`;
      }
    });

    $$(".add-cart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.currentTarget.closest(".product-card");
        if (!card) return;

        const id = String(card.dataset.id || "").trim();
        const name = String(card.dataset.name || $("h3", card)?.textContent || "Produto").trim();

        // preço: prioridade pro data-price
        const priceRaw =
          card.dataset.price ||
          $(".new", card)?.textContent ||
          $(".price", card)?.textContent ||
          "0";

        const priceCents = toCents(priceRaw);

        const qtyInput = $(".quantity", card) || $('input[type="number"]', card);
        let qty = qtyInput ? Number(qtyInput.value) : 1;
        if (!Number.isFinite(qty) || qty <= 0) qty = 1;

        upsertItem({ id, name, priceCents, qty });

        const oldText = btn.textContent;
        btn.textContent = "Adicionado ✓";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = oldText;
          btn.disabled = false;
        }, 800);
      });
    });
  }

  // ===== SEARCH =====
  function setupSearch() {
    const input = $(".search-input");
    if (!input) return;

    input.addEventListener("input", () => {
      const q = normalizeText(input.value);
      const cards = $$(".product-card");

      cards.forEach((card) => {
        const name = card.dataset.name || $("h3", card)?.textContent || "";
        const hay = normalizeText(name);
        card.style.display = hay.includes(q) ? "" : "none";
      });
    });
  }

  // ===== CART PAGE =====
  function setupCartPage() {
    const listEl = $("#lista-itens");
    const totalEl = $("#total");
    if (!listEl || !totalEl) return;

    function getSelectedPayment() {
      const radios = $$('input[name="pagamento"]');
      const checked = radios.find((r) => r.checked);
      return checked?.value || "Pix";
    }

    function render() {
      const cart = loadCart();
      const total = calcTotal(cart);

      totalEl.textContent = centsToBRL(total);

      if (cart.length === 0) {
        listEl.innerHTML = `
          <div class="carrinho-vazio">
            <div class="pulse-icon"><i class="fa-solid fa-basket-shopping"></i></div>
            <p>Aguardando suas escolhas...</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = cart
        .map((item) => {
          const itemTotal = item.priceCents * item.qty;
          return `
            <div class="item-row" data-id="${escapeHtml(item.id)}"
              style="display:flex; gap:12px; align-items:center; justify-content:space-between; padding:14px; border-radius:16px; margin-bottom:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);">
              
              <div style="display:flex; flex-direction:column; gap:6px;">
                <strong style="font-size:15px;">${escapeHtml(item.name)}</strong>
                <span style="opacity:.85;">${centsToBRL(item.priceCents)} • Subtotal: ${centsToBRL(itemTotal)}</span>
              </div>

              <div style="display:flex; align-items:center; gap:10px;">
                <button class="qty-minus" aria-label="Diminuir"
                  style="border:none; padding:8px 12px; border-radius:12px; cursor:pointer;">−</button>

                <input class="qty-input" type="number" min="1" value="${item.qty}"
                  style="width:70px; text-align:center; padding:8px 10px; border-radius:12px; border:none; outline:none;">

                <button class="qty-plus" aria-label="Aumentar"
                  style="border:none; padding:8px 12px; border-radius:12px; cursor:pointer;">+</button>

                <button class="remove-item" aria-label="Remover" title="Remover"
                  style="border:none; padding:8px 12px; border-radius:12px; cursor:pointer;">🗑</button>
              </div>
            </div>
          `;
        })
        .join("");

      $$(".item-row", listEl).forEach((row) => {
        const id = row.dataset.id;

        $(".qty-minus", row)?.addEventListener("click", () => {
          const current = loadCart().find((i) => i.id === id);
          if (!current) return;
          setItemQty(id, Math.max(0, current.qty - 1));
          render();
        });

        $(".qty-plus", row)?.addEventListener("click", () => {
          const current = loadCart().find((i) => i.id === id);
          if (!current) return;
          setItemQty(id, current.qty + 1);
          render();
        });

        $(".remove-item", row)?.addEventListener("click", () => {
          removeItem(id);
          render();
        });

        $(".qty-input", row)?.addEventListener("change", (e) => {
          let v = Number(e.target.value);
          if (!Number.isFinite(v) || v <= 0) v = 1;
          setItemQty(id, v);
          render();
        });
      });
    }

    // Esvaziar
    const btnClear = $("#esvaziar-carrinho");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        saveCart([]);
        render();
      });
    }

    // Finalizar WhatsApp
    const btnWhats = $("#finalizar-whats");
    if (btnWhats) {
      btnWhats.addEventListener("click", () => {
        const cart = loadCart();

        if (cart.length === 0) {
          alert("Seu carrinho está vazio!");
          return;
        }

        const pagamento = getSelectedPayment();
        const endereco = $("#endereco")?.value?.trim() || "";

        if (!endereco) {
          alert("Por favor, digite o endereço completo para entrega.");
          return;
        }

        const total = calcTotal(cart);

        const lines = [];
        lines.push("Olá! Quero fazer um pedido:");
        lines.push("");

        cart.forEach((i) => {
          lines.push(`• ${i.qty}x ${i.name} — ${centsToBRL(i.priceCents * i.qty)}`);
        });

        lines.push("");
        lines.push(`Total: ${centsToBRL(total)}`);
        lines.push(`Pagamento: ${pagamento}`);
        lines.push(`Endereço: ${endereco}`);

        const msg = lines.join("\n");
        const url = `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(msg)}`;
        window.open(url, "_blank");
      });
    }

    render();
  }

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    setupAddButtons();
    setupSearch();
    setupCartPage();
  });
})();
