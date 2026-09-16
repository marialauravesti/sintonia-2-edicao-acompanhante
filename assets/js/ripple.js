  // ---------- efeito ripple nos botoes ----------
  // Porta do <RippleButton /> (MagicUI) para JS puro: o projeto e estatico, sem
  // build step, entao o componente React nao roda aqui. A cor sai da variavel
  // CSS --ripple-cor, definida em style.css.
  (function(){
    var DURACAO = 600; // precisa bater com a animacao "ripple" no CSS

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // delegacao no documento: pega qualquer .btn, inclusive os que surgirem depois
    document.addEventListener('click', function(evento){
      var botao = evento.target.closest('.btn');
      if (!botao) return;

      var caixa = botao.getBoundingClientRect();
      var diametro = Math.max(caixa.width, caixa.height);

      // acionamento por teclado (Enter/Espaco) chega sem coordenadas: centraliza
      var semCoordenadas = !evento.clientX && !evento.clientY;
      var x = semCoordenadas ? caixa.width / 2 : evento.clientX - caixa.left;
      var y = semCoordenadas ? caixa.height / 2 : evento.clientY - caixa.top;

      var onda = document.createElement('span');
      onda.className = 'ripple';
      onda.style.width = onda.style.height = diametro + 'px';
      onda.style.left = (x - diametro / 2) + 'px';
      onda.style.top = (y - diametro / 2) + 'px';

      botao.appendChild(onda);
      setTimeout(function(){ onda.remove(); }, DURACAO);
    });
  })();
