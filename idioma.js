// Mapeamento dos textos nos dois idiomas
const traducoes = {
    pt: {
        menuInicio: "Início",
        menuSobre: "Sobre",
        heroSubtitle: "Preço justo, qualidade garantida",
        offersTitle: "Ofertas Relâmpago",
        btnMore: "Ver nossa loja",
        feedbackTitle: 'DÊ SEU <span>FEEDBACK</span>',
        feedbackSubtitle: "Conte sua experiência com a FIFO",
        lblAvaliacao: "SUA AVALIAÇÃO",
        phNome: "SEU NOME",
        phTexto: "SEU FEEDBACK (MÁX. 100 CARACTERES)",
        btnFeedback: "ENVIAR COMENTÁRIO",
        footerCopy: "© 2026 Fifo Gloria — Todos os direitos reservados"
    },
    en: {
        menuInicio: "Home",
        menuSobre: "About",
        heroSubtitle: "Fair price, guaranteed quality",
        offersTitle: "Flash Deals",
        btnMore: "Visit our store",
        feedbackTitle: 'GIVE YOUR <span>FEEDBACK</span>',
        feedbackSubtitle: "Tell us about your experience with FIFO",
        lblAvaliacao: "YOUR RATING",
        phNome: "YOUR NAME",
        phTexto: "YOUR FEEDBACK (MAX 100 CHARACTERS)",
        btnFeedback: "SUBMIT COMMENT",
        footerCopy: "© 2026 Fifo Gloria — All rights reserved"
    }
};

// Idioma padrão
let idiomaAtual = localStorage.getItem('idioma_fifo') || 'pt';

// Função para atualizar os elementos na página
function aplicarIdioma(lang) {
    const t = traducoes[lang];

    document.getElementById('menu-inicio').textContent = t.menuInicio;
    document.getElementById('menu-sobre').textContent = t.menuSobre;
    document.getElementById('hero-subtitle').textContent = t.heroSubtitle;
    document.getElementById('offers-title').textContent = t.offersTitle;
    document.getElementById('btn-more').textContent = t.btnMore;
    document.getElementById('feedback-title').innerHTML = t.feedbackTitle;
    document.getElementById('feedback-subtitle').textContent = t.feedbackSubtitle;
    document.getElementById('lbl-avaliacao').textContent = t.lblAvaliacao;
    document.getElementById('nomes').placeholder = t.phNome;
    document.getElementById('textos').placeholder = t.phTexto;
    document.getElementById('btn-feedback').textContent = t.btnFeedback;
    document.getElementById('footer-copy').textContent = t.footerCopy;

    // Atualiza a tag lang do HTML
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
}

// Evento do Botão PT / EN
document.getElementById('lang-btn').addEventListener('click', () => {
    idiomaAtual = idiomaAtual === 'pt' ? 'en' : 'pt';
    localStorage.setItem('idioma_fifo', idiomaAtual);
    aplicarIdioma(idiomaAtual);
});

// Aplica a tradução assim que a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    aplicarIdioma(idiomaAtual);
});