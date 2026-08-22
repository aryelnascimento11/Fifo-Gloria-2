const bairros = ["garcia", "progresso", "gaspar alto"];

async function inicializarAutocomplete() {
    const ender = document.getElementById("endereco");
    if (!ender) return;

    // Aguarda a biblioteca Places carregar
    const { Autocomplete } = await google.maps.importLibrary("places");

    const autoComplete = new Autocomplete(ender, {
        componentRestrictions: { country: "br" },
        fields: ["formatted_address", "geometry", "address_components"]
    });

    autoComplete.addListener("place_changed", () => {
        const place = autoComplete.getPlace();

        if (!place.geometry || !place.address_components) {
            alert("Por favor, selecione um endereço válido da lista!");
            return;
        }

        let bairroEncontrado = "";

        for (const componente of place.address_components) {
            if (componente.types.includes("sublocality_level_1") || componente.types.includes("sublocality")) {
                bairroEncontrado = componente.long_name.toLowerCase();
                break;
            }
        }

        console.log("Bairro detectado:", bairroEncontrado);

        if (bairros.includes(bairroEncontrado)) {
            console.log("Endereço aprovado!");
        } else {
            alert("Atendemos apenas os bairros Garcia, Progresso e Gaspar Alto.");
            ender.value = "";
        }
    });
}

// Executa a inicialização
window.addEventListener("load", inicializarAutocomplete);