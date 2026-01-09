# 🌱 Ciclik - Plataforma de Reciclagem Gamificada

## 📋 Sobre o Projeto

Ciclik é uma plataforma web progressiva (PWA) que gamifica o processo de reciclagem, incentivando usuários a adotarem práticas sustentáveis através de um sistema de pontos, níveis e missões educativas.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Build Tool**: Vite
- **Gerenciador de Pacotes**: Bun / npm
- **PWA**: Service Worker + Manifest

## 📦 Estrutura do Projeto

```
ciclik-projeto/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── contexts/       # Context API (Auth, Profile)
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Funções utilitárias
│   └── types/          # Definições TypeScript
├── supabase/
│   └── migrations/     # Migrations do banco de dados
└── public/             # Assets estáticos
```

## 🔧 Instalação e Execução

### Pré-requisitos
- Node.js 18+ ou Bun
- Conta no Supabase

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/natanjs01/Ciclik_validacoes.git
   cd ciclik-projeto
   ```

2. **Instale as dependências**
   ```bash
   bun install
   # ou
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Execute as migrations do Supabase**
   ```bash
   supabase db push
   ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   bun run dev
   # ou
   npm run dev
   ```

6. **Acesse a aplicação**
   
   Abra [http://localhost:5173](http://localhost:5173) no navegador

## 🏗️ Build para Produção

```bash
bun run build
# ou
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 🌟 Funcionalidades Principais

- ✅ Cadastro e autenticação de usuários (PF e PJ)
- ✅ Upload de notas fiscais via QR Code
- ✅ Sistema de pontos e níveis
- ✅ Missões educativas sobre reciclagem
- ✅ Dashboard com estatísticas de reciclagem
- ✅ Sistema de cooperativas e pontos de coleta
- ✅ PWA com suporte offline

## 📱 Progressive Web App (PWA)

O Ciclik pode ser instalado como aplicativo no dispositivo do usuário, oferecendo:
- Funcionalidade offline
- Notificações push
- Experiência semelhante a um app nativo

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

Desenvolvido com 💚 pela equipe Ciclik

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do repositório no GitHub.

---

**Nota**: Este é um projeto em desenvolvimento ativo. Algumas funcionalidades podem estar em fase de testes
- React
- shadcn-ui
- Tailwind CSS

