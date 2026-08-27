(function () {
  "use strict";

  const STORAGE_KEY = "fifo_cart_v1";
  const WHATS_NUMBER = "5547992779029";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
  }

  function centsToBRL(cents) {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  }

  function calcTotal(cart = loadCart()) {
    return cart.reduce((sum, i) => sum + (i.priceCents || 0) * (i.qty || 0), 0);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===== FUNÇÕES GLOBAIS (USADAS PELO INLINE DO HTML) =====
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

  // ===== DISPARO PARA O WHATSAPP =====
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

      // Captura direta dos elementos exatamente pelos IDs do seu HTML
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

      // Monta os itens do carrinho
      let textoItens = "";
      cart.forEach((i) => {
        textoItens += `• ${i.qty}x ${i.name} — ${centsToBRL(i.priceCents * i.qty)}\n`;
      });

      // Monta as linhas da mensagem garantindo a ordem
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
    renderCart();
    setupCheckout();
    window.alternarTipoEntrega();
  });
})();