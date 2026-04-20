'use strict';

const DEPARTAMENTO_PADRAO = 'Divisão de Manutenção e Serviços de São José dos Campos';

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatarDataISO(dateStr) {
  if (!dateStr) return '';
  const partes = dateStr.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return dateStr;
}

function resolverDepartamento(valor, customValue) {
  if (valor === 'Outros') return (customValue || '').trim() || DEPARTAMENTO_PADRAO;
  return valor || DEPARTAMENTO_PADRAO;
}

function criarBlocoAssinatura(nome, cargo, depto, assinaturaUrl) {
  const imgHtml = assinaturaUrl
    ? `<img src="${esc(assinaturaUrl)}" class="assinatura-imagem-limpa">`
    : `<div style="height: 50px;"></div>`;
  return `
    <div class="bloco-assinatura">
      ${imgHtml}
      <div class="linha-assinatura"></div>
      <strong>${esc(nome)}</strong>
      <span style="font-size: 0.85em; color: #555;">${esc(cargo)}</span>
      <span style="font-size: 0.85em; color: #555;">${esc(depto)}</span>
    </div>
  `;
}

if (typeof module !== 'undefined') {
  module.exports = { esc, formatarDataISO, resolverDepartamento, criarBlocoAssinatura };
}
