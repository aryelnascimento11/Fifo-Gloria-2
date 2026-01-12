# 🛒 Mercado Fifo - Website

Site profissional para o Mercado Fifo com foco em apresentação de produtos e ofertas.

## ✨ Funcionalidades

### 🏠 Página Inicial (index.html)
- **Header fixo** com logo, menu de navegação e botão WhatsApp
- **Hero banner** com chamada principal
- **Sobre o Mercado** - apresentação da loja
- **O que você encontra aqui** - 4 categorias visuais (Hortifruti, Padaria, Bebidas, Limpeza)
- **Chamada para ações** - botões para ofertas
- **Footer** com informações de contato e redes sociais

### 🎯 Página de Ofertas (ofertas.html)
- **Barra de pesquisa funcional** - filtra produtos por nome em tempo real
- **Grid responsivo** de produtos (3 colunas desktop, 2 tablet, 1 mobile)
- **Organização visual** por categorias
- **Cards de produto** com:
  - Ícone/emoji representativo
  - Nome do produto
  - Preço
  - Tag "Oferta"
- **Botão WhatsApp flutuante** no canto inferior
- **Footer consistente** com a página inicial

### 🎨 Design
- **Cores vibrantes e profissionais** com verde como cor primária
- **Responsivo** para desktop, tablet e mobile
- **Animações suaves** ao passar o mouse
- **Ícones Font Awesome** para melhor apresentação visual
- **Layout limpo** e fácil de usar

## 🔧 Tecnologias

- **HTML5** - Estrutura semântica
- **CSS3** - Styling responsivo com media queries
- **JavaScript vanilla** - Pesquisa funcional sem dependências
- **Font Awesome 6.4** - Ícones

## 📁 Arquivos

```
.
├── index.html          # Página inicial
├── ofertas.html        # Página de ofertas
├── style.css           # Estilos globais
├── script.js           # Funcionalidade de pesquisa
└── README.md           # Este arquivo
```

## 🚀 Como Usar

1. Abra `index.html` no navegador
2. Clique em "Ofertas" para ver a página de ofertas
3. Use a barra de pesquisa para filtrar produtos
4. Clique nos botões WhatsApp para entrar em contato

## 📱 Responsividade

- **Desktop**: 3 colunas de produtos
- **Tablet (768px)**: 2 colunas de produtos
- **Mobile (480px)**: 1 coluna de produtos

## 🎯 Funcionalidades da Pesquisa

- Busca em tempo real conforme você digita
- Filtra por nome do produto
- Mostra contador de produtos encontrados
- Case-insensitive (maiúsculas/minúsculas não importam)
- Mensagem quando nenhum produto é encontrado

## 📝 Customização

### Adicionar Produtos
Edite o arquivo `script.js` e adicione novos produtos ao objeto `products`:

```javascript
{
    hortifruti: [
        { name: 'Nome do Produto', price: 'R$ X,XX', icon: '🌳' },
    ]
}
```

### Alterar Cores
Modifique as variáveis CSS em `style.css`:

```css
:root {
    --primary-color: #2ecc71;      /* Verde primário */
    --primary-dark: #27ae60;       /* Verde escuro */
    --secondary-color: #34495e;    /* Cinza azulado */
    --accent-color: #e74c3c;       /* Vermelho para destaques */
}
```

### Atualizar Contatos
Procure por `https://wa.me/5511999999999` e atualize o número do WhatsApp

## 📞 Contato

- **WhatsApp**: Botão flutuante em todas as páginas
- **Endereço**: Rua das Flores, 123 - Bom Retiro
- **Horário**: Seg-Sex 7h-20h | Sáb 7h-18h | Dom 8h-14h

## ⚖️ Licença

Projeto desenvolvido para Mercado Fifo © 2026
Um site para um comercio
