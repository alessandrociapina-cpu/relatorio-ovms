'use strict';

const {
  esc,
  formatarDataISO,
  resolverDepartamento,
  criarBlocoAssinatura,
  dmsParaDecimal,
  aplicarRefGps,
  sanitizarNomeArquivo,
  validarEsquemaProjeto,
} = require('../utils');

const DEPTO_PADRAO = 'Divisão de Manutenção e Serviços Operacionais de São José dos Campos - OVMS';

describe('esc()', () => {
  test('escapa < e >', () => {
    expect(esc('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  test('escapa &', () => {
    expect(esc('a & b')).toBe('a &amp; b');
  });
  test('escapa aspas duplas', () => {
    expect(esc('"texto"')).toBe('&quot;texto&quot;');
  });
  test('escapa aspas simples', () => {
    expect(esc("it's")).toBe('it&#39;s');
  });
  test('retorna vazio para null', () => {
    expect(esc(null)).toBe('');
  });
  test('retorna vazio para undefined', () => {
    expect(esc(undefined)).toBe('');
  });
  test('converte número para string', () => {
    expect(esc(42)).toBe('42');
  });
  test('não altera texto sem caracteres especiais', () => {
    expect(esc('texto normal')).toBe('texto normal');
  });
  test('bloqueia injeção com atributo HTML', () => {
    const escaped = esc('"><img onerror=alert(1)>');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&lt;img');
    expect(escaped).not.toContain('<img');
  });
});

describe('formatarDataISO()', () => {
  test('formata data ISO para dd/mm/aaaa', () => {
    expect(formatarDataISO('2026-04-20')).toBe('20/04/2026');
  });
  test('mantém zeros à esquerda no mês', () => {
    expect(formatarDataISO('2026-01-05')).toBe('05/01/2026');
  });
  test('retorna a string original se o formato for inválido', () => {
    expect(formatarDataISO('invalido')).toBe('invalido');
  });
  test('retorna vazio para string vazia', () => {
    expect(formatarDataISO('')).toBe('');
  });
  test('retorna vazio para null', () => {
    expect(formatarDataISO(null)).toBe('');
  });
});

describe('resolverDepartamento()', () => {
  test('retorna o valor do select quando não é Outros', () => {
    expect(resolverDepartamento('Divisão X', '')).toBe('Divisão X');
  });
  test('retorna o valor customizado quando Outros preenchido', () => {
    expect(resolverDepartamento('Outros', 'Minha Divisão')).toBe('Minha Divisão');
  });
  test('retorna o padrão quando Outros mas campo vazio', () => {
    expect(resolverDepartamento('Outros', '')).toBe(DEPTO_PADRAO);
  });
  test('retorna o padrão quando valor vazio', () => {
    expect(resolverDepartamento('', '')).toBe(DEPTO_PADRAO);
  });
  test('ignora espaços no valor customizado', () => {
    expect(resolverDepartamento('Outros', '   ')).toBe(DEPTO_PADRAO);
  });
  test('remove espaços das extremidades do valor customizado', () => {
    expect(resolverDepartamento('Outros', '  OVMS  ')).toBe('OVMS');
  });
});

describe('criarBlocoAssinatura()', () => {
  test('contém o nome do fiscal', () => {
    const html = criarBlocoAssinatura('João Silva', 'Engenheiro', 'OVMS', null);
    expect(html).toContain('João Silva');
  });
  test('contém o cargo', () => {
    const html = criarBlocoAssinatura('Ana', 'Técnico', 'OVMS', null);
    expect(html).toContain('Técnico');
  });
  test('contém o departamento', () => {
    const html = criarBlocoAssinatura('Ana', 'Técnico', 'OVMS', null);
    expect(html).toContain('OVMS');
  });
  test('usa div vazia quando não há assinatura', () => {
    const html = criarBlocoAssinatura('Ana', 'Técnico', 'OVMS', null);
    expect(html).toContain('<div style="height: 50px;"></div>');
  });
  test('usa img quando há assinatura', () => {
    const html = criarBlocoAssinatura('Ana', 'Técnico', 'OVMS', 'data:image/png;base64,abc');
    expect(html).toContain('<img src="data:image/png;base64,abc"');
  });
  test('escapa HTML no nome', () => {
    const html = criarBlocoAssinatura('<script>alert(1)</script>', 'Cargo', 'Depto', null);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
  test('escapa HTML no cargo', () => {
    const html = criarBlocoAssinatura('Nome', '"><img onerror=alert(1)>', 'Depto', null);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
  test('escapa HTML no departamento', () => {
    const html = criarBlocoAssinatura('Nome', 'Cargo', '<evil>', null);
    expect(html).not.toContain('<evil>');
    expect(html).toContain('&lt;evil&gt;');
  });
  test('escapa HTML na URL da assinatura', () => {
    const html = criarBlocoAssinatura('Nome', 'Cargo', 'Depto', '"><script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });
  test('inclui classe bloco-assinatura', () => {
    const html = criarBlocoAssinatura('Nome', 'Cargo', 'Depto', null);
    expect(html).toContain('class="bloco-assinatura"');
  });
  test('inclui linha de assinatura', () => {
    const html = criarBlocoAssinatura('Nome', 'Cargo', 'Depto', null);
    expect(html).toContain('class="linha-assinatura"');
  });
});

describe('dmsParaDecimal()', () => {
  test('retorna número diretamente quando já é número', () => {
    expect(dmsParaDecimal(45.5)).toBe(45.5);
  });
  test('converte string para float', () => {
    expect(dmsParaDecimal('23.123')).toBeCloseTo(23.123);
  });
  test('converte array DMS [graus, minutos, segundos]', () => {
    expect(dmsParaDecimal([23, 30, 0])).toBeCloseTo(23.5);
  });
  test('converte DMS com segundos fracionados', () => {
    expect(dmsParaDecimal([23, 0, 36])).toBeCloseTo(23.01);
  });
  test('retorna 0 para array vazio', () => {
    expect(dmsParaDecimal([])).toBe(0);
  });
  test('retorna 0 para null', () => {
    expect(dmsParaDecimal(null)).toBe(0);
  });
  test('suporta objetos valueOf (formato EXIF raw)', () => {
    const coord = [{ valueOf: () => 23 }, { valueOf: () => 32 }, { valueOf: () => 0 }];
    expect(dmsParaDecimal(coord)).toBeCloseTo(23 + 32 / 60);
  });
  test('usa parseFloat quando coords[0] é zero (falsy)', () => {
    expect(dmsParaDecimal([0, 30, 0])).toBeCloseTo(0.5);
  });
});

describe('aplicarRefGps()', () => {
  test('nega valor para referência S', () => {
    expect(aplicarRefGps(23.5, 'S')).toBeCloseTo(-23.5);
  });
  test('nega valor para referência W', () => {
    expect(aplicarRefGps(46.6, 'W')).toBeCloseTo(-46.6);
  });
  test('mantém positivo para referência N', () => {
    expect(aplicarRefGps(23.5, 'N')).toBeCloseTo(23.5);
  });
  test('mantém positivo para referência E', () => {
    expect(aplicarRefGps(46.6, 'E')).toBeCloseTo(46.6);
  });
  test('força positivo antes de negar para S (valor já negativo)', () => {
    expect(aplicarRefGps(-23.5, 'S')).toBeCloseTo(-23.5);
  });
  test('retorna valor sem alteração para ref desconhecida', () => {
    expect(aplicarRefGps(10, 'X')).toBe(10);
  });
});

describe('sanitizarNomeArquivo()', () => {
  test('retorna sem-local para string vazia', () => {
    expect(sanitizarNomeArquivo('')).toBe('sem-local');
  });
  test('retorna sem-local para null', () => {
    expect(sanitizarNomeArquivo(null)).toBe('sem-local');
  });
  test('retorna sem-local para apenas espaços', () => {
    expect(sanitizarNomeArquivo('   ')).toBe('sem-local');
  });
  test('substitui espaços por underscore', () => {
    expect(sanitizarNomeArquivo('Rua das Flores')).toBe('Rua_das_Flores');
  });
  test('substitui caracteres especiais por underscore', () => {
    expect(sanitizarNomeArquivo('São José/SJC')).toBe('S_o_Jos__SJC');
  });
  test('mantém letras, números e hífens', () => {
    expect(sanitizarNomeArquivo('abc-123-XYZ')).toBe('abc-123-XYZ');
  });
  test('remove espaços das extremidades antes de processar', () => {
    expect(sanitizarNomeArquivo('  local  ')).toBe('local');
  });
});

describe('validarEsquemaProjeto()', () => {
  test('retorna false para null', () => {
    expect(validarEsquemaProjeto(null)).toBe(false);
  });
  test('retorna false para array', () => {
    expect(validarEsquemaProjeto([])).toBe(false);
  });
  test('retorna false para string', () => {
    expect(validarEsquemaProjeto('texto')).toBe(false);
  });
  test('retorna true para objeto vazio (sem campos obrigatórios)', () => {
    expect(validarEsquemaProjeto({})).toBe(true);
  });
  test('retorna true para projeto válido com form e fotos', () => {
    expect(validarEsquemaProjeto({ form: { local: 'X' }, fotos: [] })).toBe(true);
  });
  test('retorna false se form não for objeto', () => {
    expect(validarEsquemaProjeto({ form: 'invalido' })).toBe(false);
  });
  test('retorna false se fotos não for array', () => {
    expect(validarEsquemaProjeto({ fotos: 'invalido' })).toBe(false);
  });
  test('retorna false se form for array', () => {
    expect(validarEsquemaProjeto({ form: [] })).toBe(false);
  });
});
