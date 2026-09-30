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

const {
  lerMetadadosExif,
  temGps,
  foiCapturadaAgora,
  obterPosicaoAparelho,
  formatarGpsAparelho,
  substituirGps,
  limparMetaLegado,
} = require('../modules/gps');

afterEach(() => {
  delete global.EXIF;
});

// --- Casos sem leitura EXIF ---

describe('lerMetadadosExif() — sem EXIF disponível', () => {
  test('retorna vazio quando EXIF é undefined e não há data do arquivo', async () => {
    delete global.EXIF;
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toBe('');
  });

  test('usa lastModified como data de fallback quando EXIF é undefined', async () => {
    delete global.EXIF;
    const lastModified = new Date(2024, 5, 15, 10, 30).getTime(); // 15/06/2024 10:30
    const resultado = await lerMetadadosExif({ type: 'image/jpeg', lastModified });
    expect(resultado).toContain('15/06/2024');
    expect(resultado).toContain('10:30');
    expect(resultado).not.toContain('📍');
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

  test('GPS zerado pelo Android (lat/lng = 0) é tratado como ausente', async () => {
    global.EXIF = criarExifMock({
      GPSLatitude: [0, 0, 0],
      GPSLongitude: [0, 0, 0],
      GPSLatitudeRef: 'N',
      GPSLongitudeRef: 'E',
    });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).not.toContain('📍');
  });

  test('GPS ausente não gera texto de aviso nos metadados', async () => {
    global.EXIF = criarExifMock({ DateTimeOriginal: '2024:06:15 10:30:00' });
    const resultado = await lerMetadadosExif({ type: 'image/jpeg' });
    expect(resultado).toBe('🗓️ 15/06/2024 às 10:30');
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

// --- Helpers de GPS do celular ---

describe('temGps()', () => {
  test('detecta coordenada registrada', () => {
    expect(temGps('🗓️ 01/01/2026 às 10:00  📍 GPS: -23.1, -45.8')).toBe(true);
  });

  test('retorna false para texto sem GPS ou vazio', () => {
    expect(temGps('🗓️ 01/01/2026 às 10:00')).toBe(false);
    expect(temGps('')).toBe(false);
    expect(temGps(undefined)).toBe(false);
  });
});

describe('foiCapturadaAgora()', () => {
  const agora = new Date(2026, 8, 30, 12, 0).getTime();

  test('arquivo gravado há 1 minuto conta como captura atual', () => {
    expect(foiCapturadaAgora({ lastModified: agora - 60 * 1000 }, agora)).toBe(true);
  });

  test('foto antiga da galeria não conta como captura atual', () => {
    expect(foiCapturadaAgora({ lastModified: agora - 60 * 60 * 1000 }, agora)).toBe(false);
  });

  test('arquivo sem lastModified não conta como captura atual', () => {
    expect(foiCapturadaAgora({}, agora)).toBe(false);
  });
});

describe('formatarGpsAparelho()', () => {
  test('inclui coordenadas, origem e precisão arredondada', () => {
    expect(formatarGpsAparelho({ lat: -23.18, lng: -45.88, precisao: 12.6 })).toBe(
      '📍 GPS: -23.180000, -45.880000 (celular, ±13 m)'
    );
  });

  test('omite precisão quando não informada', () => {
    expect(formatarGpsAparelho({ lat: 1, lng: 2 })).toBe('📍 GPS: 1.000000, 2.000000 (celular)');
  });
});

describe('substituirGps()', () => {
  const novo = '📍 GPS: 1.000000, 2.000000 (celular)';

  test('acrescenta GPS mantendo a data', () => {
    expect(substituirGps('🗓️ 01/01/2026 às 10:00', novo)).toBe(`🗓️ 01/01/2026 às 10:00  ${novo}`);
  });

  test('substitui GPS existente', () => {
    expect(substituirGps('🗓️ 01/01/2026 às 10:00  📍 GPS: 9, 9', novo)).toBe(
      `🗓️ 01/01/2026 às 10:00  ${novo}`
    );
  });

  test('funciona sem metadados anteriores', () => {
    expect(substituirGps('', novo)).toBe(novo);
    expect(substituirGps(undefined, novo)).toBe(novo);
  });
});

describe('limparMetaLegado()', () => {
  test.each([
    '📍 GPS: Não encontrado na foto (use o botão abaixo)',
    '📍 GPS: Não disponível via navegador (use o botão abaixo)',
    '📍 GPS: Removido pelo sistema do aparelho celular',
    '📍 GPS: Falha na leitura',
  ])('remove aviso antigo: %s', (aviso) => {
    expect(limparMetaLegado(`🗓️ 01/01/2026 às 10:00  ${aviso}`)).toBe('🗓️ 01/01/2026 às 10:00');
  });

  test('preserva coordenadas válidas', () => {
    const meta = '🗓️ 01/01/2026 às 10:00  📍 GPS: -23.1, -45.8';
    expect(limparMetaLegado(meta)).toBe(meta);
  });

  test('retorna vazio para entrada vazia', () => {
    expect(limparMetaLegado('')).toBe('');
    expect(limparMetaLegado(null)).toBe('');
  });
});

describe('obterPosicaoAparelho()', () => {
  const geoOriginal = navigator.geolocation;

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { value: geoOriginal, configurable: true });
  });

  function mockGeo(impl) {
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: jest.fn(impl) },
      configurable: true,
    });
  }

  test('resolve com latitude, longitude e precisão', async () => {
    mockGeo((ok) => ok({ coords: { latitude: -23.1, longitude: -45.8, accuracy: 7 } }));
    await expect(obterPosicaoAparelho()).resolves.toEqual({
      lat: -23.1,
      lng: -45.8,
      precisao: 7,
    });
  });

  test('resolve null quando o usuário nega a permissão', async () => {
    mockGeo((_ok, erro) => erro({ code: 1 }));
    await expect(obterPosicaoAparelho()).resolves.toBeNull();
  });

  test('resolve null quando o navegador não tem geolocalização', async () => {
    Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
    await expect(obterPosicaoAparelho()).resolves.toBeNull();
  });
});
