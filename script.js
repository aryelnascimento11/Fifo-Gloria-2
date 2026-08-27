(function () {
  "use strict";

  // ===== CONFIGURAÇÕES =====
  const STORAGE_KEY = "fifo_cart_v1";
  const WHATS_NUMBER = "5547992779029";

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
    let s = String(value).replace(/[^\d.,-]/g, "").trim();
    if (!s) return 0;

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (hasComma && !hasDot) {
      s = s.replace(",", ".");
    } else if (!hasComma && hasDot) {
      const parts = s.split(".");
      if (parts.length > 2) s = parts.join("") + "." + parts.pop();
    }

    const num = Number.parseFloat(s);
    return Number.isNaN(num) ? 0 : Math.round(num * 100);
  }

  function centsToBRL(cents) {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===== LOCALSTORAGE =====
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
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
    if (countEl) {
      countEl.textContent = String(getCartCount());
    }
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

  function calcTotal(cart = loadCart()) {
    return cart.reduce((sum, i) => sum + (i.priceCents || 0) * (i.qty || 0), 0);
  }

  // ===== FUNÇÕES GLOBAIS =====
  window.alternarTipoEntrega = function () {
    const radio = $('input[name="tipo-entrega"]:checked');
    const camposEntrega = $("#campos-entrega");
    if (!radio || !camposEntrega) return;

    if (radio.value === "retirada") {
      camposEntrega.style.display = "none";
    } else {
      camposEntrega.style.display = "block";
    }
  };

  window.mascaraCPF = function (input) {
    let v = input.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    input.value = v;
  };

  // ===== ADICIONAR AO CARRINHO (LOJA/CATÁLOGO) =====
  function setupAddButtons() {
    // Procura por botões comuns de adicionar ao carrinho
    const btnList = $$(".add-cart, .btn-add, button[data-action='add']");

    btnList.forEach((btn, index) => {
      if (btn.dataset.hasListener) return;
      btn.dataset.hasListener = "true";

      btn.addEventListener("click", (e) => {
        const targetBtn = e.currentTarget;
        
        // Tenta achar o card do produto mais próximo
        const card = targetBtn.closest(".product-card, .offer-card, .card-produto, .produto, .item") || targetBtn.parentElement;

        if (!card) return;

        // Captura o nome
        const name = 
          card.dataset.name || 
          $("h3", card)?.textContent || 
          $("h2", card)?.textContent || 
          $(".nome-produto", card)?.textContent || 
          "Produto";

        // Captura o preço
        const priceRaw =
          card.dataset.price ||
          $(".new-price", card)?.textContent ||
          $(".price", card)?.textContent ||
          $(".preco", card)?.textContent ||
          "0";

        // Gerador de ID único se não houver no dataset
        const id = card.dataset.id || `item-${normalizeText(name).replace(/\s+/g, "-")}-${index}`;

        const priceCents = toCents(priceRaw);

        // Captura a quantidade
        const qtyInput = $("input[type='number']", card) || $(".quantity", card);
        let qty = qtyInput ? Number(qtyInput.value) : 1;
        if (!Number.isFinite(qty) || qty <= 0) qty = 1;

        // Salva no LocalStorage
        upsertItem({ id: String(id).trim(), name: String(name).trim(), priceCents, qty });

        // Feedback visual no botão
        const oldText = targetBtn.textContent;
        targetBtn.textContent = "Adicionado ✓";
        targetBtn.disabled = true;
        
        setTimeout(() => {
          targetBtn.textContent = oldText;
          targetBtn.disabled = false;
        }, 800);
      });
    });
  }

  // ===== OFERTAS DO SUPABASE =====
  async function carregarOfertasRelampago() {
    const container = $("#offers-grid");
    if (!container) return;

    const db = window.supabaseClient || window.db || window.supabase;
    if (!db || typeof db.from !== "function") return;

    try {
      const { data: ofertas, error } = await db
        .from("ofertas_relampago")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return;

      if (ofertas && ofertas.length > 0) {
        container.innerHTML = ofertas
          .map(
            (item) => `
            <div class="offer-card product-card" 
                 data-id="oferta-${item.id}" 
                 data-name="${escapeHtml(item.nome)}" 
                 data-price="${item.preco_novo}">
              <img src="${escapeHtml(item.imagem_url)}" alt="${escapeHtml(item.nome)}">
              <h3>${escapeHtml(item.nome)}</h3>
              <div class="prices">
                ${
                  item.preco_antigo
                    ? `<span class="old-price">R$ ${escapeHtml(item.preco_antigo)}</span>`
                    : ""
                }
                <span class="new-price">R$ ${escapeHtml(item.preco_novo)}</span>
              </div>
              <div class="actions" style="margin-top:10px; display:flex; gap:8px; align-items:center; justify-content:center;">
                <input type="number" class="quantity" value="1" min="1" style="width:50px; text-align:center; padding:5px; border-radius:6px; border:1px solid #ccc;">
                <button class="add-cart" style="cursor:pointer; padding:6px 12px; border-radius:6px; border:none; background:#28a745; color:#fff; font-weight:600;">Adicionar</button>
              </div>
            </div>
          `
          )
          .join("");

        setupAddButtons();
      }
    } catch (err) {
      console.error("Erro ao carregar ofertas:", err);
    }
  }

  // ===== RENDER DO CARRINHO =====
  function renderCart() {
    const listEl = $("#lista-itens");
    const totalEl = $("#total");
    if (!listEl || !totalEl) return;

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
        const itemTotal = (item.priceCents || 0) * (item.qty || 0);
        return `
          <div class="item-row" data-id="${escapeHtml(item.id)}"
            style="display:flex; gap:12px; align-items:center; justify-content:space-between; padding:14px; border-radius:16px; margin-bottom:12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12);">
            
            <div style="display:flex; flex-direction:column; gap:6px;">
              <strong style="font-size:15px;">${escapeHtml(item.name)}</strong>
              <span style="opacity:.85;">${centsToBRL(item.priceCents)} • Subtotal: ${centsToBRL(itemTotal)}</span>
            </div>

            <div style="display:flex; align-items:center; gap:10px;">
              <button class="qty-minus" style="border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">−</button>
              <span>${item.qty}</span>
              <button class="qty-plus" style="border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">+</button>
              <button class="remove-item" style="border:none; padding:6px 10px; border-radius:8px; cursor:pointer;">🗑</button>
            </div>
          </div>
        `;
      })
      .join("");

    $$(".item-row", listEl).forEach((row) => {
      const id = row.dataset.id;

      $(".qty-minus", row)?.addEventListener("click", () => {
        const cart = loadCart();
        const item = cart.find((i) => i.id === id);
        if (item) {
          item.qty -= 1;
          const cleaned = cart.filter((i) => i.qty > 0);
          saveCart(cleaned);
          renderCart();
        }
      });

      $(".qty-plus", row)?.addEventListener("click", () => {
        const cart = loadCart();
        const item = cart.find((i) => i.id === id);
        if (item) {
          item.qty += 1;
          saveCart(cart);
          renderCart();
        }
      });

      $(".remove-item", row)?.addEventListener("click", () => {
        const cart = loadCart().filter((i) => i.id !== id);
        saveCart(cart);
        renderCart();
      });
    });
  }

  // ===== CHECKOUT =====
  function setupCheckout() {
    const btnWhats = $("#finalizar-whats");
    const btnClear = $("#esvaziar-carrinho");

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        saveCart([]);
        renderCart();
      });
    }

    if (!btnWhats) return;

    btnWhats.addEventListener("click", () => {
      const cart = loadCart();

      if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
      }

      const elNome = $("#cliente-nome");
      const elCpf = $("#cliente-cpf");

      const nome = elNome ? elNome.value.trim() : "";
      const cpf = elCpf ? elCpf.value.trim() : "";

      if (!nome) {
        alert("Por favor, digite seu Nome Completo.");
        if (elNome) elNome.focus();
        return;
      }

      if (!cpf) {
        alert("Por favor, digite seu CPF.");
        if (elCpf) elCpf.focus();
        return;
      }

      const radioEntrega = $('input[name="tipo-entrega"]:checked');
      const tipoEntrega = radioEntrega ? radioEntrega.value : "entrega";

      const radioPagamento = $('input[name="pagamento"]:checked');
      const pagamento = radioPagamento ? radioPagamento.value : "Pix";

      const total = calcTotal(cart);

      let textoItens = "";
      cart.forEach((i) => {
        textoItens += `• ${i.qty}x ${i.name} — ${centsToBRL(i.priceCents * i.qty)}\n`;
      });

      let linhas = [];
      linhas.push("🛒 *NOVO PEDIDO - FIFO VIRTUAL*");
      linhas.push("");
      linhas.push(`👤 *Cliente:* ${nome}`);
      linhas.push(`📄 *CPF:* ${cpf}`);
      linhas.push("");
      linhas.push("*Itens do Pedido:*");
      linhas.push(textoItens.trim());
      linhas.push("");
      linhas.push(`*Total:* ${centsToBRL(total)}`);
      linhas.push(`*Forma de Pagamento:* ${pagamento}`);

      if (tipoEntrega === "retirada") {
        linhas.push(`📦 *Modalidade:* RETIRADA NO LOCAL`);
      } else {
        const elBairro = $("#bairro");
        const elRua = $("#endereco");
        const elNum = $("#Residencia");

        const bairro = elBairro ? elBairro.value.trim() : "";
        const rua = elRua ? elRua.value.trim() : "";
        const numero = elNum ? elNum.value.trim() : "";

        if (!bairro) {
          alert("Por favor, selecione seu bairro.");
          if (elBairro) elBairro.focus();
          return;
        }

        if (!rua) {
          alert("Por favor, digite sua rua/avenida.");
          if (elRua) elRua.focus();
          return;
        }

        if (!numero) {
          alert("Por favor, digite o número da sua residência.");
          if (elNum) elNum.focus();
          return;
        }

        linhas.push(`🚚 *Modalidade:* ENTREGA A DOMICÍLIO`);
        linhas.push(`📍 *Endereço:* ${rua}, Nº ${numero} - Bairro ${bairro}`);
      }

      const mensagemTexto = linhas.join("\n");
      const urlWhats = `https://api.whatsapp.com/send?phone=${WHATS_NUMBER}&text=${encodeURIComponent(mensagemTexto)}`;

      window.open(urlWhats, "_blank");
    });
  }

  // ===== INICIALIZAÇÃO =====
  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    setupAddButtons();
    carregarOfertasRelampago();
    renderCart();
    setupCheckout();
    window.alternarTipoEntrega();
  });
})();