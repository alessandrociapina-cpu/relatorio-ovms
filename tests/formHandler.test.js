/**
 * @jest-environment jsdom
 */
'use strict';

// Mock globals que formHandler.js depende
global.mostrarErro = jest.fn();
global.limparErro = jest.fn();
global.mostrarAlerta = jest.fn(() => Promise.resolve());
global.confirmar = jest.fn(() => Promise.resolve(false));
global.salvarDB = jest.fn(() => Promise.resolve());
global.carregarDB = jest.fn(() => Promise.resolve(null));
global.limparDB = jest.fn(() => Promise.resolve());
global.sanitizarNomeArquivo = (s) => String(s).replace(/[^a-z0-9]/gi, '-');
global.validarEsquemaProjeto = jest.fn(() => true);
global.formatarDataISO = jest.fn((s) => s);

// scrollIntoView não existe em jsdom
Element.prototype.scrollIntoView = jest.fn();

const { FormHandler } = require('../formHandler');

function criarElementos() {
  document.body.innerHTML = '';

  function addInput(id, type = 'text') {
    const el = document.createElement('input');
    el.id = id;
    el.type = type;
    document.body.appendChild(el);
    return el;
  }

  function addSelect(id, opcoes = ['opcao1']) {
    const el = document.createElement('select');
    el.id = id;
    opcoes.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      el.appendChild(opt);
    });
    document.body.appendChild(el);
    return el;
  }

  function addDiv(id) {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  function addSpan(id) {
    const el = document.createElement('span');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  function addButton(id) {
    const el = document.createElement('button');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  const form = document.createElement('form');
  form.id = 'form-vistoria';
  document.body.appendChild(form);

  // Radio bordaFotos
  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'bordaFotos';
  radio.value = 'nenhuma';
  radio.checked = true;
  document.body.appendChild(radio);

  const cargoOpcoes = ['Engenheiro Civil', 'Engenheiro', 'Outros'];
  const deptoOpcoes = ['Divisão OVMS', 'Outros'];

  return {
    formVistoria: form,
    inputLocalVistoria: addInput('localVistoria'),
    inputDataVistoria: addInput('dataVistoria', 'date'),
    inputHoraVistoria: addInput('horaVistoria', 'time'),
    inputNomeFiscal: addInput('nomeFiscal'),
    selectCargo: addSelect('cargoFiscal', cargoOpcoes),
    inputCargoOutros: addInput('cargoFiscalOutros'),
    selectDepartamento: addSelect('departamentoFiscal', deptoOpcoes),
    inputDepartamentoOutros: addInput('departamentoFiscalOutros'),
    checkboxIncluirFiscal2: addInput('incluirFiscal2', 'checkbox'),
    blocoFiscal2: addDiv('blocoFiscal2'),
    inputNomeFiscal2: addInput('nomeFiscal2'),
    selectCargo2: addSelect('cargoFiscal2', cargoOpcoes),
    inputCargoOutros2: addInput('cargoFiscalOutros2'),
    selectDepartamento2: addSelect('departamentoFiscal2', deptoOpcoes),
    inputDepartamentoOutros2: addInput('departamentoFiscalOutros2'),
    checkboxAssinatura: addInput('incluirAssinatura', 'checkbox'),
    dicaAssinatura: addDiv('dicaAssinatura'),
    inputImagemAssinatura: addInput('imagemAssinatura', 'file'),
    btnAssinaturaLabel: addButton('btnAssinaturaLabel'),
    assinaturaStatus: addSpan('assinaturaStatus'),
    btnRemoverAssinatura: addButton('btnRemoverAssinatura'),
    inputImagemAssinatura2: addInput('imagemAssinatura2', 'file'),
    btnAssinaturaLabel2: addButton('btnAssinaturaLabel2'),
    assinaturaStatus2: addSpan('assinaturaStatus2'),
    btnRemoverAssinatura2: addButton('btnRemoverAssinatura2'),
    inputObservacoes: addInput('observacoesGerais'),
    btnSalvarProjeto: addButton('btnSalvarProjeto'),
    inputCarregarProjeto: addInput('inputCarregarProjeto', 'file'),
    autoSaveStatus: addSpan('autoSaveStatus'),
  };
}

function criarEstado() {
  return { fotos: [], assinatura1: null, assinatura2: null };
}

function preencherValido(el) {
  el.inputLocalVistoria.value = 'Rua das Flores, 123';
  el.inputDataVistoria.value = '2026-04-20';
  el.inputNomeFiscal.value = 'João da Silva';
  el.selectCargo.value = 'Engenheiro Civil';
  el.selectDepartamento.value = 'Divisão OVMS';
}

// ---------------------------------------------------------------------------
describe('FormHandler.validarFormulario()', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = criarEstado();
    cb = { onEstadoCarregado: jest.fn() };
    FormHandler.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  test('retorna false e chama mostrarErro quando local está vazio', () => {
    el.inputDataVistoria.value = '2026-04-20';
    el.inputNomeFiscal.value = 'João da Silva';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(
      el.inputLocalVistoria,
      expect.stringContaining('local')
    );
  });

  test('retorna false quando local tem menos de 3 caracteres', () => {
    el.inputLocalVistoria.value = 'AB';
    el.inputDataVistoria.value = '2026-04-20';
    el.inputNomeFiscal.value = 'João da Silva';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(
      el.inputLocalVistoria,
      expect.stringContaining('3')
    );
  });

  test('retorna false e chama mostrarErro quando data está vazia', () => {
    el.inputLocalVistoria.value = 'Local Válido';
    el.inputNomeFiscal.value = 'João da Silva';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(el.inputDataVistoria, expect.any(String));
  });

  test('retorna false quando nome do fiscal está vazio', () => {
    el.inputLocalVistoria.value = 'Local Válido';
    el.inputDataVistoria.value = '2026-04-20';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(el.inputNomeFiscal, expect.any(String));
  });

  test('retorna false quando nome do fiscal tem menos de 3 caracteres', () => {
    el.inputLocalVistoria.value = 'Local Válido';
    el.inputDataVistoria.value = '2026-04-20';
    el.inputNomeFiscal.value = 'AB';
    expect(FormHandler.validarFormulario()).toBe(false);
  });

  test('retorna true quando todos os campos obrigatórios são válidos', () => {
    preencherValido(el);
    expect(FormHandler.validarFormulario()).toBe(true);
  });

  test('chama limparErro nos campos válidos', () => {
    preencherValido(el);
    FormHandler.validarFormulario();
    expect(global.limparErro).toHaveBeenCalledWith(el.inputLocalVistoria);
    expect(global.limparErro).toHaveBeenCalledWith(el.inputDataVistoria);
    expect(global.limparErro).toHaveBeenCalledWith(el.inputNomeFiscal);
  });

  test('retorna false quando cargo é Outros mas campo customizado está vazio', () => {
    preencherValido(el);
    el.selectCargo.value = 'Outros';
    el.inputCargoOutros.value = '';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(el.inputCargoOutros, expect.any(String));
  });

  test('retorna false quando cargo customizado tem menos de 2 caracteres', () => {
    preencherValido(el);
    el.selectCargo.value = 'Outros';
    el.inputCargoOutros.value = 'A';
    expect(FormHandler.validarFormulario()).toBe(false);
  });

  test('retorna true quando cargo é Outros com valor customizado válido', () => {
    preencherValido(el);
    el.selectCargo.value = 'Outros';
    el.inputCargoOutros.value = 'Gestor';
    expect(FormHandler.validarFormulario()).toBe(true);
  });

  test('retorna false quando departamento é Outros mas campo está vazio', () => {
    preencherValido(el);
    el.selectDepartamento.value = 'Outros';
    el.inputDepartamentoOutros.value = '';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(el.inputDepartamentoOutros, expect.any(String));
  });

  test('retorna false quando departamento customizado tem menos de 3 caracteres', () => {
    preencherValido(el);
    el.selectDepartamento.value = 'Outros';
    el.inputDepartamentoOutros.value = 'AB';
    expect(FormHandler.validarFormulario()).toBe(false);
  });

  test('retorna true quando departamento customizado é válido', () => {
    preencherValido(el);
    el.selectDepartamento.value = 'Outros';
    el.inputDepartamentoOutros.value = 'Setor ABC';
    expect(FormHandler.validarFormulario()).toBe(true);
  });

  test('valida fiscal2 quando checkboxIncluirFiscal2 está marcado', () => {
    preencherValido(el);
    el.checkboxIncluirFiscal2.checked = true;
    el.inputNomeFiscal2.value = '';
    expect(FormHandler.validarFormulario()).toBe(false);
    expect(global.mostrarErro).toHaveBeenCalledWith(el.inputNomeFiscal2, expect.any(String));
  });

  test('não valida fiscal2 quando checkbox está desmarcado', () => {
    preencherValido(el);
    el.checkboxIncluirFiscal2.checked = false;
    el.inputNomeFiscal2.value = '';
    expect(FormHandler.validarFormulario()).toBe(true);
  });

  test('retorna true com fiscal2 completamente válido', () => {
    preencherValido(el);
    el.checkboxIncluirFiscal2.checked = true;
    el.inputNomeFiscal2.value = 'Maria Souza';
    el.selectCargo2.value = 'Engenheiro Civil';
    el.selectDepartamento2.value = 'Divisão OVMS';
    expect(FormHandler.validarFormulario()).toBe(true);
  });

  test('limpa erros de fiscal2 quando checkbox está desmarcado', () => {
    preencherValido(el);
    el.checkboxIncluirFiscal2.checked = false;
    FormHandler.validarFormulario();
    expect(global.limparErro).toHaveBeenCalledWith(el.inputNomeFiscal2);
    expect(global.limparErro).toHaveBeenCalledWith(el.inputCargoOutros2);
    expect(global.limparErro).toHaveBeenCalledWith(el.inputDepartamentoOutros2);
  });
});

// ---------------------------------------------------------------------------
describe('FormHandler.exportarEstado()', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = criarEstado();
    cb = { onEstadoCarregado: jest.fn() };
    FormHandler.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  test('exporta valores dos campos de formulário', () => {
    el.inputLocalVistoria.value = 'Rua A';
    el.inputDataVistoria.value = '2026-01-15';
    el.inputHoraVistoria.value = '09:30';
    el.inputNomeFiscal.value = 'Carlos Lima';
    el.selectCargo.value = 'Engenheiro Civil';
    el.selectDepartamento.value = 'Divisão OVMS';

    const estado = FormHandler.exportarEstado();

    expect(estado.form.local).toBe('Rua A');
    expect(estado.form.data).toBe('2026-01-15');
    expect(estado.form.hora).toBe('09:30');
    expect(estado.form.fiscal).toBe('Carlos Lima');
    expect(estado.form.cargo).toBe('Engenheiro Civil');
    expect(estado.form.departamento1).toBe('Divisão OVMS');
  });

  test('exporta fotos do estado compartilhado', () => {
    const foto = { id: 'f1', fileName: 'test.jpg', originalDataUrl: 'data:...' };
    st.fotos = [foto];

    const estado = FormHandler.exportarEstado();

    expect(estado.fotos).toHaveLength(1);
    expect(estado.fotos[0].id).toBe('f1');
  });

  test('exporta assinaturas do estado compartilhado', () => {
    st.assinatura1 = 'data:image/png;base64,abc';
    st.assinatura2 = 'data:image/png;base64,def';

    const estado = FormHandler.exportarEstado();

    expect(estado.form.assinaturaUrl).toBe('data:image/png;base64,abc');
    expect(estado.form.assinaturaUrl2).toBe('data:image/png;base64,def');
  });

  test('exporta bordaFotos do radio selecionado', () => {
    const estado = FormHandler.exportarEstado();
    expect(estado.form.bordaFotos).toBe('nenhuma');
  });

  test('exporta estado incluirFiscal2 e dados do fiscal 2', () => {
    el.checkboxIncluirFiscal2.checked = true;
    el.inputNomeFiscal2.value = 'Ana Paula';
    el.selectCargo2.value = 'Engenheiro Civil';
    el.selectDepartamento2.value = 'Divisão OVMS';

    const estado = FormHandler.exportarEstado();

    expect(estado.form.incluirFiscal2).toBe(true);
    expect(estado.form.nomeFiscal2).toBe('Ana Paula');
  });

  test('exporta incluirAssinatura do checkbox', () => {
    el.checkboxAssinatura.checked = true;

    const estado = FormHandler.exportarEstado();

    expect(estado.form.incluirAssinatura).toBe(true);
  });

  test('exporta observações', () => {
    el.inputObservacoes.value = 'Observação de teste';
    const estado = FormHandler.exportarEstado();
    expect(estado.form.obs).toBe('Observação de teste');
  });
});

