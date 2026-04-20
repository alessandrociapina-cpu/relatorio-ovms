'use strict';

const DEPARTAMENTO_PADRAO = 'Divisão de Manutenção e Serviços de São José dos Campos';

function esc(str) {
  if (str === null || str === undefined) return '';
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

function dmsParaDecimal(coords) {
  if (typeof coords === 'number') return coords;
  if (typeof coords === 'string') return parseFloat(coords);
  if (coords && coords.length >= 3) {
    const d = coords[0] && coords[0].valueOf ? coords[0].valueOf() : parseFloat(coords[0]) || 0;
    const m = coords[1] && coords[1].valueOf ? coords[1].valueOf() : parseFloat(coords[1]) || 0;
    const s = coords[2] && coords[2].valueOf ? coords[2].valueOf() : parseFloat(coords[2]) || 0;
    return d + m / 60 + s / 3600;
  }
  return 0;
}

function aplicarRefGps(valor, ref) {
  if (ref === 'S' || ref === 'W') return Math.abs(valor) * -1;
  if (ref === 'N' || ref === 'E') return Math.abs(valor);
  return valor;
}

function sanitizarNomeArquivo(valor) {
  if (!valor || !valor.trim()) return 'sem-local';
  return valor.trim().replace(/[^a-zA-Z0-9-]/g, '_');
}

function validarEsquemaProjeto(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return false;
  if ('form' in dados && (typeof dados.form !== 'object' || Array.isArray(dados.form)))
    return false;
  if ('fotos' in dados && !Array.isArray(dados.fotos)) return false;
  return true;
}

/* global module */
if (typeof module !== 'undefined') {
  module.exports = {
    esc,
    formatarDataISO,
    resolverDepartamento,
    criarBlocoAssinatura,
    dmsParaDecimal,
    aplicarRefGps,
    sanitizarNomeArquivo,
    validarEsquemaProjeto,
  };
}
