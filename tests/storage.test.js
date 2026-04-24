'use strict';

const { IDBFactory } = require('fake-indexeddb');

// Substitui a global indexedDB por uma implementação em memória
global.indexedDB = new IDBFactory();

// Cada teste começa com um banco limpo
beforeEach(() => {
  global.indexedDB = new IDBFactory();
  // Recarrega o módulo para que initDB use a nova instância
  jest.resetModules();
});

// Utilitário para obter módulo fresco (indexedDB reiniciado)
function freshStorage() {
  return require('../modules/storage');
}

describe('storage — initDB()', () => {
  test('resolve com um objeto IDBDatabase', async () => {
    const { initDB: init } = freshStorage();
    const db = await init();
    expect(db).toBeDefined();
    expect(typeof db.transaction).toBe('function');
  });

  test('segunda chamada reutiliza a mesma versão do banco', async () => {
    const { initDB: init } = freshStorage();
    const db1 = await init();
    const db2 = await init();
    expect(db1.name).toBe(db2.name);
  });
});

describe('storage — salvarDB() e carregarDB()', () => {
  test('salva e recupera um objeto', async () => {
    const { salvarDB: salvar, carregarDB: carregar } = freshStorage();
    const dados = { texto: 'teste', num: 42 };
    await salvar(dados);
    const resultado = await carregar();
    expect(resultado).toEqual(dados);
  });

  test('carregarDB retorna undefined quando nada foi salvo', async () => {
    const { carregarDB: carregar } = freshStorage();
    const resultado = await carregar();
    expect(resultado).toBeUndefined();
  });

  test('sobrescreve ao salvar novamente', async () => {
    const { salvarDB: salvar, carregarDB: carregar } = freshStorage();
    await salvar({ versao: 1 });
    await salvar({ versao: 2 });
    const resultado = await carregar();
    expect(resultado).toEqual({ versao: 2 });
  });

  test('salva arrays como valor', async () => {
    const { salvarDB: salvar, carregarDB: carregar } = freshStorage();
    const fotos = [{ id: 'a' }, { id: 'b' }];
    await salvar(fotos);
    const resultado = await carregar();
    expect(resultado).toEqual(fotos);
  });

  test('salva null sem erros', async () => {
    const { salvarDB: salvar, carregarDB: carregar } = freshStorage();
    await salvar(null);
    const resultado = await carregar();
    expect(resultado).toBeNull();
  });
});

describe('storage — limparDB()', () => {
  test('remove o rascunho salvo', async () => {
    const { salvarDB: salvar, carregarDB: carregar, limparDB: limpar } = freshStorage();
    await salvar({ dado: 'algo' });
    await limpar();
    const resultado = await carregar();
    expect(resultado).toBeUndefined();
  });

  test('limparDB sem rascunho prévio não lança erro', async () => {
    const { limparDB: limpar } = freshStorage();
    await expect(limpar()).resolves.toBeUndefined();
  });
});
