  // ---------- raios de luz no fundo do hero ----------
  // Porta do componente React <LightRays /> para WebGL puro. O original usa OGL,
  // que aqui exigiria bundler; o shader abaixo reproduz o mesmo efeito.
  // Parametros equivalentes: raysOrigin="top-center", raysColor="#5A39A2",
  // raysSpeed=1.5, lightSpread=0.8, rayLength=1.2, followMouse=true,
  // mouseInfluence=0.1, noiseAmount=0.1, distortion=0.05
  (function(){
    var COR = [0x5A / 255, 0x39 / 255, 0xA2 / 255];
    var VELOCIDADE = 1.5, ESPALHAMENTO = 0.8, COMPRIMENTO = 1.2;
    var INFLUENCIA_MOUSE = 0.1, RUIDO = 0.1, DISTORCAO = 0.05;
    var DPR_MAX = 2;

    var canvas = document.querySelector('[data-light-rays]');
    if (!canvas) return;

    // alpha real no canvas: evita depender de mix-blend-mode, que cria uma camada
    // de composicao propria e pode falhar ao pintar o conteudo por cima
    var gl = canvas.getContext('webgl', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false
    });
    if (!gl) return;   // sem WebGL o hero fica so com o gradiente, sem quebrar

    var VERT = [
      'attribute vec2 posicao;',
      'void main(){ gl_Position = vec4(posicao, 0.0, 1.0); }'
    ].join('\n');

    var FRAG = [
      'precision highp float;',
      'uniform vec2 iResolution;',
      'uniform float iTime;',
      'uniform vec2 rayPos;',
      'uniform vec2 rayDir;',
      'uniform vec3 raysColor;',
      'uniform float raysSpeed;',
      'uniform float lightSpread;',
      'uniform float rayLength;',
      'uniform float mouseInfluence;',
      'uniform vec2 mousePos;',
      'uniform float noiseAmount;',
      'uniform float distortion;',

      'float ruido(vec2 st){',
      '  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);',
      '}',

      'float forcaDoRaio(vec2 origem, vec2 direcao, vec2 coord, float semA, float semB, float vel){',
      '  vec2 v = coord - origem;',
      '  float dist = length(v);',
      '  vec2 dirNorm = v / max(dist, 0.0001);',
      '  float cosAng = dot(dirNorm, direcao);',
      '  float distorcido = cosAng + distortion * sin(iTime * 2.0 + dist * 0.01) * 0.2;',
      '  float espalha = pow(max(distorcido, 0.0), 1.0 / max(lightSpread, 0.001));',
      '  float distMax = iResolution.x * rayLength;',
      '  float quedaComprimento = clamp((distMax - dist) / distMax, 0.0, 1.0);',
      '  float quedaFade = clamp((iResolution.x * 0.45 - dist) / (iResolution.x * 0.45), 0.5, 1.0);',
      '  float base = clamp(',
      '    (0.45 + 0.15 * sin(distorcido * semA + iTime * vel)) +',
      '    (0.30 + 0.20 * cos(-distorcido * semB + iTime * vel)), 0.0, 1.0);',
      '  return base * quedaComprimento * quedaFade * espalha;',
      '}',

      'void main(){',
      '  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);',
      '  vec2 direcao = rayDir;',
      '  if (mouseInfluence > 0.0){',
      '    vec2 alvo = normalize(mousePos * iResolution - rayPos);',
      '    direcao = normalize(mix(direcao, alvo, mouseInfluence));',
      '  }',
      '  float r1 = forcaDoRaio(rayPos, direcao, coord, 36.2214, 21.11349, 1.5 * raysSpeed);',
      '  float r2 = forcaDoRaio(rayPos, direcao, coord, 22.3991, 18.0234, 1.1 * raysSpeed);',
      '  float intensidade = r1 * 0.5 + r2 * 0.4;',
      '  if (noiseAmount > 0.0){',
      '    float n = ruido(coord * 0.01 + iTime * 0.1);',
      '    intensidade *= (1.0 - noiseAmount + noiseAmount * n);',
      '  }',
      '  intensidade *= 0.1 + (1.0 - coord.y / iResolution.y) * 0.8;',  // mais forte perto da origem
      '  intensidade = clamp(intensidade, 0.0, 1.0);',
      '  gl_FragColor = vec4(raysColor * intensidade, intensidade);',  // premultiplicado

      '}'
    ].join('\n');

    function compilar(tipo, fonte){
      var s = gl.createShader(tipo);
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
        console.error('LightRays, erro no shader:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vs = compilar(gl.VERTEX_SHADER, VERT);
    var fs = compilar(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    var programa = gl.createProgram();
    gl.attachShader(programa, vs);
    gl.attachShader(programa, fs);
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)){
      console.error('LightRays, erro ao linkar:', gl.getProgramInfoLog(programa));
      return;
    }
    gl.useProgram(programa);

    // triangulo unico cobrindo a tela toda
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var attrPosicao = gl.getAttribLocation(programa, 'posicao');
    gl.enableVertexAttribArray(attrPosicao);
    gl.vertexAttribPointer(attrPosicao, 2, gl.FLOAT, false, 0, 0);

    function u(nome){ return gl.getUniformLocation(programa, nome); }
    var uResolucao = u('iResolution'), uTempo = u('iTime'), uRayPos = u('rayPos'),
        uRayDir = u('rayDir'), uMouse = u('mousePos');

    gl.uniform3fv(u('raysColor'), COR);
    gl.uniform1f(u('raysSpeed'), VELOCIDADE);
    gl.uniform1f(u('lightSpread'), ESPALHAMENTO);
    gl.uniform1f(u('rayLength'), COMPRIMENTO);
    gl.uniform1f(u('noiseAmount'), RUIDO);
    gl.uniform1f(u('distortion'), DISTORCAO);
    gl.uniform1f(u('mouseInfluence'), INFLUENCIA_MOUSE);

    var largura = 0, altura = 0;

    function redimensionar(){
      var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
      var caixa = canvas.getBoundingClientRect();
      largura = Math.max(1, Math.round(caixa.width * dpr));
      altura = Math.max(1, Math.round(caixa.height * dpr));
      if (canvas.width === largura && canvas.height === altura) return;
      canvas.width = largura;
      canvas.height = altura;
      gl.viewport(0, 0, largura, altura);
      gl.uniform2f(uResolucao, largura, altura);
      gl.uniform2f(uRayPos, largura * 0.5, 0.0);   // raysOrigin="top-center"
      gl.uniform2f(uRayDir, 0.0, 1.0);             // apontando para baixo
    }

    // mouse suavizado, para o movimento nao ficar travado
    var mouseAlvo = { x: 0.5, y: 0.5 }, mouseSuave = { x: 0.5, y: 0.5 };
    window.addEventListener('mousemove', function(evento){
      var caixa = canvas.getBoundingClientRect();
      mouseAlvo.x = (evento.clientX - caixa.left) / caixa.width;
      mouseAlvo.y = (evento.clientY - caixa.top) / caixa.height;
    }, { passive: true });

    window.addEventListener('resize', redimensionar);
    redimensionar();

    var semMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function desenhar(tempo){
      gl.uniform1f(uTempo, tempo * 0.001);
      mouseSuave.x += (mouseAlvo.x - mouseSuave.x) * 0.08;
      mouseSuave.y += (mouseAlvo.y - mouseSuave.y) * 0.08;
      gl.uniform2f(uMouse, mouseSuave.x, mouseSuave.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (semMovimento){ desenhar(0); return; }   // quadro unico, sem animar

    var visivel = true, quadro = null;

    function laco(tempo){
      desenhar(tempo);
      quadro = requestAnimationFrame(laco);
    }

    // nao gasta GPU enquanto o hero esta fora da tela
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(entradas){
        visivel = entradas[0].isIntersecting;
        if (visivel && !quadro) quadro = requestAnimationFrame(laco);
        else if (!visivel && quadro){ cancelAnimationFrame(quadro); quadro = null; }
      }, { threshold: 0 }).observe(canvas);
    }

    quadro = requestAnimationFrame(laco);
  })();
