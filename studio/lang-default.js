// EatNow Studio is made for restaurants in Japan, so it opens in Japanese until the owner picks
// English (the web pages open in English, for visitors). Runs before the studio's modules load.
try {
  if (!localStorage.getItem('eatnow.lang')) localStorage.setItem('eatnow.lang', 'ja');
} catch {}
