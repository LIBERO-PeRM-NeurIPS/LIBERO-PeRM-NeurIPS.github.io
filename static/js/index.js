// LIBERO-PeRM project page — minimal interactions

document.addEventListener('DOMContentLoaded', () => {
  // Bulma navbar burger (mobile)
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById('permNavMenu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      menu.classList.toggle('is-active');
    });
    // close menu after clicking a link (mobile)
    menu.querySelectorAll('.navbar-item').forEach((link) => {
      link.addEventListener('click', () => {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
      });
    });
  }

  // BibTeX copy button
  const copyBtn = document.getElementById('copyBibtex');
  const bibtex = document.getElementById('bibtexText');
  if (copyBtn && bibtex) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(bibtex.textContent.trim());
        copyBtn.querySelector('span:last-child').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.querySelector('span:last-child').textContent = 'Copy';
        }, 1600);
      } catch (e) {
        // clipboard API unavailable (e.g., non-HTTPS local file) — select text instead
        const range = document.createRange();
        range.selectNodeContents(bibtex);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }

  // Disabled resource buttons: block navigation until real links land
  document.querySelectorAll('.is-disabled-link').forEach((a) => {
    a.addEventListener('click', (e) => e.preventDefault());
  });
});
