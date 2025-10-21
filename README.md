# Tailwind Formatter

[![Version](https://img.shields.io/badge/version-0.0.4-blue.svg)](https://github.com/juniorcintra/tailwind-formatter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Extensão para Visual Studio Code que formata classes Tailwind CSS, separando-as em strings individuais para melhor legibilidade e organização do código.

---

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Exemplos](#exemplos)
- [Requisitos](#requisitos)
- [Licença](#licença)
- [Autor](#autor)

---

## 🎯 Sobre

O **Tailwind Formatter** é uma extensão do VS Code que facilita a formatação de classes Tailwind CSS. Ele transforma uma string única de classes em múltiplas strings separadas, tornando o código mais legível e fácil de manter.

---

## ✨ Funcionalidades

- ✅ Formata classes Tailwind CSS em strings separadas
- ✅ Funciona com qualquer arquivo (JSX, TSX, HTML, etc.)
- ✅ Acionado via menu de contexto (botão direito)
- ✅ Suporte para seleção de texto
- ✅ Rápido e eficiente

---

## 📦 Instalação

### Via Marketplace do VS Code

1. Abra o Visual Studio Code
2. Vá para a aba de Extensões (`Ctrl+Shift+X` ou `Cmd+Shift+X`)
3. Procure por "Tailwind Formatter"
4. Clique em "Instalar"

### Via Linha de Comando

```bash
code --install-extension tailwind-formatter
```

### Manual

1. Baixe o arquivo `.vsix` da [página de releases](https://github.com/juniorcintra/tailwind-formatter/releases)
2. No VS Code, vá em Extensions → `...` → Install from VSIX
3. Selecione o arquivo baixado

---

## 🚀 Como Usar

1. **Selecione** o texto com as classes Tailwind que deseja formatar
2. **Clique com o botão direito** para abrir o menu de contexto
3. **Selecione** a opção **"Formatar Tailwind"**
4. Pronto! Suas classes serão formatadas automaticamente

---

## 💡 Exemplos

### Exemplo 1: JSX/TSX

**Antes:**
```tsx
"mx-auto my-8 flex items-center justify-between"
```

**Depois:**
```tsx
"mx-auto", "my-8", "flex", "items-center", "justify-between"
```

### Exemplo 2: HTML com className

**Antes:**
```html
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
```

**Depois:**
```html
<div className="bg-blue-500", "text-white", "p-4", "rounded-lg", "shadow-md">
```

### Exemplo 3: React Component

**Antes:**
```tsx
const Button = () => (
  <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
    Click me
  </button>
);
```

**Depois:**
```tsx
const Button = () => (
  <button className="bg-indigo-600", "hover:bg-indigo-700", "text-white", "font-bold", "py-2", "px-4", "rounded">
    Click me
  </button>
);
```

---

## 📋 Requisitos

- Visual Studio Code versão 1.75.0 ou superior

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**[Junior Cintra](https://github.com/juniorcintra)**  
Desenvolvedor Full Stack

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

## 🐛 Reportar Bugs

Encontrou um bug? Por favor, abra uma [issue](https://github.com/juniorcintra/tailwind-formatter/issues) no GitHub.

---

## ⭐ Mostre seu apoio

Se este projeto te ajudou, considere dar uma ⭐️ no [GitHub](https://github.com/juniorcintra/tailwind-formatter)!
