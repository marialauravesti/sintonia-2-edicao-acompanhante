  // ---------- subtitulo do hero: palavra que alterna em loop ----------
  // Porta do padrao <AnimatePresence> + <motion.span> (Framer Motion) para JS puro:
  // o projeto e estatico, sem build step, entao React nao roda aqui.
  (function(){
    var PALAVRAS = [
      'O achachismo',
      'A barreira',
      'O ruído',
      'A disputa',
      'O impasse',
      'A guerra'
    ];
    var INTERVALO = 2500;  // tempo com a palavra parada
    var TRANSICAO = 400;   // precisa bater com a transicao do .rot-palavra no CSS

    var slot = document.querySelector('[data-palavras-rotativas]');
    if (!slot) return;

    var spans = PALAVRAS.map(function(texto){
      var span = document.createElement('span');
      span.className = 'rot-palavra';
      span.textContent = texto;
      slot.appendChild(span);
      return span;
    });

    var larguras = [];
    var atual = 0;
    var relogio = null;

    function medir(){
      larguras = spans.map(function(span){ return span.getBoundingClientRect().width; });
      slot.style.width = larguras[atual] + 'px';
    }

    // devolve o span para a posicao de espera sem animar o caminho de volta
    function repousar(span){
      span.classList.add('sem-transicao');
      span.classList.remove('ativa', 'saindo');
      void span.offsetWidth;                  // forca reflow antes de reativar
      span.classList.remove('sem-transicao');
    }

    function mostrar(indice){
      if (indice === atual) return;

      var saindo = spans[atual];
      var entrando = spans[indice];

      // quem entra precisa comecar limpo: se sobrasse a classe "saindo", ela venceria
      // "ativa" no CSS (mesma especificidade, declarada depois) e a palavra sumiria
      repousar(entrando);

      saindo.classList.remove('ativa');
      saindo.classList.add('saindo');
      entrando.classList.add('ativa');

      slot.style.width = larguras[indice] + 'px';
      atual = indice;

      setTimeout(function(){ repousar(saindo); }, TRANSICAO);
    }

    function iniciar(){
      medir();
      spans[0].classList.add('ativa');
      slot.classList.add('pronto');           // so agora libera a transicao de largura

      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      relogio = setInterval(function(){
        mostrar((atual + 1) % PALAVRAS.length);
      }, INTERVALO);
    }

    // as larguras dependem da fonte carregada e do font-size em vw
    var reMedir;
    window.addEventListener('resize', function(){
      clearTimeout(reMedir);
      reMedir = setTimeout(medir, 150);
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(iniciar);
    else window.addEventListener('load', iniciar);
  })();
