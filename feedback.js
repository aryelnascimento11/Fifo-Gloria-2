document.addEventListener("DOMContentLoaded", () => {

    const list = [];

    const estrelinha = document.getElementById("estrelas");
    const botaoENV = document.getElementById("btn-feedback");
    const user = document.getElementById("nomes");
    const comment = document.getElementById("textos");
    const feedList = document.getElementById("listasTX");

    botaoENV.addEventListener("click", () => {
        const usuario = user.value.trim();
        const comentario = comment.value.trim();
        const inputss = document.querySelector('input[name="nota"]:checked');
        const  sol =  inputss ? inputss.value : "";

        if (usuario === "" || comentario === "" || sol === "") return;

        list.push({
            user: usuario,
            comment: comentario,
            estrelinha: sol
        });

        user.value = "";
        comment.value = "";
        
        
        if(inputss){
            inputss.checked = false;
        }

        mostrarFeed();
    });

    function mostrarFeed() {
        feedList.innerHTML = "";
        list.forEach((item) => {
            const li = document.createElement("li");
            li.classList.add("feedback-item");
            li.innerHTML = `
            <span class="banana">${item.estrelinha}</span>
            <div class="dereto"> 
                <span>${item.user}:</span>
                <p>${item.comment}</p >
            
            </div>
            `
            
            feedList.appendChild(li);
        });
    }

});