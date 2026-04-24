'use strict';

// Carrega dmsParaDecimal e aplicarRefGps de utils.js como globais
const { dmsParaDecimal, aplicarRefGps } = require('../utils');
global.dmsParaDecimal = dmsParaDecimal;
global.aplicarRefGps = aplicarRefGps;

// Fábrica de mocks EXIF — retorna tags configuráveis
function criarExifMock(tags = {}) {
  return {
    getData: jest.fn((file, callback) => {
      callback.call({
        _tags: tags,
      });
    }),
    getTag: jest.fn(function (obj, tag) {
      return obj._tags ? obj._tags[tag] : undefined;
    }),
  };
}

const { lerMetadadosExif } = require('../modules/gps');

afterEach(() => {
  delete global.EXIF;
});

// --- Casos sem leitura EXIF ---

describe('lerMetadadosExif() — sem EXIF disponível', () => {
  test('retorna mensagem GPS bloqueado quando EXIF é undefined', async () => {
    delete global.EXIF;
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('Bloqueado pelo aparelho celular');
  });

  test('usa lastModified como data de fallback quando EXIF é undefined', async () => {
    delete global.EXIF;
    const lastModified = new Date(2024, 5, 15, 10, 30).getTime(); // 15/06/2024 10:30
    const resultado = await lerMetadadosExif({ type: 'image/jpeg', lastModified });
    expect(resultado).toContain('15/06/2024');
    expect(resultado).toContain('10:30');
    expect(resultado).toContain('Bloqueado pelo aparelho celular');
  });

  test('resolve com "" para arquivo não-imagem', async () => {
    global.EXIF = criarExifMock();
    const resultado = await lerMetadadosExif({ type: 'application/pdf' });
    expect(resultado).toBe('');
  });

  test('resolve com "" para tipo vazio', async () => {
    global.EXIF = criarExifMock();
    const resultado = await lerMetadadosExif({ type: '' });
    expect(resultado).toBe('');
  });
});

// --- Data/hora EXIF ---

describe('lerMetadadosExif() — data/hora', () => {
  test('inclui data formatada quando DateTimeOriginal presente', async () => {
    global.EXIF = criarExifMock({ DateTimeOriginal: '2024:06:15 10:30:00' });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('15/06/2024');
    expect(resultado).toContain('10:30');
  });

  test('não inclui data quando DateTimeOriginal ausente e sem lastModified', async () => {
    global.EXIF = criarExifMock({});
    const resultado = await lerMetadadosExif({ type: 'image/png' });
    expect(resultado).not.toContain('🗓️');
  });

  test('usa lastModified como fallback quando DateTimeOriginal ausente', async () => {
    global.EXIF = criarExifMock({});
    const lastModified = new Date(2024, 0, 20, 9, 5).getTime(); // 20/01/2024 09:05
    const resultado = await lerMetadadosExif({ type: 'image/jpeg', lastModified });
    expect(resultado).toContain('20/01/2024');
    expect(resultado).toContain('09:05');
  });

  test('ignora DateTimeOriginal com formato inválido (sem espaço)', async () => {
    global.EXIF = criarExifMock({ DateTimeOriginal: '2024:06:15' });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).not.toContain('🗓️');
  });
});

// --- GPS ---

describe('lerMetadadosExif() — GPS presente e válido', () => {
  function coordsDMS(graus, min, seg) {
    return [graus, min, seg];
  }

  test('GPS Norte/Leste retorna coordenadas positivas', async () => {
    global.EXIF = criarExifMock({
      GPSLatitude: coordsDMS(23, 32, 0),
      GPSLongitude: coordsDMS(46, 38, 0),
      GPSLatitudeRef: 'N',
      GPSLongitudeRef: 'E',
    });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('📍 GPS:');
    expect(resultado).toContain('23.');
  });

  test('GPS Sul/Oeste retorna coordenadas negativas', async () => {
    global.EXIF = criarExifMock({
      GPSLatitude: coordsDMS(23, 32, 0),
      GPSLongitude: coordsDMS(46, 38, 0),
      GPSLatitudeRef: 'S',
      GPSLongitudeRef: 'W',
    });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('-23.');
    expect(resultado).toContain('-46.');
  });

  test('GPS com lat/lng = 0 exibe mensagem "Removido pelo sistema"', async () => {
    global.EXIF = criarExifMock({
      GPSLatitude: [0, 0, 0],
      GPSLongitude: [0, 0, 0],
      GPSLatitudeRef: 'N',
      GPSLongitudeRef: 'E',
    });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('Removido pelo sistema');
  });

  test('GPS ausente exibe mensagem "Bloqueado pelo aparelho celular"', async () => {
    global.EXIF = criarExifMock({});
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('Bloqueado pelo aparelho celular');
  });

  test('resultado contém GPS quando ambos data e GPS presentes', async () => {
    global.EXIF = criarExifMock({
      DateTimeOriginal: '2024:06:15 08:00:00',
      GPSLatitude: coordsDMS(23, 32, 0),
      GPSLongitude: coordsDMS(46, 38, 0),
      GPSLatitudeRef: 'S',
      GPSLongitudeRef: 'W',
    });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toContain('15/06/2024');
    expect(resultado).toContain('📍 GPS:');
  });
});

// --- dmsParaDecimal (utils.js) ---

describe('dmsParaDecimal()', () => {
  test('número direto retorna o mesmo valor', () => {
    expect(dmsParaDecimal(23.5)).toBe(23.5);
  });

  test('string converte via parseFloat', () => {
    expect(dmsParaDecimal('46.63')).toBeCloseTo(46.63);
  });

  test('array DMS [D, M, S] converte corretamente', () => {
    expect(dmsParaDecimal([23, 30, 0])).toBeCloseTo(23.5);
  });

  test('DMS [0, 0, 0] retorna 0', () => {
    expect(dmsParaDecimal([0, 0, 0])).toBe(0);
  });

  test('DMS com objetos .valueOf() funciona', () => {
    const wrap = (n) => ({ valueOf: () => n });
    expect(dmsParaDecimal([wrap(23), wrap(30), wrap(0)])).toBeCloseTo(23.5);
  });

  test('input null/undefined retorna 0', () => {
    expect(dmsParaDecimal(null)).toBe(0);
    expect(dmsParaDecimal(undefined)).toBe(0);
  });
});

// --- aplicarRefGps (utils.js) ---

describe('aplicarRefGps()', () => {
  test('N mantém positivo', () => {
    expect(aplicarRefGps(23.5, 'N')).toBe(23.5);
  });

  test('S torna negativo', () => {
    expect(aplicarRefGps(23.5, 'S')).toBe(-23.5);
  });

  test('E mantém positivo', () => {
    expect(aplicarRefGps(46.6, 'E')).toBe(46.6);
  });

  test('W torna negativo', () => {
    expect(aplicarRefGps(46.6, 'W')).toBe(-46.6);
  });

  test('valor já negativo com S mantém negativo', () => {
    expect(aplicarRefGps(-23.5, 'S')).toBe(-23.5);
  });

  test('ref desconhecida retorna o valor sem modificação', () => {
    expect(aplicarRefGps(10, 'X')).toBe(10);
  });
});
