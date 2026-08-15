fetch('/header.html')
  .then(resposta => resposta.text())
  .then(html => {
    document.getElementById('header-placeholder').innerHTML = html;
  });

fetch('/footer.html')
  .then(resposta => resposta.text())
  .then(html => {
    document.getElementById('footer-placeholder').innerHTML = html;
  });