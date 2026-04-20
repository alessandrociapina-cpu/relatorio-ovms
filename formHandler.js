/* global mostrarErro, limparErro, mostrarAlerta, confirmar, salvarDB, carregarDB, limparDB, sanitizarNomeArquivo, validarEsquemaProjeto, formatarDataISO */
'use strict';

const FormHandler = (() => {
  let _st, _el, _cb;
  let _timeoutSalvar;

  function init(state, elements, callbacks) {
    _st = state;
    _el = elements;
    _cb = callbacks; // { onEstadoCarregado }
    _bindEvents();
  }

  function validarFiscal(
    inputNome,
    selectCargo,
    inputCargoOutros,
    selectDepto,
    inputDeptoOutros,
    label
  ) {
    let valido = true;
    let primeiroErro = null;

    const nome = inputNome.value.trim();
    if (!nome) {
      mostrarErro(inputNome, `Informe o nome do ${label}.`);
      primeiroErro = inputNome;
      valido = false;
    } else if (nome.length < 3) {
      mostrarErro(inputNome, 'O nome deve ter pelo menos 3 caracteres.');
      primeiroErro = inputNome;
      valido = false;
    } else {
      limparErro(inputNome);
    }

    if (selectCargo.value === 'Outros') {
      const cargo = inputCargoOutros.value.trim();
      if (!cargo) {
        mostrarErro(inputCargoOutros, `Informe o cargo do ${label}.`);
        primeiroErro = primeiroErro || inputCargoOutros;
        valido = false;
      } else if (cargo.length < 2) {
        mostrarErro(inputCargoOutros, 'Mínimo de 2 caracteres.');
        primeiroErro = primeiroErro || inputCargoOutros;
        valido = false;
      } else {
        limparErro(inputCargoOutros);
      }
    } else {
      limparErro(inputCargoOutros);
    }

    if (selectDepto.value === 'Outros') {
      const depto = inputDeptoOutros.value.trim();
      if (!depto) {
        mostrarErro(inputDeptoOutros, `Informe o departamento do ${label}.`);
        primeiroErro = primeiroErro || inputDeptoOutros;
        valido = false;
      } else if (depto.length < 3) {
        mostrarErro(inputDeptoOutros, 'Mínimo de 3 caracteres.');
        primeiroErro = primeiroErro || inputDeptoOutros;
        valido = false;
      } else {
        limparErro(inputDeptoOutros);
      }
    } else {
      limparErro(inputDeptoOutros);
    }

    return { valido, primeiroErro };
  }

  function validarFormulario() {
    let valido = true;
    let primeiroErro = null;

    const local = _el.inputLocalVistoria.value.trim();
    if (!local) {
      mostrarErro(_el.inputLocalVistoria, 'Informe o local da vistoria.');
      primeiroErro = _el.inputLocalVistoria;
      valido = false;
    } else if (local.length < 3) {
      mostrarErro(_el.inputLocalVistoria, 'O local deve ter pelo menos 3 caracteres.');
      primeiroErro = _el.inputLocalVistoria;
      valido = false;
    } else {
      limparErro(_el.inputLocalVistoria);
    }

    if (!_el.inputDataVistoria.value) {
      mostrarErro(_el.inputDataVistoria, 'Informe a data da vistoria.');
      primeiroErro = primeiroErro || _el.inputDataVistoria;
      valido = false;
    } else {
      limparErro(_el.inputDataVistoria);
    }

    const r1 = validarFiscal(
      _el.inputNomeFiscal,
      _el.selectCargo,
      _el.inputCargoOutros,
      _el.selectDepartamento,
      _el.inputDepartamentoOutros,
      '1º fiscal'
    );
    if (!r1.valido) {
      valido = false;
      primeiroErro = primeiroErro || r1.primeiroErro;
    }

    if (_el.checkboxIncluirFiscal2.checked) {
      const r2 = validarFiscal(
        _el.inputNomeFiscal2,
        _el.selectCargo2,
        _el.inputCargoOutros2,
        _el.selectDepartamento2,
        _el.inputDepartamentoOutros2,
        '2º fiscal'
      );
      if (!r2.valido) {
        valido = false;
        primeiroErro = primeiroErro || r2.primeiroErro;
      }
    } else {
      limparErro(_el.inputNomeFiscal2);
      limparErro(_el.inputCargoOutros2);
      limparErro(_el.inputDepartamentoOutros2);
    }

    if (primeiroErro) {
      primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primeiroErro.focus();
    }
    return valido;
  }

  function vincularSelectOutros(selectEl, inputOutros) {
    selectEl.addEventListener('change', (e) => {
      const isOutros = e.target.value === 'Outros';
      inputOutros.style.display = isOutros ? 'inline-block' : 'none';
      if (isOutros) inputOutros.focus();
      else inputOutros.value = '';
      salvarRascunhoLocal();
    });
    inputOutros.addEventListener('input', salvarRascunhoLocal);
  }

  function atualizarVisibilidadeAssinaturas() {
    _el.dicaAssinatura.style.display = _el.checkboxAssinatura.checked ? 'block' : 'none';

    if (_el.checkboxAssinatura.checked) {
      _el.btnAssinaturaLabel.style.display = 'inline-block';
      _el.btnAssinaturaLabel2.style.display = _el.checkboxIncluirFiscal2.checked
        ? 'inline-block'
        : 'none';
    } else {
      _el.btnAssinaturaLabel.style.display = 'none';
      _el.btnAssinaturaLabel2.style.display = 'none';
    }

    if (!_el.checkboxAssinatura.checked) {
      _el.assinaturaStatus.style.display = 'none';
      _el.btnRemoverAssinatura.style.display = 'none';
      _el.assinaturaStatus2.style.display = 'none';
      _el.btnRemoverAssinatura2.style.display = 'none';
    } else {
      if (_st.assinatura1) {
        _el.assinaturaStatus.style.display = 'inline-block';
        _el.btnRemoverAssinatura.style.display = 'inline-block';
      }
      if (_st.assinatura2 && _el.checkboxIncluirFiscal2.checked) {
        _el.assinaturaStatus2.style.display = 'inline-block';
        _el.btnRemoverAssinatura2.style.display = 'inline-block';
      } else {
        _el.assinaturaStatus2.style.display = 'none';
        _el.btnRemoverAssinatura2.style.display = 'none';
      }
    }
  }

  function exportarEstado() {
    const borda =
      Array.from(document.querySelectorAll('input[name="bordaFotos"]')).find((r) => r.checked)
        ?.value || 'nenhuma';
    return {
      form: {
        local: _el.inputLocalVistoria.value,
        data: _el.inputDataVistoria.value,
        hora: _el.inputHoraVistoria.value,
        fiscal: _el.inputNomeFiscal.value,
        obs: _el.inputObservacoes.value,
        incluirAssinatura: _el.checkboxAssinatura.checked,
        assinaturaUrl: _st.assinatura1,
        cargo: _el.selectCargo.value,
        cargoOutros: _el.inputCargoOutros.value,
        departamento1: _el.selectDepartamento.value,
        departamentoOutros1: _el.inputDepartamentoOutros.value,
        incluirFiscal2: _el.checkboxIncluirFiscal2.checked,
        nomeFiscal2: _el.inputNomeFiscal2.value,
        cargo2: _el.selectCargo2.value,
        cargoOutros2: _el.inputCargoOutros2.value,
        departamento2: _el.selectDepartamento2.value,
        departamentoOutros2: _el.inputDepartamentoOutros2.value,
        assinaturaUrl2: _st.assinatura2,
        bordaFotos: borda,
      },
      fotos: _st.fotos,
    };
  }

  function carregarEstado(estado) {
    if (estado.form) {
      _el.inputLocalVistoria.value = estado.form.local || '';
      _el.inputDataVistoria.value = estado.form.data || '';
      _el.inputHoraVistoria.value = estado.form.hora || '';
      _el.inputNomeFiscal.value = estado.form.fiscal || '';
      _el.inputObservacoes.value = estado.form.obs || '';

      if (estado.form.cargo) _el.selectCargo.value = estado.form.cargo;
      if (estado.form.cargo === 'Outros') {
        _el.inputCargoOutros.style.display = 'inline-block';
        _el.inputCargoOutros.value = estado.form.cargoOutros || '';
      } else {
        _el.inputCargoOutros.style.display = 'none';
      }

      if (estado.form.departamento1) _el.selectDepartamento.value = estado.form.departamento1;
      if (estado.form.departamento && !estado.form.departamento1)
        _el.selectDepartamento.value = estado.form.departamento;
      if (_el.selectDepartamento.value === 'Outros') {
        _el.inputDepartamentoOutros.style.display = 'inline-block';
        _el.inputDepartamentoOutros.value =
          estado.form.departamentoOutros1 || estado.form.departamentoOutros || '';
      } else {
        _el.inputDepartamentoOutros.style.display = 'none';
      }

      _el.checkboxIncluirFiscal2.checked = estado.form.incluirFiscal2 || false;
      _el.blocoFiscal2.style.display = _el.checkboxIncluirFiscal2.checked ? 'flex' : 'none';
      _el.inputNomeFiscal2.value = estado.form.nomeFiscal2 || '';

      if (estado.form.cargo2) _el.selectCargo2.value = estado.form.cargo2;
      if (estado.form.cargo2 === 'Outros') {
        _el.inputCargoOutros2.style.display = 'inline-block';
        _el.inputCargoOutros2.value = estado.form.cargoOutros2 || '';
      } else {
        _el.inputCargoOutros2.style.display = 'none';
      }

      if (estado.form.departamento2) _el.selectDepartamento2.value = estado.form.departamento2;
      if (estado.form.departamento2 === 'Outros') {
        _el.inputDepartamentoOutros2.style.display = 'inline-block';
        _el.inputDepartamentoOutros2.value = estado.form.departamentoOutros2 || '';
      } else {
        _el.inputDepartamentoOutros2.style.display = 'none';
      }

      _el.checkboxAssinatura.checked = estado.form.incluirAssinatura || false;
      _st.assinatura1 = estado.form.assinaturaUrl || null;
      _st.assinatura2 = estado.form.assinaturaUrl2 || null;

      if (estado.form.bordaFotos) {
        const rb = document.querySelector(
          `input[name="bordaFotos"][value="${estado.form.bordaFotos}"]`
        );
        if (rb) rb.checked = true;
      }
      atualizarVisibilidadeAssinaturas();
    }
    if (estado.fotos) {
      _st.fotos = estado.fotos;
      _cb.onEstadoCarregado();
    }
  }

  function salvarRascunhoLocal() {
    clearTimeout(_timeoutSalvar);
    _el.autoSaveStatus.textContent = 'Digitando... (aguardando para salvar)';
    _el.autoSaveStatus.style.color = '#6c757d';

    _timeoutSalvar = setTimeout(async () => {
      try {
        await salvarDB(exportarEstado());
        const agora = new Date();
        _el.autoSaveStatus.textContent = `✔ Salvo às ${agora.getHours()}:${String(agora.getMinutes()).padStart(2, '0')}`;
        _el.autoSaveStatus.style.color = 'green';
      } catch (e) {
        _el.autoSaveStatus.textContent =
          '⚠️ Falha ao armazenar. Use "Baixar Projeto" para garantir!';
        _el.autoSaveStatus.style.color = '#d9534f';
        console.error('Falha interna no IndexedDB:', e);
      }
    }, 5000);
  }

  async function inicializarAutoSave() {
    try {
      const dataToRestore = await carregarDB();
      if (dataToRestore && validarEsquemaProjeto(dataToRestore)) {
        const localSalvo =
          dataToRestore.form && dataToRestore.form.local
            ? dataToRestore.form.local
            : 'Não informado';
        let dataSalva = 'Não informada';
        if (dataToRestore.form && dataToRestore.form.data) {
          dataSalva = formatarDataISO(dataToRestore.form.data) || 'Não informada';
        }
        const msg = `Encontramos um relatório em andamento salvo neste dispositivo:\n\n📍 Local: ${localSalvo}\n📅 Data: ${dataSalva}\n\nDeseja restaurar esta vistoria?`;
        if (await confirmar(msg)) {
          carregarEstado(dataToRestore);
          _el.autoSaveStatus.textContent = 'Rascunho restaurado.';
        } else {
          await limparDB();
        }
      }
    } catch (e) {
      console.error('Erro assíncrono ao recuperar o estado da vistoria:', e);
    }
  }

  function _bindEvents() {
    vincularSelectOutros(_el.selectCargo, _el.inputCargoOutros);
    vincularSelectOutros(_el.selectDepartamento, _el.inputDepartamentoOutros);
    vincularSelectOutros(_el.selectCargo2, _el.inputCargoOutros2);
    vincularSelectOutros(_el.selectDepartamento2, _el.inputDepartamentoOutros2);

    _el.checkboxAssinatura.addEventListener('change', () => {
      atualizarVisibilidadeAssinaturas();
      salvarRascunhoLocal();
    });

    _el.checkboxIncluirFiscal2.addEventListener('change', (e) => {
      _el.blocoFiscal2.style.display = e.target.checked ? 'flex' : 'none';
      atualizarVisibilidadeAssinaturas();
      salvarRascunhoLocal();
    });

    _el.inputImagemAssinatura.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        await mostrarAlerta('Selecione apenas arquivos de imagem.', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        _st.assinatura1 = ev.target.result;
        atualizarVisibilidadeAssinaturas();
        salvarRascunhoLocal();
      };
      reader.readAsDataURL(file);
    });

    _el.inputImagemAssinatura2.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        await mostrarAlerta('Selecione apenas arquivos de imagem.', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        _st.assinatura2 = ev.target.result;
        atualizarVisibilidadeAssinaturas();
        salvarRascunhoLocal();
      };
      reader.readAsDataURL(file);
    });

    _el.btnRemoverAssinatura.addEventListener('click', () => {
      _st.assinatura1 = null;
      _el.inputImagemAssinatura.value = '';
      atualizarVisibilidadeAssinaturas();
      salvarRascunhoLocal();
    });

    _el.btnRemoverAssinatura2.addEventListener('click', () => {
      _st.assinatura2 = null;
      _el.inputImagemAssinatura2.value = '';
      atualizarVisibilidadeAssinaturas();
      salvarRascunhoLocal();
    });

    _el.formVistoria.addEventListener('input', salvarRascunhoLocal);

    [
      _el.inputLocalVistoria,
      _el.inputDataVistoria,
      _el.inputNomeFiscal,
      _el.inputCargoOutros,
      _el.inputDepartamentoOutros,
      _el.inputNomeFiscal2,
      _el.inputCargoOutros2,
      _el.inputDepartamentoOutros2,
    ].forEach((input) => input.addEventListener('input', () => limparErro(input)));

    document
      .querySelectorAll('input[name="bordaFotos"]')
      .forEach((r) => r.addEventListener('change', salvarRascunhoLocal));

    _el.btnSalvarProjeto.addEventListener('click', (e) => {
      e.preventDefault();
      const blob = new Blob([JSON.stringify(exportarEstado())], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dataArquivo = _el.inputDataVistoria.value || 'sem-data';
      const localArquivo = sanitizarNomeArquivo(_el.inputLocalVistoria.value);
      a.download = `vistoria-${dataArquivo}-${localArquivo}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    _el.inputCarregarProjeto.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.name.endsWith('.json')) {
        await mostrarAlerta('Selecione um arquivo de projeto (.json).', 'error');
        _el.inputCarregarProjeto.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const dados = JSON.parse(ev.target.result);
          if (!validarEsquemaProjeto(dados)) {
            await mostrarAlerta('Arquivo inválido: formato não reconhecido.', 'error');
            return;
          }
          carregarEstado(dados);
          await mostrarAlerta('Projeto carregado com sucesso!', 'success');
          salvarRascunhoLocal();
        } catch (_err) {
          await mostrarAlerta('Erro ao ler o arquivo. Verifique se é um projeto válido.', 'error');
        }
      };
      reader.readAsText(file);
      _el.inputCarregarProjeto.value = '';
    });
  }

  return {
    init,
    validarFormulario,
    exportarEstado,
    carregarEstado,
    salvarRascunhoLocal,
    inicializarAutoSave,
  };
})();

/* global module */
if (typeof module !== 'undefined') module.exports = { FormHandler };
