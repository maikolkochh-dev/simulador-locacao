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

    // Projection horizon & exit parameters
    const prazoMeses = Number(data.prazoAnaliseMeses) || Number(data.prazoMeses) || (Number(data.qtdParcelas) > 0 ? Number(data.qtdParcelas) : 48);
    const descontoRevendaFipePct = typeof data.desagioVendaFipe !== 'undefined'
      ? Math.max(0, Math.min(1, Number(data.desagioVendaFipe)))
      : (typeof data.descontoRevendaFipePct !== 'undefined'
        ? Math.max(0, Math.min(1, Number(data.descontoRevendaFipePct)))
        : 0);

    // 1. Purchase vs. FIPE Patrimonial Margin
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

    // 3. Revenue Calculations (Potential vs. Expected after Occupancy & Adimplência)
    const receitaPotencialMensal = this.round2(valorSemanal * semanasMes);
    const receitaBrutaMensal = this.round2(receitaPotencialMensal * taxaOcupacao * taxaAdimplencia);
    const perdaVacanciaInadimplencia = this.round2(receitaPotencialMensal - receitaBrutaMensal);

    // 4. Taxes (Simples Nacional / Aliquota configurada)
    const aliquotaImposto = typeof data.aliquotaImposto !== 'undefined' && data.aliquotaImposto !== null
      ? Number(data.aliquotaImposto)
      : this.DEFAULTS.SIMPLES_NACIONAL_RATE;
    const impostosSimplesNacional = this.round2(receitaBrutaMensal * aliquotaImposto);
    const receitaLiquidaMensal = this.round2(receitaBrutaMensal - impostosSimplesNacional);

    // 5. Fixed Operational Cash Outflows
    const rastreador = Number(data.rastreador) || 0;
    const seguro = Number(data.seguro) || 0;
    const manutencao = Number(data.manutencao) || 0;
    const suporteSistema = Number(data.suporteSistema) || 0;
    const contabilidade = Number(data.contabilidade) || 0;
    const ipvaLicenciamento = Number(data.ipvaLicenciamento) || 0;

    const custosOperacionaisRecorrentes = this.round2(
      rastreador + seguro + manutencao + suporteSistema + contabilidade + ipvaLicenciamento
    );

    // 6. Cash Flow Statement (Demonstrativo de Fluxo de Caixa Mensal)
    // Operational Cash Flow BEFORE Debt Service
    const caixaOperacionalAntesDivida = this.round2(receitaLiquidaMensal - custosOperacionaisRecorrentes);

    // Cash Flow AFTER Debt Service
    const caixaAposServicoDivida = this.round2(caixaOperacionalAntesDivida - parcelaFinanciamento);

    // Cash Retentions in Internal Funds (Emergency Reserve + Extra Maintenance Provision)
    const fundoReserva = Number(data.fundoReserva) || 0;
    const manutencaoExtra = Number(data.manutencaoExtra) || 0;
    const reservasRetidasMes = this.round2(fundoReserva + manutencaoExtra);

    // MAIN INDICATOR: Monthly Distributable Cash Flow (Caixa Mensal Disponível Projetado)
    // NOTE: Depreciation is NEVER subtracted here!
    const caixaDisponivelProjetado = this.round2(caixaAposServicoDivida - reservasRetidasMes);

    // Total monthly cash outflows + retentions (excluding non-cash depreciation)
    const saidasCaixaERetencoesMes = this.round2(
      impostosSimplesNacional + custosOperacionaisRecorrentes + parcelaFinanciamento + reservasRetidasMes
    );
    const saidasCaixaTotaisMensais = saidasCaixaERetencoesMes;

    // 7. Depreciation — MANDATORY RULE: ALWAYS calculated over FIPE (valorFipe), NEVER over valorPago
    const baseFipeDepreciacao = valorFipe > 0 ? valorFipe : valorPago;
    let depreciacaoMensal = 0;
    if (typeof data.depreciacaoMensal !== 'undefined' && data.depreciacaoMensal !== null) {
      depreciacaoMensal = this.round2(Number(data.depreciacaoMensal));
    } else {
      const depreciacaoAnualTaxa = typeof data.depreciacaoAnualTaxa !== 'undefined'
        ? Number(data.depreciacaoAnualTaxa)
        : this.DEFAULTS.ANNUAL_DEPRECIATION_RATE;
      depreciacaoMensal = this.round2((baseFipeDepreciacao * depreciacaoAnualTaxa) / 12);
    }

    const depreciacaoAnualFipe = this.round2(depreciacaoMensal * 12);
    const taxaDepreciacaoAnualFipe = baseFipeDepreciacao > 0
      ? Math.min(0.99, Math.max(0, depreciacaoAnualFipe / baseFipeDepreciacao))
      : 0;
    const taxaDepreciacaoMensalFipe = baseFipeDepreciacao > 0
      ? (depreciacaoMensal / baseFipeDepreciacao)
      : 0;

    // 8. Economic & Patrimonial Result (DRE Econômico / Patrimonial)
    // Total provisions (Reserve retentions + Non-cash FIPE depreciation) for Economic view
    const totalProvisoes = this.round2(reservasRetidasMes + depreciacaoMensal);
    const custosTotaisEconomicos = this.round2(saidasCaixaERetencoesMes + depreciacaoMensal);
    const resultadoEconomicoMensal = this.round2(caixaDisponivelProjetado - depreciacaoMensal);

    // Legacy compatibility aliases:
    // lucroOperacional = caixaOperacionalAntesDivida
    // lucroLiquido = caixaDisponivelProjetado (so main KPIs reflect real distributable cash as required by spec)
    const lucroOperacional = caixaOperacionalAntesDivida;
    const lucroLiquido = caixaDisponivelProjetado;
    const custosTotaisMensais = saidasCaixaERetencoesMes;

    // 9. Debt Service Coverage Ratio (DSCR) & Break-even Occupancy
    const dscr = parcelaFinanciamento > 0
      ? (caixaOperacionalAntesDivida / parcelaFinanciamento)
      : null;

    // Break-even occupancy: minimum occupancy to cover taxes, fixed costs, debt service, and reserve retentions
    const compromissosFixosMensais = this.round2(
      custosOperacionaisRecorrentes + parcelaFinanciamento + reservasRetidasMes
    );
    const receitaBaseLiquidaPorUnidadeOcupacao = receitaPotencialMensal * taxaAdimplencia * (1 - aliquotaImposto);
    const ocupacaoEquilibrio = receitaBaseLiquidaPorUnidadeOcupacao > 0
      ? (compromissosFixosMensais / receitaBaseLiquidaPorUnidadeOcupacao)
      : 0;
    const semanasEquilibrioMes = ocupacaoEquilibrio * semanasMes;

    // 10. Capital Base, ROI & Payback (Strict handling when 100% Financed / Entrada = 0)
    const semCapitalProprioInicial = isLeveraged && valorEntrada <= 0;
    const capitalInvestido = isLeveraged ? valorEntrada : valorPago;
    const capitalProprioInicial = capitalInvestido;

    const margemCaixa = receitaBrutaMensal > 0 ? (caixaDisponivelProjetado / receitaBrutaMensal) : 0;
    const margemCaixaDisponivel = margemCaixa;
    const margemLiquida = margemCaixa;
    const margemEconomica = receitaBrutaMensal > 0 ? (resultadoEconomicoMensal / receitaBrutaMensal) : 0;

    const roiMensal = (!semCapitalProprioInicial && capitalInvestido > 0)
      ? (caixaDisponivelProjetado / capitalInvestido)
      : null;
    const roiAnual = roiMensal !== null ? (roiMensal * 12) : null;
    const paybackMeses = (!semCapitalProprioInicial && capitalInvestido > 0 && caixaDisponivelProjetado > 0)
      ? (capitalInvestido / caixaDisponivelProjetado)
      : (semCapitalProprioInicial ? null : Infinity);

    // Reference return over total asset purchase price (always defined if valorPago > 0)
    const roiSobreAtivoMensal = valorPago > 0 ? (caixaDisponivelProjetado / valorPago) : 0;
    const roiSobreAtivoAnual = roiSobreAtivoMensal * 12;

    // 11. Occupancy Sensitivity Scenarios (100%, 90%, 80%)
    const cenariosOcupacao = [1.0, 0.9, 0.8].map((ocup) => {
      const recMes = this.round2(receitaPotencialMensal * ocup * taxaAdimplencia);
      const impMes = this.round2(recMes * aliquotaImposto);
      const recLiq = this.round2(recMes - impMes);
      const cxOpAntesDivida = this.round2(recLiq - custosOperacionaisRecorrentes);
      const cxAposDivida = this.round2(cxOpAntesDivida - parcelaFinanciamento);
      const cxDistribuivel = this.round2(cxAposDivida - reservasRetidasMes);
      const dscrCenario = parcelaFinanciamento > 0 ? (cxOpAntesDivida / parcelaFinanciamento) : null;
      return {
        ocupacaoPct: Math.round(ocup * 100),
        ocupacaoFactor: ocup,
        taxaOcupacao: ocup,
        semanasAlugadasMes: ocup * semanasMes,
        receitaMensal: recMes,
        receitaBrutaMensal: recMes,
        impostosMensal: impMes,
        caixaOperacionalAntesDivida: cxOpAntesDivida,
        parcelaFinanciamento,
        caixaAposDivida: cxAposDivida,
        caixaAposServicoDivida: cxAposDivida,
        reservaRetida: reservasRetidasMes,
        reservasRetidasMes,
        caixaDistribuivel: cxDistribuivel,
        caixaDisponivelProjetado: cxDistribuivel,
        caixaAcumulado48m: this.round2(cxDistribuivel * 48),
        dscr: dscrCenario
      };
    });

    // 12. Multi-Period Horizon Projections (12, 24, 36, 48 months) — Cash & FIPE Patrimony
    const horizontes = [12, 24, 36, 48].map((meses) => {
      // Cash accumulated over N months (accounting for financing ending if meses > qtdParcelas)
      let caixaDistribuivelAcumulado = 0;
      for (let m = 1; m <= meses; m++) {
        const parcelaMes = (isLeveraged && qtdParcelas > 0 && m > qtdParcelas) ? 0 : parcelaFinanciamento;
        const cxMes = this.round2(caixaOperacionalAntesDivida - parcelaMes - reservasRetidasMes);
        caixaDistribuivelAcumulado = this.round2(caixaDistribuivelAcumulado + cxMes);
      }
      const reservasAcumuladas = this.round2(reservasRetidasMes * meses);

      // FIPE Projected Value at month N (always depreciating from valorFipe!)
      // Formula from Spec 3.5.A: fipe_projetada = fipe_atual * (1 - taxa_anual)^(n/12)
      const fipeProjetada = this.round2(
        baseFipeDepreciacao * Math.pow(1 - taxaDepreciacaoAnualFipe, meses / 12)
      );
      const depreciacaoAcumuladaFipe = this.round2(baseFipeDepreciacao - fipeProjetada);
      const valorBrutoRevenda = this.round2(fipeProjetada * (1 - descontoRevendaFipePct));
      const diferencaRevendaVsValorPago = this.round2(valorBrutoRevenda - valorPago);

      // Nominal remaining installments (note: nominal sum, not discounted present value)
      const parcelasRestantes = isLeveraged && qtdParcelas > 0 ? Math.max(0, qtdParcelas - meses) : 0;
      const saldoNominalParcelasRestantes = this.round2(parcelasRestantes * parcelaFinanciamento);
      const patrimonioLiquidoVeiculo = this.round2(Math.max(0, valorBrutoRevenda - saldoNominalParcelasRestantes));
      const riquezaTotalGerada = this.round2(caixaDistribuivelAcumulado + reservasAcumuladas + patrimonioLiquidoVeiculo);

      return {
        meses,
        anos: meses / 12,
        caixaDistribuivelAcumulado,
        reservasAcumuladas,
        fipeProjetada,
        valorFipeProjetado: fipeProjetada,
        depreciacaoAcumuladaFipe,
        valorBrutoRevenda,
        valorVendaProjetado: valorBrutoRevenda,
        diferencaRevendaVsValorPago,
        ganhoOuPerdaSobreValorPago: diferencaRevendaVsValorPago,
        parcelasRestantes,
        saldoNominalParcelasRestantes,
        saldoDevedorEstimado: saldoNominalParcelasRestantes,
        patrimonioLiquidoVeiculo,
        riquezaTotalGerada
      };
    });

    const projecaoPrazoSelecionado = horizontes.find(h => h.meses === prazoMeses) || horizontes[3];
    const horizonteSelecionado = projecaoPrazoSelecionado;

    // 13. Risk Analysis Scoring (incorporating Cash Flow, DSCR, and Occupancy Break-even)
    const analiseRisco = this.evaluateRisk({
      caixaDisponivelProjetado,
      dscr,
      ocupacaoEquilibrio,
      roiMensal,
      roiSobreAtivoMensal,
      semCapitalProprioInicial
    });

    return {
      // Revenue
      receitaPotencialMensal,
      receitaBrutaMensal,
      perdaVacanciaInadimplencia,
      impostosSimplesNacional,
      receitaLiquidaMensal,

      // Cash Flow Statement
      custosOperacionaisRecorrentes,
      caixaOperacionalAntesDivida,
      parcelaFinanciamento,
      totalNominalFinanciamento,
      caixaAposServicoDivida,
      fundoReserva,
      manutencaoExtra,
      reservasRetidasMes,
      caixaDisponivelProjetado,
      saidasCaixaERetencoesMes,
      saidasCaixaTotaisMensais,

      // Depreciation (ALWAYS over FIPE) & Economic/Patrimonial Statement
      baseFipeDepreciacao,
      depreciacaoMensal,
      depreciacaoAnualFipe,
      taxaDepreciacaoAnualFipe,
      taxaDepreciacaoMensalFipe,
      totalProvisoes,
      custosTotaisEconomicos,
      resultadoEconomicoMensal,

      // Purchase vs FIPE Patrimonial Margin
      margemInicialVsFipe,
      descontoSobreFipe,

      // Key Ratios & Indicators
      dscr,
      ocupacaoEquilibrio,
      semanasEquilibrioMes,
      capitalInvestido,
      capitalProprioInicial,
      semCapitalProprioInicial,
      isLeveraged,
      margemCaixa,
      margemCaixaDisponivel,
      margemLiquida,
      margemEconomica,
      roiMensal,
      roiAnual,
      paybackMeses,
      roiSobreAtivoMensal,
      roiSobreAtivoAnual,

      // Scenarios & Horizons
      cenariosOcupacao,
      horizontes,
      projecaoPrazoSelecionado,
      horizonteSelecionado,
      analiseRisco,

      // Legacy aliases
      custosTotaisMensais,
      lucroOperacional,
      lucroLiquido,

      // Breakdown for visual output
      inputs: {
        valorPago,
        valorFipe,
        valorCaucao,
        valorSemanal,
        semanasMes,
        taxaOcupacao,
        taxaAdimplencia,
        prazoMeses,
        prazoAnaliseMeses: prazoMeses,
        descontoRevendaFipePct,
        desagioVendaFipe: descontoRevendaFipePct,
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
