(function () {
  "use strict";

  // ===== CONFIG =====
  const STORAGE_KEY = "fifo_cart_v1";

  // WhatsApp do mercado (DDD + número, só dígitos)
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
    let s = String(value);
    s = s.replace(/[^\d.,-]/g, "").trim();

    if (!s) return 0;

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (lastComma > lastDot) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (hasComma && !hasDot) {
      s = s.replace(",", ".");
    } else if (!hasComma && hasDot) {
      const parts = s.split(".");
      if (parts.length > 2) {
        const dec = parts.pop();
        s = parts.join("") + "." + dec;
      }
    }

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
    saveCart(cleaned);
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

  // ===== CARREGAR OFERTAS DO SUPABASE =====
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

  // ===== ADD TO CART (todas páginas) =====
  function setupAddButtons() {
    $$(".product-card").forEach((card, index) => {
      const qtyInput = $(".quantity", card) || $('input[type="number"]', card);
      if (qtyInput && !qtyInput.classList.contains("quantity")) {
        qtyInput.classList.add("quantity");
      }

      if (!card.dataset.name) {
        const name = $("h3", card)?.textContent?.trim();
        if (name) card.dataset.name = name;
      }

      if (!card.dataset.price) {
        const priceText =
          $(".new-price", card)?.textContent?.trim() ||
          $(".new", card)?.textContent?.trim() ||
          $(".price", card)?.textContent?.trim();
        if (priceText) {
          const cents = toCents(priceText);
          card.dataset.price = String((cents / 100).toFixed(2));
        }
      }

      if (!card.dataset.id) {
        const base = normalizeText(card.dataset.name || `produto-${index + 1}`).replace(/\s+/g, "-");
        card.dataset.id = `auto-${base}-${index}`;
      }
    });

    $$(".add-cart").forEach((btn) => {
      if (btn.dataset.hasListener) return;
      btn.dataset.hasListener = "true";

      btn.addEventListener("click", (e) => {
        const card = e.currentTarget.closest(".product-card");
        if (!card) return;

        const id = String(card.dataset.id || "").trim();
        const name = String(card.dataset.name || $("h3", card)?.textContent || "Produto").trim();

        const priceRaw =
          card.dataset.price ||
          $(".new-price", card)?.textContent ||
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

  // ===== FUNÇÕES DE ENTREGA E MÁSCARA (EXPOSTAS NO ESCOPO GLOBAL) =====
  window.alternarTipoEntrega = function () {
    const radio = $('input[name="tipo-entrega"]:checked');
    if (!radio) return;
    const tipo = radio.value;
    const camposEntrega = $("#campos-entrega");
    if (!camposEntrega) return;

    if (tipo === "retirada") {
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

    const btnClear = $("#esvaziar-carrinho");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        saveCart([]);
        render();
      });
    }

    const btnWhats = $("#finalizar-whats");
    if (btnWhats) {
      btnWhats.addEventListener("click", () => {
        const cart = loadCart();

        if (cart.length === 0) {
          alert("Seu carrinho está vazio!");
          return;
        }

        // Pega diretamente pelos IDs do HTML ou por seletores flexíveis
        const elNome = document.getElementById("cliente-nome") || document.getElementById("nome") || document.querySelector('input[placeholder*="Nome"]');
        const elCpf = document.getElementById("cliente-cpf") || document.getElementById("cpf") || document.querySelector('input[placeholder*="CPF"]');

        const nome = elNome ? elNome.value.trim() : "";
        const cpf = elCpf ? elCpf.value.trim() : "";

        if (!nome || !cpf) {
          alert("Por favor, preencha o Nome Completo e o CPF.");
          if (!nome && elNome) elNome.focus();
          else if (!cpf && elCpf) elCpf.focus();
          return;
        }

        const radioEntrega = $('input[name="tipo-entrega"]:checked');
        const tipoEntrega = radioEntrega ? radioEntrega.value : "entrega";
        const pagamento = getSelectedPayment();
        const total = calcTotal(cart);

        let textoItens = "";
        cart.forEach((i) => {
          textoItens += `• ${i.qty}x ${i.name} — ${centsToBRL(i.priceCents * i.qty)}\n`;
        });

        // Montagem única e estruturada da mensagem
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
          const bairroSelect = $('select[name="bairro"]') || $("#bairro");
          const bairro = bairroSelect ? bairroSelect.value.trim() : "";
          const rua = $("#endereco") ? $("#endereco").value.trim() : "";
          const numero = $("#Residencia") ? $("#Residencia").value.trim() : "";

          if (!bairro) {
            alert("Por favor, selecione seu bairro.");
            if (bairroSelect) bairroSelect.focus();
            return;
          }

          if (!rua) {
            alert("Por favor, digite a sua rua.");
            $("#endereco")?.focus();
            return;
          }

          if (!numero) {
            alert("Por favor, digite o número da residência.");
            $("#Residencia")?.focus();
            return;
          }

          linhas.push(`🚚 *Modalidade:* ENTREGA A DOMICÍLIO`);
          linhas.push(`📍 *Endereço:* ${rua}, Nº ${numero} - ${bairro}`);
        }

        const mensagemFinal = linhas.join("\n");
        const url = `https://api.whatsapp.com/send?phone=${WHATS_NUMBER}&text=${encodeURIComponent(mensagemFinal)}`;
        window.open(url, "_blank");
      });
    }

    // Configura evento de alteração nos rádios de entrega
    $$('input[name="tipo-entrega"]').forEach((radio) => {
      radio.addEventListener("change", window.alternarTipoEntrega);
    });

    render();
  }

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    setupAddButtons();
    setupSearch();
    setupCartPage();
    carregarOfertasRelampago();
  });
})();