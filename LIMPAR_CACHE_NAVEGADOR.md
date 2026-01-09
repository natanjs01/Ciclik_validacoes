# 🔄 Como Limpar o Cache do Navegador

## ✅ Alteração Realizada

O texto na página `/user` foi alterado de:
```
{pontosRestantes} pts para {proximoNivel}
```

Para:
```
Próximo: {pontosRestantes} pontos para atingir o próximo nível
```

## 🚨 Problema: Cache do Navegador

O navegador está mostrando a versão antiga da página porque está usando cache.

## 🔧 Soluções

### Opção 1: Hard Refresh (Mais Rápido)

**Windows/Linux:**
- Pressione `Ctrl + Shift + R`
- OU `Ctrl + F5`

**Mac:**
- Pressione `Cmd + Shift + R`

### Opção 2: Limpar Cache Completo

**Chrome/Edge:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Escolha "Últimas 24 horas"
4. Clique em "Limpar dados"

**Firefox:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cache"
3. Clique em "Limpar agora"

### Opção 3: Modo Incógnito/Anônimo

Abra uma nova janela em modo incógnito:
- `Ctrl + Shift + N` (Chrome/Edge)
- `Ctrl + Shift + P` (Firefox)

### Opção 4: DevTools (Para Desenvolvedores)

1. Pressione `F12` para abrir DevTools
2. Clique com botão direito no ícone de atualizar
3. Selecione "Esvaziar cache e recarregar forçado"

### Opção 5: Reiniciar o Servidor de Desenvolvimento

Se nada funcionar, reinicie o servidor:
```bash
# Parar o servidor (Ctrl + C no terminal)
# Depois executar novamente:
npm run dev
```

## ✨ Verificação

Após limpar o cache, o texto deve aparecer como:
```
Próximo: 250 pontos para atingir o próximo nível
```

Em vez de:
```
Próximo: Protetor Ciclik
```
