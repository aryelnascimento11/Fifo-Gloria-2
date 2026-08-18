document.addEventListener("DOMContentLoaded",  async () => {

    const list = [];

    const nota = document.getElementById("estrelas");
    const botaoENV = document.getElementById("btn-feedback");
    const nome = document.getElementById("nomes");
    const mensagem = document.getElementById("textos");
    const feedList = document.getElementById("listasTX");


    async function carregarFeed(){
                const { data, erro } = await db
            .from("avaliacoes")
            .select("*")
            .order("criado_em", { ascending: true })
            .limit(6)

            if(error){
                console.error("deu errro", error.menssage)
                return;
            }

        mostrarFeed(data)
    }

    carregarFeed()

    botaoENV.addEventListener("click", async () => {
        const usuario = nome.value.trim();
        const comentario = mensagem.value.trim();
        const inputss = document.querySelector('input[name="result"]:checked');
        const sol = inputss ?   Number(inputss.value) : null;

        if (usuario === "" || comentario === "" || sol === null) return;

        const { error } = await db
            .from("avaliacoes")
            .insert([
                {
                    nome: usuario,
                    mensagem: comentario,
                    nota: Number(sol)
                }
            ])

            if(error){
                console.error("deiii erro", error.message);
                return;
            }


        nome.value = "";
        mensagem.value = "";


        if (inputss) {
            inputss.checked = false;
        }



        await carregarFeed();
    });

    function mostrarFeed(list) {
            if(!feedList)return;
        
        feedList.innerHTML = "";

        if(!list) return;

        list.forEach((item) => {
            const li = document.createElement("li");
            const VrEstre = Number(item.nota) || 0;
            const estrelas = "★" .repeat(VrEstre);
            li.classList.add("feedback-item");
            li.innerHTML = `
            <span class="banana">${estrelas}</span>
            <div class="dereto"> 
                <span>${item.nome}:</span>
                <p>${item.mensagem}</p >
            
            </div>
            `

            feedList.appendChild(li);
        });
    }

});

