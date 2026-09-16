# Sintonia 2ª Edição — landing do acompanhante

Site estático **apenas explicativo** do evento **Sintonia: Criação e Vendas #002**,
voltado para o **acompanhante** convidado por um participante confirmado.

Diferente da landing principal (`sintonia-2-edicao`), esta página **não tem formulário
nem backend**: o link é enviado dentro de um **template do YCloud (WhatsApp)** e o
**aceite/recusa acontece pelos botões da própria mensagem do WhatsApp**, não na página.

A página traz: hero, contador regressivo, programação e local/mapa — com o texto em tom
de convite/boas-vindas.

## Rodar/testar localmente

```bash
python -m http.server 5500
```

Abra `http://localhost:5500`.

## Publicar

Publicar os arquivos estáticos (`index.html` + `assets/`) no host escolhido.
Não há configuração de backend/CORS.
