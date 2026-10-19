/**
 * Service to handle car rental financial calculations, Cash Flow vs. Economic/Patrimonial DRE,
 * Occupancy/Default sensitivity, DSCR, and FIPE-based Depreciation projections.
 *
 * CORE RULES:
 * 1. Depreciation is ALWAYS calculated over the vehicle's FIPE reference value (valorFipe), NEVER over valorPago.
 * 2. Depreciation is a non-cash patrimonial/economic effect: it MUST NOT be subtracted from Monthly Distributable Cash Flow.
 * 3. Reserve retentions (Fundo de Reserva / Manutenção Extra) reduce monthly distributable cash, but accumulate as operation reserves.
 * 4. Purchase discount below FIPE is an unrealized patrimonial margin buffer, not immediate cash profit on day zero.
 * 5. When 100% financed (valorEntrada === 0), ROI and Payback on own initial capital are marked as Not Applicable (null) instead of Infinity.
 */

export const simulationService = {
  DEFAULTS: {
    SIMPLES_NACIONAL_RATE: 0.0, // 0% default unless specified by user
    ANNUAL_DEPRECIATION_RATE: 0.0, // 0% fallback unless historical FIPE or user specifies
    WEEKS_PER_MONTH: 4.3,
    IPVA_ANNUAL_RATE: 0.04
  },

  /**
   * Rounds currency values to 2 decimal places safely to avoid floating-point drift
   */
  round2(val) {
    return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
  },

  /**
   * Performs all financial simulation calculations.
   * @param {Object} data Inputs from the forms
   */
  calculate(data) {
    const valorPago = Number(data.valorPago) || 0;
    const valorFipe = Number(data.valorFipe) || 0;
    const valorCaucao = Number(data.valorCaucao) || 0; // Passive security deposit, NOT rental revenue
    const valorSemanal = Number(data.valorSemanal) || 0;
    const semanasMes = Number(data.semanasMes) || this.DEFAULTS.WEEKS_PER_MONTH;

    // Occupancy & Collection (Adimplência) rates (0 to 1)
    const taxaOcupacao = typeof data.taxaOcupacao !== 'undefined' && data.taxaOcupacao !== null
      ? Math.max(0, Math.min(1, Number(data.taxaOcupacao)))
      : 1.0;
    const taxaAdimplencia = typeof data.taxaAdimplencia !== 'undefined' && data.taxaAdimplencia !== null
      ? Math.max(0, Math.min(1, Number(data.taxaAdimplencia)))
      : 1.0;

    // Projection horizon & exit parameters (12, 24, 36, 48, 60 months)
    const prazoMeses = Number(data.prazoAnaliseMeses) || Number(data.prazoMeses) || 36;
    const customSalePrice = typeof data.customSalePrice === 'number' && !Number.isNaN(data.customSalePrice)
      ? Math.max(0, data.customSalePrice)
      : null;
    const customPayoffAmount = typeof data.customPayoffAmount === 'number' && !Number.isNaN(data.customPayoffAmount)
      ? Math.max(0, data.customPayoffAmount)
      : null;

    // 1. Purchase vs. FIPE Margin
    const margemInicialVsFipe = this.round2(valorFipe - valorPago);
    const descontoSobreFipe = valorFipe > 0 ? ((valorFipe - valorPago) / valorFipe) : 0;

    // 2. Leveraged Operation (Financing)
    const isLeveraged = Boolean(data.isLeveraged);
    const valorEntrada = isLeveraged ? (Number(data.valorEntrada) || 0) : 0;
    const valorFinanciado = isLeveraged ? (Number(data.valorFinanciado) || 0) : 0;
    const qtdParcelas = isLeveraged ? (Number(data.qtdParcelas) || 0) : 0;
    const valorParcela = isLeveraged ? (Number(data.valorParcela) || 0) : 0;
    const parcelaFinanciamento = isLeveraged ? valorParcela : 0;
    const totalNominalFinanciamento = this.round2(parcelaFinanciamento * qtdParcelas);

    // 3. Monthly Revenue
    const receitaPotencialMensal = this.round2(valorSemanal * semanasMes);
    const receitaBrutaMensal = receitaPotencialMensal;

    // 4. Taxes (4. Impostos % - only if informed by user)
    const aliquotaImposto = typeof data.aliquotaImposto !== 'undefined' && data.aliquotaImposto !== null
      ? Number(data.aliquotaImposto)
      : this.DEFAULTS.SIMPLES_NACIONAL_RATE;
    const impostosSimplesNacional = this.round2(receitaBrutaMensal * aliquotaImposto);
    const receitaLiquidaMensal = this.round2(receitaBrutaMensal - impostosSimplesNacional);

    // 5. Out-of-Pocket Fixed Operational Costs (Custos que saem de fato do bolso da empresa)
    const rastreador = Number(data.rastreador) || 0;
    const seguro = Number(data.seguro) || 0;
    const manutencao = Number(data.manutencao) || 0;
    const suporteSistema = Number(data.suporteSistema) || 0;
    const contabilidade = Number(data.contabilidade) || 0;
    const ipvaLicenciamento = Number(data.ipvaLicenciamento) || 0;

    const custosOperacionaisRecorrentes = this.round2(
      rastreador + seguro + manutencao + suporteSistema + contabilidade + ipvaLicenciamento
    );

    // 6. Monthly Operational Profit (Desconta APENAS o que sai de fato do bolso da empresa)
    // Lucro Operacional Antes da Parcela:
    const caixaOperacionalAntesDivida = this.round2(receitaLiquidaMensal - custosOperacionaisRecorrentes);
    // Lucro Operacional Mensal (Com parcela do financiamento descontada quando houver):
    const lucroOperacionalMensal = this.round2(caixaOperacionalAntesDivida - parcelaFinanciamento);
    // Lucro Operacional Mensal após quitar o financiamento (sem parcela):
    const lucroOperacionalMensalSemParcela = caixaOperacionalAntesDivida;

    // Total que sai de fato do bolso no mês (Custos Fixos + Impostos + Parcela):
    const saidasBolsoMensais = this.round2(
      impostosSimplesNacional + custosOperacionaisRecorrentes + parcelaFinanciamento
    );

    // 7. Informational Variables (Reservas & Depreciação sobre a FIPE — não saem do bolso como despesa fixa)
    const fundoReserva = Number(data.fundoReserva) || 0;
    const manutencaoExtra = Number(data.manutencaoExtra) || 0;
    const reservasRetidasMes = this.round2(fundoReserva + manutencaoExtra);

    // MANDATORY RULE: Depreciation is ALWAYS calculated over FIPE (valorFipe), NEVER over valorPago
    const baseFipeDepreciacao = valorFipe > 0 ? valorFipe : valorPago;
    const depreciacaoMensal = this.round2(Math.max(0, Number(data.depreciacaoMensal) || 0));
    const depreciacaoAnualFipe = this.round2(depreciacaoMensal * 12);
    const taxaDepreciacaoAnualFipe = baseFipeDepreciacao > 0
      ? Math.min(0.99, Math.max(0, depreciacaoAnualFipe / baseFipeDepreciacao))
      : 0;
    const totalProvisoes = this.round2(reservasRetidasMes + depreciacaoMensal);

    // 8. Horizon Calculation for 12, 24, 36, 48, and 60 months
    const buildHorizon = (meses, isSelectedHorizon = false) => {
      // Operational profit accumulated over `meses`
      // In months 1..qtdParcelas, financing installment is paid out of pocket; after qtdParcelas, installment is 0!
      let lucroOperacionalAcumulado = 0;
      for (let m = 1; m <= meses; m++) {
        const temParcelaNoMes = isLeveraged && qtdParcelas > 0 && m <= qtdParcelas;
        const lucroMes = temParcelaNoMes ? lucroOperacionalMensal : lucroOperacionalMensalSemParcela;
        lucroOperacionalAcumulado = this.round2(lucroOperacionalAcumulado + lucroMes);
      }

      // Depreciation over FIPE in the period = depreciacaoMensal * meses (based on what the user set on the previous screen)
      const depreciacaoPeriodoFipe = this.round2(depreciacaoMensal * meses);
      const valorVeiculoAposDepreciacao = this.round2(Math.max(0, baseFipeDepreciacao - depreciacaoPeriodoFipe));

      // Vehicle sale value (defaults to FIPE minus period depreciation, or user's custom edited sale price on active horizon)
      const valorVendaVeiculo = (isSelectedHorizon && customSalePrice !== null)
        ? this.round2(customSalePrice)
        : valorVeiculoAposDepreciacao;

      // Remaining financing installments at month `meses`
      const parcelasPagasNoPeriodo = isLeveraged && qtdParcelas > 0 ? Math.min(meses, qtdParcelas) : 0;
      const mesesComParcela = parcelasPagasNoPeriodo;
      const mesesSemParcela = Math.max(0, meses - parcelasPagasNoPeriodo);
      const parcelasRestantes = isLeveraged && qtdParcelas > 0 ? Math.max(0, qtdParcelas - meses) : 0;
      const TemFinanciamentoRestante = parcelasRestantes > 0;
      const somaParcelasRestantes = this.round2(parcelasRestantes * parcelaFinanciamento);

      // Payoff amount (Valor para Quitação): 0 if no installments remain; otherwise customPayoffAmount or somaParcelasRestantes
      const valorQuitacao = parcelasRestantes > 0
        ? ((isSelectedHorizon && customPayoffAmount !== null) ? this.round2(customPayoffAmount) : somaParcelasRestantes)
        : 0;

      // Result: Lucro Operacional do Período + Valor da Venda do Veículo (descontada depreciação)
      const resultadoOperacionalMaisVenda = this.round2(lucroOperacionalAcumulado + valorVendaVeiculo);

      // Final Result after Quitação (if any installments remain)
      const resultadoLiquidoAposQuitacao = this.round2(resultadoOperacionalMaisVenda - valorQuitacao);

      // Initial capital disbursed at day 0 (Valor Pago if cash purchase, or Valor de Entrada if financed)
      const capitalInicialDesembolsado = isLeveraged ? valorEntrada : valorPago;
      const ganhoLiquidoSobreCapitalInicial = this.round2(resultadoLiquidoAposQuitacao - capitalInicialDesembolsado);

      const reservasAcumuladas = this.round2(reservasRetidasMes * meses);

      return {
        meses,
        anos: meses / 12,
        lucroOperacionalAcumulado,
        depreciacaoPeriodoFipe,
        valorVeiculoAposDepreciacao,
        valorVendaVeiculo,
        parcelasPagasNoPeriodo,
        mesesComParcela,
        mesesSemParcela,
        parcelasRestantes,
        TemFinanciamentoRestante,
        somaParcelasRestantes,
        valorQuitacao,
        resultadoOperacionalMaisVenda,
        resultadoLiquidoAposQuitacao,
        capitalInicialDesembolsado,
        ganhoLiquidoSobreCapitalInicial,
        lucroLiquidoSobreCapitalProprio: ganhoLiquidoSobreCapitalInicial,
        reservasAcumuladas
      };
    };

    const horizontes = [12, 24, 36, 48, 60].map(m => buildHorizon(m, m === prazoMeses));
    const horizonteSelecionado = horizontes.find(h => h.meses === prazoMeses) || buildHorizon(prazoMeses, true);

    // 9. Key Markers (Payback, ROI, Margem) based on out-of-pocket operational cash flow & selected horizon
    // Reference capital for ROI & Payback:
    // If cash purchase: valorPago. If leveraged with entrada > 0: valorEntrada. If 100% financed (entrada = 0): valorPago as asset base reference.
    const baseCapitalRoi = isLeveraged
      ? (valorEntrada > 0 ? valorEntrada : valorPago)
      : valorPago;
    const capitalProprioInicial = baseCapitalRoi;
    const semCapitalProprioInicial = isLeveraged && valorEntrada <= 0;

    const margemOperacionalMensal = receitaBrutaMensal > 0
      ? (lucroOperacionalMensal / receitaBrutaMensal)
      : 0;

    // Break-even occupancy & weeks/month based on out-of-pocket monthly expenses
    const ocupacaoEquilibrio = receitaBrutaMensal > 0
      ? Math.max(0, Math.min(1, saidasBolsoMensais / receitaBrutaMensal))
      : 0;
    const semanasEquilibrioMes = valorSemanal > 0
      ? Math.max(0, saidasBolsoMensais / valorSemanal)
      : 0;

    // Monthly ROI based on monthly operational profit in pocket
    const roiMensal = baseCapitalRoi > 0 ? (lucroOperacionalMensal / baseCapitalRoi) : 0;
    const roiAnual = roiMensal * 12;

    // Total ROI in the selected period (including vehicle sale - payoff - initial capital)
    const roiTotalPeriodo = baseCapitalRoi > 0
      ? ((horizonteSelecionado.resultadoLiquidoAposQuitacao - (isLeveraged ? valorEntrada : valorPago)) / baseCapitalRoi)
      : 0;

    // Payback in months
    const paybackMeses = (lucroOperacionalMensal > 0 && baseCapitalRoi > 0)
      ? (baseCapitalRoi / lucroOperacionalMensal)
      : Infinity;

    const dscr = parcelaFinanciamento > 0
      ? (caixaOperacionalAntesDivida / parcelaFinanciamento)
      : null;

    const analiseRisco = this.evaluateRisk({
      caixaDisponivelProjetado: lucroOperacionalMensal,
      dscr,
      ocupacaoEquilibrio,
      roiMensal,
      roiSobreAtivoMensal: valorPago > 0 ? (lucroOperacionalMensal / valorPago) : 0,
      semCapitalProprioInicial
    });

    return {
      // Monthly Revenue & Out-of-pocket Expenses
      receitaPotencialMensal,
      receitaBrutaMensal,
      impostosSimplesNacional,
      receitaLiquidaMensal,
      custosOperacionaisRecorrentes,
      caixaOperacionalAntesDivida,
      parcelaFinanciamento,
      totalNominalFinanciamento,
      saidasBolsoMensais,
      saidasCaixaBolsoMensais: saidasBolsoMensais,
      lucroOperacionalMensal,
      lucroOperacionalMensalSemParcela,

      // Informational Provisions & FIPE Depreciation
      baseFipeDepreciacao,
      depreciacaoMensal,
      depreciacaoAnualFipe,
      taxaDepreciacaoAnualFipe,
      fundoReserva,
      manutencaoExtra,
      reservasRetidasMes,
      totalProvisoes,

      // Purchase vs FIPE Margin
      margemInicialVsFipe,
      descontoSobreFipe,

      // Markers (ROI, Payback, Margin, Break-even)
      isLeveraged,
      semCapitalProprioInicial,
      baseCapitalRoi,
      capitalProprioInicial,
      margemOperacionalMensal,
      margemLucroOperacional: margemOperacionalMensal,
      margemLiquida: margemOperacionalMensal,
      ocupacaoEquilibrio,
      semanasEquilibrioMes,
      roiMensal,
      roiAnual,
      roiTotalPeriodo,
      paybackMeses,
      dscr,

      // Horizons (12, 24, 36, 48, 60 months)
      horizontes,
      horizonteSelecionado,
      analiseRisco,

      // Legacy aliases
      custosTotaisMensais: saidasBolsoMensais,
      lucroOperacional: caixaOperacionalAntesDivida,
      lucroLiquido: lucroOperacionalMensal,
      caixaDisponivelProjetado: lucroOperacionalMensal,

      inputs: {
        valorPago,
        valorFipe,
        valorCaucao,
        valorSemanal,
        semanasMes,
        prazoMeses,
        prazoAnaliseMeses: prazoMeses,
        isLeveraged,
        valorEntrada,
        valorFinanciado,
        qtdParcelas,
        valorParcela
      },
      custosDetalhados: {
        rastreador,
        seguro,
        manutencao,
        suporteSistema,
        contabilidade,
        ipvaLicenciamento,
        impostosSimplesNacional,
        fundoReserva,
        manutencaoExtra,
        reservasRetidasMes,
        depreciacaoMensal,
        parcelaFinanciamento
      }
    };
  },

  /**
   * Helper to estimate monthly IPVA provision based on FIPE price
   */
  estimateMonthlyIpva(valorFipe) {
    return (valorFipe * this.DEFAULTS.IPVA_ANNUAL_RATE) / 12;
  },

  /**
   * Helper to estimate monthly depreciation ALWAYS based on FIPE price (valorFipe)
   */
  estimateMonthlyDepreciation(valorFipe, annualRate = 0.06) {
    return (valorFipe * annualRate) / 12;
  },

  /**
   * Evaluates operational risk based on Distributable Cash Flow, DSCR, and Break-even Occupancy
   */
  evaluateRisk({
    caixaDisponivelProjetado,
    dscr,
    ocupacaoEquilibrio
  }) {
    if (caixaDisponivelProjetado <= 0 || (dscr !== null && dscr < 1.0)) {
      return {
        status: 'danger',
        score: dscr !== null && dscr < 1.0 ? 'Alerta: DSCR < 1,00x' : 'Fluxo de Caixa Negativo',
        message: dscr !== null && dscr < 1.0
          ? 'A geração operacional de caixa é insuficiente para cobrir a parcela do financiamento (DSCR menor que 1). Alto risco de desembolso do próprio bolso.'
          : 'As saídas de caixa, serviço da dívida e retenções superam a receita esperada no cenário atual. Reveja o aluguel semanal, custos ou condições do crédito.',
        colorClass: 'text-rose-400 bg-rose-950/40 border-rose-500/30'
      };
    }

    if (ocupacaoEquilibrio > 0.85 || (dscr !== null && dscr < 1.25)) {
      return {
        status: 'warning',
        score: 'Margem de Segurança Estreita',
        message: `O caixa é positivo, mas exige ocupação acima de ${(ocupacaoEquilibrio * 100).toFixed(1)}% para empatar. Pequenas vacâncias ou inadimplência podem pressionar o caixa mensal.`,
        colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30'
      };
    }

    if (ocupacaoEquilibrio <= 0.65) {
      return {
        status: 'excellent',
        score: 'Alta Resiliência de Caixa',
        message: `Operação com forte geração de caixa disponível e ponto de equilíbrio baixo (${(ocupacaoEquilibrio * 100).toFixed(1)}% de ocupação), oferecendo amplo colchão contra vacância.`,
        colorClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30'
      };
    }

    return {
      status: 'success',
      score: 'Operação Equilibrada',
      message: `O fluxo de caixa cobre custos operacionais, serviço da dívida e reservas com ponto de equilíbrio em ${(ocupacaoEquilibrio * 100).toFixed(1)}% de ocupação.`,
      colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
    };
  }
};
