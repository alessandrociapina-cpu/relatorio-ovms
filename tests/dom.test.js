/**
 * @jest-environment jsdom
 */
'use strict';

const { mostrarErro, limparErro, mostrarAlerta, confirmar } = require('../domUtils');

const MODAL_HTML = `
  <div id="modal-app" style="display:none">
    <p id="modal-mensagem"></p>
    <button id="modal-btn-ok">OK</button>
    <button id="modal-btn-cancelar">Cancelar</button>
  </div>
`;

describe('mostrarErro()', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div><input id="localVistoria" /></div>`;
  });

  test('adiciona classe input-invalido', () => {
    const input = document.getElementById('localVistoria');
    mostrarErro(input, 'Campo obrigatório');
    expect(input.classList.contains('input-invalido')).toBe(true);
  });

  test('cria span com id erro-{input.id}', () => {
    const input = document.getElementById('localVistoria');
    mostrarErro(input, 'Campo obrigatório');
    const span = document.getElementById('erro-localVistoria');
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('Campo obrigatório');
  });

  test('span tem classe msg-erro-campo', () => {
    const input = document.getElementById('localVistoria');
    mostrarErro(input, 'Erro');
    expect(document.getElementById('erro-localVistoria').className).toBe('msg-erro-campo');
  });

  test('não duplica span ao chamar duas vezes', () => {
    const input = document.getElementById('localVistoria');
    mostrarErro(input, 'msg 1');
    mostrarErro(input, 'msg 2');
    expect(document.querySelectorAll('#erro-localVistoria').length).toBe(1);
    expect(document.getElementById('erro-localVistoria').textContent).toBe('msg 2');
  });

  test('atualiza mensagem do span existente', () => {
    const input = document.getElementById('localVistoria');
    mostrarErro(input, 'primeiro');
    mostrarErro(input, 'segundo');
    expect(document.getElementById('erro-localVistoria').textContent).toBe('segundo');
  });
});

describe('limparErro()', () => {
  test('remove classe input-invalido', () => {
    document.body.innerHTML = `<div><input id="localVistoria" class="input-invalido" /></div>`;
    const input = document.getElementById('localVistoria');
    limparErro(input);
    expect(input.classList.contains('input-invalido')).toBe(false);
  });

  test('remove span de erro se existir', () => {
    document.body.innerHTML = `
      <div>
        <input id="localVistoria" />
        <span id="erro-localVistoria">Erro</span>
      </div>`;
    const input = document.getElementById('localVistoria');
    limparErro(input);
    expect(document.getElementById('erro-localVistoria')).toBeNull();
  });

  test('não lança exceção se não houver span', () => {
    document.body.innerHTML = `<div><input id="localVistoria" /></div>`;
    const input = document.getElementById('localVistoria');
    expect(() => limparErro(input)).not.toThrow();
  });

  test('mostrarErro seguido de limparErro deixa DOM limpo', () => {
    document.body.innerHTML = `<div><input id="localVistoria" /></div>`;
    const input = document.getElementById('localVistoria');
    mostrarErro(input, 'Erro');
    limparErro(input);
    expect(input.classList.contains('input-invalido')).toBe(false);
    expect(document.getElementById('erro-localVistoria')).toBeNull();
  });
});

describe('mostrarAlerta()', () => {
  beforeEach(() => {
    document.body.innerHTML = MODAL_HTML;
  });

  test('exibe o modal', () => {
    const modal = document.getElementById('modal-app');
    const promise = mostrarAlerta('Mensagem de teste');
    expect(modal.style.display).toBe('flex');
    document.getElementById('modal-btn-ok').click();
    return promise;
  });

  test('define a mensagem corretamente', () => {
    const promise = mostrarAlerta('Texto importante');
    expect(document.getElementById('modal-mensagem').textContent).toBe('Texto importante');
    document.getElementById('modal-btn-ok').click();
    return promise;
  });

  test('esconde o cancelar', () => {
    const promise = mostrarAlerta('Alerta');
    expect(document.getElementById('modal-btn-cancelar').style.display).toBe('none');
    document.getElementById('modal-btn-ok').click();
    return promise;
  });

  test('fecha o modal ao clicar OK', async () => {
    const modal = document.getElementById('modal-app');
    const promise = mostrarAlerta('Alerta');
    document.getElementById('modal-btn-ok').click();
    await promise;
    expect(modal.style.display).toBe('none');
  });

  test('define data-tipo quando informado', () => {
    const modal = document.getElementById('modal-app');
    const promise = mostrarAlerta('Erro!', 'error');
    expect(modal.dataset.tipo).toBe('error');
    document.getElementById('modal-btn-ok').click();
    return promise;
  });

  test('fecha ao pressionar Enter', async () => {
    const modal = document.getElementById('modal-app');
    const promise = mostrarAlerta('Pressione Enter');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await promise;
    expect(modal.style.display).toBe('none');
  });

  test('fecha ao pressionar Escape', async () => {
    const modal = document.getElementById('modal-app');
    const promise = mostrarAlerta('Pressione Esc');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await promise;
    expect(modal.style.display).toBe('none');
  });

  test('ignora teclas que não sejam Enter ou Escape', async () => {
    const modal = document.getElementById('modal-app');
    const promise = mostrarAlerta('Aguardando');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(modal.style.display).toBe('flex');
    document.getElementById('modal-btn-ok').click();
    await promise;
    expect(modal.style.display).toBe('none');
  });
});

describe('confirmar()', () => {
  beforeEach(() => {
    document.body.innerHTML = MODAL_HTML;
  });

  test('exibe o botão Cancelar', () => {
    const promise = confirmar('Confirmar?');
    expect(document.getElementById('modal-btn-cancelar').style.display).toBe('inline-block');
    document.getElementById('modal-btn-ok').click();
    return promise;
  });

  test('resolve true ao clicar OK', async () => {
    const promise = confirmar('Confirmar?');
    document.getElementById('modal-btn-ok').click();
    expect(await promise).toBe(true);
  });

  test('resolve false ao clicar Cancelar', async () => {
    const promise = confirmar('Confirmar?');
    document.getElementById('modal-btn-cancelar').click();
    expect(await promise).toBe(false);
  });

  test('resolve true ao pressionar Enter', async () => {
    const promise = confirmar('Confirmar?');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(await promise).toBe(true);
  });

  test('resolve false ao pressionar Escape', async () => {
    const promise = confirmar('Confirmar?');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await promise).toBe(false);
  });

  test('fecha o modal ao clicar OK', async () => {
    const modal = document.getElementById('modal-app');
    const promise = confirmar('Confirmar?');
    document.getElementById('modal-btn-ok').click();
    await promise;
    expect(modal.style.display).toBe('none');
  });

  test('fecha o modal ao clicar Cancelar', async () => {
    const modal = document.getElementById('modal-app');
    const promise = confirmar('Confirmar?');
    document.getElementById('modal-btn-cancelar').click();
    await promise;
    expect(modal.style.display).toBe('none');
  });
});
