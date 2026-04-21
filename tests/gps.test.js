/**
 * @jest-environment jsdom
 */
'use strict';

const utils = require('../utils');
global.dmsParaDecimal = utils.dmsParaDecimal;
global.aplicarRefGps = utils.aplicarRefGps;

const { lerMetadadosExif } = require('../modules/gps');

describe('lerMetadadosExif()', () => {
  beforeEach(() => {
    global.EXIF = {
      getData: jest.fn((file, callback) => {
        callback.call(file);
      }),
      getTag: jest.fn(),
    };
  });

  afterEach(() => {
    delete global.EXIF;
  });

  test('retorna string vazia quando EXIF não está disponível', async () => {
    delete global.EXIF;
    const file = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const result = await lerMetadadosExif(file);
    expect(result).toBe('');
  });

  test('retorna string vazia para arquivo não-imagem', async () => {
    const file = new File([''], 'doc.pdf', { type: 'application/pdf' });
    const result = await lerMetadadosExif(file);
    expect(result).toBe('');
  });

  test('retorna dados de data quando DateTimeOriginal está presente', async () => {
    global.EXIF.getTag = jest.fn((ctx, tag) => {
      if (tag === 'DateTimeOriginal') return '2026:04:21 14:30:00';
      return undefined;
    });
    const file = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const result = await lerMetadadosExif(file);
    expect(result).toContain('21/04/2026');
    expect(result).toContain('14:30');
  });

  test('inclui coordenadas GPS quando disponíveis', async () => {
    global.EXIF.getTag = jest.fn((ctx, tag) => {
      if (tag === 'GPSLatitude') return [23, 30, 0];
      if (tag === 'GPSLongitude') return [46, 38, 0];
      if (tag === 'GPSLatitudeRef') return 'S';
      if (tag === 'GPSLongitudeRef') return 'W';
      return undefined;
    });
    const file = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const result = await lerMetadadosExif(file);
    expect(result).toContain('GPS:');
    expect(result).toContain('-23.5');
  });

  test('exibe mensagem quando GPS foi removido (coordenadas zeradas)', async () => {
    global.EXIF.getTag = jest.fn((ctx, tag) => {
      if (tag === 'GPSLatitude') return [0, 0, 0];
      if (tag === 'GPSLongitude') return [0, 0, 0];
      if (tag === 'GPSLatitudeRef') return 'S';
      if (tag === 'GPSLongitudeRef') return 'W';
      return undefined;
    });
    const file = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const result = await lerMetadadosExif(file);
    expect(result).toContain('Removido pelo sistema');
  });

  test('exibe mensagem quando GPS está bloqueado (sem tags GPS)', async () => {
    global.EXIF.getTag = jest.fn(() => undefined);
    const file = new File([''], 'foto.jpg', { type: 'image/jpeg' });
    const result = await lerMetadadosExif(file);
    expect(result).toContain('Bloqueado pelo aparelho celular');
  });
});
