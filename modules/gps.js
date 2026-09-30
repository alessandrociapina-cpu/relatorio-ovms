'use strict';
/* global dmsParaDecimal, aplicarRefGps */

// Uma foto conta como "recém-capturada" se o arquivo foi gravado há menos disso.
const JANELA_CAPTURA_MS = 5 * 60 * 1000;

function _dataDoArquivo(file) {
  if (!file.lastModified) return '';
  const d = new Date(file.lastModified);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `🗓️ ${dia}/${mes}/${ano} às ${hora}:${min}`;
}

// Android zera (não remove) as coordenadas EXIF de fotos entregues a navegadores,
// por isso lat/lng = 0 é tratado como ausência de GPS.
function lerMetadadosExif(file) {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    if (typeof EXIF === 'undefined') {
      resolve(_dataDoArquivo(file));
      return;
    }

    EXIF.getData(file, function () {
      const partes = [];
      const dataExif = EXIF.getTag(this, 'DateTimeOriginal');
      const dh = typeof dataExif === 'string' ? dataExif.split(' ') : [];
      if (dh.length === 2) {
        partes.push(`🗓️ ${dh[0].split(':').reverse().join('/')} às ${dh[1].substring(0, 5)}`);
      } else {
        const dataArquivo = _dataDoArquivo(file);
        if (dataArquivo) partes.push(dataArquivo);
      }

      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      if (lat !== undefined && lng !== undefined) {
        try {
          const calcLat = aplicarRefGps(dmsParaDecimal(lat), EXIF.getTag(this, 'GPSLatitudeRef'));
          const calcLng = aplicarRefGps(dmsParaDecimal(lng), EXIF.getTag(this, 'GPSLongitudeRef'));
          if (calcLat !== 0 && calcLng !== 0 && !isNaN(calcLat) && !isNaN(calcLng)) {
            partes.push(`📍 GPS: ${calcLat.toFixed(6)}, ${calcLng.toFixed(6)}`);
          }
        } catch (_e) {
          // coordenadas ilegíveis: tratadas como ausentes
        }
      }
      resolve(partes.join('  '));
    });
  });
}

function temGps(meta) {
  return typeof meta === 'string' && meta.includes('📍 GPS:');
}

function foiCapturadaAgora(file, agora = Date.now()) {
  return !!file.lastModified && Math.abs(agora - file.lastModified) < JANELA_CAPTURA_MS;
}

function obterPosicaoAparelho(timeoutMs = 20000) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisao: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}

function formatarGpsAparelho(pos) {
  const precisao = Number.isFinite(pos.precisao) ? `, ±${Math.round(pos.precisao)} m` : '';
  return `📍 GPS: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)} (celular${precisao})`;
}

// Substitui (ou acrescenta) a coordenada mantendo a data/hora já registrada.
function substituirGps(meta, textoGps) {
  const base = limparMetaLegado(meta).split('📍')[0].trim();
  return base ? `${base}  ${textoGps}` : textoGps;
}

// Projetos salvos até a v62 gravaram avisos como "📍 GPS: Não encontrado na foto (...)"
// dentro do texto de metadados; eles não devem chegar ao relatório.
function limparMetaLegado(meta) {
  if (!meta) return '';
  return meta.replace(/📍 GPS: (Não encontrado|Não disponível|Removido|Falha)[^📍]*/gu, '').trim();
}

/* global module */
if (typeof module !== 'undefined') {
  module.exports = {
    lerMetadadosExif,
    temGps,
    foiCapturadaAgora,
    obterPosicaoAparelho,
    formatarGpsAparelho,
    substituirGps,
    limparMetaLegado,
  };
}