// ---------------------------------------------------------------------------
describe('FormHandler.carregarEstado()', () => {
  let el, st, cb;

  function estadoBase(overrides = {}) {
    return {
      form: {
        local: 'Avenida Brasil',
        data: '2026-03-10',
        hora: '14:00',
        fiscal: 'Pedro Costa',
        obs: 'Obs teste',
        cargo: 'Engenheiro Civil',
        cargoOutros: '',
        departamento1: 'Divisão OVMS',
        departamentoOutros1: '',
        incluirFiscal2: false,
        nomeFiscal2: '',
        cargo2: 'Engenheiro Civil',
        cargoOutros2: '',
        departamento2: 'Divisão OVMS',
        departamentoOutros2: '',
        incluirAssinatura: false,
        assinaturaUrl: null,
        assinaturaUrl2: null,
        bordaFotos: 'nenhuma',
        ...overrides,
      },
      fotos: [],
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    el = criarElementos();
    st = criarEstado();
    cb = { onEstadoCarregado: jest.fn() };
    FormHandler.init(st, el, cb);
  });

  afterEach(() => jest.useRealTimers());

  test('preenche campos do formulário a partir do estado', () => {
    FormHandler.carregarEstado(estadoBase());

    expect(el.inputLocalVistoria.value).toBe('Avenida Brasil');
    expect(el.inputDataVistoria.value).toBe('2026-03-10');
    expect(el.inputHoraVistoria.value).toBe('14:00');
    expect(el.inputNomeFiscal.value).toBe('Pedro Costa');
    expect(el.inputObservacoes.value).toBe('Obs teste');
  });

  test('restaura assinaturas no estado compartilhado', () => {
    FormHandler.carregarEstado(
      estadoBase({
        incluirAssinatura: true,
        assinaturaUrl: 'data:image/png;base64,aaa',
        assinaturaUrl2: 'data:image/png;base64,bbb',
      })
    );

    expect(st.assinatura1).toBe('data:image/png;base64,aaa');
    expect(st.assinatura2).toBe('data:image/png;base64,bbb');
  });

  test('atualiza state.fotos e chama onEstadoCarregado quando há fotos', () => {
    const fotos = [{ id: 'f1', fileName: 'foto.jpg', originalDataUrl: 'data:...' }];
    const estado = estadoBase();
    estado.fotos = fotos;

    FormHandler.carregarEstado(estado);

    expect(st.fotos).toEqual(fotos);
    expect(cb.onEstadoCarregado).toHaveBeenCalledTimes(1);
  });

  test('não chama onEstadoCarregado quando não há fotos no estado', () => {
    const estado = estadoBase();
    estado.fotos = undefined;

    FormHandler.carregarEstado(estado);

    expect(cb.onEstadoCarregado).not.toHaveBeenCalled();
  });

  test('exibe blocoFiscal2 quando incluirFiscal2 é true', () => {
    FormHandler.carregarEstado(estadoBase({ incluirFiscal2: true, nomeFiscal2: 'Ana' }));

    expect(el.checkboxIncluirFiscal2.checked).toBe(true);
    expect(el.blocoFiscal2.style.display).toBe('flex');
    expect(el.inputNomeFiscal2.value).toBe('Ana');
  });

  test('exibe inputCargoOutros quando cargo é Outros', () => {
    FormHandler.carregarEstado(estadoBase({ cargo: 'Outros', cargoOutros: 'Gestor' }));

    expect(el.selectCargo.value).toBe('Outros');
    expect(el.inputCargoOutros.style.display).toBe('inline-block');
    expect(el.inputCargoOutros.value).toBe('Gestor');
  });

  test('oculta inputCargoOutros quando cargo não é Outros', () => {
    FormHandler.carregarEstado(estadoBase({ cargo: 'Engenheiro Civil' }));

    expect(el.inputCargoOutros.style.display).toBe('none');
  });

  test('exibe inputDepartamentoOutros quando departamento é Outros', () => {
    // Adiciona opção Outros ao select de departamento
    const opt = document.createElement('option');
    opt.value = 'Outros';
    el.selectDepartamento.appendChild(opt);

    FormHandler.carregarEstado(
      estadoBase({ departamento1: 'Outros', departamentoOutros1: 'Setor X' })
    );

    expect(el.selectDepartamento.value).toBe('Outros');
    expect(el.inputDepartamentoOutros.style.display).toBe('inline-block');
    expect(el.inputDepartamentoOutros.value).toBe('Setor X');
  });

  test('define checkboxAssinatura a partir do estado', () => {
    FormHandler.carregarEstado(estadoBase({ incluirAssinatura: true }));
    expect(el.checkboxAssinatura.checked).toBe(true);
  });
});
