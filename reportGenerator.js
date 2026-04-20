/* global esc, resolverDepartamento, criarBlocoAssinatura, mostrarAlerta */
'use strict';

const ReportGenerator = (() => {
  let _st, _el, _cb;

  function init(state, elements, callbacks) {
    _st = state;
    _el = elements;
    _cb = callbacks; // { validarFormulario, redimensionarImagem }
    _bindEvents();
  }

  function getOpcoesRelatorio() {
    const layout = Array.from(_el.radiosLayout).find((r) => r.checked)?.value || '2';
    const qualidade = Array.from(_el.radiosQualidade).find((r) => r.checked)?.value || 'media';
    const margens = Array.from(_el.radiosMargens).find((r) => r.checked)?.value || 'maiores';
    const borda =
      Array.from(document.querySelectorAll('input[name="bordaFotos"]')).find((r) => r.checked)
        ?.value || 'nenhuma';
    const mapaQualidade = {
      media: { largura: 1024, qualidade: 0.7 },
      maxima: { largura: 1600, qualidade: 0.8 },
    };
    const mapaMargens = { menores: 5, maiores: 15 };
    return {
      layoutColunas: layout,
      largura: mapaQualidade[qualidade].largura,
      qualidade: mapaQualidade[qualidade].qualidade,
      margensMm: mapaMargens[margens],
      usarMarca: _el.checkboxMarca.checked,
      posMarca: _el.selectPosicaoMarca.value,
      tamMarca: _el.selectTamanhoMarca.value,
      opacMarca: parseInt(_el.rangeOpacidadeMarca.value, 10) / 100,
      fonte: _el.selectFonte.value,
      tamanhoFonte: _el.selectTamanhoFonte.value,
      usarMetadados: _el.checkboxMetadados.checked,
      bordaFotos: borda,
    };
  }

  function applyPrintMargins(mm) {
    const STYLE_ID = 'print-margins-style';
    let styleTag = document.getElementById(STYLE_ID);
    const css = `@page { size: A4 portrait; margin: ${mm}mm; }`;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_ID;
      styleTag.setAttribute('media', 'print');
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;
  }

  async function gerarRelatorio(ativarPreview = true) {
    if (!_cb.validarFormulario()) return;
    const fotosValidas = _st.fotos.filter((f) => f && f.originalDataUrl);
    if (fotosValidas.length === 0) {
      await mostrarAlerta('Selecione pelo menos uma foto.', 'error');
      return;
    }

    const opt = getOpcoesRelatorio();
    _el.cabecalhoRelatorioDiv.innerHTML = '';
    _el.corpoRelatorioDiv.innerHTML = '';
    _el.observacoesFinaisRelatorioDiv.innerHTML = '';

    const local = _el.inputLocalVistoria.value;
    const data = new Date(_el.inputDataVistoria.value + 'T00:00:00');
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const horaHtml = _el.inputHoraVistoria.value
      ? `<p><strong>Hora:</strong> ${esc(_el.inputHoraVistoria.value)}</p>`
      : '';

    _el.areaRelatorio.style.fontFamily = opt.fonte;
    _el.areaRelatorio.style.fontSize = `${opt.tamanhoFonte}pt`;
    _el.cabecalhoRelatorioDiv.innerHTML = `
      <div class="cabecalho-principal">
        <div class="espacador-logo"></div>
        <div class="titulos-cabecalho">
          <div class="titulo-companhia">COMPANHIA DE SANEAMENTO BÁSICO DO ESTADO DE SÃO PAULO</div>
          <h2 class="titulo-vistoria">RELATÓRIO FOTOGRÁFICO DE VISTORIA</h2>
        </div>
        <img src="sabesp-logo.png" alt="Logo" class="logo-relatorio-direito">
      </div>
      <div class="info-vistoria"><p><strong>Local da Vistoria:</strong> ${esc(local)}</p><p><strong>Data da Vistoria:</strong> ${esc(dataFormatada)}</p>${horaHtml}</div>
    `;

    _el.areaRelatorio.classList.remove('layout-1-col');
    if (opt.layoutColunas === '1') _el.areaRelatorio.classList.add('layout-1-col');
    applyPrintMargins(opt.margensMm);

    const imagensProcessadas = await Promise.all(
      fotosValidas.map(async (f, i) => {
        const base = f.editedPreviewDataUrl || f.previewDataUrl;
        return {
          url: await _cb.redimensionarImagem(base, opt.largura, opt.qualidade),
          leg: `Imagem ${i + 1}: ${(f.textoLegenda || '').trim() || 'Sem legenda'}`,
          meta: f.metadadosExif,
          noLogo: f.ocultarLogo,
          noMeta: f.ocultarMetadados,
        };
      })
    );

    imagensProcessadas.forEach((imgObj) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item-relatorio');
      const wrapper = document.createElement('div');
      wrapper.classList.add('imagem-wrapper');

      const imgEl = document.createElement('img');
      imgEl.src = imgObj.url;
      imgEl.classList.add('foto-principal');

      if (opt.bordaFotos === 'preta-2pt') {
        imgEl.classList.add('borda-preta-2pt');
      }

      wrapper.appendChild(imgEl);

      if (opt.usarMarca && !imgObj.noLogo) {
        const logo = document.createElement('img');
        logo.src = 'sabesp-logo.png';
        logo.classList.add('marca-dagua-overlay', `pos-${opt.posMarca}`, opt.tamMarca);
        logo.style.opacity = opt.opacMarca;
        wrapper.appendChild(logo);
      }

      const legP = document.createElement('p');
      legP.classList.add('legenda');
      legP.textContent = imgObj.leg;
      itemDiv.appendChild(wrapper);
      itemDiv.appendChild(legP);

      if (imgObj.meta && opt.usarMetadados && !imgObj.noMeta) {
        const metaP = document.createElement('p');
        metaP.classList.add('metadados-foto');
        metaP.textContent = imgObj.meta;
        itemDiv.appendChild(metaP);
      }
      _el.corpoRelatorioDiv.appendChild(itemDiv);
    });

    let assinaturaHtml = '';
    if (_el.checkboxAssinatura.checked) {
      const nome1 = _el.inputNomeFiscal.value.trim() || '1º Fiscal/Inspetor';
      const cargo1 =
        _el.selectCargo.value === 'Outros'
          ? _el.inputCargoOutros.value.trim()
          : _el.selectCargo.value;
      const deptoFinal1 = resolverDepartamento(
        _el.selectDepartamento.value,
        _el.inputDepartamentoOutros.value
      );

      let bloco2 = '';
      if (_el.checkboxIncluirFiscal2.checked) {
        const nome2 = _el.inputNomeFiscal2.value.trim() || '2º Fiscal/Inspetor';
        const cargo2 =
          _el.selectCargo2.value === 'Outros'
            ? _el.inputCargoOutros2.value.trim()
            : _el.selectCargo2.value;
        const deptoFinal2 = resolverDepartamento(
          _el.selectDepartamento2.value,
          _el.inputDepartamentoOutros2.value
        );
        bloco2 = criarBlocoAssinatura(nome2, cargo2, deptoFinal2, _st.assinatura2);
      }

      assinaturaHtml = `
        <div class="assinaturas-container">
          ${criarBlocoAssinatura(nome1, cargo1, deptoFinal1, _st.assinatura1)}
          ${bloco2}
        </div>
      `;
    }

    let obsFinalHtml = '';
    if (_el.inputObservacoes.value.trim()) {
      obsFinalHtml += `<h3>Observações Gerais</h3><p>${esc(_el.inputObservacoes.value.trim())}</p>`;
    }
    if (assinaturaHtml) {
      obsFinalHtml += assinaturaHtml;
    }
    _el.observacoesFinaisRelatorioDiv.innerHTML = obsFinalHtml;

    _atualizarRodape();

    _el.areaRelatorio.style.display = 'table';
    if (ativarPreview) document.body.classList.add('preview-print');
    _el.areaRelatorio.scrollIntoView({ behavior: 'smooth' });
  }

  function _atualizarRodape() {
    const rodapeDiv = document.querySelector('.rodape-texto');
    if (!rodapeDiv) return;

    const isOutros1 = _el.selectDepartamento.value === 'Outros';
    const isOutros2 =
      _el.checkboxIncluirFiscal2.checked && _el.selectDepartamento2.value === 'Outros';

    if (isOutros1 || isOutros2) {
      let deptoNome = '';
      if (isOutros1 && _el.inputDepartamentoOutros.value.trim() !== '') {
        deptoNome = _el.inputDepartamentoOutros.value.trim();
      } else if (isOutros2 && _el.inputDepartamentoOutros2.value.trim() !== '') {
        deptoNome = _el.inputDepartamentoOutros2.value.trim();
      }

      if (deptoNome !== '') {
        rodapeDiv.innerHTML = `Companhia de Saneamento Básico do Estado de São Paulo – Sabesp<br>
        <span contenteditable="true" style="display:inline-block; outline:none;">${esc(deptoNome)}</span><br>
        <span>www.sabesp.com.br</span>`;
      } else {
        rodapeDiv.innerHTML = `Companhia de Saneamento Básico do Estado de São Paulo – Sabesp<br>
        <span>www.sabesp.com.br</span>`;
      }
    } else {
      rodapeDiv.innerHTML = `Companhia de Saneamento Básico do Estado de São Paulo – Sabesp<br>
      <span contenteditable="true" style="display:inline-block; outline:none;">Divisão de Manutenção e Serviços Operacionais de São José dos Campos - OVMS</span><br>
      <span contenteditable="true" style="display: inline-block; outline: none; min-width: 100%;">Rua Euclides Miragaia, 126, Centro - CEP 12.245-820 - São José dos Campos - SP</span><br>
      <span>www.sabesp.com.br</span>`;
    }
  }

  function _bindEvents() {
    _el.btnGerarRelatorio.addEventListener('click', (e) => {
      e.preventDefault();
      gerarRelatorio(true);
    });

    _el.btnGerarPDF.addEventListener('click', async (e) => {
      e.preventDefault();
      await gerarRelatorio(true);
      const tituloOriginal = document.title;
      const nomeObra = _el.inputLocalVistoria.value.trim();
      document.title = nomeObra ? `Relatório Fotográfico - ${nomeObra}` : 'Relatório Fotográfico';
      setTimeout(() => {
        window.print();
        document.title = tituloOriginal;
      }, 500);
    });

    _el.btnAlternarPreview.addEventListener('click', () => {
      document.body.classList.toggle('preview-print');
      _el.areaRelatorio.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return { init, gerarRelatorio };
})();

/* global module */
if (typeof module !== 'undefined') module.exports = { ReportGenerator };
