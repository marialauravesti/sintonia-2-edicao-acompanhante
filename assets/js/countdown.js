  // ---------- contagem regressiva: flip clock (folha de 180 graus virando) ----------
  (function(){
    var alvo = new Date("2026-09-24T18:30:00-03:00").getTime();
    var grupos = ['cd-dias','cd-horas','cd-min','cd-seg'];
    var estado = {}; // valor atual exibido em cada digito
    var DURACAO_FLIP = 600; // precisa bater com --dur-flip no CSS
    var SEM_MOVIMENTO = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // cada digito tem 2 metades fixas por baixo + 2 folhas que giram por cima delas:
    // a folha de cima tomba 180deg (revelando a metade nova) e a de baixo assenta por cima.
    function criarDigito(container){
      var flip = document.createElement('div');
      flip.className = 'flip';
      flip.innerHTML =
        '<div class="peca fixa topo"><span>0</span></div>' +
        '<div class="peca fixa base"><span>0</span></div>' +
        '<div class="peca folha folha-topo topo"><span>0</span></div>' +
        '<div class="peca folha folha-base base"><span>0</span></div>';
      container.appendChild(flip);
      return flip;
    }

    // monta os 8 digitos (2 por unidade)
    grupos.forEach(function(id){
      var container = document.getElementById(id);
      criarDigito(container);
      criarDigito(container);
      estado[id] = ['0','0'];
    });

    function atualizarDigito(flip, novoValor){
      var fixaTopo    = flip.querySelector('.fixa.topo span');
      var fixaBase    = flip.querySelector('.fixa.base span');
      var folhaTopoEl = flip.querySelector('.folha-topo');
      var folhaTopo   = folhaTopoEl.querySelector('span');
      var folhaBase   = flip.querySelector('.folha-base span');

      // em repouso a folha de cima e o que aparece no topo, entao ela guarda o valor atual
      if (folhaTopo.textContent === novoValor) return;

      // com movimento reduzido, troca seca: sem isso o valor antigo ficaria meio
      // segundo na tela esperando uma animacao que nao vai rodar
      if (SEM_MOVIMENTO){
        fixaTopo.textContent = fixaBase.textContent = novoValor;
        folhaTopo.textContent = folhaBase.textContent = novoValor;
        return;
      }

      var velho = folhaTopo.textContent;
      fixaTopo.textContent  = novoValor; // fica embaixo; e revelado quando a folha de cima tomba
      folhaTopo.textContent = velho;     // a folha que cai carrega o valor ANTIGO
      folhaBase.textContent = novoValor; // a folha que assenta carrega o valor NOVO
      // a fixa de baixo segue com o valor antigo ate a folha de baixo pousar

      // fecha no mesmo frame em que a animacao termina (animationend), em vez de um
      // setTimeout que segurava a folha 1-2 frames a mais e dava a "travada" no fim
      var terminou = false;
      function finalizar(){
        if (terminou) return;
        terminou = true;
        folhaTopoEl.removeEventListener('animationend', aoTerminar);
        clearTimeout(reserva);
        folhaTopo.textContent = novoValor; // em repouso a folha de cima mostra o NOVO
        fixaBase.textContent  = novoValor; // e a metade de baixo tambem
        flip.classList.remove('girando');
      }
      function aoTerminar(e){ if (e.animationName === 'folhaCai') finalizar(); }

      flip.classList.remove('girando');
      void flip.offsetWidth;             // reinicia a animacao se ainda estava rodando
      flip.classList.add('girando');
      folhaTopoEl.addEventListener('animationend', aoTerminar);
      var reserva = setTimeout(finalizar, DURACAO_FLIP + 120); // rede de seguranca
    }

    function setUnidade(id, valor){
      var pad = String(valor).padStart(2,'0');
      var container = document.getElementById(id);
      var flips = container.querySelectorAll('.flip');
      if (estado[id][0] !== pad[0]){ atualizarDigito(flips[0], pad[0]); estado[id][0] = pad[0]; }
      if (estado[id][1] !== pad[1]){ atualizarDigito(flips[1], pad[1]); estado[id][1] = pad[1]; }
    }

    function tick(){
      var agora = Date.now();
      var diff = Math.max(0, alvo - agora);
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      setUnidade('cd-dias', d);
      setUnidade('cd-horas', h);
      setUnidade('cd-min', m);
      setUnidade('cd-seg', s);
    }
    tick();
    setInterval(tick, 1000);
  })();
