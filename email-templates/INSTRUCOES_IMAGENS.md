# 🖼️ Como Resolver Imagens Quebradas nos Emails

## Problema Identificado
As imagens nos templates de email estão apontando para GitHub, mas nem todos os clientes de email carregam imagens externas por segurança ou porque o repositório não é público.

## ✅ Soluções Disponíveis

### **Solução 1: Usar Supabase Storage (RECOMENDADO)**

Esta é a melhor solução para produção:

#### **Passo 1: Criar Bucket Público**
1. Acesse **Supabase Dashboard** → **Storage** (ícone de pasta no menu lateral)
2. Clique em **"New bucket"**
3. Nome do bucket: `email-images`
4. **IMPORTANTE:** Marque a opção **"Public bucket"** ✅
5. Clique em **"Create bucket"**

#### **Passo 2: Upload das Imagens**
1. Clique no bucket `email-images` que você criou
2. Clique em **"Upload file"**
3. Faça upload dessas 2 imagens da pasta `public/` do projeto:
   - **`logo-with-slogan.png`** → Logo completo Ciclik com slogan (use esta!)
   - **`folhas-ciclik.png`** → Ícone de folhas para o footer

#### **Passo 3: Copiar URLs Públicas**

**Para cada imagem:**

1. Na lista de arquivos, clique nos **3 pontinhos (⋮)** ao lado da imagem
2. Selecione **"Copy URL"** ou **"Get URL"**
3. A URL terá este formato:
   ```
   https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/logo-with-slogan.png
   ```

**Ou copie manualmente:**
```
https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/logo-with-slogan.png
https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/folhas-ciclik.png
```

💡 **Dica:** Para pegar seu `[SEU-PROJETO-ID]`, veja a URL do Supabase Dashboard:
```
https://supabase.com/dashboard/project/[SEU-PROJETO-ID]
```

#### **Passo 4: Atualizar Templates**

**No `template-confirmacao-email.html`:**

```html
<!-- ANTES (linha ~17): -->
<img src="https://raw.githubusercontent.com/natanjs01/Ciclik_validacoes/main/public/ciclik-logo-full.png" alt="Ciclik">

<!-- DEPOIS: -->
<img src="https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/logo-with-slogan.png" alt="Ciclik">
```

```html
<!-- ANTES (linha ~132): -->
<img src="https://raw.githubusercontent.com/natanjs01/Ciclik_validacoes/main/public/folhas-ciclik.png" alt="Ciclik Icon">

<!-- DEPOIS: -->
<img src="https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/folhas-ciclik.png" alt="Ciclik Icon">
```

**No `template-recuperacao-senha.html`:**

```html
<!-- ANTES (linha ~17): -->
<img src="https://raw.githubusercontent.com/natanjs01/Ciclik_validacoes/main/public/ciclik-logo-full.png" alt="Ciclik">

<!-- DEPOIS: -->
<img src="https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/logo-with-slogan.png" alt="Ciclik">
```

```html
<!-- ANTES (linha ~83): -->
<img src="https://raw.githubusercontent.com/natanjs01/Ciclik_validacoes/main/public/folhas-ciclik.png" alt="Ciclik Icon">

<!-- DEPOIS: -->
<img src="https://[SEU-PROJETO-ID].supabase.co/storage/v1/object/public/email-images/folhas-ciclik.png" alt="Ciclik Icon">
```

**Vantagens:**
- ✅ Sempre funciona em todos os clientes de email
- ✅ Rápido e confiável (CDN do Supabase)
- ✅ Integrado ao seu projeto
- ✅ URLs permanentes e públicas
- ✅ Não expõe código do projeto

---

### **Solução 2: Tornar Repositório Público**

Se o repositório for público, as URLs do GitHub funcionarão:

1. GitHub → Repositório → **Settings** → **Change visibility** → **Public**
2. As URLs atuais funcionarão automaticamente

**Atenção:** Isso expõe todo o código do projeto!

---

### **Solução 3: Usar Imagens em Base64 (Backup)**

As imagens já estão embutidas nos templates, mas alguns clientes de email podem bloquear.

**Passo a passo para ativar:**

