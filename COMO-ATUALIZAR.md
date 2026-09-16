# Como atualizar a landing do acompanhante

Guia rápido para publicar mudanças da landing do **acompanhante** do **Sintonia 2ª Edição** em produção.

**No ar em:** https://bi.vesti.com.br/sintonia/acompanhante/

> Use o link **com a barra no final** (`/acompanhante/`), inclusive no template do YCloud.
> Sem a barra, o CSS e as imagens podem não carregar (os caminhos dos assets são relativos).

---

## Fluxo de atualização (o normal)

### 1. Na sua máquina — commit + push

```bash
cd sintonia-2-edicao-acompanhante
git add -A
git commit -m "descrição da mudança"
git push
```

> Push na branch `main` (o servidor está na `main`).

### 2. No servidor — rodar o script

```bash
ssh allan@216.238.108.108
/home/allan/atualizar-sintonia-acompanhante.sh
```

- Vai pedir a **senha do sudo** (normal; nada aparece enquanto digita).
- No fim precisa aparecer `HTTP 200` = deu certo.

### 3. Conferir

Abra https://bi.vesti.com.br/sintonia/acompanhante/ e dê **Ctrl+F5** (Windows) ou
**Cmd+Shift+R** (Mac) para forçar o refresh.

---

## Dica: cache de CSS/JS

Os assets são chamados com `?v=N` no `index.html` (ex.: `style.css?v=2`). Ao mudar
**visual ou JS**, incremente esse número (`?v=3`, `?v=4`, …) antes do push, para que o
navegador de quem já visitou pegue a versão nova. Mudança só de texto no HTML não precisa.

---

## O que o `atualizar-sintonia-acompanhante.sh` faz

1. `git pull --ff-only` no repo (`/home/allan/sintonia-2-edicao-acompanhante`)
2. Republica a landing em `/var/www/sintonia/acompanhante` (cria a pasta se não existir,
   copia `index.html` + `assets/`, ajusta o dono para `www-data`)
3. Checa se a página responde (`HTTP 200`)

Ele só toca em `/var/www/sintonia/acompanhante` e no repo do acompanhante —
**nunca** no nginx, na landing principal (`/var/www/sintonia`), no backend nem em outros sites.

Conteúdo do script (para recriar, se precisar):

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="/home/allan/sintonia-2-edicao-acompanhante"
DEST="/var/www/sintonia/acompanhante"

echo "==> [1/3] git pull..."
git -C "$REPO" pull --ff-only

echo "==> [2/3] Publicando em $DEST..."
sudo mkdir -p "$DEST"
sudo rm -rf "$DEST/assets"
sudo cp -r "$REPO/index.html" "$REPO/assets" "$DEST/"
sudo chown -R www-data:www-data "$DEST"

echo "==> [3/3] Checando..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://bi.vesti.com.br/sintonia/acompanhante/ || echo "(confira no navegador)"
echo "==> Pronto! https://bi.vesti.com.br/sintonia/acompanhante/"
```

---

## Referência da infraestrutura (servidor `allan@216.238.108.108`, Ubuntu 22.04)

| Item | Valor |
|---|---|
| Repo no servidor | `/home/allan/sintonia-2-edicao-acompanhante` (clonado via HTTPS) |
| Landing (estático) | `/var/www/sintonia/acompanhante` |
| Script de atualização | `/home/allan/atualizar-sintonia-acompanhante.sh` |
| Config nginx | nenhuma própria — servido pelo `location /sintonia/` de `/etc/nginx/snippets/sintonia.conf` |

### Observações

- **Repo público:** o servidor faz `git pull` via HTTPS, sem chave. Se o repositório virar
  **privado**, o pull vai falhar — aí será preciso criar uma deploy key para ele (como a
  landing principal usa, em `~/.ssh/config`).
- **Convivência com a landing principal:** o `~/atualizar-sintonia.sh` só apaga
  `/var/www/sintonia/assets` e sobrescreve `/var/www/sintonia/index.html`, então **não**
  afeta a pasta `acompanhante/`. Se esse script mudar para limpar `/var/www/sintonia`
  inteiro, a página do acompanhante some — rode de novo o script do acompanhante.
