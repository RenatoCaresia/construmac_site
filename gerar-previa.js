// Gera a versão de prévia do site a partir de ./site, com selo "prévia de proposta" e noindex.
//
//   node gerar-previa.js          → ./previa  (link do claude.ai: mapa vira link e o formulário
//                                              mostra um botão, porque o visualizador de lá não
//                                              carrega iframes nem abre janelas)
//   node gerar-previa.js pages    → ./docs    (GitHub Pages: site completo, só com o selo e o noindex)
const fs = require('fs');
const path = require('path');

const PAGES = process.argv[2] === 'pages';
const SRC = path.join(__dirname, 'site');
const OUT = path.join(__dirname, PAGES ? 'docs' : 'previa');

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, { recursive: true });
if (PAGES) fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
else fs.rmSync(path.join(OUT, 'assets', 'img', 'og.jpg'), { force: true });

const swap = (text, from, to, label) => {
  if (!text.includes(from)) throw new Error(`Trecho não encontrado: ${label}`);
  return text.replace(from, to);
};

/* ---------- index.html ---------- */
const htmlPath = path.join(OUT, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(/<title>[^<]*<\/title>/, '<title>Prévia — proposta de novo site Construmac</title>\n<meta name="robots" content="noindex, nofollow">');

html = swap(html, '</head>', `<style>
.previa{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:95;display:flex;align-items:center;gap:.6rem;max-width:calc(100vw - 110px);padding:.5rem .95rem .5rem .5rem;border-radius:999px;background:rgba(3,20,47,.92);color:#fff;font:600 .8rem/1.25 Manrope,system-ui,sans-serif;box-shadow:0 12px 30px -12px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.previa b{flex:none;padding:.35rem .6rem;border-radius:999px;background:linear-gradient(100deg,#FBC505,#FB7701,#F94501);color:#051D43;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase}
.map--link{position:relative;display:grid;place-items:center;text-align:center;color:#fff;isolation:isolate}
.map--link img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.map--link::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(5,29,67,.68)}
.map--link strong{display:block;font-family:"Bricolage Grotesque",sans-serif;font-size:clamp(1.4rem,3vw,2.2rem);letter-spacing:-.03em;line-height:1.1;margin-bottom:.9rem}
@media (max-width:620px){.previa{left:14px;transform:none;max-width:calc(100vw - 96px);font-size:.72rem}}
</style>
</head>`, 'head');

html = swap(html, '<script src="js/main.js" defer></script>',
  '<div class="previa" role="note"><b>Prévia</b><span>Proposta de novo site — ainda não é o site oficial da Construmac</span></div>\n<script src="js/main.js" defer></script>', 'script');

if (!PAGES) {
  html = html.replace(/<div class="map" data-reveal>[\s\S]*?<\/div>/, `<a class="map map--link" data-reveal href="https://maps.app.goo.gl/P1o9qyqD7CrreAMJ9" target="_blank" rel="noopener">
      <img src="assets/img/cubatao.webp" alt="" loading="lazy">
      <span><strong>Av. Pedro José Cardoso, 411<br>Vila Paulista · Cubatão — SP</strong><span class="btn btn--primary">Abrir no Google Maps</span></span>
    </a>`);
  if (!html.includes('map--link" data-reveal')) throw new Error('Trecho não encontrado: mapa');
}

fs.writeFileSync(htmlPath, html);

/* ---------- main.js (só no link do claude.ai) ---------- */
if (!PAGES) {
  const jsPath = path.join(OUT, 'js', 'main.js');
  let js = fs.readFileSync(jsPath, 'utf8');
  js = swap(js, `    note.textContent = 'Abrindo o WhatsApp com a sua mensagem…';
    window.open(wa(text), '_blank', 'noopener');`,
  `    const go = document.createElement('a');
    go.href = wa(text);
    go.target = '_blank';
    go.rel = 'noopener';
    go.className = 'btn btn--dark btn--block';
    go.textContent = 'Mensagem pronta — abrir o WhatsApp';
    note.replaceChildren(go);`, 'window.open');
  fs.writeFileSync(jsPath, js);
}

const list = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) walk(p); else list.push(path.relative(OUT, p).replace(/\\/g, '/'));
});
walk(OUT);
console.log(`${path.basename(OUT)}/ gerada com ${list.length} arquivos`);
