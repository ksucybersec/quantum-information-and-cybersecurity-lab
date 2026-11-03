/* margin-fx.js
   Decorative, interactive effects for the empty side margins on wide viewports.
   Gated by <body data-margin-fx="..."> and a min-width check; no-ops otherwise.
*/
(function(){

  var QUBIT_SYMBOLS = ['|0⟩', '|1⟩', '0', '1', 'ψ', '⟩'];
  var DEFAULT_PHRASES = ['BB84', 'E91', 'QKD', 'SHOR94', 'CHSH>2', 'NO-CLONE'];
  var HEX_CHARS = '0123456789ABCDEF';

  function rand(min, max){ return Math.random() * (max - min) + min; }
  function randInt(min, max){ return Math.floor(rand(min, max + 1)); }
  function pick(arr){ return arr[randInt(0, arr.length - 1)]; }

  function makeRail(side){
    var rail = document.createElement('div');
    rail.className = 'margin-rail margin-rail-' + side;
    document.body.appendChild(rail);
    return rail;
  }

  /* ---------- a. qubit-rain ---------- */
  function buildQubitRain(left, right){
    [left, right].forEach(function(rail){
      rail.classList.add('margin-rail--qubit-rain');
      var count = randInt(8, 10);
      for (var i = 0; i < count; i++){
        var span = document.createElement('span');
        span.className = 'qubit-symbol';
        span.textContent = pick(QUBIT_SYMBOLS);
        var dur = rand(8, 16);
        var delay = rand(0, dur);
        var left_pct = rand(5, 90);
        span.style.left = left_pct + '%';
        span.style.animationDuration = dur + 's';
        span.style.animationDelay = '-' + delay + 's';
        span.style.fontSize = rand(13, 15) + 'px';
        rail.appendChild(span);
        attachQubitClick(span);
      }
    });
  }

  function attachQubitClick(span){
    span.addEventListener('click', function(){
      if (span.classList.contains('collapsing')) return;
      span.textContent = pick(['|0⟩', '|1⟩']);
      span.classList.add('collapsing');
      setTimeout(function(){
        span.classList.remove('collapsing');
        span.textContent = pick(QUBIT_SYMBOLS);
      }, 600);
    });
  }

  /* ---------- b. circuit-trace ---------- */
  function buildCircuitTrace(left, right){
    [left, right].forEach(function(rail){
      rail.classList.add('margin-rail--circuit-trace');
      rail.innerHTML = buildCircuitSvg();
    });
  }

  function buildCircuitSvg(){
    var pathCount = randInt(2, 3);
    var w = 100, h = 1000; /* viewBox units; svg scales with rail */
    var paths = '';
    for (var p = 0; p < pathCount; p++){
      var x = randInt(15, 85);
      var points = [];
      var y = 0;
      points.push([x, y]);
      var segs = randInt(2, 3);
      for (var s = 0; s < segs; s++){
        y += randInt(150, 300);
        points.push([x, y]);
        x = randInt(15, 85);
        points.push([x, y]);
      }
      y = h;
      points.push([x, y]);
      var d = 'M ' + points.map(function(pt){ return pt[0] + ' ' + pt[1]; }).join(' L ');
      paths += '<path class="circuit-path" d="' + d + '"></path>';
      var nodeCount = randInt(2, 3);
      for (var n = 0; n < nodeCount; n++){
        var idx = randInt(1, points.length - 2);
        var node = points[idx];
        paths += '<circle class="circuit-node" cx="' + node[0] + '" cy="' + node[1] + '" r="4"></circle>';
      }
    }
    return '<svg class="circuit-svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + paths + '</svg>';
  }

  /* ---------- c. cipher-stream ---------- */
  function randomHexLine(len){
    var s = '';
    for (var i = 0; i < len; i++) s += HEX_CHARS[randInt(0, 15)];
    return s;
  }

  function buildCipherStream(left, right, phrases){
    [left, right].forEach(function(rail){
      rail.classList.add('margin-rail--cipher-stream');
      var col = document.createElement('div');
      col.className = 'cipher-col';
      rail.appendChild(col);
      var lineCount = randInt(8, 12);
      var lines = [];
      for (var i = 0; i < lineCount; i++){
        var len = randInt(6, 10);
        var lineEl = document.createElement('div');
        lineEl.className = 'cipher-line';
        lineEl.dataset.len = len;
        lineEl.textContent = randomHexLine(len);
        col.appendChild(lineEl);
        lines.push(lineEl);
      }

      /* ambient re-scramble of a random line */
      setInterval(function(){
        var l = pick(lines);
        if (l.classList.contains('resolved') || l.classList.contains('resolving')) return;
        l.textContent = randomHexLine(parseInt(l.dataset.len, 10));
      }, randInt(150, 250));

      /* periodic phrase resolve */
      function scheduleResolve(){
        setTimeout(function(){
          resolveRandomLine(lines, phrases);
          scheduleResolve();
        }, rand(8000, 12000));
      }
      scheduleResolve();
    });
  }

  function resolveRandomLine(lines, phrases){
    var line = pick(lines);
    if (line.classList.contains('resolving') || line.classList.contains('resolved')) return;
    var len = parseInt(line.dataset.len, 10);
    var phrase = pick(phrases).toUpperCase();
    if (phrase.length > len) phrase = phrase.slice(0, len);
    while (phrase.length < len) phrase += ' ';

    line.classList.add('resolving');
    var totalMs = 400;
    var perChar = totalMs / len;
    var revealed = '';
    var i = 0;
    var current = line.textContent;
    function step(){
      revealed += phrase[i];
      line.textContent = revealed + randomHexLine(len - revealed.length);
      i++;
      if (i < len){
        setTimeout(step, perChar);
      } else {
        line.textContent = phrase;
        line.classList.remove('resolving');
        line.classList.add('resolved');
        setTimeout(function(){
          line.classList.remove('resolved');
          line.textContent = randomHexLine(len);
        }, 2500);
      }
    }
    step();
  }

  /* ---------- d. entropy-meter ---------- */
  function buildEntropyMeter(left, right){
    [left, right].forEach(function(rail){
      rail.classList.add('margin-rail--entropy-meter');

      var readout = document.createElement('div');
      readout.className = 'entropy-readout';
      rail.appendChild(readout);

      var stack = document.createElement('div');
      stack.className = 'entropy-stack';
      rail.appendChild(stack);

      var tickCount = 20;
      var ticks = [];
      for (var i = 0; i < tickCount; i++){
        var tick = document.createElement('div');
        tick.className = 'entropy-tick';
        stack.appendChild(tick);
        ticks.push(tick);
      }

      var interval = null;

      function randomizeTicks(){
        ticks.forEach(function(t){
          t.style.width = rand(10, 95) + '%';
          t.style.opacity = rand(0.15, 0.5);
        });
      }

      function startNoise(){
        randomizeTicks();
        interval = setInterval(randomizeTicks, 150);
      }

      function stopNoise(){
        if (interval){ clearInterval(interval); interval = null; }
      }

      startNoise();

      rail.addEventListener('mouseenter', function(){
        stopNoise();
        rail.classList.add('entropy-active');
        ticks.forEach(function(t, idx){
          var wv = 40 + 40 * Math.sin(idx / tickCount * Math.PI * 2);
          t.style.transition = 'width 1.5s ease, opacity 1.5s ease, background 1.5s ease';
          t.style.width = wv + '%';
          t.style.opacity = 0.8;
        });
        var bits = rand(0, 1).toFixed(2);
        readout.textContent = bits + ' BITS';
        readout.classList.add('visible');
      });

      rail.addEventListener('mouseleave', function(){
        readout.classList.remove('visible');
        rail.classList.remove('entropy-active');
        ticks.forEach(function(t){
          t.style.transition = '';
        });
        startNoise();
      });
    });
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function(){
    var effect = document.body.dataset.marginFx;
    if (!effect) return;
    if (window.innerWidth < 1400) return;

    var builders = {
      'qubit-rain': buildQubitRain,
      'circuit-trace': buildCircuitTrace,
      'cipher-stream': null, /* handled below, needs phrase list */
      'entropy-meter': buildEntropyMeter
    };

    if (!(effect in builders)) return;

    var left = makeRail('left');
    var right = makeRail('right');

    if (effect === 'cipher-stream'){
      var phraseAttr = document.body.dataset.marginPhrases;
      var phrases = phraseAttr ? phraseAttr.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : DEFAULT_PHRASES;
      buildCipherStream(left, right, phrases);
      return;
    }

    builders[effect](left, right);
  });

})();
