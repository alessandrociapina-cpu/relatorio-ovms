/**
 * @jest-environment jsdom
 */
'use strict';

const { initDB, salvarDB, carregarDB, limparDB } = require('../modules/storage');

describe('storage.js – IndexedDB', () => {
  beforeEach(async () => {
    try {
      await limparDB();
    } catch (_) {
      // ignora erros de limpeza entre testes
    }
  });

  test('salvarDB persiste um estado e carregarDB o recupera', async () => {
    const estado = { form: { local: 'Teste', data: '2026-04-21' }, fotos: [] };
    await salvarDB(estado);
    const recuperado = await carregarDB();
    expect(recuperado).toEqual(estado);
  });

  test('carregarDB retorna undefined quando não há dados salvos', async () => {
    const recuperado = await carregarDB();
    expect(recuperado).toBeUndefined();
  });

  test('salvarDB substitui o estado anterior', async () => {
    const estado1 = { form: { local: 'Primeiro' }, fotos: [] };
    const estado2 = { form: { local: 'Segundo' }, fotos: [{ id: '1' }] };
    await salvarDB(estado1);
    await salvarDB(estado2);
    const recuperado = await carregarDB();
    expect(recuperado).toEqual(estado2);
  });

  test('limparDB remove os dados persistidos', async () => {
    const estado = { form: { local: 'Remover' }, fotos: [] };
    await salvarDB(estado);
    await limparDB();
    const recuperado = await carregarDB();
    expect(recuperado).toBeUndefined();
  });

  test('initDB retorna uma instância de IDBDatabase', async () => {
    const db = await initDB();
    expect(db).toBeDefined();
    expect(typeof db.transaction).toBe('function');
  });
});
