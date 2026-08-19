document.addEventListener("DOMContentLoaded", async () => {

    const botaoENV = document.getElementById("btn-feedback");
    const nome = document.getElementById("nomes");
    const mensagem = document.getElementById("textos");
    const feedList = document.getElementById("listasTX");

    async function carregarFeed() {
        // Corrigido: 'error' em vez de 'erro'
        const { data, error } = await db
            .from("avaliacoes")
            .select("*")
            .order("criado_em", { ascending: false })
            .limit(6);

        if (error) {
            console.error("deu erro", error.message);
            return;
        }

        mostrarFeed(data);
    }

    // Carrega o feed ao abrir a página
    carregarFeed();

    // Evento do botão enviar
    botaoENV.addEventListener("click", async () => {
        const usuario = nome.value.trim();
        const comentario = mensagem.value.trim();
        const inputss = document.querySelector('input[name="result"]:checked');
        const sol = inputss ? Number(inputss.value) : null;

        // Trava caso falte algum campo
        if (usuario === "" || comentario === "" || sol === null) return;

        if(mensagem.length > 100){
            alert("100 caracteris")
         return}

        const { error } = await db
            .from("avaliacoes")
            .insert([
                {
                    nome: usuario,
                    mensagem: comentario,
                    nota: Number(sol)
                }
            ]);

        if (error) {
            console.error("deu erro", error.message);
            return;
        }

        // Limpa os campos do formulário
        nome.value = "";
        mensagem.value = "";

        if (inputss) {
            inputss.checked = false;
        }

        // Atualiza a lista na tela
        await carregarFeed();
    });

    // Função que desenha o feed
    function mostrarFeed(list) {
        if (!feedList) return;

        feedList.innerHTML = "";

        if (!list) return;

        list.forEach((item) => {
            const li = document.createElement("li");
            const VrEstre = Number(item.nota) || 0;
            const estrelas = "★".repeat(VrEstre);

            li.classList.add("feedback-item");
            li.innerHTML = `
                <span class="banana">${estrelas}</span>
                <div class="dereto"> 
                    <q>${item.nome}</q>
                    <p>${item.mensagem}</p>
                </div>
            `;

            feedList.appendChild(li);
        });
    }

});