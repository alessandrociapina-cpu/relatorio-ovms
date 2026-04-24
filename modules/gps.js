'use strict';
/* global dmsParaDecimal, aplicarRefGps */

function _dataDoArquivo(file) {
  if (!file.lastModified) return '';
  const d = new Date(file.lastModified);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `🗓️ ${dia}/${mes}/${ano} às ${hora}:${min}  `;
}

function lerMetadadosExif(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    if (typeof EXIF === 'undefined') {
      const meta =
        _dataDoArquivo(file) + '📍 GPS: Não disponível via navegador (use o botão abaixo)';
      resolve(meta.trim());
      return;
    }

    EXIF.getData(file, function () {
      let textoMeta = '';
      const dataExif = EXIF.getTag(this, 'DateTimeOriginal');
      if (dataExif) {
        const partes = dataExif.split(' ');
        if (partes.length === 2)
          textoMeta += `🗓️ ${partes[0].split(':').reverse().join('/')} às ${partes[1].substring(0, 5)}  `;
      }
      if (!textoMeta) textoMeta = _dataDoArquivo(file);

      const lat = EXIF.getTag(this, 'GPSLatitude');
      const lng = EXIF.getTag(this, 'GPSLongitude');
      const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
      const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

      if (lat !== undefined && lng !== undefined) {
        try {
          const calcLat = aplicarRefGps(dmsParaDecimal(lat), latRef);
          const calcLng = aplicarRefGps(dmsParaDecimal(lng), lngRef);

          if (calcLat !== 0 && calcLng !== 0 && !isNaN(calcLat) && !isNaN(calcLng)) {
            textoMeta += `📍 GPS: ${calcLat.toFixed(6)}, ${calcLng.toFixed(6)}`;
          } else {
            textoMeta += `📍 GPS: Removido pelo sistema do aparelho celular`;
          }
        } catch (e) {
          textoMeta += `📍 GPS: Falha na leitura`;
        }
      } else {
        textoMeta += `📍 GPS: Não disponível via navegador (use o botão abaixo)`;
      }
      resolve(textoMeta.trim());
    });
  });
}

/* global module */
if (typeof module !== 'undefined') {
  module.exports = { lerMetadadosExif };
}
