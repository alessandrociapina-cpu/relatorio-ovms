'use strict';

const { esc, formatarDataISO, resolverDepartamento, criarBlocoAssinatura } = require('../utils');

const DEPTO_PADRAO = 'Divisão de Manutenção e Serviços de São José dos Campos';

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
