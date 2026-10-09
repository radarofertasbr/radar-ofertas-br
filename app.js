/* Radar de Ofertas BR — landing: rastreamento, consentimento, A/B, vitrine e compartilhamento */
(function () {
  'use strict';
  var C = window.RADAR_CONFIG || {};
  var WA = C.WHATSAPP_URL;
  var V = window.RADAR_VARIANT || 'a';
  var d = document, ls;
  try { ls = window.localStorage; } catch (e) { ls = null; }
  function get(k) { try { return ls && ls.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { ls && ls.setItem(k, v); } catch (e) {} }
  function $(id) { return d.getElementById(id); }

  /* ---------- UTM: captura e persistência (primeiro e último toque) ---------- */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  var qs = new URLSearchParams(location.search), now = {}, has = false;
  KEYS.forEach(function (k) { var v = qs.get(k); if (v) { now[k] = v.slice(0, 100); has = true; } });
  if (has) {
    now.ts = Date.now();
    set('radar_utm_last', JSON.stringify(now));
    if (!get('radar_utm_first')) set('radar_utm_first', JSON.stringify(now));
  }
  var last = {}; try { last = JSON.parse(get('radar_utm_last') || '{}'); } catch (e) {}
  if (last.ts && Date.now() - last.ts > 90 * 864e5) last = {}; // UTM vale 90 dias

  function baseParams(extra) {
    var p = { ab_variant: V, headline_variant: 'headline_' + V, hero_image_variant: 'hero_' + V, button_text_variant: 'button_' + V,
      page_path: location.pathname, referrer_host: (d.referrer ? (function(){try{return new URL(d.referrer).host}catch(e){return ''}})() : '') };
    KEYS.forEach(function (k) { if (k !== 'fbclid' && last[k]) p[k] = last[k]; });
    p.has_fbclid = last.fbclid ? 1 : 0;
    for (var k in extra) p[k] = extra[k];
    return p;
  }

  /* ---------- Contador anônimo (sem cookies) ---------- */
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40); }
  function count(key) {
    if (!C.COUNTER_NAMESPACE || !C.COUNTER_BASE) return;
    var url = C.COUNTER_BASE + '/hit/' + C.COUNTER_NAMESPACE + '/' + slug(key);
    try { fetch(url, { mode: 'cors', keepalive: true, credentials: 'omit' }).catch(function () {}); } catch (e) {}
  }

  /* ---------- Meta Pixel com consentimento (LGPD) ---------- */
  var pixelOn = false;
  function loadPixel() {
    if (pixelOn || !C.PIXEL_ID) return;
    pixelOn = true;
    /* snippet oficial da Meta */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,d,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', String(C.PIXEL_ID).replace(/\D/g, ''));
    window.fbq('track', 'PageView');
    window.fbq('trackCustom', 'LandingView', baseParams({}));
  }
  function fb(kind, name, params) { if (pixelOn && window.fbq) window.fbq(kind, name, params); }

  var consentBox = $('consent'), reopen = $('consent-reopen');
  function decide(v) { set('radar_consent', v); consentBox.classList.remove('show'); if (v === 'granted') loadPixel(); }
  if (C.PIXEL_ID) {
    reopen.hidden = false;
    var c = get('radar_consent');
    if (c === 'granted') loadPixel(); else if (c !== 'denied') consentBox.classList.add('show');
    $('consent-yes').onclick = function () { decide('granted'); };
    $('consent-no').onclick = function () { decide('denied'); };
    reopen.onclick = function () { consentBox.classList.add('show'); };
  }

  /* camada de dados para futuras ferramentas (GTM etc.) */
  window.dataLayer = window.dataLayer || [];
  function track(name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params));
  }

  /* visualização (1 vez por sessão) */
  try { if (!sessionStorage.getItem('radar_seen')) { sessionStorage.setItem('radar_seen', '1'); count('view_' + V); } } catch (e) { count('view_' + V); }
  track('landing_view', baseParams({}));

  /* ---------- Cliques no WhatsApp (conversão principal) ---------- */
  function navigate(url, newTab) { if (newTab) window.open(url, '_blank', 'noopener'); else location.href = url; }
  d.querySelectorAll('[data-cta="whatsapp"]').forEach(function (a) {
    a.href = WA; // garante o link oficial exato
    a.addEventListener('click', function (ev) {
      var p = baseParams({ button_id: a.id || 'whatsapp', section: a.getAttribute('data-section') || '', destination: 'whatsapp_group', content_name: 'Grupo WhatsApp Radar de Ofertas BR' });
      fb('track', 'Lead', p);
      fb('track', 'Contact', p);
      fb('trackCustom', 'WhatsAppGroupClick', p);
      track('whatsapp_group_click', p);
      count('wa_' + V); count('wa_btn_' + p.button_id);
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1) return; // abrir em nova aba: deixa o navegador agir
      ev.preventDefault();
      setTimeout(function () { navigate(WA); }, pixelOn ? 300 : 120);
    });
  });

  /* ---------- Vitrine do Radar (conversão secundária; links oficiais SEM alteração) ---------- */
  var VIT = (C.VITRINE_URL || '').trim();
  d.querySelectorAll('[data-cta="vitrine"]').forEach(function (a) {
    if (!/^https?:\/\//i.test(VIT)) { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'VITRINE DE OFERTAS: EM BREVE'; return; }
    a.href = VIT; a.target = '_blank'; a.rel = 'noopener sponsored'; a.removeAttribute('aria-disabled');
    a.addEventListener('click', function () {
      var p = baseParams({ button_id: a.id || 'vitrine', section: 'vitrine', destination: 'shopee_vitrine', content_name: 'Vitrine do Afiliado Shopee' });
      fb('trackCustom', 'VitrineClick', p);
      fb('track', 'ViewContent', p);
      track('vitrine_click', p);
      count('vit_' + V); count('vit_btn_' + p.button_id);
    });
  });
  /* produtos do catálogo (gerado por tools/gerar_vitrine.py) */
  d.querySelectorAll('[data-cta="produto"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var p = baseParams({ button_id: 'produto', section: 'vitrine', destination: 'shopee_produto', product_code: a.getAttribute('data-code'), category: a.getAttribute('data-cat'), content_name: 'Produto ' + a.getAttribute('data-code') });
      fb('trackCustom', 'VitrineProductClick', p);
      track('vitrine_product_click', p);
      count('prod_' + V); count('prod_cat_' + p.category);
    });
  });
  var prods = [].slice.call(d.querySelectorAll('.prod')), more = $('prods-more'), PAGE = +C.VITRINE_PAGE_SIZE || 8, shown = PAGE, filt = 'todas';
  function render() {
    var total = 0;
    prods.forEach(function (li) {
      var ok = filt === 'todas' || (' ' + li.getAttribute('data-cats') + ' ').indexOf(' ' + filt + ' ') > -1;
      if (ok) total++;
      li.classList.toggle('hide', !(ok && total <= shown));
    });
    if (more) more.hidden = total <= shown;
  }
  if (prods.length) {
    render();
    if (more) more.addEventListener('click', function () { shown += PAGE; render(); count('vit_mais'); });
    d.querySelectorAll('.chip[data-filter]').forEach(function (c) {
      c.addEventListener('click', function () {
        d.querySelectorAll('.chip[data-filter]').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
        c.classList.add('on'); c.setAttribute('aria-pressed', 'true');
        filt = c.getAttribute('data-filter'); shown = PAGE; render();
        var p = baseParams({ section: 'vitrine', category: filt }); track('vitrine_filter', p); fb('trackCustom', 'VitrineFilter', p);
      });
    });
  }

  /* ---------- Botão flutuante: aparece depois do botão principal ---------- */
  var fab = $('cta-flutuante'), hero = $('cta-hero');
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (e) { fab.classList.toggle('show', !e[0].isIntersecting && e[0].boundingClientRect.top < 0); }).observe(hero);
  } else fab.classList.add('show');

  /* ---------- Compartilhar ---------- */
  function shareUrl(src) {
    var u = new URL(location.href); u.search = ''; u.hash = '';
    u.searchParams.set('utm_source', src); u.searchParams.set('utm_medium', 'share'); u.searchParams.set('utm_campaign', 'indicacao');
    return u.toString();
  }
  var shareText = 'Olha que legal: um grupo GRÁTIS de ofertas e cupons no WhatsApp! 🔥 Antes de comprar, consulte o Radar 👉 ';
  var sw = $('share-wa');
  sw.href = 'https://wa.me/?text=' + encodeURIComponent(shareText + shareUrl('whatsapp'));
  sw.addEventListener('click', function () { var p = baseParams({ button_id: 'share-wa', method: 'whatsapp' }); fb('trackCustom', 'Share', p); track('share', p); count('share_whatsapp'); });
  function toast(t) { var el = $('toast'); el.textContent = t; el.classList.add('show'); setTimeout(function () { el.classList.remove('show'); }, 2200); }
  $('share-copy').addEventListener('click', function () {
    var url = shareUrl('copia_link');
    var done = function () { toast('Link copiado! ✅'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
    function fallback() { var t = d.createElement('textarea'); t.value = url; t.style.position = 'fixed'; t.style.opacity = '0'; d.body.appendChild(t); t.select(); try { d.execCommand('copy'); done(); } catch (e) { prompt('Copie o link:', url); } d.body.removeChild(t); }
    var p = baseParams({ button_id: 'share-copy', method: 'copy_link' }); fb('trackCustom', 'Share', p); track('share', p); count('share_copy');
  });
  var sn = $('share-native');
  if (navigator.share) {
    sn.hidden = false;
    sn.addEventListener('click', function () {
      navigator.share({ title: 'Radar de Ofertas BR', text: shareText, url: shareUrl('compartilhar') }).catch(function () {});
      var p = baseParams({ button_id: 'share-native', method: 'native' }); fb('trackCustom', 'Share', p); track('share', p); count('share_native');
    });
  }
})();
