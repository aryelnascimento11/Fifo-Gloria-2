// ===== GERENCIAMENTO DE AUTENTICAÇÃO COM SUPABASE =====

// Inicializa a verificação ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  await verificarSessao();
});

// 1. Função para verificar se o administrador já está logado
async function verificarSessao() {
  const db = window.supabaseClient || window.db || window.supabase;
  if (!db) return;

  const { data: { session } } = await db.auth.getSession();

  const loginBox = document.getElementById("login-screen");
  const adminContent = document.getElementById("admin-content");

  if (session) {
    // Se estiver logado, exibe o painel
    if (loginBox) loginBox.style.display = "none";
    if (adminContent) adminContent.style.display = "block";
  } else {
    // Se não estiver logado, exige o login
    if (loginBox) loginBox.style.display = "block";
    if (adminContent) adminContent.style.display = "none";
  }
}

// 2. Função para realizar o login seguro
async function fazerLogin(event) {
  if (event) event.preventDefault();

  const db = window.supabaseClient || window.db || window.supabase;
  if (!db) {
    alert("Erro: Conexão com Supabase não foi encontrada. Verifique o arquivo supabase.js");
    return;
  }

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-senha").value.trim();

  if (!email || !password) {
    alert("Por favor, preencha o e-mail e a senha!");
    return;
  }

  // Tenta autenticar no servidor do Supabase
  const { data, error } = await db.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert("Acesso negado: E-mail ou senha incorretos!");
    console.error("Erro de autenticação:", error.message);
  } else {
    alert("Login realizado com sucesso!");
    await verificarSessao();
  }
}

// 3. Função para fazer Logout (Sair)
async function fazerLogout() {
  const db = window.supabaseClient || window.db || window.supabase;
  if (db) {
    await db.auth.signOut();
    alert("Você saiu do painel.");
    window.location.reload();
  }
}

// ===== PUBLICAÇÃO DE OFERTAS =====

async function publicarOferta() {
  // Pega a conexão do Supabase
  const db = window.supabaseClient || window.db || window.supabase;

  if (!db) {
    alert("Erro: Conexão com Supabase não foi encontrada. Verifique o arquivo supabase.js");
    return;
  }

  // Garante que o usuário está autenticado antes de permitir a publicação
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    alert("Sua sessão expirou ou você não está logado! Faça login novamente.");
    window.location.reload();
    return;
  }

  const nome = document.getElementById("prod-nome").value.trim();
  const precoAntigo = document.getElementById("prod-preco-antigo").value.trim();
  const precoNovo = document.getElementById("prod-preco-novo").value.trim();
  const fileInput = document.getElementById("prod-foto");
  const file = fileInput.files[0];

  if (!nome || !precoNovo || !file) {
    alert("Preencha o nome, preço promocional e selecione uma foto!");
    return;
  }

  try {
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}.${fileExt}`;

    // 1. Upload da foto no Storage
    const { data: storageData, error: storageError } = await db.storage
      .from('produtos')
      .upload(fileName, file);

    if (storageError) {
      alert("Erro no Upload do Storage: " + storageError.message);
      return;
    }

    // 2. Pegar a URL pública da imagem
    const { data: urlData } = db.storage
      .from('produtos')
      .getPublicUrl(fileName);

    const imagemUrl = urlData.publicUrl;

    // 3. Salvar na tabela ofertas_relampago
    const { error: insertError } = await db
      .from('ofertas_relampago')
      .insert([{
        nome: nome,
        preco_antigo: precoAntigo,
        preco_novo: precoNovo,
        imagem_url: imagemUrl
      }]);

    if (insertError) {
      alert("Erro ao Salvar no Banco: " + insertError.message);
    } else {
      alert("Oferta publicada com sucesso!");
      window.location.reload();
    }

  } catch (err) {
    console.error("Erro detalhado:", err);
    alert("Erro na execução: " + err.message);
  }
}