document.addEventListener("DOMContentLoaded", () => {

    // const btnFeedback = document.getElementById("btnFeedback");

    // console.log(btnFeedback);

    // btnFeedback.addEventListener("click", () => {
    //     console.log("Botão clicado");
    // });

    // const btnEnviar = document.getElementById("btnEnviar");

     const lista = []

     const name = document.getElementById("nomes");
     const feedback = document.getElementById("textos");
     const botaoEnv = document.getElementById("btn-feedback");
     const listaHT = document.getElementById("listasTX");

    botaoEnv.addEventListener("click", () => {
        const nomes = name.value.trim();
        const textos = feedback.value.trim();
        if(nomes === "" || textos === "") return;
        
        lista.push({
            nome: nomes,
            feedback: textos
        })

        name.value = ""; 
        feedback.value = "";

        mostrarFeedbacks();
    })

    function mostrarFeedbacks(){
        listaHT.innerHTML = "";
        lista.forEach((item) => {
            const li = document.createElement("li")
            li.textContent = `${item.nome}: ${item.feedback}`
            listaHT.appendChild(li)
        })
    }
});