Os arquivos já têm Base64 parcial. Para usar 100%, os templates precisam das strings Base64 completas das imagens.

---

## 📋 Como Testar os Emails

### **Teste Rápido no Supabase:**

1. **Vá para:** Supabase Dashboard → **Authentication** → **Email Templates**
2. **Selecione o template:** "Confirm signup" ou "Reset password"
3. **Cole o HTML** atualizado do template correspondente
4. **Clique em:** "Send test email to [seu-email]"
5. **Verifique seu email** (inbox ou spam)

### **Checklist de Verificação:**

✅ As imagens aparecem corretamente?
✅ O logo está nítido e legível?
✅ O ícone de folhas está visível no footer?
✅ As cores estão corretas (verde #10b981)?

### **Se as imagens NÃO aparecerem:**

1. ✅ Verifique se o bucket `email-images` está marcado como **"Public"**
2. ✅ Confirme que as URLs estão corretas (copie novamente do Supabase)
3. ✅ Teste copiar a URL e abrir no navegador (deve mostrar a imagem)
4. ✅ Verifique se não há espaços extras nas URLs do HTML

### **Clientes de Email Testados:**

- ✅ Gmail (Web e App)
- ✅ Outlook (Web e Desktop)  
- ✅ Apple Mail (iOS/macOS)
- ✅ Yahoo Mail
- ✅ Protonmail

---

## 🎨 Imagens que Você Precisa Fazer Upload

### **Imagem 1: Logo Ciclik com Slogan**
- **Arquivo do projeto:** `public/logo-with-slogan.png` ⭐ **USE ESTA**
- **Dimensões:** 180px de largura (responsiva)
- **Descrição:** Logo completo da Ciclik com slogan verde
- **Uso:** Header verde dos emails (topo)
- **Nome no Supabase:** `logo-with-slogan.png`

### **Imagem 2: Ícone de Folhas**
- **Arquivo do projeto:** `public/folhas-ciclik.png`
- **Dimensões:** 40px de largura
- **Descrição:** Ícone verde com folhas/natureza da Ciclik
- **Uso:** Footer dos emails (rodapé)
- **Nome no Supabase:** `folhas-ciclik.png`

> 💡 **Dica:** Use o `logo-with-slogan.png` em vez de `ciclik-logo-full.png` para melhor qualidade nos emails!

---

## 🚀 Próximos Passos (Tempo Total: ~10 minutos)

### **⏱️ Passo a Passo Rápido:**

1. **Upload no Supabase Storage** (5 minutos)
   - Criar bucket público `email-images`
   - Upload de `logo-with-slogan.png`
   - Upload de `folhas-ciclik.png`

2. **Copiar URLs Públicas** (1 minuto)
   - Clicar nos 3 pontinhos (...) de cada imagem
   - Selecionar "Copy URL"
   - Salvar as URLs em um bloco de notas

3. **Atualizar Templates** (2 minutos)
   - Substituir URLs nos 2 templates (4 substituições no total)
   - Salvar os arquivos

4. **Testar no Supabase** (2 minutos)
   - Enviar email de teste
   - Verificar se imagens aparecem

**Pronto! Emails funcionando perfeitamente! 🎉**

---

### **🎯 Checklist Final:**

- [ ] Bucket `email-images` criado e público
- [ ] `logo-with-slogan.png` com upload feito
- [ ] `folhas-ciclik.png` com upload feito
- [ ] URLs copiadas e salvas
- [ ] 4 URLs atualizadas nos templates (2 em cada arquivo)
- [ ] Email de teste enviado
- [ ] Imagens aparecem corretamente

---

### **💾 Exemplo de URLs Finais:**

Depois de completar, suas URLs ficarão assim:

```
Logo: https://xyz123.supabase.co/storage/v1/object/public/email-images/logo-with-slogan.png
Folhas: https://xyz123.supabase.co/storage/v1/object/public/email-images/folhas-ciclik.png
```

> 💡 **Salve essas URLs!** Você precisará delas para futuros templates de email.

---

## 📧 Suporte

Se tiver dúvidas sobre como fazer upload no Supabase Storage, me pergunte!
