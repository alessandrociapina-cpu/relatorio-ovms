'use strict';
/* global dmsParaDecimal, aplicarRefGps */

function lerMetadadosExif(file) {
  return new Promise((resolve) => {
    if (typeof EXIF === 'undefined' || !file.type.startsWith('image/')) {
      resolve('');
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
        textoMeta += `📍 GPS: Bloqueado pelo aparelho celular (Use o botão abaixo)`;
      }
      resolve(textoMeta.trim());
    });
  });
}

/* global module */
if (typeof module !== 'undefined') {
  module.exports = { lerMetadadosExif };
}
