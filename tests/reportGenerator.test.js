/**
 * @jest-environment jsdom
 */
'use strict';

// Mock globals que reportGenerator.js depende
global.esc = (s) =>
  String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
global.resolverDepartamento = jest.fn((select, outros) => outros || select);
global.criarBlocoAssinatura = jest.fn((nome) => `<div class="bloco-assinatura">${nome}</div>`);
global.mostrarAlerta = jest.fn(() => Promise.resolve());
Element.prototype.scrollIntoView = jest.fn();

const { ReportGenerator } = require('../reportGenerator');

function addRadio(name, value, checked = false) {
  const el = document.createElement('input');
  el.type = 'radio';
  el.name = name;
  el.value = value;
  el.checked = checked;
  document.body.appendChild(el);
  return el;
}

function addSelect(options = ['opt']) {
  const el = document.createElement('select');
  options.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
  document.body.appendChild(el);
  return el;
}

function addCheckbox() {
  const el = document.createElement('input');
  el.type = 'checkbox';
  document.body.appendChild(el);
  return el;
}

function criarElementos() {
  document.body.innerHTML = '';

  function addDiv(id) {
    const el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  function addInput(id = null) {
    const el = document.createElement('input');
    if (id) el.id = id;
    document.body.appendChild(el);
    return el;
  }

  function addButton(id) {
    const el = document.createElement('button');
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  const rodapeDiv = document.createElement('div');
  rodapeDiv.className = 'rodape-texto';
  document.body.appendChild(rodapeDiv);

  // Radio bordaFotos padrão
  addRadio('bordaFotos', 'nenhuma', true);

  const selectDepto = addSelect(['OVMS', 'Outros']);
  const selectDepto2 = addSelect(['OVMS', 'Outros']);
  const selectCargo = addSelect(['Engenheiro Civil', 'Outros']);
  const selectCargo2 = addSelect(['Engenheiro Civil', 'Outros']);
  const selectFonte = addSelect(['Arial']);
  const selectTamanhoFonte = addSelect(['10']);
  const selectPosicaoMarca = addSelect(['superior-direito']);
  const selectTamanhoMarca = addSelect(['marca-pequena']);

  const rangeOpacidade = document.createElement('input');
  rangeOpacidade.type = 'range';
  rangeOpacidade.value = '50';
  document.body.appendChild(rangeOpacidade);

  return {
    btnGerarRelatorio: addButton('btnGerarRelatorio'),
    btnGerarPDF: addButton('btnGerarPDF'),
    btnAlternarPreview: addButton('btnAlternarPreview'),
    areaRelatorio: addDiv('area-relatorio'),
    cabecalhoRelatorioDiv: addDiv('cabecalho-relatorio'),
    corpoRelatorioDiv: addDiv('corpo-relatorio'),
    observacoesFinaisRelatorioDiv: addDiv('observacoes-finais-relatorio'),
    selectFonte,
    selectTamanhoFonte,
    radiosLayout: [addRadio('layoutColunas', '2', true)],
    radiosQualidade: [addRadio('qualidadeImagens', 'media', true)],
    radiosMargens: [addRadio('margensImpressao', 'maiores', true)],
    checkboxMarca: addCheckbox(),
    selectPosicaoMarca,
    selectTamanhoMarca,
    rangeOpacidadeMarca: rangeOpacidade,
    checkboxMetadados: addCheckbox(),
    checkboxAssinatura: addCheckbox(),
    checkboxIncluirFiscal2: addCheckbox(),
    selectDepartamento: selectDepto,
    inputDepartamentoOutros: addInput(),
    selectDepartamento2: selectDepto2,
    inputDepartamentoOutros2: addInput(),
    selectCargo,
    inputCargoOutros: addInput(),
    selectCargo2,
    inputCargoOutros2: addInput(),
    inputNomeFiscal: addInput('inputNomeFiscal'),
    inputNomeFiscal2: addInput('inputNomeFiscal2'),
    inputLocalVistoria: addInput('inputLocalVistoria'),
    inputDataVistoria: addInput('inputDataVistoria'),
    inputHoraVistoria: addInput('inputHoraVistoria'),
    inputObservacoes: addInput('inputObservacoes'),
  };
}

function criarFoto(overrides = {}) {
  return {
    id: 'f1',
    fileName: 'test.jpg',
    originalDataUrl: 'data:image/jpeg;base64,orig',
    previewDataUrl: 'data:image/jpeg;base64,prev',
    editedPreviewDataUrl: null,
    textoLegenda: '',
    metadadosExif: '',
    ocultarLogo: false,
    ocultarMetadados: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
describe('ReportGenerator.gerarRelatorio()', () => {
  let el, st, cb;

  beforeEach(() => {
    jest.clearAllMocks();
    el = criarElementos();
    st = { fotos: [], assinatura1: null, assinatura2: null };
    cb = {
      validarFormulario: jest.fn(() => true),
      redimensionarImagem: jest.fn((url) => Promise.resolve(url)),
    };
    ReportGenerator.init(st, el, cb);
  });

  test('não gera relatório quando validarFormulario retorna false', async () => {
    cb.validarFormulario.mockReturnValue(false);
    await ReportGenerator.gerarRelatorio();
    expect(el.cabecalhoRelatorioDiv.innerHTML).toBe('');
    expect(cb.redimensionarImagem).not.toHaveBeenCalled();
  });

  test('exibe alerta de erro quando não há fotos', async () => {
    st.fotos = [];
    await ReportGenerator.gerarRelatorio();
    expect(global.mostrarAlerta).toHaveBeenCalledWith(expect.stringContaining('foto'), 'error');
    expect(el.cabecalhoRelatorioDiv.innerHTML).toBe('');
  });

  test('gera cabeçalho com local da vistoria', async () => {
    el.inputLocalVistoria.value = 'Rua das Flores, 123';
    el.inputDataVistoria.value = '2026-04-20';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.cabecalhoRelatorioDiv.innerHTML).toContain('Rua das Flores, 123');
  });

  test('gera cabeçalho com data formatada', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-04-20';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    // Data no formato pt-BR: 20/04/2026
    expect(el.cabecalhoRelatorioDiv.innerHTML).toContain('20/04/2026');
  });

  test('inclui hora no cabeçalho quando fornecida', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    el.inputHoraVistoria.value = '14:30';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.cabecalhoRelatorioDiv.innerHTML).toContain('14:30');
  });

  test('chama redimensionarImagem para cada foto', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto(), criarFoto({ id: 'f2' })];

    await ReportGenerator.gerarRelatorio(false);

    expect(cb.redimensionarImagem).toHaveBeenCalledTimes(2);
  });

  test('usa editedPreviewDataUrl quando disponível', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto({ editedPreviewDataUrl: 'data:image/jpeg;base64,editada' })];

    await ReportGenerator.gerarRelatorio(false);

    expect(cb.redimensionarImagem).toHaveBeenCalledWith(
      'data:image/jpeg;base64,editada',
      expect.any(Number),
      expect.any(Number)
    );
  });

  test('usa previewDataUrl quando editedPreviewDataUrl é null', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [
      criarFoto({ previewDataUrl: 'data:image/jpeg;base64,prev', editedPreviewDataUrl: null }),
    ];

    await ReportGenerator.gerarRelatorio(false);

    expect(cb.redimensionarImagem).toHaveBeenCalledWith(
      'data:image/jpeg;base64,prev',
      expect.any(Number),
      expect.any(Number)
    );
  });

  test('renderiza item no corpo para cada foto', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto(), criarFoto({ id: 'f2' })];

    await ReportGenerator.gerarRelatorio(false);

    const items = el.corpoRelatorioDiv.querySelectorAll('.item-relatorio');
    expect(items).toHaveLength(2);
  });

  test('legenda usa textoLegenda quando preenchido', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto({ textoLegenda: 'Minha legenda especial' })];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.corpoRelatorioDiv.innerHTML).toContain('Minha legenda especial');
  });

  test('legenda usa "Sem legenda" quando textoLegenda está vazio', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto({ textoLegenda: '' })];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.corpoRelatorioDiv.innerHTML).toContain('Sem legenda');
  });

  test('renderiza bloco de assinatura quando checkboxAssinatura ativo', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    el.inputNomeFiscal.value = 'Carlos Lima';
    el.checkboxAssinatura.checked = true;
    st.assinatura1 = 'data:image/png;base64,abc';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(global.criarBlocoAssinatura).toHaveBeenCalled();
    expect(el.observacoesFinaisRelatorioDiv.innerHTML).toContain('assinaturas-container');
  });

  test('não renderiza assinatura quando checkboxAssinatura está desmarcado', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    el.checkboxAssinatura.checked = false;
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(global.criarBlocoAssinatura).not.toHaveBeenCalled();
  });

  test('renderiza observações quando inputObservacoes tem valor', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    el.inputObservacoes.value = 'Observação importante';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.observacoesFinaisRelatorioDiv.innerHTML).toContain('Observa');
  });

  test('define display="table" em areaRelatorio', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.areaRelatorio.style.display).toBe('table');
  });

  test('adiciona classe preview-print ao body quando ativarPreview=true', async () => {
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(true);

    expect(document.body.classList.contains('preview-print')).toBe(true);
  });

  test('não adiciona classe preview-print quando ativarPreview=false', async () => {
    document.body.classList.remove('preview-print');
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(document.body.classList.contains('preview-print')).toBe(false);
  });

  test('adiciona classe layout-1-col quando layoutColunas é 1', async () => {
    el.radiosLayout[0].checked = false;
    const radio1col = addRadio('layoutColunas', '1', true);
    el.radiosLayout = [el.radiosLayout[0], radio1col];
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    expect(el.areaRelatorio.classList.contains('layout-1-col')).toBe(true);
  });

  test('adiciona borda-preta-2pt quando bordaFotos é preta-2pt', async () => {
    // Adiciona radio de borda preta
    const radioBorda = document.querySelector('input[name="bordaFotos"]');
    radioBorda.checked = false;
    const radioPreta = addRadio('bordaFotos', 'preta-2pt', true);
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';
    st.fotos = [criarFoto()];

    await ReportGenerator.gerarRelatorio(false);

    const img = el.corpoRelatorioDiv.querySelector('.foto-principal');
    expect(img.classList.contains('borda-preta-2pt')).toBe(true);

    radioPreta.remove();
    radioBorda.checked = true;
  });

  test('chama validarFormulario antes de gerar', async () => {
    st.fotos = [criarFoto()];
    el.inputLocalVistoria.value = 'Local';
    el.inputDataVistoria.value = '2026-01-01';

    await ReportGenerator.gerarRelatorio(false);

    expect(cb.validarFormulario).toHaveBeenCalledTimes(1);
  });
});
