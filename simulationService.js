/**
 * Service to handle car rental financial calculations and DRE logic.
 */

export const simulationService = {
  // Default configuration values
  DEFAULTS: {
    SIMPLES_NACIONAL_RATE: 0.06, // 6%
    ANNUAL_DEPRECIATION_RATE: 0.095, // 9.5% (Média de 7% e 12%)
    WEEKS_PER_MONTH: 4.3,
    IPVA_ANNUAL_RATE: 0.04 // 4% of FIPE value
  },

  /**
   * Performs all financial simulation calculations.
   * @param {Object} data Inputs from the forms
   * @param {number} data.valorPago - Paid price of the vehicle
   * @param {number} data.valorFipe - Current FIPE price of the vehicle
   * @param {number} data.valorCaucao - Deposit amount
   * @param {number} data.valorSemanal - Weekly rental price
   * @param {number} [data.semanasMes] - Weeks billed per month
   * @param {number} data.rastreador - Monthly cost for tracker
   * @param {number} data.seguro - Monthly cost for insurance
   * @param {number} data.manutencao - Monthly cost for maintenance
   * @param {number} data.suporteSistema - Monthly cost for system/support
   * @param {number} data.contabilidade - Monthly cost for accounting
   * @param {number} data.ipvaLicenciamento - Monthly cost for IPVA/licensing
   * @param {number} [data.aliquotaImposto] - Tax rate (Simples Nacional)
   * @param {number} data.fundoReserva - Monthly cost for reserve fund (0 if disabled)
   * @param {number} [data.depreciacaoMensal] - Dynamic or override monthly depreciation
   * @param {number} [data.depreciacaoAnualTaxa] - Rate for automatic depreciation
   */
  calculate(data) {
    const valorPago = Number(data.valorPago) || 0;
    const valorFipe = Number(data.valorFipe) || 0;
    const valorCaucao = Number(data.valorCaucao) || 0;
    const valorSemanal = Number(data.valorSemanal) || 0;
    const semanasMes = Number(data.semanasMes) || this.DEFAULTS.WEEKS_PER_MONTH;
    
    // Revenue calculations
    const receitaBrutaMensal = valorSemanal * semanasMes;
    
    // Taxes (Simples Nacional)
    const aliquotaImposto = typeof data.aliquotaImposto !== 'undefined' 
      ? Number(data.aliquotaImposto) 
      : this.DEFAULTS.SIMPLES_NACIONAL_RATE;
    const impostosSimplesNacional = receitaBrutaMensal * aliquotaImposto;
    
    const receitaLiquidaMensal = receitaBrutaMensal - impostosSimplesNacional;

    // Operational costs
    const rastreador = Number(data.rastreador) || 0;
    const seguro = Number(data.seguro) || 0;
    const manutencao = Number(data.manutencao) || 0;
    const suporteSistema = Number(data.suporteSistema) || 0;
    const contabilidade = Number(data.contabilidade) || 0;
    const ipvaLicenciamento = Number(data.ipvaLicenciamento) || 0;
    
    // Sum of regular operational costs
    const custosOperacionaisRecorrentes = rastreador + seguro + manutencao + suporteSistema + contabilidade + ipvaLicenciamento;

    // Provisions (Reserve and Depreciation)
    const fundoReserva = Number(data.fundoReserva) || 0;
    
    // Depreciation: automatically calculated if not explicitly provided or overridden
    let depreciacaoMensal = 0;
    if (typeof data.depreciacaoMensal !== 'undefined' && data.depreciacaoMensal !== null) {
      depreciacaoMensal = Number(data.depreciacaoMensal);
    } else {
      const depreciacaoAnualTaxa = typeof data.depreciacaoAnualTaxa !== 'undefined'
        ? Number(data.depreciacaoAnualTaxa)
        : this.DEFAULTS.ANNUAL_DEPRECIATION_RATE;
      depreciacaoMensal = (valorPago * depreciacaoAnualTaxa) / 12;
    }

    const totalProvisoes = fundoReserva + depreciacaoMensal;

    // DRE Totals
    const custosTotaisMensais = impostosSimplesNacional + custosOperacionaisRecorrentes + totalProvisoes;
    
    // Profit lines
    const lucroOperacional = receitaLiquidaMensal - custosOperacionaisRecorrentes;
    const lucroLiquido = receitaBrutaMensal - custosTotaisMensais;
    
    // Indicators
    const margemLiquida = receitaBrutaMensal > 0 ? (lucroLiquido / receitaBrutaMensal) : 0;
    const roiMensal = valorPago > 0 ? (lucroLiquido / valorPago) : 0;
    const roiAnual = roiMensal * 12;
    const paybackMeses = lucroLiquido > 0 ? (valorPago / lucroLiquido) : Infinity;
    
    // Comparison with FIPE (Discount or Premium)
    const descontoSobreFipe = valorFipe > 0 ? ((valorFipe - valorPago) / valorFipe) : 0;

    // Risk Analysis Scoring
    const analiseRisco = this.evaluateRisk(lucroLiquido, roiMensal);

    return {
      receitaBrutaMensal,
      impostosSimplesNacional,
      receitaLiquidaMensal,
      custosOperacionaisRecorrentes,
      totalProvisoes,
      custosTotaisMensais,
      lucroOperacional,
      lucroLiquido,
      margemLiquida,
      roiMensal,
      roiAnual,
      paybackMeses,
      descontoSobreFipe,
      fundoReserva,
      depreciacaoMensal,
      analiseRisco,
      
      // Breakdown for visual output
      inputs: {
        valorPago,
        valorFipe,
        valorCaucao,
        valorSemanal,
        semanasMes
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
        depreciacaoMensal
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
   * Helper to estimate default monthly depreciation based on Paid Price
   */
  estimateMonthlyDepreciation(valorPago) {
    return (valorPago * this.DEFAULTS.ANNUAL_DEPRECIATION_RATE) / 12;
  },

  /**
   * Evaluates operational risk based on Net income and monthly ROI
   * @param {number} lucroLiquido 
   * @param {number} roiMensal 
   * @returns {{ status: string, score: string, message: string, colorClass: string }}
   */
  evaluateRisk(lucroLiquido, roiMensal) {
    if (lucroLiquido <= 0) {
      return {
        status: 'danger',
        score: 'Alto Risco',
        message: 'A operação apresenta prejuízo. Os custos operacionais e tributos superam a receita recorrente da locação. Reveja o valor semanal ou reduza despesas.',
        colorClass: 'text-rose-400 bg-rose-950/40 border-rose-500/30'
      };
    }
    
    if (roiMensal < 0.02) {
      return {
        status: 'warning',
        score: 'Baixa Atratividade',
        message: 'O retorno mensal líquido está abaixo de 2.0% do valor pago no carro. O rendimento é baixo considerando os riscos da locação direta (colisões, inadimplência).',
        colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30'
      };
    }
    
    if (roiMensal >= 0.02 && roiMensal < 0.05) {
      return {
        status: 'success',
        score: 'Operação Viável',
        message: 'O retorno mensal está entre 2.0% e 5.0%. Apresenta excelente taxa de atratividade comercial, bem acima de opções de investimento tradicionais.',
        colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
      };
    }
    
    // roiMensal >= 0.05
    return {
      status: 'excellent',
      score: 'Excelente Oportunidade',
      message: 'A operação ultrapassa 5.0% de retorno mensal líquido! Altíssima rentabilidade. O payback estimado é muito rápido e o veículo é altamente viável.',
      colorClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30'
    };
  }
};
