document.addEventListener("DOMContentLoaded", () => {

    const btnFeedback = document.getElementById("btnFeedback");

    console.log(btnFeedback);

    btnFeedback.addEventListener("click", () => {
        console.log("Botão clicado");
    });

});