# 📧 Templates de Email Profissionais - Ciclik

Este diretório contém templates de email HTML prontos para uso no Supabase.

## 📁 Arquivos Disponíveis

### 1. **template-confirmacao-email.html**
Template para confirmação de email ao criar uma nova conta.
- Ícone de celebração 🎉
- Lista de benefícios do app
- Botão CTA verde
- Link alternativo para copiar/colar

### 2. **template-recuperacao-senha.html**
Template para recuperação/redefinição de senha.
- Ícone de chave 🔑
- Aviso de segurança destacado
- Botão CTA verde
- Aviso de expiração do link (1 hora)

## 🎨 Características dos Templates

- ✅ **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- ✅ **CSS Inline**: Máxima compatibilidade com clientes de email
- ✅ **Imagens do Ciclik**: Logo e ícones do projeto
- ✅ **Gradientes Verdes**: Identidade visual da marca
- ✅ **Acessível**: Boa hierarquia visual e contraste
- ✅ **Profissional**: Layout limpo e moderno

## 🚀 Como Usar no Supabase

### Método 1: Via Dashboard (Recomendado)

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto **Ciclik_validacoes**
3. Vá em **Authentication** → **Email Templates**
4. Selecione o template desejado:
   - **Confirm signup** (confirmação de email)
   - **Reset password** (recuperação de senha)
5. Cole o conteúdo HTML do arquivo correspondente
6. Clique em **Save**

### Método 2: Via Configuração Local

Se você tem um arquivo `supabase/config.toml`, adicione:

```toml
[auth.email.template.confirmation]
subject = "Confirme seu email - Ciclik"
content_path = "./email-templates/template-confirmacao-email.html"

[auth.email.template.recovery]
subject = "Redefinir sua senha - Ciclik"
content_path = "./email-templates/template-recuperacao-senha.html"
```

## 🔧 Variáveis do Supabase

Os templates usam variáveis do Supabase que são automaticamente substituídas:

- `{{ .ConfirmationURL }}` - URL para confirmação/recuperação
- `{{ .Token }}` - Token de confirmação (se necessário)
- `{{ .Email }}` - Email do usuário (se necessário)

## ⚠️ Observações Importantes

1. **Imagens**: Os templates usam URLs do GitHub para as imagens. Certifique-se de que:
   - As imagens existem no repositório
   - O repositório está público ou use URLs alternativas

2. **Teste antes de usar**: Sempre teste os emails enviando para você mesmo antes de ativar em produção.

3. **Personalização**: Você pode personalizar:
   - Cores (atualize os valores hex)
   - Textos (mantenha as variáveis {{ }})
   - Imagens (substitua as URLs)

## 🎨 Paleta de Cores Usada

- **Verde Principal**: `#10b981` (Emerald 500)
- **Verde Escuro**: `#059669` (Emerald 600)
- **Verde Claro**: `#f0fdf4` (Emerald 50)
- **Cinza Texto**: `#6b7280` (Gray 500)
- **Cinza Título**: `#1f2937` (Gray 800)

## 📱 Preview

Para visualizar os templates:
1. Abra os arquivos `.html` diretamente no navegador
2. Ou use uma ferramenta como [Litmus](https://www.litmus.com/) para testar em diferentes clientes de email

## 🆘 Suporte

Se tiver problemas:
1. Verifique se as variáveis `{{ }}` não foram alteradas
2. Teste o HTML em https://putsmail.com/
3. Verifique os logs do Supabase em **Logs** → **Auth**

---

**Desenvolvido para o Ciclik** 🌱 - Recicle e Ganhe
