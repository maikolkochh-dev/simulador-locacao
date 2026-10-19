/**
 * Main Application Controller for LocaSim Car Rental Simulator.
 * Manages state, wizard steps, input formatting masks, and visual outputs.
 */

import { fipeService } from './fipeService.js?v=20261019b';
import { simulationService } from './simulationService.js?v=20261019b';

// ==========================================================================
// APPLICATION STATE
// ==========================================================================
const state = {
  currentUser: null,
  currentStep: 1,
  vehicle: {
    brandId: '',
    brandName: '',
    modelId: '',
    modelName: '',
    yearId: '',
    yearName: '',
    valorFipe: 0,
    valorPago: 0,
    historicoDepreciacaoMensal: 0,
    historicoDepreciacaoTotal: 0,
    historicoMeses: 0,
    isManual: false,
    isLeveraged: false,
    valorEntrada: 0,
    valorFinanciado: 0,
    qtdParcelas: 0,
    valorParcela: 0,
    isFinanciadoManual: false,
    photoUrl: '',
    photoLicense: 'Imagem ilustrativa • Sem vínculo de placa'
  },
  rental: {
    valorCaucao: 0,
    valorSemanal: 0,
    semanasMes: 4.3,
    taxaOcupacao: 1.0,
    taxaAdimplencia: 1.0
  },
  costs: {
    uf: '',
    isLocadoraBenefit: false,
    isIpvaIsento: false,
    isIpvaManual: false,
    manualIpvaAnual: 0,
    customIpvaRate: null,
    isSeguroManual: false,
    deprecMultiplier: 1,
    deprecFipeAnnualRate: null,
    rastreador: 0,
    seguro: 0,
    manutencao: 0,
    manutencaoExtra: 0,
    suporteSistema: 0,
    contabilidade: 0,
    ipvaLicenciamento: 0,
    aliquotaImposto: 0,
    fundoReserva: 0,
    depreciacaoMensal: 0,
    useFundoReserva: true
  },
  report: {
    prazoAnaliseMeses: 48,
    desagioVendaFipe: 0
  }
};

// ==========================================================================
// TABELA OFICIAL 2026: LICENCIAMENTO + ALÍQUOTA IPVA POR ESTADO (UF)
// ==========================================================================
const UF_TAX_DATA_2026 = {
  AC: { nome: 'Acre', licenciamento: 200.25, ipvaRate: 0.02, nota: 'CRLV-e Digital 2026' },
  AL: { nome: 'Alagoas', licenciamento: 36.03, ipvaRate: 0.0275, nota: 'Carro popular: R$ 36,03 (até R$ 155,41 por categoria)' },
  AP: { nome: 'Amapá', licenciamento: 128.54, ipvaRate: 0.03, nota: 'CRLV-e Digital 2026' },
  AM: { nome: 'Amazonas', licenciamento: 122.88, ipvaRate: 0.02, nota: 'Alíquota carro popular 1.0 (2,0%)' },
  BA: { nome: 'Bahia', licenciamento: 173.50, ipvaRate: 0.025, nota: 'CRLV-e Digital 2026' },
  CE: { nome: 'Ceará', licenciamento: 220.46, ipvaRate: 0.025, nota: 'Alíquota carro popular até 100cv (2,5%)' },
  DF: { nome: 'Distrito Federal', licenciamento: 102.00, ipvaRate: 0.03, nota: 'CRLV-e Digital 2026' },
  ES: { nome: 'Espírito Santo', licenciamento: 237.04, ipvaRate: 0.02, nota: 'Alíquota reduzida ES (2,0%)' },
  GO: { nome: 'Goiás', licenciamento: 251.25, ipvaRate: 0.03, nota: 'Alíquota carro popular 1.0 (3,0%)' },
  MA: { nome: 'Maranhão', licenciamento: 95.87, ipvaRate: 0.025, nota: 'Licenciamento: R$ 95,87 a R$ 157,33' },
  MT: { nome: 'Mato Grosso', licenciamento: 140.00, ipvaRate: 0.02, nota: 'Alíquota carro popular 1.0 (2,0%)' },
  MS: { nome: 'Mato Grosso do Sul', licenciamento: 235.28, ipvaRate: 0.03, nota: 'CRLV-e Digital 2026' },
  MG: { nome: 'Minas Gerais', licenciamento: 35.62, ipvaRate: 0.04, nota: 'Menor taxa de licenciamento do país (R$ 35,62)' },
  PA: { nome: 'Pará', licenciamento: 288.08, ipvaRate: 0.025, nota: 'CRLV-e Digital 2026' },
  PB: { nome: 'Paraíba', licenciamento: 206.55, ipvaRate: 0.025, nota: 'CRLV-e Digital 2026' },
  PR: { nome: 'Paraná', licenciamento: 90.94, ipvaRate: 0.019, nota: 'Alíquota reduzida PR 2026 (1,9%) | Licenc.: R$ 90,94 a R$ 94,61' },
  PE: { nome: 'Pernambuco', licenciamento: 158.00, ipvaRate: 0.024, nota: 'Alíquota unificada PE (2,4%)' },
  PI: { nome: 'Piauí', licenciamento: 129.60, ipvaRate: 0.025, nota: 'CRLV-e Digital 2026' },
  RJ: { nome: 'Rio de Janeiro', licenciamento: 293.71, ipvaRate: 0.04, nota: 'Maior taxa de licenciamento do país (R$ 293,71)' },
  RN: { nome: 'Rio Grande do Norte', licenciamento: 90.00, ipvaRate: 0.03, nota: 'CRLV-e Digital 2026' },
  RS: { nome: 'Rio Grande do Sul', licenciamento: 109.27, ipvaRate: 0.03, nota: 'Licenciamento: R$ 109,27 a R$ 114,19' },
  RO: { nome: 'Rondônia', licenciamento: 220.41, ipvaRate: 0.03, nota: 'CRLV-e Digital 2026' },
  RR: { nome: 'Roraima', licenciamento: 98.47, ipvaRate: 0.03, nota: 'Licenciamento: R$ 98,47 a R$ 205,25' },
  SC: { nome: 'Santa Catarina', licenciamento: 149.37, ipvaRate: 0.02, nota: 'CRLV-e Digital 2026 (IPVA 2,0%)' },
  SP: { nome: 'São Paulo', licenciamento: 174.08, ipvaRate: 0.04, nota: 'CRLV-e Digital 2026' },
  SE: { nome: 'Sergipe', licenciamento: 207.36, ipvaRate: 0.025, nota: 'CRLV-e Digital 2026' },
  TO: { nome: 'Tocantins', licenciamento: 79.63, ipvaRate: 0.025, nota: 'CRLV-e Digital 2026' }
};

// ==========================================================================
// DOM ELEMENT QUERIES
// ==========================================================================
const elements = {
  // Landing Page Elements
  landingPage: document.getElementById('landing-page'),
  btnLandingStart: document.getElementById('btn-landing-start'),
  btnLandingStartBanner: document.getElementById('btn-landing-start-banner'),
  appLogo: document.getElementById('app-logo'),
  wizardBox: document.querySelector('.wizard-box'),

  // Wizard Progress elements
  wizardNav: document.getElementById('wizard-nav'),
  wizardFill: document.getElementById('wizard-progress-fill'),
  stepIndicators: document.querySelectorAll('.step-indicator'),
  pages: document.querySelectorAll('.wizard-page'),

  // Header / Widget elements
  userWidget: document.getElementById('user-widget'),
  userWidgetName: document.getElementById('user-widget-name'),
  logoutBtn: document.getElementById('logout-btn'),

  // Step 1: Access / Auth (Centered Register & Login Views)
  authRegisterView: document.getElementById('auth-register-view'),
  authLoginView: document.getElementById('auth-login-view'),
  registerForm: document.getElementById('register-form'),
  regNome: document.getElementById('reg-nome'),
  regTelefone: document.getElementById('reg-telefone'),
  regEmail: document.getElementById('reg-email'),
  regSenha: document.getElementById('reg-senha'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginSenha: document.getElementById('login-senha'),
  linkGoToLogin: document.getElementById('link-go-to-login'),
  linkGoToRegister: document.getElementById('link-go-to-register'),

  // Step 2: Vehicle & FIPE
  vehicleForm: document.getElementById('vehicle-form'),
  fipeManualToggle: document.getElementById('fipe-manual-toggle'),
  fipeSelectorsGrid: document.getElementById('fipe-selectors-grid'),
  manualVehicleGrid: document.getElementById('manual-vehicle-grid'),
  fipeBrand: document.getElementById('fipe-brand'),
  fipeModel: document.getElementById('fipe-model'),
  fipeYear: document.getElementById('fipe-year'),
  manualBrand: document.getElementById('manual-brand'),
  manualModel: document.getElementById('manual-model'),
  valorFipeInput: document.getElementById('vehicle-valor-fipe'),
  valorPagoInput: document.getElementById('vehicle-valor-pago'),
  btnLeverageSim: document.getElementById('btn-leverage-sim'),
  btnLeverageNao: document.getElementById('btn-leverage-nao'),
  leverageFieldsContainer: document.getElementById('leverage-fields-container'),
  leverageEntradaInput: document.getElementById('leverage-entrada'),
  leverageFinanciadoInput: document.getElementById('leverage-financiado'),
  leverageQtdParcelasInput: document.getElementById('leverage-qtd-parcelas'),
  leverageValorParcelaInput: document.getElementById('leverage-valor-parcela'),
  fipeFeedbackArea: document.getElementById('fipe-feedback-area'),
  fipeSpinner: document.getElementById('fipe-spinner'),
  fipePreviewCard: document.getElementById('fipe-preview-card'),
  previewCardBrand: document.getElementById('preview-card-brand'),
  previewCardModel: document.getElementById('preview-card-model'),
  previewCardYear: document.getElementById('preview-card-year'),
  previewCardPrice: document.getElementById('preview-card-price'),
  previewCardRef: document.getElementById('preview-card-ref'),
  fipeComparisonBanner: document.getElementById('fipe-comparison-banner'),
  comparisonDirection: document.getElementById('comparison-direction'),
  comparisonBadge: document.getElementById('comparison-badge'),

  // Step 3: Income & Occupancy
  rentalForm: document.getElementById('rental-form'),
  valorCaucaoInput: document.getElementById('rental-valor-caucao'),
  valorSemanalInput: document.getElementById('rental-valor-semanal'),
  semanasMesInput: document.getElementById('rental-semanas-mes'),
  btnWeeks43: document.getElementById('btn-weeks-43'),
  btnWeeks433: document.getElementById('btn-weeks-433'),
  rentalOcupacaoInput: document.getElementById('rental-ocupacao'),
  rentalAdimplenciaInput: document.getElementById('rental-adimplencia'),

  // Step 4: Costs
  costsForm: document.getElementById('costs-form'),
  costUf: document.getElementById('cost-uf'),
  ufTaxBreakdownPanel: document.getElementById('uf-tax-breakdown-panel'),
  ufBreakdownStateTitle: document.getElementById('uf-breakdown-state-title'),
  ufBreakdownNote: document.getElementById('uf-breakdown-note'),
  ufLicenciamentoMensal: document.getElementById('uf-licenciamento-mensal'),
  ufLicenciamentoAnual: document.getElementById('uf-licenciamento-anual'),
  ufIpvaStepLabel: document.getElementById('uf-ipva-step-label'),
  ufIpvaMensal: document.getElementById('uf-ipva-mensal'),
  ufIpvaAnual: document.getElementById('uf-ipva-anual'),
  ufTotalMensal: document.getElementById('uf-total-mensal'),
  ufTotalAnual: document.getElementById('uf-total-anual'),
  btnLocadoraBenefit: document.getElementById('btn-locadora-benefit'),
  btnIpvaIsento: document.getElementById('btn-ipva-isento'),
  btnIpvaManual: document.getElementById('btn-ipva-manual'),
  ipvaManualBox: document.getElementById('ipva-manual-box'),
  ipvaManualAnual: document.getElementById('ipva-manual-anual'),
  ipvaManualMensal: document.getElementById('ipva-manual-mensal'),
  locadoraSavingsBox: document.getElementById('locadora-savings-box'),
  locadoraSavingsMensalBadge: document.getElementById('locadora-savings-mensal-badge'),
  locadoraSavingsAnual: document.getElementById('locadora-savings-anual'),
  locadoraSavingsDetail: document.getElementById('locadora-savings-detail'),
  costRastreador: document.getElementById('cost-rastreador'),
  costSeguro: document.getElementById('cost-seguro'),
  seguroFipeHint: document.getElementById('seguro-fipe-hint'),
  costManutencao: document.getElementById('cost-manutencao'),
  costManutencaoExtra: document.getElementById('cost-manutencao-extra'),
  costSuporte: document.getElementById('cost-suporte'),
  costContabilidade: document.getElementById('cost-contabilidade'),
  costIpva: document.getElementById('cost-ipva'),
  costTaxRate: document.getElementById('cost-tax-rate'),
  taxPreviewTag: document.getElementById('tax-preview-tag'),
  costDepreciacao: document.getElementById('cost-depreciacao'),
  deprecOriginTag: document.getElementById('deprec-origin-tag'),
  deprecHelperText: document.getElementById('deprec-helper-text'),
  btnDeprec1x: document.getElementById('btn-deprec-1x'),
  btnDeprec15x: document.getElementById('btn-deprec-15x'),
  btnDeprec2x: document.getElementById('btn-deprec-2x'),
  btnDeprec6pct: document.getElementById('btn-deprec-6pct'),
  btnDeprec10pct: document.getElementById('btn-deprec-10pct'),
  btnDeprecManual: document.getElementById('btn-deprec-manual'),
  reserveFundToggle: document.getElementById('reserve-fund-toggle'),
  reserveFundInputGroup: document.getElementById('reserve-fund-input-group'),
  costFundoReserva: document.getElementById('cost-fundo-reserva'),

  // Step 5: Investor Report & Executive Cards
  reportGeneratedDate: document.getElementById('report-generated-date'),
  reportScenarioPill: document.getElementById('report-scenario-pill'),
  step5OcupacaoBtns: document.getElementById('step5-ocupacao-btns'),
  step5PrazoBtns: document.getElementById('step5-prazo-btns'),
  step5DesagioBtns: document.getElementById('step5-desagio-btns'),
  investorAlertBanner: document.getElementById('investor-alert-banner'),
  investorAlertTitle: document.getElementById('investor-alert-title'),
  investorAlertDesc: document.getElementById('investor-alert-desc'),
  reportFipeMarginBadge: document.getElementById('report-fipe-margin-badge'),
  vehiclePhotoImg: document.getElementById('vehicle-photo-img'),
  vehiclePhotoFallback: document.getElementById('vehicle-photo-fallback'),
  vehiclePhotoUpload: document.getElementById('vehicle-photo-upload'),
  btnVehiclePhotoUrl: document.getElementById('btn-vehicle-photo-url'),
  btnVehiclePhotoRemove: document.getElementById('btn-vehicle-photo-remove'),
  vehiclePhotoLicense: document.getElementById('vehicle-photo-license'),
  investorNarrativeText: document.getElementById('investor-narrative-text'),

  resultVehicleName: document.getElementById('result-vehicle-name'),
  resultFipeReference: document.getElementById('result-fipe-reference'),
  execKpiFipe: document.getElementById('exec-kpi-fipe'),
  execKpiPago: document.getElementById('exec-kpi-pago'),
  execKpiPagoSub: document.getElementById('exec-kpi-pago-sub'),
  execKpiReceitaLabel: document.getElementById('exec-kpi-receita-label'),
  dreHeaderRevenue: document.getElementById('dre-header-revenue'),
  execKpiReceitaSub: document.getElementById('exec-kpi-receita-sub'),
  execKpiCaixaOp: document.getElementById('exec-kpi-caixa-op'),
  execKpiCustosSub: document.getElementById('exec-kpi-custos-sub'),
  execKpiDscr: document.getElementById('exec-kpi-dscr'),
  execKpiDscrSub: document.getElementById('exec-kpi-dscr-sub'),
  execCardCaixaDistribuivel: document.getElementById('exec-card-caixa-distribuivel'),
  execKpiCaixaDistribuivel: document.getElementById('exec-kpi-caixa-distribuivel'),
  execKpiCaixaDistSub: document.getElementById('exec-kpi-caixa-dist-sub'),

  dreRowReceitaPotencial: document.getElementById('dre-row-receita-potencial'),
  dreReceitaPotencial: document.getElementById('dre-receita-potencial'),
  dreRowVacancia: document.getElementById('dre-row-vacancia'),
  dreLabelVacancia: document.getElementById('dre-label-vacancia'),
  dreValVacancia: document.getElementById('dre-val-vacancia'),
  dreLabelReceitaBruta: document.getElementById('dre-label-receita-bruta'),
  dreReceitaBruta: document.getElementById('dre-receita-bruta'),
  dreRowImpostos: document.getElementById('dre-row-impostos'),
  dreLabelImpostos: document.getElementById('dre-label-impostos'),
  dreImpostos: document.getElementById('dre-impostos'),
  dreRowReceitaLiquida: document.getElementById('dre-row-receita-liquida'),
  dreReceitaLiquida: document.getElementById('dre-receita-liquida'),
  dreCustosRecorrentesTotal: document.getElementById('dre-custos-recorrentes-total'),
  dreRastreador: document.getElementById('dre-rastreador'),
  dreSeguro: document.getElementById('dre-seguro'),
  dreManutencao: document.getElementById('dre-manutencao'),
  dreManutencaoExtra: document.getElementById('dre-manutencao-extra'),
  dreSuporte: document.getElementById('dre-suporte'),
  dreRowContabilidade: document.getElementById('dre-row-contabilidade'),
  dreContabilidade: document.getElementById('dre-contabilidade'),
  dreIpva: document.getElementById('dre-ipva'),
  dreCaixaOperacional: document.getElementById('dre-caixa-operacional'),
  dreProvisoesTotal: document.getElementById('dre-provisoes-total'),
  dreFundoReserva: document.getElementById('dre-fundo-reserva'),
  dreDepreciacao: document.getElementById('dre-depreciacao'),
  dreLabelDepreciacaoFipe: document.getElementById('dre-label-depreciacao-fipe'),
  dreResultadoEconomico: document.getElementById('dre-resultado-economico'),
  dreFinanciamentoHeader: document.getElementById('dre-financiamento-header'),
  dreFinanciamentoTotal: document.getElementById('dre-financiamento-total'),
  dreFinanciamentoRow: document.getElementById('dre-financiamento-row'),
  dreFinanciamentoLabel: document.getElementById('dre-financiamento-label'),
  dreFinanciamentoVal: document.getElementById('dre-financiamento-val'),
  dreRowCaixaAposDivida: document.getElementById('dre-row-caixa-apos-divida'),
  dreCaixaAposDivida: document.getElementById('dre-caixa-apos-divida'),
  dreSaidasTotal: document.getElementById('dre-saidas-total'),
  dreLucroLiquido: document.getElementById('dre-lucro-liquido'),

  // KPI Results & Charts
  riskCard: document.getElementById('risk-card'),
  riskLabel: document.getElementById('risk-label'),
  riskBadge: document.getElementById('risk-badge'),
  riskDesc: document.getElementById('risk-desc'),
  metricCardRoi: document.getElementById('metric-card-roi'),
  kpiRoiLabel: document.getElementById('kpi-roi-label'),
  kpiRoiMensal: document.getElementById('kpi-roi-mensal'),
  kpiRoiAnual: document.getElementById('kpi-roi-anual'),
  kpiPayback: document.getElementById('kpi-payback'),
  kpiPaybackSubtext: document.getElementById('kpi-payback-subtext'),
  kpiMargem: document.getElementById('kpi-margem'),
  kpiFipeDesconto: document.getElementById('kpi-fipe-desconto'),
  kpiFipeDetalhe: document.getElementById('kpi-fipe-detalhe'),
  kpiBreakevenPct: document.getElementById('kpi-breakeven-pct'),
  kpiBreakevenSub: document.getElementById('kpi-breakeven-sub'),
  kpiReservaAcumulada: document.getElementById('kpi-reserva-acumulada'),
  kpiReservaAcumuladaSub: document.getElementById('kpi-reserva-acumulada-sub'),

  waterfallChartContainer: document.getElementById('waterfall-chart-container'),
  occupancyBarsContainer: document.getElementById('occupancy-bars-container'),
  occupancyTableBody: document.getElementById('occupancy-table-body'),
  horizonCashBars: document.getElementById('horizon-cash-bars'),
  patrimonyChart4Title: document.getElementById('patrimony-chart4-title'),
  fipePatrimonyBars: document.getElementById('fipe-patrimony-bars'),
  patrimonyProtectionSummary: document.getElementById('patrimony-protection-summary'),

  // Visual slices and legends
  sliceProfit: document.getElementById('slice-profit'),
  sliceTaxes: document.getElementById('slice-taxes'),
  sliceOpex: document.getElementById('slice-opex'),
  sliceProvisions: document.getElementById('slice-provisions'),
  legendProfitPct: document.getElementById('legend-profit-pct'),
  legendTaxesPct: document.getElementById('legend-taxes-pct'),
  legendOpexPct: document.getElementById('legend-opex-pct'),
  legendProvisionsPct: document.getElementById('legend-provisions-pct'),

  // Global action buttons
  btnRestart: document.getElementById('btn-restart-simulation')
};

// ==========================================================================
// STRING & CURRENCY FORMATTERS AND PARSERS
// ==========================================================================
const utils = {
  /**
   * Formats a raw number to BRL Currency string (R$ 1.500,00)
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  /**
   * Parses a formatted currency string (e.g. "R$ 1.500,50") back to a float number
   */
  parseCurrency(value) {
    if (!value) return 0;
    // Replace "R$", all thousands separators (dots) and replace comma with dot
    let clean = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  },

  /**
   * Parses a percentage string (e.g. "6,5" or "10.5") into a float (6.5 or 10.5), or null if empty
   */
  parseTaxPercent(value) {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).replace(/[^\d.,]/g, '').trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(',', '.');
    const num = parseFloat(normalized);
    return Number.isNaN(num) ? null : num;
  },

  /**
   * Formats a percentage float (0.3912) as (39,12%)
   */
  formatPercent(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  },

  /**
   * Sets up real-time typing mask for standard currency input fields
   */
  setupCurrencyMask(input) {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value === '') {
        e.target.value = '';
        return;
      }
      let doubleValue = parseFloat(value) / 100;
      e.target.value = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(doubleValue);
    });

    input.addEventListener('focus', (e) => {
      if (e.target.value === '') {
        e.target.value = 'R$ 0,00';
      }
    });

    input.addEventListener('blur', (e) => {
      if (e.target.value === 'R$ 0,00' || e.target.value === '') {
        e.target.value = '';
      }
    });
  },

  /**
   * Cell Phone Input Mask (XX) XXXXX-XXXX
   */
  setupPhoneMask(input) {
    input.addEventListener('input', (e) => {
      let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
  }
};

// ==========================================================================
// CORE APP LOGIC & WIZARD NAVIGATION
// ==========================================================================

/**
 * Shows the beautiful Landing Page, hiding the wizard boxes
 */
function showLandingPage() {
  elements.landingPage.style.display = 'flex';
  elements.wizardNav.style.display = 'none';
  elements.wizardBox.style.display = 'none';
  // If user changes back to landing page, reset step status
  state.currentStep = 1;
}

/**
 * Transition smoothly into the wizard simulation
 */
function startSimulation() {
  elements.landingPage.style.display = 'none';
  elements.wizardNav.style.display = 'flex';
  elements.wizardBox.style.display = 'block';
  
  if (state.currentUser) {
    goToStep(2);
  } else {
    goToStep(1);
  }
}

/**
 * Initializes the application: loads storage, binds events, preloads brands.
 */
function init() {
  // Bind masks
  utils.setupPhoneMask(elements.regTelefone);
  utils.setupCurrencyMask(elements.valorFipeInput);
  utils.setupCurrencyMask(elements.valorPagoInput);
  if (elements.leverageEntradaInput) utils.setupCurrencyMask(elements.leverageEntradaInput);
  if (elements.leverageFinanciadoInput) utils.setupCurrencyMask(elements.leverageFinanciadoInput);
  if (elements.leverageValorParcelaInput) utils.setupCurrencyMask(elements.leverageValorParcelaInput);
  utils.setupCurrencyMask(elements.valorCaucaoInput);
  utils.setupCurrencyMask(elements.valorSemanalInput);
  utils.setupCurrencyMask(elements.costRastreador);
  utils.setupCurrencyMask(elements.costSeguro);
  utils.setupCurrencyMask(elements.costManutencao);
  if (elements.costManutencaoExtra) utils.setupCurrencyMask(elements.costManutencaoExtra);
  utils.setupCurrencyMask(elements.costSuporte);
  utils.setupCurrencyMask(elements.costContabilidade);
  utils.setupCurrencyMask(elements.costIpva);
  if (elements.ipvaManualAnual) utils.setupCurrencyMask(elements.ipvaManualAnual);
  if (elements.ipvaManualMensal) utils.setupCurrencyMask(elements.ipvaManualMensal);
  utils.setupCurrencyMask(elements.costDepreciacao);
  utils.setupCurrencyMask(elements.costFundoReserva);

  // Check if user is logged in
  const storedUser = localStorage.getItem('locasim_user');
  if (storedUser) {
    state.currentUser = JSON.parse(storedUser);
    renderLoggedInWidget();
  }

  // Set up Event Listeners
  bindEvents();

  // Initialize premium searchable dropdowns
  makeSelectSearchable('fipe-brand', 'Selecione ou digite a marca...');
  makeSelectSearchable('fipe-model', 'Selecione ou digite o modelo...');
  makeSelectSearchable('fipe-year', 'Selecione ou digite o ano...');
  makeSelectSearchable('cost-uf', 'Selecione ou digite seu Estado (UF)...');

  // Load the Landing Page at first loading
  showLandingPage();
}

/**
 * Helper to auto-calculate Valor Financiado = max(0, Valor Pago - Valor de Entrada)
 */
function updateAutoFinanciado() {
  if (!state.vehicle.isLeveraged || state.vehicle.isFinanciadoManual) return;
  const valorPago = utils.parseCurrency(elements.valorPagoInput.value);
  const valorEntrada = utils.parseCurrency(elements.leverageEntradaInput.value);
  if (valorPago > 0) {
    const financiado = Math.max(0, valorPago - valorEntrada);
    elements.leverageFinanciadoInput.value = financiado > 0 ? utils.formatCurrency(financiado) : 'R$ 0,00';
    state.vehicle.valorFinanciado = financiado;
  }
}

/**
 * Syncs the active UI state of the 3 IPVA mode buttons (1% Locadora, Isento, Manual)
 */
function syncIpvaModeButtons() {
  if (elements.btnLocadoraBenefit) {
    elements.btnLocadoraBenefit.classList.toggle('active', Boolean(state.costs.isLocadoraBenefit));
    elements.btnLocadoraBenefit.setAttribute('aria-pressed', state.costs.isLocadoraBenefit ? 'true' : 'false');
  }
  if (elements.btnIpvaIsento) {
    elements.btnIpvaIsento.classList.toggle('active', Boolean(state.costs.isIpvaIsento));
    elements.btnIpvaIsento.setAttribute('aria-pressed', state.costs.isIpvaIsento ? 'true' : 'false');
  }
  if (elements.btnIpvaManual) {
    elements.btnIpvaManual.classList.toggle('active', Boolean(state.costs.isIpvaManual));
    elements.btnIpvaManual.setAttribute('aria-pressed', state.costs.isIpvaManual ? 'true' : 'false');
  }
  if (elements.ipvaManualBox) {
    elements.ipvaManualBox.style.display = state.costs.isIpvaManual ? 'flex' : 'none';
  }
}

/**
 * Recalculates 2026 Licenciamento + IPVA based on selected UF, FIPE price, 1% Locadora Benefit, Isento, or Manual IPVA
 */
function recalculateStateIpvaAndLicenciamento(options = {}) {
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value);
  const ufCode = elements.costUf ? elements.costUf.value : '';
  const ipvaBtns = [
    document.getElementById('btn-ipva-0'),
    document.getElementById('btn-ipva-1'),
    document.getElementById('btn-ipva-2'),
    document.getElementById('btn-ipva-3'),
    document.getElementById('btn-ipva-4')
  ];
  const btnIpvaManualRate = document.getElementById('btn-ipva-manual-rate');

  syncIpvaModeButtons();

  if (ufCode && UF_TAX_DATA_2026[ufCode]) {
    const ufData = UF_TAX_DATA_2026[ufCode];
    state.costs.uf = ufCode;

    const licenciamentoAnual = ufData.licenciamento;
    const licenciamentoMensal = licenciamentoAnual / 12;

    const fullIpvaRate = ufData.ipvaRate;
    const ipvaAnualCheio = valorFipe * fullIpvaRate;

    let effectiveIpvaRate = fullIpvaRate;
    let ipvaAnualEfetivo = 0;
    let ipvaMensalEfetivo = 0;

    if (state.costs.isIpvaIsento) {
      effectiveIpvaRate = 0;
      ipvaAnualEfetivo = 0;
      ipvaMensalEfetivo = 0;
    } else if (state.costs.isIpvaManual) {
      effectiveIpvaRate = null;
      ipvaAnualEfetivo = Math.max(0, state.costs.manualIpvaAnual || 0);
      ipvaMensalEfetivo = ipvaAnualEfetivo / 12;

      if (!options.skipManualInputsSync) {
        if (elements.ipvaManualAnual) elements.ipvaManualAnual.value = utils.formatCurrency(ipvaAnualEfetivo);
        if (elements.ipvaManualMensal) elements.ipvaManualMensal.value = utils.formatCurrency(ipvaMensalEfetivo);
      }
    } else {
      effectiveIpvaRate = state.costs.isLocadoraBenefit
        ? 0.01
        : (state.costs.customIpvaRate !== null ? state.costs.customIpvaRate : fullIpvaRate);
      ipvaAnualEfetivo = valorFipe * effectiveIpvaRate;
      ipvaMensalEfetivo = ipvaAnualEfetivo / 12;

      // Pre-populate manualIpvaAnual so switching to Manual starts with current value
      state.costs.manualIpvaAnual = ipvaAnualEfetivo;
      if (elements.ipvaManualAnual) elements.ipvaManualAnual.value = utils.formatCurrency(ipvaAnualEfetivo);
      if (elements.ipvaManualMensal) elements.ipvaManualMensal.value = utils.formatCurrency(ipvaMensalEfetivo);
    }

    const totalAnual = licenciamentoAnual + ipvaAnualEfetivo;
    const totalMensal = licenciamentoMensal + ipvaMensalEfetivo;

    // Populate main monthly IPVA+Licenciamento field
    if (!options.skipCostIpvaInputSync) {
      elements.costIpva.value = utils.formatCurrency(totalMensal);
    }
    state.costs.ipvaLicenciamento = totalMensal;

    // Sync rate buttons highlight
    ipvaBtns.forEach(btn => {
      if (!btn) return;
      const r = parseFloat(btn.getAttribute('data-rate'));
      if (!state.costs.isIpvaManual && effectiveIpvaRate !== null && Math.abs(r - effectiveIpvaRate) < 0.001) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    if (btnIpvaManualRate) {
      btnIpvaManualRate.classList.toggle('active', Boolean(state.costs.isIpvaManual));
    }

    // Populate Discriminated Panel (1. Licenciamento | 2. IPVA | Soma Total)
    if (elements.ufTaxBreakdownPanel) {
      elements.ufTaxBreakdownPanel.style.display = 'flex';
      elements.ufBreakdownStateTitle.textContent = `${ufData.nome} (${ufCode}) — Licenciamento + IPVA 2026`;
      elements.ufBreakdownNote.textContent = ufData.nota;

      elements.ufLicenciamentoMensal.textContent = `${utils.formatCurrency(licenciamentoMensal)}/mês`;
      elements.ufLicenciamentoAnual.textContent = `(${utils.formatCurrency(licenciamentoAnual)} / ano)`;

      if (state.costs.isIpvaIsento) {
        elements.ufIpvaStepLabel.textContent = `2. IPVA Estadual (ISENTO — R$ 0,00)`;
      } else if (state.costs.isIpvaManual) {
        elements.ufIpvaStepLabel.textContent = `2. IPVA Manual / Anual Informado`;
      } else if (state.costs.isLocadoraBenefit) {
        elements.ufIpvaStepLabel.textContent = `2. IPVA Benefício Locadora (1,00% FIPE)`;
      } else {
        elements.ufIpvaStepLabel.textContent = `2. IPVA Estadual ${ufCode} (${utils.formatPercent(effectiveIpvaRate)} FIPE)`;
      }

      elements.ufIpvaMensal.textContent = `${utils.formatCurrency(ipvaMensalEfetivo)}/mês`;
      elements.ufIpvaAnual.textContent = `(${utils.formatCurrency(ipvaAnualEfetivo)} / ano)`;

      elements.ufTotalMensal.textContent = `${utils.formatCurrency(totalMensal)}/mês`;
      elements.ufTotalAnual.textContent = `(${utils.formatCurrency(totalAnual)} / ano)`;
    }

    // Populate Green Savings Box when Locadora 1% Benefit is active
    if (elements.locadoraSavingsBox) {
      if (state.costs.isLocadoraBenefit) {
        const economiaAnual = Math.max(0, ipvaAnualCheio - ipvaAnualEfetivo);
        const economiaMensal = economiaAnual / 12;
        elements.locadoraSavingsBox.style.display = 'flex';
        elements.locadoraSavingsMensalBadge.textContent = `+ ${utils.formatCurrency(economiaMensal)}/mês no caixa`;
        elements.locadoraSavingsAnual.textContent = `${utils.formatCurrency(economiaAnual)} / ano de economia no IPVA`;
        elements.locadoraSavingsDetail.textContent =
          `Em ${ufData.nome} (${ufCode}), quem paga o IPVA cheio (${utils.formatPercent(fullIpvaRate)}) desembolsa ${utils.formatCurrency(ipvaAnualCheio)}/ano. Com o desconto de 1% para CNPJ Locadora, você paga apenas ${utils.formatCurrency(ipvaAnualEfetivo)}/ano de IPVA (+ ${utils.formatCurrency(licenciamentoAnual)}/ano de licenciamento).`;
      } else {
        elements.locadoraSavingsBox.style.display = 'none';
      }
    }
  } else {
    // Fallback if UF not yet selected
    if (elements.ufTaxBreakdownPanel) elements.ufTaxBreakdownPanel.style.display = 'none';
    if (elements.locadoraSavingsBox) elements.locadoraSavingsBox.style.display = 'none';
    if (state.costs.isIpvaIsento) {
      elements.costIpva.value = 'R$ 0,00';
      state.costs.ipvaLicenciamento = 0;
    } else if (state.costs.isIpvaManual) {
      const monthlyManual = (state.costs.manualIpvaAnual || 0) / 12;
      if (!options.skipCostIpvaInputSync) {
        elements.costIpva.value = utils.formatCurrency(monthlyManual);
      }
      state.costs.ipvaLicenciamento = monthlyManual;
    } else if (valorFipe > 0) {
      const activeIpvaBtn = document.querySelector('.rate-btn.active');
      const ipvaRate = activeIpvaBtn && activeIpvaBtn.hasAttribute('data-rate')
        ? parseFloat(activeIpvaBtn.getAttribute('data-rate'))
        : 0.04;
      const monthlyIpva = (valorFipe * ipvaRate) / 12;
      elements.costIpva.value = utils.formatCurrency(monthlyIpva);
      state.costs.ipvaLicenciamento = monthlyIpva;
    }
  }
}

/**
 * Binds DOM triggers to state modifiers
 */
function bindEvents() {
  // Toggle Acesso / Registar Views
  elements.linkGoToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    elements.authRegisterView.style.display = 'none';
    elements.authLoginView.style.display = 'block';
  });

  elements.linkGoToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    elements.authRegisterView.style.display = 'block';
    elements.authLoginView.style.display = 'none';
  });

  // Step 1: Register Form Submit (LOCADOR NÔMADE backend)
  elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = elements.regNome.value.trim();
    const telefone = elements.regTelefone.value;
    const email = elements.regEmail.value.trim();
    const senha = elements.regSenha.value.trim();

    elements.regNome.style.borderColor = '';
    elements.regTelefone.style.borderColor = '';
    elements.regEmail.style.borderColor = '';
    elements.regSenha.style.borderColor = '';

    let hasError = false;
    if (nome.length < 3) {
      elements.regNome.style.borderColor = 'var(--color-danger)';
      hasError = true;
    }
    const cleanPhone = telefone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      elements.regTelefone.style.borderColor = 'var(--color-danger)';
      hasError = true;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      elements.regEmail.style.borderColor = 'var(--color-danger)';
      hasError = true;
    }
    if (senha.length < 4) {
      elements.regSenha.style.borderColor = 'var(--color-danger)';
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, email, senha })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Erro ao realizar cadastro.');
        return;
      }

      state.currentUser = data.user;
      localStorage.setItem('locasim_user', JSON.stringify(data.user));
      renderLoggedInWidget();

      // Show beautiful notification about the email if preview URL exists!
      if (data.emailPreviewUrl) {
        console.log('[WELCOME EMAIL PREVIEW LINK]', data.emailPreviewUrl);
        showEmailToast(data.emailPreviewUrl);
      } else {
        alert('Cadastro realizado com sucesso! E-mail de confirmação enviado.');
      }
      
      goToStep(2);
    } catch (err) {
      console.error('API Register Error:', err);
      // Fallback local storage logic if backend server is offline or fails
      const localUser = { nome, telefone, email };
      state.currentUser = localUser;
      localStorage.setItem('locasim_user', JSON.stringify(localUser));
      renderLoggedInWidget();
      goToStep(2);
    }
  });

  // Step 1: Login Form Submit
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = elements.loginEmail.value.trim();
    const senha = elements.loginSenha.value.trim();

    elements.loginEmail.style.borderColor = '';
    elements.loginSenha.style.borderColor = '';

    let hasError = false;
    if (!email) {
      elements.loginEmail.style.borderColor = 'var(--color-danger)';
      hasError = true;
    }
    if (!senha) {
      elements.loginSenha.style.borderColor = 'var(--color-danger)';
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'E-mail ou senha incorretos.');
        elements.loginEmail.style.borderColor = 'var(--color-danger)';
        elements.loginSenha.style.borderColor = 'var(--color-danger)';
        return;
      }

      state.currentUser = data.user;
      localStorage.setItem('locasim_user', JSON.stringify(data.user));
      renderLoggedInWidget();
      goToStep(2);
    } catch (err) {
      alert('Servidor de login offline. Por favor, utilize o cadastro para simular localmente.');
    }
  });

  // Step Indicators Navigation (Allowed if completed or already authenticated)
  elements.stepIndicators.forEach(ind => {
    ind.addEventListener('click', () => {
      const step = parseInt(ind.dataset.step);
      // Can't navigate past step 1 if not logged in
      if (!state.currentUser && step > 1) return;
      
      // Validate current step before allowing forward navigation
      if (step > state.currentStep) {
        if (!validateStep(state.currentStep)) return;
      }
      
      goToStep(step);
    });
  });

  // Wizard General buttons Next/Prev
  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(state.currentStep - 1);
    });
  });

  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(state.currentStep)) {
        if (state.currentStep === 4) {
          // Compute calculations on step 4 submit -> results in step 5
          runCalculationsAndRender();
        }
        goToStep(state.currentStep + 1);
      }
    });
  });

  // Logout button
  elements.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('locasim_user');
    state.currentUser = null;
    elements.userWidget.style.display = 'none';
    
    // Clear forms and reset state
    if (elements.registerForm) elements.registerForm.reset();
    if (elements.loginForm) elements.loginForm.reset();
    resetSimulationState();
    goToStep(1);
  });

  // Restart Button
  elements.btnRestart.addEventListener('click', () => {
    resetSimulationState();
    goToStep(2);
  });

  // Dynamic FIPE Selectors cascade
  elements.fipeManualToggle.addEventListener('change', (e) => {
    const isManual = e.target.checked;
    state.vehicle.isManual = isManual;
    
    if (isManual) {
      elements.fipeSelectorsGrid.style.display = 'none';
      elements.manualVehicleGrid.style.display = 'grid';
      elements.fipeFeedbackArea.style.display = 'none';
      elements.valorFipeInput.readOnly = false;
      elements.valorFipeInput.disabled = false;
      elements.valorFipeInput.value = '';
    } else {
      elements.fipeSelectorsGrid.style.display = 'grid';
      elements.manualVehicleGrid.style.display = 'none';
      elements.valorFipeInput.readOnly = true;
      elements.valorFipeInput.value = '';
      loadBrands();
    }
  });

  elements.fipeBrand.addEventListener('change', async (e) => {
    const brandId = e.target.value;
    state.vehicle.brandId = brandId;
    state.vehicle.brandName = e.target.options[e.target.selectedIndex]?.text || '';
    
    // Clear model and year dropdowns
    elements.fipeModel.innerHTML = '<option value="">Carregando modelos...</option>';
    elements.fipeModel.disabled = true;
    elements.fipeYear.innerHTML = '<option value="">Selecione um modelo primeiro</option>';
    elements.fipeYear.disabled = true;
    
    hideFipePreview();
    
    if (!brandId) return;

    try {
      const models = await fipeService.getModels(brandId);
      elements.fipeModel.innerHTML = '<option value="">Selecione o modelo</option>';
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.codigo;
        option.textContent = model.nome;
        elements.fipeModel.appendChild(option);
      });
      elements.fipeModel.disabled = false;
    } catch (err) {
      alert('Falha ao buscar modelos na FIPE. Digite manualmente.');
    }
  });

  elements.fipeModel.addEventListener('change', async (e) => {
    const modelId = e.target.value;
    state.vehicle.modelId = modelId;
    state.vehicle.modelName = e.target.options[e.target.selectedIndex]?.text || '';
    
    elements.fipeYear.innerHTML = '<option value="">Carregando anos...</option>';
    elements.fipeYear.disabled = true;
    hideFipePreview();

    if (!modelId) return;

    try {
      const years = await fipeService.getYears(state.vehicle.brandId, modelId);
      elements.fipeYear.innerHTML = '<option value="">Selecione o ano modelo</option>';
      years.forEach(year => {
        const option = document.createElement('option');
        option.value = year.codigo;
        option.textContent = year.nome;
        elements.fipeYear.appendChild(option);
      });
      elements.fipeYear.disabled = false;
    } catch (err) {
      alert('Falha ao carregar anos dos veículos.');
    }
  });

  elements.fipeYear.addEventListener('change', async (e) => {
    const yearId = e.target.value;
    state.vehicle.yearId = yearId;
    state.vehicle.yearName = e.target.options[e.target.selectedIndex]?.text || '';
    
    if (!yearId) {
      hideFipePreview();
      return;
    }

    showFipeSpinner();

    try {
      const priceDetails = await fipeService.getPrice(state.vehicle.brandId, state.vehicle.modelId, yearId);
      if (priceDetails) {
        // Cache numeric FIPE value and historical depreciation in state
        const parsedVal = utils.parseCurrency(priceDetails.Valor);
        state.vehicle.valorFipe = parsedVal;
        state.vehicle.historicoDepreciacaoMensal = priceDetails.historicoDepreciacaoMensalNum || 0;
        state.vehicle.historicoDepreciacaoTotal = priceDetails.historicoDepreciacaoTotalNum || 0;
        state.vehicle.historicoMeses = priceDetails.historicoMeses || 0;

        // Reset auto-calculated Seguro & Depreciação flags when a new vehicle is selected
        state.costs.isSeguroManual = false;
        if (state.costs.deprecMultiplier === 'manual') {
          state.costs.deprecMultiplier = 1;
        }
        
        // Populate inputs
        elements.valorFipeInput.value = priceDetails.Valor;
        
        // Show details card
        renderFipeCard(priceDetails);
        triggerSmartDefaults();
      }
    } catch (err) {
      alert('Falha ao buscar preço FIPE na API.');
      hideFipePreview();
    }
  });

  // Smart defaults triggers
  elements.valorPagoInput.addEventListener('blur', () => {
    triggerSmartDefaults();
    updateAutoFinanciado();
  });

  elements.valorPagoInput.addEventListener('input', () => {
    updateAutoFinanciado();
  });

  elements.valorFipeInput.addEventListener('blur', () => {
    state.costs.isSeguroManual = false;
    triggerSmartDefaults();
  });

  // Allow user to edit Seguro manually while preserving 0.34% FIPE initial prefill
  if (elements.costSeguro) {
    elements.costSeguro.addEventListener('input', () => {
      state.costs.isSeguroManual = true;
    });
  }

  // Operação Alavancada (SIM / NÃO) Toggle & Inputs
  if (elements.btnLeverageSim && elements.btnLeverageNao) {
    elements.btnLeverageSim.addEventListener('click', () => {
      state.vehicle.isLeveraged = true;
      elements.btnLeverageSim.classList.add('active');
      elements.btnLeverageNao.classList.remove('active');
      elements.leverageFieldsContainer.style.display = 'block';
      updateAutoFinanciado();
    });

    elements.btnLeverageNao.addEventListener('click', () => {
      state.vehicle.isLeveraged = false;
      elements.btnLeverageNao.classList.add('active');
      elements.btnLeverageSim.classList.remove('active');
      elements.leverageFieldsContainer.style.display = 'none';
    });
  }

  if (elements.leverageEntradaInput) {
    elements.leverageEntradaInput.addEventListener('input', () => {
      state.vehicle.isFinanciadoManual = false;
      updateAutoFinanciado();
    });
    elements.leverageEntradaInput.addEventListener('blur', () => {
      updateAutoFinanciado();
    });
  }

  if (elements.leverageFinanciadoInput) {
    elements.leverageFinanciadoInput.addEventListener('input', () => {
      state.vehicle.isFinanciadoManual = true;
    });
  }

  // Step 4: UF (State) Selector & IPVA Mode Buttons (1% Locadora, Isento 0%, Manual/Anual)
  if (elements.costUf) {
    elements.costUf.addEventListener('change', () => {
      state.costs.customIpvaRate = null;
      const customSearchInput = elements.costUf.parentElement?.querySelector('.custom-select-search');
      if (customSearchInput) customSearchInput.style.borderColor = '';
      recalculateStateIpvaAndLicenciamento();
    });
  }

  if (elements.btnLocadoraBenefit) {
    elements.btnLocadoraBenefit.addEventListener('click', () => {
      state.costs.isLocadoraBenefit = !state.costs.isLocadoraBenefit;
      if (state.costs.isLocadoraBenefit) {
        state.costs.isIpvaIsento = false;
        state.costs.isIpvaManual = false;
        state.costs.customIpvaRate = null;
      }
      recalculateStateIpvaAndLicenciamento();
    });
  }

  if (elements.btnIpvaIsento) {
    elements.btnIpvaIsento.addEventListener('click', () => {
      state.costs.isIpvaIsento = !state.costs.isIpvaIsento;
      if (state.costs.isIpvaIsento) {
        state.costs.isLocadoraBenefit = false;
        state.costs.isIpvaManual = false;
        state.costs.customIpvaRate = null;
      }
      recalculateStateIpvaAndLicenciamento();
    });
  }

  if (elements.btnIpvaManual) {
    elements.btnIpvaManual.addEventListener('click', () => {
      state.costs.isIpvaManual = !state.costs.isIpvaManual;
      if (state.costs.isIpvaManual) {
        state.costs.isLocadoraBenefit = false;
        state.costs.isIpvaIsento = false;
        state.costs.customIpvaRate = null;
      }
      recalculateStateIpvaAndLicenciamento();
      if (state.costs.isIpvaManual && elements.ipvaManualAnual) {
        setTimeout(() => {
          elements.ipvaManualAnual.focus();
          elements.ipvaManualAnual.select();
        }, 50);
      }
    });
  }

  if (elements.ipvaManualAnual) {
    elements.ipvaManualAnual.addEventListener('input', () => {
      const anual = utils.parseCurrency(elements.ipvaManualAnual.value);
      state.costs.isIpvaManual = true;
      state.costs.isLocadoraBenefit = false;
      state.costs.isIpvaIsento = false;
      state.costs.manualIpvaAnual = anual;
      if (elements.ipvaManualMensal) {
        elements.ipvaManualMensal.value = utils.formatCurrency(anual / 12);
      }
      recalculateStateIpvaAndLicenciamento({ skipManualInputsSync: true });
    });
  }

  if (elements.ipvaManualMensal) {
    elements.ipvaManualMensal.addEventListener('input', () => {
      const mensal = utils.parseCurrency(elements.ipvaManualMensal.value);
      const anual = mensal * 12;
      state.costs.isIpvaManual = true;
      state.costs.isLocadoraBenefit = false;
      state.costs.isIpvaIsento = false;
      state.costs.manualIpvaAnual = anual;
      if (elements.ipvaManualAnual) {
        elements.ipvaManualAnual.value = utils.formatCurrency(anual);
      }
      recalculateStateIpvaAndLicenciamento({ skipManualInputsSync: true });
    });
  }

  // Landing Page Start Triggers
  elements.btnLandingStart.addEventListener('click', startSimulation);
  elements.btnLandingStartBanner.addEventListener('click', startSimulation);
  
  // Step 3: Weeks/Month quick buttons (4.3 vs 4.3333) & Occupancy buttons (100%, 90%, 80%)
  const weeksBtns = [elements.btnWeeks43, elements.btnWeeks433].filter(Boolean);
  weeksBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseFloat(btn.getAttribute('data-weeks')) || 4.3;
      elements.semanasMesInput.value = w;
      state.rental.semanasMes = w;
      weeksBtns.forEach(b => b.classList.toggle('active', b === btn));
      updateTaxPreviewTag();
    });
  });

  if (elements.semanasMesInput) {
    elements.semanasMesInput.addEventListener('input', () => {
      const val = parseFloat(elements.semanasMesInput.value) || 4.3;
      state.rental.semanasMes = val;
      weeksBtns.forEach(b => {
        const bw = parseFloat(b.getAttribute('data-weeks'));
        b.classList.toggle('active', Math.abs(bw - val) < 0.005);
      });
      updateTaxPreviewTag();
    });
  }

  const step3OcupBtns = document.querySelectorAll('[data-ocup-step3]');
  step3OcupBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseFloat(btn.getAttribute('data-ocup-step3')) || 100;
      if (elements.rentalOcupacaoInput) elements.rentalOcupacaoInput.value = pct;
      state.rental.taxaOcupacao = pct / 100;
      step3OcupBtns.forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  if (elements.rentalOcupacaoInput) {
    elements.rentalOcupacaoInput.addEventListener('input', () => {
      const pct = Math.min(100, Math.max(10, parseFloat(elements.rentalOcupacaoInput.value) || 100));
      state.rental.taxaOcupacao = pct / 100;
      step3OcupBtns.forEach(b => {
        const bp = parseFloat(b.getAttribute('data-ocup-step3'));
        b.classList.toggle('active', Math.abs(bp - pct) < 0.5);
      });
    });
  }

  if (elements.rentalAdimplenciaInput) {
    elements.rentalAdimplenciaInput.addEventListener('input', () => {
      const pct = Math.min(100, Math.max(10, parseFloat(elements.rentalAdimplenciaInput.value) || 100));
      state.rental.taxaAdimplencia = pct / 100;
    });
  }

  // Step 4: Depreciation Buttons (1x, 1.5x, 2x from 1st Screen FIPE, 6% a.a. FIPE, 10% a.a. FIPE, Manual)
  // MANDATORY RULE: All depreciation calculations ALWAYS use valorFipe as the base, NEVER valorPago!
  const allDeprecBtns = [
    elements.btnDeprec1x,
    elements.btnDeprec15x,
    elements.btnDeprec2x,
    elements.btnDeprec6pct,
    elements.btnDeprec10pct,
    elements.btnDeprecManual
  ].filter(Boolean);

  allDeprecBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const multAttr = btn.getAttribute('data-mult');
      const rateFipeAttr = btn.getAttribute('data-rate-fipe');

      allDeprecBtns.forEach(b => b.classList.toggle('active', b === btn));

      if (multAttr === 'manual') {
        state.costs.deprecMultiplier = 'manual';
        state.costs.deprecFipeAnnualRate = null;
        elements.costDepreciacao.focus();
        elements.costDepreciacao.select();
      } else if (rateFipeAttr) {
        const rate = parseFloat(rateFipeAttr) || 0.06;
        state.costs.deprecMultiplier = 'rate-fipe';
        state.costs.deprecFipeAnnualRate = rate;
        recalculateDepreciationFromFirstScreen();
      } else {
        const mult = parseFloat(multAttr) || 1;
        state.costs.deprecMultiplier = mult;
        state.costs.deprecFipeAnnualRate = null;
        recalculateDepreciationFromFirstScreen();
      }
    });
  });

  // Switch to "Manual" automatically when user types directly in Depreciation input
  elements.costDepreciacao.addEventListener('input', () => {
    state.costs.deprecMultiplier = 'manual';
    state.costs.deprecFipeAnnualRate = null;
    allDeprecBtns.forEach(b => {
      b.classList.toggle('active', b === elements.btnDeprecManual);
    });
  });

  // Step 5: Interactive Sensitivity Bar (Ocupação, Horizonte 12-48m, Deságio Revenda vs FIPE)
  if (elements.step5OcupacaoBtns) {
    elements.step5OcupacaoBtns.querySelectorAll('[data-ocup]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ocup = parseFloat(btn.getAttribute('data-ocup')) || 1;
        state.rental.taxaOcupacao = ocup;
        if (elements.rentalOcupacaoInput) {
          elements.rentalOcupacaoInput.value = Math.round(ocup * 100);
        }
        elements.step5OcupacaoBtns.querySelectorAll('[data-ocup]').forEach(b => b.classList.toggle('active', b === btn));
        runCalculationsAndRender();
      });
    });
  }

  if (elements.step5PrazoBtns) {
    elements.step5PrazoBtns.querySelectorAll('[data-prazo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prazo = parseInt(btn.getAttribute('data-prazo'), 10) || 48;
        state.report.prazoAnaliseMeses = prazo;
        elements.step5PrazoBtns.querySelectorAll('[data-prazo]').forEach(b => b.classList.toggle('active', b === btn));
        runCalculationsAndRender();
      });
    });
  }

  if (elements.step5DesagioBtns) {
    elements.step5DesagioBtns.querySelectorAll('[data-desagio]').forEach(btn => {
      btn.addEventListener('click', () => {
        const desagio = parseFloat(btn.getAttribute('data-desagio')) || 0;
        state.report.desagioVendaFipe = desagio;
        elements.step5DesagioBtns.querySelectorAll('[data-desagio]').forEach(b => b.classList.toggle('active', b === btn));
        runCalculationsAndRender();
      });
    });
  }

  // Step 5: Vehicle Photo Upload / URL / Remove (Licensed or user-provided image)
  if (elements.vehiclePhotoUpload) {
    elements.vehiclePhotoUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.vehicle.photoUrl = ev.target.result;
        state.vehicle.photoLicense = 'Foto própria enviada pelo usuário • Uso autorizado no relatório';
        syncVehiclePhotoUI();
      };
      reader.readAsDataURL(file);
    });
  }

  if (elements.btnVehiclePhotoUrl) {
    elements.btnVehiclePhotoUrl.addEventListener('click', () => {
      const url = prompt('Cole a URL da imagem do veículo (use fotos próprias ou de banco licenciado):', state.vehicle.photoUrl || '');
      if (url && url.trim()) {
        state.vehicle.photoUrl = url.trim();
        state.vehicle.photoLicense = 'Imagem informada via URL pelo usuário • Sem vínculo de placa';
        syncVehiclePhotoUI();
      }
    });
  }

  if (elements.btnVehiclePhotoRemove) {
    elements.btnVehiclePhotoRemove.addEventListener('click', () => {
      state.vehicle.photoUrl = '';
      state.vehicle.photoLicense = 'Imagem ilustrativa • Sem vínculo de placa';
      if (elements.vehiclePhotoUpload) elements.vehiclePhotoUpload.value = '';
      syncVehiclePhotoUI();
    });
  }

  // Step 4: 4. Impostos (%) input mask & live preview (accepts only 0,1 to 100%)
  if (elements.costTaxRate) {
    elements.costTaxRate.addEventListener('input', (e) => {
      // Allow only digits and a single comma or dot
      let raw = e.target.value.replace(/[^\d.,]/g, '');
      const parts = raw.split(/[.,]/);
      if (parts.length > 2) {
        raw = parts[0] + ',' + parts.slice(1).join('');
      }
      e.target.value = raw;
      elements.costTaxRate.style.borderColor = '';
      updateTaxPreviewTag();
    });

    elements.costTaxRate.addEventListener('blur', (e) => {
      const pct = utils.parseTaxPercent(e.target.value);
      if (pct === null || pct === 0) {
        e.target.value = '';
        updateTaxPreviewTag();
        return;
      }
      let clamped = pct;
      if (clamped < 0.1) clamped = 0.1;
      if (clamped > 100) clamped = 100;
      e.target.value = String(clamped).replace('.', ',');
      updateTaxPreviewTag();
    });
  }

  // App logo returns home (to Landing Page)
  elements.appLogo.addEventListener('click', (e) => {
    e.preventDefault();
    showLandingPage();
  });

  // Imprimir Simulação
  const btnPrint = document.getElementById('btn-print-simulation');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Compartilhar WhatsApp
  const btnShare = document.getElementById('btn-share-whatsapp');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      shareSimulationOnWhatsApp();
    });
  }

  // Chamar Suporte Consultoria WhatsApp
  const btnConsultancy = document.getElementById('btn-consultancy-whatsapp');
  if (btnConsultancy) {
    btnConsultancy.addEventListener('click', () => {
      const waNumber = '5547999919781'; // Host phone for support
      const message = 'Olá! Estou utilizando o Simulador Locador Nômade e gostaria de saber mais sobre a consultoria de aluguel de carros.';
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    });
  }
}

/**
 * Updates the vehicle photo / neutral silhouette box in Step 5
 */
function syncVehiclePhotoUI() {
  if (!elements.vehiclePhotoImg || !elements.vehiclePhotoFallback) return;
  if (state.vehicle.photoUrl) {
    elements.vehiclePhotoImg.src = state.vehicle.photoUrl;
    elements.vehiclePhotoImg.style.display = 'block';
    elements.vehiclePhotoFallback.style.display = 'none';
    if (elements.btnVehiclePhotoRemove) elements.btnVehiclePhotoRemove.style.display = 'inline-block';
  } else {
    elements.vehiclePhotoImg.src = '';
    elements.vehiclePhotoImg.style.display = 'none';
    elements.vehiclePhotoFallback.style.display = 'flex';
    if (elements.btnVehiclePhotoRemove) elements.btnVehiclePhotoRemove.style.display = 'none';
  }
  if (elements.vehiclePhotoLicense) {
    elements.vehiclePhotoLicense.textContent = state.vehicle.photoLicense || 'Imagem ilustrativa • Sem vínculo de placa';
  }
}

// ==========================================================================
// VALIDATION SCHEMES FOR WIZARD STEPS
// ==========================================================================
function validateStep(step) {
  switch(step) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    case 4:
      return validateStep4();
    default:
      return true;
  }
}

function validateStep1() {
  // Can only advance to step 2 if a user has a logged in session
  if (!state.currentUser) {
    alert('Por favor, crie uma conta ou faça login para continuar.');
    return false;
  }
  return true;
}

function validateStep2() {
  let isValid = true;
  
  // Highlight reset
  elements.valorPagoInput.style.borderColor = '';
  elements.valorFipeInput.style.borderColor = '';
  elements.fipeBrand.style.borderColor = '';
  elements.fipeModel.style.borderColor = '';
  elements.fipeYear.style.borderColor = '';
  elements.manualBrand.style.borderColor = '';
  elements.manualModel.style.borderColor = '';
  if (elements.leverageEntradaInput) elements.leverageEntradaInput.style.borderColor = '';
  if (elements.leverageFinanciadoInput) elements.leverageFinanciadoInput.style.borderColor = '';
  if (elements.leverageQtdParcelasInput) elements.leverageQtdParcelasInput.style.borderColor = '';
  if (elements.leverageValorParcelaInput) elements.leverageValorParcelaInput.style.borderColor = '';

  const valorPago = utils.parseCurrency(elements.valorPagoInput.value);
  if (valorPago <= 0) {
    elements.valorPagoInput.style.borderColor = 'var(--color-danger)';
    isValid = false;
  }

  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value);
  if (valorFipe <= 0) {
    elements.valorFipeInput.style.borderColor = 'var(--color-danger)';
    isValid = false;
  }

  if (state.vehicle.isManual) {
    const manualB = elements.manualBrand.value.trim();
    const manualM = elements.manualModel.value.trim();
    if (!manualB) {
      elements.manualBrand.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
    if (!manualM) {
      elements.manualModel.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
  } else {
    if (!elements.fipeBrand.value) {
      elements.fipeBrand.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
    if (!elements.fipeModel.value) {
      elements.fipeModel.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
    if (!elements.fipeYear.value) {
      elements.fipeYear.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
  }

  if (state.vehicle.isLeveraged) {
    const entrada = utils.parseCurrency(elements.leverageEntradaInput.value);
    const financiado = utils.parseCurrency(elements.leverageFinanciadoInput.value);
    const qtdParcelas = parseInt(elements.leverageQtdParcelasInput.value, 10) || 0;
    const valorParcela = utils.parseCurrency(elements.leverageValorParcelaInput.value);

    if (entrada < 0) {
      elements.leverageEntradaInput.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
    if (financiado <= 0) {
      elements.leverageFinanciadoInput.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
    if (qtdParcelas <= 0) {
      elements.leverageQtdParcelasInput.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
    if (valorParcela <= 0) {
      elements.leverageValorParcelaInput.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
  }

  return isValid;
}

function validateStep3() {
  let isValid = true;
  elements.valorCaucaoInput.style.borderColor = '';
  elements.valorSemanalInput.style.borderColor = '';
  elements.semanasMesInput.style.borderColor = '';

  const caucao = utils.parseCurrency(elements.valorCaucaoInput.value);
  if (caucao < 0) {
    elements.valorCaucaoInput.style.borderColor = 'var(--color-danger)';
    isValid = false;
  }

  const semanal = utils.parseCurrency(elements.valorSemanalInput.value);
  if (semanal <= 0) {
    elements.valorSemanalInput.style.borderColor = 'var(--color-danger)';
    isValid = false;
  }

  const semanas = parseFloat(elements.semanasMesInput.value) || 0;
  if (semanas < 1 || semanas > 6) {
    elements.semanasMesInput.style.borderColor = 'var(--color-danger)';
    isValid = false;
  }

  return isValid;
}

function validateStep4() {
  let isValid = true;

  // Validate UF selection first
  if (elements.costUf) {
    const customSearchInput = elements.costUf.parentElement?.querySelector('.custom-select-search');
    if (customSearchInput) customSearchInput.style.borderColor = '';
    if (!elements.costUf.value) {
      if (customSearchInput) customSearchInput.style.borderColor = 'var(--color-danger)';
      alert('Por favor, selecione o Estado (UF) de registro do veículo no topo da tela.');
      isValid = false;
    }
  }

  // Validate optional 4. Impostos (%) — if filled, must be between 0,1% and 100%
  if (elements.costTaxRate) {
    elements.costTaxRate.style.borderColor = '';
    const rawTax = elements.costTaxRate.value.trim();
    if (rawTax !== '') {
      const pct = utils.parseTaxPercent(rawTax);
      if (pct === null || pct < 0.1 || pct > 100) {
        elements.costTaxRate.style.borderColor = 'var(--color-danger)';
        alert('O campo "4. Impostos (%)" aceita apenas percentual de 0,1% a 100% (ou deixe em branco caso esteja simulando como Pessoa Física).');
        isValid = false;
      }
    }
  }

  const fields = [
    elements.costRastreador,
    elements.costSeguro,
    elements.costManutencao,
    elements.costContabilidade,
    elements.costManutencaoExtra,
    elements.costFundoReserva,
    elements.costDepreciacao
  ].filter(Boolean);

  fields.forEach(f => f.style.borderColor = '');

  fields.forEach(field => {
    const val = utils.parseCurrency(field.value);
    if (val < 0) {
      field.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
  });

  return isValid;
}

// ==========================================================================
// USER CONTROLS & WIZARD STEPS ENGINE
// ==========================================================================

/**
 * Handles visual updates when shifting between page indices
 */
function goToStep(step) {
  state.currentStep = step;
  
  // Hide timeline progress navbar in step 1 (Centered Login) to match screenshot exactly
  if (step === 1) {
    elements.wizardNav.style.display = 'none';
  } else {
    elements.wizardNav.style.display = 'flex';
  }
  
  // Update Indicators classes
  elements.stepIndicators.forEach(ind => {
    const s = parseInt(ind.dataset.step);
    ind.classList.remove('active', 'completed');
    if (s === step) {
      ind.classList.add('active');
    } else if (s < step) {
      ind.classList.add('completed');
    }
  });

  // Calculate Progress Fill percentage
  // Steps: 1, 2, 3, 4, 5
  // Fill should be: 0% (step1), 25% (step2), 50% (step3), 75% (step4), 100% (step5)
  const percent = ((step - 1) / 4) * 100;
  elements.wizardFill.style.width = `${percent}%`;

  // Display correct page view block
  elements.pages.forEach(p => {
    p.classList.remove('active');
    if (p.id === `page-step-${step}`) {
      p.classList.add('active');
    }
  });

  // Lazy Preloads
  if (step === 2 && !state.vehicle.isManual && elements.fipeBrand.options.length <= 1) {
    loadBrands();
  }

  if (step === 4) {
    recalculateStateIpvaAndLicenciamento();
    recalculateSeguroFromFipe();
    recalculateDepreciationFromFirstScreen();
    updateTaxPreviewTag();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Populates header profile state widget
 */
function renderLoggedInWidget() {
  elements.userWidgetName.textContent = state.currentUser.nome.split(' ')[0];
  elements.userWidget.style.display = 'flex';
}

/**
 * Preloads car brands from API in dropdown
 */
async function loadBrands() {
  elements.fipeBrand.innerHTML = '<option value="">Carregando marcas...</option>';
  try {
    const brands = await fipeService.getBrands();
    elements.fipeBrand.innerHTML = '<option value="">Selecione a marca</option>';
    brands.forEach(brand => {
      const option = document.createElement('option');
      option.value = brand.codigo;
      option.textContent = brand.nome;
      elements.fipeBrand.appendChild(option);
    });
  } catch (err) {
    alert('Erro ao carregar marcas da Tabela FIPE. Utilizaremos o modo de digitação manual.');
    elements.fipeManualToggle.checked = true;
    elements.fipeManualToggle.dispatchEvent(new Event('change'));
  }
}

/**
 * Resets vehicle dropdown selections and calculations
 */
function resetSimulationState() {
  if (elements.vehicleForm) elements.vehicleForm.reset();
  elements.rentalForm.reset();
  elements.costsForm.reset();
  
  state.vehicle = {
    brandId: '',
    brandName: '',
    modelId: '',
    modelName: '',
    yearId: '',
    yearName: '',
    valorFipe: 0,
    valorPago: 0,
    historicoDepreciacaoMensal: 0,
    historicoDepreciacaoTotal: 0,
    historicoMeses: 0,
    isManual: false,
    isLeveraged: false,
    valorEntrada: 0,
    valorFinanciado: 0,
    qtdParcelas: 0,
    valorParcela: 0,
    isFinanciadoManual: false,
    photoUrl: '',
    photoLicense: 'Imagem ilustrativa • Sem vínculo de placa'
  };

  state.rental = {
    valorCaucao: 0,
    valorSemanal: 0,
    semanasMes: 4.3,
    taxaOcupacao: 1.0,
    taxaAdimplencia: 1.0
  };

  state.report = {
    prazoAnaliseMeses: 48,
    desagioVendaFipe: 0
  };

  if (elements.btnLeverageSim && elements.btnLeverageNao) {
    elements.btnLeverageNao.classList.add('active');
    elements.btnLeverageSim.classList.remove('active');
    elements.leverageFieldsContainer.style.display = 'none';
  }

  state.costs = {
    uf: '',
    isLocadoraBenefit: false,
    isIpvaIsento: false,
    isIpvaManual: false,
    manualIpvaAnual: 0,
    customIpvaRate: null,
    isSeguroManual: false,
    deprecMultiplier: 1,
    deprecFipeAnnualRate: null,
    rastreador: 0,
    seguro: 0,
    manutencao: 0,
    manutencaoExtra: 0,
    suporteSistema: 0,
    contabilidade: 0,
    ipvaLicenciamento: 0,
    aliquotaImposto: 0,
    fundoReserva: 0,
    depreciacaoMensal: 0,
    useFundoReserva: true
  };

  syncIpvaModeButtons();
  syncVehiclePhotoUI();
  if (elements.ufTaxBreakdownPanel) elements.ufTaxBreakdownPanel.style.display = 'none';
  if (elements.locadoraSavingsBox) elements.locadoraSavingsBox.style.display = 'none';
  if (elements.taxPreviewTag) elements.taxPreviewTag.style.display = 'none';

  const deprecBtns = [
    elements.btnDeprec1x,
    elements.btnDeprec15x,
    elements.btnDeprec2x,
    elements.btnDeprec6pct,
    elements.btnDeprec10pct,
    elements.btnDeprecManual
  ].filter(Boolean);
  deprecBtns.forEach(btn => {
    btn.classList.toggle('active', btn === elements.btnDeprec1x);
  });

  elements.fipeManualToggle.checked = false;
  elements.fipeManualToggle.dispatchEvent(new Event('change'));
  
  hideFipePreview();
}

// ==========================================================================
// FIPE CARD GRAPHICAL CONTROLS & SMART DEFAULTS
// ==========================================================================

function showFipeSpinner() {
  elements.fipeFeedbackArea.style.display = 'flex';
  elements.fipeSpinner.style.display = 'flex';
  elements.fipePreviewCard.style.display = 'none';
  elements.fipeComparisonBanner.style.display = 'none';
}

function hideFipePreview() {
  elements.fipeFeedbackArea.style.display = 'none';
  elements.fipeSpinner.style.display = 'none';
  elements.fipePreviewCard.style.display = 'none';
  elements.fipeComparisonBanner.style.display = 'none';
  const historyCard = document.getElementById('fipe-depreciation-history-card');
  if (historyCard) historyCard.style.display = 'none';
}

function renderFipeCard(data) {
  elements.fipeSpinner.style.display = 'none';
  
  elements.previewCardBrand.textContent = data.Marca;
  elements.previewCardModel.textContent = data.Modelo;
  elements.previewCardYear.textContent = `Ano: ${data.AnoModelo} ${data.Combustivel}`;
  elements.previewCardPrice.textContent = data.Valor;
  elements.previewCardRef.textContent = `Ref: ${data.MesReferencia}`;
  
  elements.fipePreviewCard.style.display = 'flex';

  // Sincronizar e preencher o cartão de depreciação histórica
  const historyCard = document.getElementById('fipe-depreciation-history-card');
  if (historyCard) {
    if (data.historicoTipo && data.historicoTipo !== 'none') {
      historyCard.style.display = 'flex';
      
      const deprecVal = document.getElementById('history-depreciation-value');
      const deprecBadge = document.getElementById('history-depreciation-badge');
      const deprecNote = document.getElementById('history-depreciation-note');
      const labelPeriod = document.getElementById('history-metric-label-period');
      const labelTotal = document.getElementById('history-metric-label-total');
      
      deprecVal.textContent = data.historicoDepreciacaoBrl;
      deprecBadge.textContent = data.historicoDepreciacaoPct;
      deprecNote.textContent = data.historicoTexto;
      
      if (data.historicoTipo === 'success') {
        historyCard.classList.add('appreciated');
        deprecBadge.className = 'history-badge appreciated';
        historyCard.querySelector('.history-card-header span').textContent = 'Histórico de Valorização Real (Últimos 2 Anos)';
        if (labelPeriod) labelPeriod.textContent = 'Valorização no Período';
        if (labelTotal) labelTotal.textContent = 'Valorização Total';
      } else {
        historyCard.classList.remove('appreciated');
        deprecBadge.className = 'history-badge';
        historyCard.querySelector('.history-card-header span').textContent = 'Histórico de Depreciação Real (Últimos 2 Anos)';
        if (labelPeriod) labelPeriod.textContent = 'Desvalorização no Período';
        if (labelTotal) labelTotal.textContent = 'Desvalorização Total';
      }
    } else {
      historyCard.style.display = 'none';
    }
  }

  renderComparisonBanner();
}

function renderComparisonBanner() {
  const valorPago = utils.parseCurrency(elements.valorPagoInput.value);
  const valorFipe = state.vehicle.valorFipe;

  if (valorPago <= 0 || valorFipe <= 0) {
    elements.fipeComparisonBanner.style.display = 'none';
    return;
  }

  elements.fipeComparisonBanner.style.display = 'flex';
  const diffPct = (valorFipe - valorPago) / valorFipe;

  const textElement = elements.fipeComparisonBanner.querySelector('.comparison-text');
  
  // Reset all state classes
  elements.fipeComparisonBanner.className = 'comparison-banner';
  elements.comparisonBadge.className = 'badge-comparison';

  if (diffPct < 0) {
    // Ágio: Paid more than FIPE
    textElement.innerHTML = `O valor de aquisição está <span>acima</span> da FIPE.`;
    elements.fipeComparisonBanner.classList.add('neutral-state');
    elements.comparisonBadge.classList.add('neutral-badge');
    elements.comparisonBadge.textContent = `${utils.formatPercent(Math.abs(diffPct))} de Ágio`;
  } else {
    // Discount / Margin
    const marginPct = diffPct;
    
    if (marginPct >= 0 && marginPct < 0.05) {
      // 0% a 5% (vermelho)
      textElement.textContent = "Margem baixa para operacao de aluguel de carros! Chance alta de perca com depreciaçao!";
      elements.fipeComparisonBanner.classList.add('danger-state');
      elements.comparisonBadge.classList.add('danger-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    } else if (marginPct >= 0.05 && marginPct < 0.10) {
      // 5% a 9.99% (faixa intermediária padrão)
      textElement.innerHTML = `O valor de aquisição está <span>abaixo</span> da FIPE.`;
      elements.fipeComparisonBanner.classList.add('neutral-state');
      elements.comparisonBadge.classList.add('neutral-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Desconto`;
    } else if (marginPct >= 0.10 && marginPct < 0.15) {
      // 10% a 14.99% (amarelo)
      textElement.textContent = "Margem de aquisição moderada! Verifique estado do veiculo!";
      elements.fipeComparisonBanner.classList.add('warning-state');
      elements.comparisonBadge.classList.add('warning-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    } else if (marginPct >= 0.15 && marginPct < 0.25) {
      // 15% ate 24.99% (verde)
      textElement.textContent = "Margem favoravel para compra! Risco baixo de assumir depreciação";
      elements.fipeComparisonBanner.classList.add('success-state');
      elements.comparisonBadge.classList.add('success-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    } else {
      // >= 25% (verde neon piscando)
      textElement.textContent = "Margem Excepcional, Altas chances de dobrar o retorno sobre investimento!";
      elements.fipeComparisonBanner.classList.add('neon-state');
      elements.comparisonBadge.classList.add('neon-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    }
  }
}

/**
 * Updates the live monthly R$ preview badge next to "4. Impostos (%)"
 */
function updateTaxPreviewTag() {
  if (!elements.taxPreviewTag || !elements.costTaxRate) return;
  const pct = utils.parseTaxPercent(elements.costTaxRate.value);
  if (pct === null || pct <= 0) {
    elements.taxPreviewTag.style.display = 'none';
    return;
  }
  const valorSemanal = utils.parseCurrency(elements.valorSemanalInput.value);
  const semanasMes = parseFloat(elements.semanasMesInput.value) || 4.3;
  const ocupacao = elements.rentalOcupacaoInput ? (parseFloat(elements.rentalOcupacaoInput.value) || 100) / 100 : 1;
  const adimplencia = elements.rentalAdimplenciaInput ? (parseFloat(elements.rentalAdimplenciaInput.value) || 100) / 100 : 1;
  const receitaBruta = valorSemanal * semanasMes * ocupacao * adimplencia;
  const impostoMensal = receitaBruta * (pct / 100);
  elements.taxPreviewTag.style.display = 'inline-block';
  elements.taxPreviewTag.textContent = `${utils.formatCurrency(impostoMensal)}/mês (${String(pct).replace('.', ',')}%)`;
}

/**
 * Pre-fills 1. Seguro Mensal with 0.34% of the vehicle's FIPE value (editable by the user)
 */
function recalculateSeguroFromFipe() {
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value);
  if (valorFipe <= 0) return;

  const seguroSugerido = valorFipe * 0.0034; // 0,34% sobre a FIPE
  if (elements.seguroFipeHint) {
    elements.seguroFipeHint.innerHTML =
      `Calculado em <strong>0,34% sobre a FIPE</strong> (${utils.formatCurrency(seguroSugerido)}/mês) — caixa editável.`;
  }

  if (!state.costs.isSeguroManual && elements.costSeguro) {
    elements.costSeguro.value = utils.formatCurrency(seguroSugerido);
    state.costs.seguro = seguroSugerido;
  }
}

/**
 * MANDATORY RULE: Depreciation is ALWAYS calculated over the vehicle's FIPE value (`valorFipe`),
 * NEVER over the purchase price paid (`valorPago`).
 * Supports:
 * - 1x, 1.5x, 2x of the 24-month historical FIPE depreciation brought from Screen 1
 *   (if the vehicle appreciated in the last 24m on Screen 1, suggests R$ 0,00/mês)
 * - 6% a.a. FIPE or 10% a.a. FIPE directly over `valorFipe`
 * - Manual entry
 */
function recalculateDepreciationFromFirstScreen() {
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value) || state.vehicle.valorFipe || 0;

  // Case 1: User selected an explicit annual percentage rate over FIPE (6% a.a. FIPE or 10% a.a. FIPE)
  if (state.costs.deprecMultiplier === 'rate-fipe' && state.costs.deprecFipeAnnualRate > 0) {
    const rate = state.costs.deprecFipeAnnualRate;
    const deprecMensalFipe = (valorFipe * rate) / 12;
    if (elements.deprecOriginTag) {
      elements.deprecOriginTag.textContent = `${utils.formatPercent(rate)} a.a. sobre FIPE: ${utils.formatCurrency(deprecMensalFipe)}/mês`;
    }
    if (elements.deprecHelperText) {
      elements.deprecHelperText.innerHTML =
        `Calculada <strong>100% em cima da FIPE (${utils.formatCurrency(valorFipe)})</strong> à taxa de <strong>${utils.formatPercent(rate)} ao ano</strong> (${utils.formatCurrency(deprecMensalFipe)}/mês). Nunca incide sobre o valor pago.`;
    }
    elements.costDepreciacao.value = utils.formatCurrency(deprecMensalFipe);
    state.costs.depreciacaoMensal = deprecMensalFipe;
    return;
  }

  // Case 2: Historical 24-month FIPE variation brought from Screen 1
  let baseDeprecMensal = 0;

  if (!state.vehicle.isManual && state.vehicle.historicoDepreciacaoMensal > 0) {
    baseDeprecMensal = state.vehicle.historicoDepreciacaoMensal;
    const pctAnualFipe = valorFipe > 0 ? ((baseDeprecMensal * 12) / valorFipe) : 0;
    if (elements.deprecOriginTag) {
      elements.deprecOriginTag.textContent = `Base FIPE 1ª Tela: ${utils.formatCurrency(baseDeprecMensal)}/mês (${utils.formatPercent(pctAnualFipe)} a.a.)`;
    }
    if (elements.deprecHelperText) {
      elements.deprecHelperText.innerHTML =
        `Depreciação trazida da 1ª tela sobre a <strong>FIPE (${utils.formatCurrency(valorFipe)})</strong>: <strong>${utils.formatCurrency(baseDeprecMensal)}/mês</strong>. Escolha manter (1x), 1,5x, 2x, 6%/10% a.a. sobre a FIPE ou Manual.`;
    }
  } else if (!state.vehicle.isManual && state.vehicle.historicoMeses > 0 && state.vehicle.historicoDepreciacaoMensal <= 0) {
    // Vehicle appreciated or had zero depreciation in the last 2 years on Screen 1 -> suggest R$ 0,00!
    baseDeprecMensal = 0;
    if (elements.deprecOriginTag) {
      elements.deprecOriginTag.textContent = `1ª Tela FIPE: Não depreciou (R$ 0,00/mês)`;
    }
    if (elements.deprecHelperText) {
      elements.deprecHelperText.innerHTML =
        `Na 1ª tela este modelo <strong>não depreciou na FIPE nos últimos 2 anos</strong>, por isso a sugestão base é <strong>R$ 0,00/mês</strong>. Para simular depreciação futura sobre a FIPE (${utils.formatCurrency(valorFipe)}), clique em <strong>6% a.a. FIPE</strong>, <strong>10% a.a. FIPE</strong> ou <strong>Manual</strong>.`;
    }
  } else {
    baseDeprecMensal = 0;
    if (elements.deprecOriginTag) {
      elements.deprecOriginTag.textContent = `Base FIPE: R$ 0,00/mês`;
    }
    if (elements.deprecHelperText) {
      elements.deprecHelperText.innerHTML =
        `A depreciação é calculada <strong>sempre sobre a FIPE (${utils.formatCurrency(valorFipe)})</strong> e nunca sobre o valor pago. Clique em <strong>6% a.a. FIPE</strong>, <strong>10% a.a. FIPE</strong> ou <strong>Manual</strong> para estimar.`;
    }
  }

  if (state.costs.deprecMultiplier !== 'manual') {
    const mult = Number(state.costs.deprecMultiplier) || 1;
    const finalDeprecMensal = baseDeprecMensal * mult;
    elements.costDepreciacao.value = utils.formatCurrency(finalDeprecMensal);
    state.costs.depreciacaoMensal = finalDeprecMensal;
  }
}

/**
 * Triggered automatically on input blur of prices.
 * Dynamically updates IPVA, Seguro (0.34% FIPE) & Depreciation operational inputs based on Vehicle FIPE metrics,
 * but leaves them editable so the user has the final word.
 */
function triggerSmartDefaults() {
  // 1. Update IPVA + Licenciamento based on selected UF
  recalculateStateIpvaAndLicenciamento();

  // 2. Pre-fill Seguro Mensal at 0.34% of FIPE (if not manually edited)
  recalculateSeguroFromFipe();

  // 3. Update Depreciation strictly based on FIPE
  recalculateDepreciationFromFirstScreen();

  // Live recalculate the discount banner on step 2 if FipeCard is rendered
  if (state.currentStep === 2 && !state.vehicle.isManual && state.vehicle.valorFipe > 0) {
    renderComparisonBanner();
  }
}

/**
 * Composes a premium WhatsApp text message summarizing the simulation results and opens the WhatsApp share API.
 */
function shareSimulationOnWhatsApp() {
  const brand = state.vehicle.isManual ? elements.manualBrand.value : state.vehicle.brandName;
  const model = state.vehicle.isManual ? elements.manualModel.value : `${state.vehicle.modelName} (${state.vehicle.yearName})`;
  const fipe = elements.valorFipeInput.value;
  const pago = elements.valorPagoInput.value;
  const semanal = elements.valorSemanalInput.value;
  
  const receita = elements.dreReceitaBruta.textContent;
  const caixaLivre = elements.dreLucroLiquido.textContent;
  const resultadoEcon = elements.dreResultadoEconomico ? elements.dreResultadoEconomico.textContent : caixaLivre;
  const roi = elements.kpiRoiMensal.textContent;
  const payback = elements.kpiRoiAnual.textContent;

  let leverageText = '';
  if (state.vehicle.isLeveraged) {
    const entrada = elements.leverageEntradaInput.value || 'R$ 0,00';
    const qtd = elements.leverageQtdParcelasInput.value || '0';
    const parcela = elements.leverageValorParcelaInput.value || 'R$ 0,00';
    leverageText = `\n*Operação Financiada:* Entrada ${entrada} + ${qtd}x de ${parcela}`;
  }

  const message = 
`🚗 *LOCADOR NÔMADE — RELATÓRIO DE VIABILIDADE & PATRIMÔNIO* 🚗

*Veículo:* ${brand} ${model}
*FIPE Referência:* ${fipe} | *Custo de Aquisição:* ${pago}${leverageText}
*Aluguel Semanal:* ${semanal}

*--- 1. FLUXO DE CAIXA MENSAL ---*
*Receita Mensal Esperada:* ${receita}
*Caixa Mensal Disponível Projetado:* ${caixaLivre}

*--- 2. VISÃO PATRIMONIAL (BASE 100% FIPE) ---*
*Resultado Econômico (após Depreciação FIPE):* ${resultadoEcon}
*Retorno / Payback:* ${roi} | ${payback}

*Siga nossas redes sociais:*
👉 *@locadornomade*`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
}


// ==========================================================================
// FINANCIAL ENGINE COMPILATION & INVESTOR REPORT RENDERING (4 PAGES)
// ==========================================================================

function formatSignedNegativeBrl(val) {
  const num = Math.abs(Number(val) || 0);
  if (num === 0) return 'R$ 0,00';
  return `R$ -${utils.formatCurrency(num).replace('R$', '').trim()}`;
}

function runCalculationsAndRender() {
  const parsedTaxPct = elements.costTaxRate ? utils.parseTaxPercent(elements.costTaxRate.value) : null;
  const aliquotaImposto = parsedTaxPct !== null && parsedTaxPct > 0 ? (parsedTaxPct / 100) : 0;

  const ocupacaoPctInput = elements.rentalOcupacaoInput ? parseFloat(elements.rentalOcupacaoInput.value) : 100;
  const taxaOcupacao = Number.isFinite(ocupacaoPctInput) ? Math.min(1, Math.max(0.1, ocupacaoPctInput / 100)) : (state.rental.taxaOcupacao || 1);
  state.rental.taxaOcupacao = taxaOcupacao;

  const adimplenciaPctInput = elements.rentalAdimplenciaInput ? parseFloat(elements.rentalAdimplenciaInput.value) : 100;
  const taxaAdimplencia = Number.isFinite(adimplenciaPctInput) ? Math.min(1, Math.max(0.1, adimplenciaPctInput / 100)) : (state.rental.taxaAdimplencia || 1);
  state.rental.taxaAdimplencia = taxaAdimplencia;

  // Sync Step 5 occupancy pills with current taxaOcupacao
  if (elements.step5OcupacaoBtns) {
    elements.step5OcupacaoBtns.querySelectorAll('[data-ocup]').forEach(btn => {
      const bOcup = parseFloat(btn.getAttribute('data-ocup'));
      btn.classList.toggle('active', Math.abs(bOcup - taxaOcupacao) < 0.02);
    });
  }

  // Collect data from forms
  const data = {
    valorPago: utils.parseCurrency(elements.valorPagoInput.value),
    valorFipe: utils.parseCurrency(elements.valorFipeInput.value),
    isLeveraged: state.vehicle.isLeveraged,
    valorEntrada: state.vehicle.isLeveraged ? utils.parseCurrency(elements.leverageEntradaInput.value) : 0,
    valorFinanciado: state.vehicle.isLeveraged ? utils.parseCurrency(elements.leverageFinanciadoInput.value) : 0,
    qtdParcelas: state.vehicle.isLeveraged ? (parseInt(elements.leverageQtdParcelasInput.value, 10) || 0) : 0,
    valorParcela: state.vehicle.isLeveraged ? utils.parseCurrency(elements.leverageValorParcelaInput.value) : 0,
    valorCaucao: utils.parseCurrency(elements.valorCaucaoInput.value),
    valorSemanal: utils.parseCurrency(elements.valorSemanalInput.value),
    semanasMes: parseFloat(elements.semanasMesInput.value) || 4.3,
    taxaOcupacao,
    taxaAdimplencia,
    
    rastreador: utils.parseCurrency(elements.costRastreador.value),
    seguro: utils.parseCurrency(elements.costSeguro.value),
    manutencao: utils.parseCurrency(elements.costManutencao.value),
    suporteSistema: elements.costSuporte ? utils.parseCurrency(elements.costSuporte.value) : 0,
    contabilidade: elements.costContabilidade ? utils.parseCurrency(elements.costContabilidade.value) : 0,
    ipvaLicenciamento: utils.parseCurrency(elements.costIpva.value),
    
    aliquotaImposto,
    depreciacaoMensal: utils.parseCurrency(elements.costDepreciacao.value),
    fundoReserva: utils.parseCurrency(elements.costFundoReserva.value),
    manutencaoExtra: elements.costManutencaoExtra ? utils.parseCurrency(elements.costManutencaoExtra.value) : 0,
    prazoAnaliseMeses: state.report.prazoAnaliseMeses || 48,
    desagioVendaFipe: state.report.desagioVendaFipe || 0
  };

  // Compile calculations through the simulation service
  const results = simulationService.calculate(data);

  // Header metadata
  if (elements.reportGeneratedDate) {
    elements.reportGeneratedDate.textContent = `Data: ${new Date().toLocaleDateString('pt-BR')}`;
  }
  if (elements.reportScenarioPill) {
    const ufLabel = state.costs.uf ? ` • UF: ${state.costs.uf}` : '';
    elements.reportScenarioPill.textContent = `Ocupação: ${Math.round(taxaOcupacao * 100)}% • Adimplência: ${Math.round(taxaAdimplencia * 100)}%${ufLabel}`;
  }

  // Vehicle Identification
  let vehicleName = '';
  if (state.vehicle.isManual) {
    vehicleName = `${elements.manualBrand.value.trim()} ${elements.manualModel.value.trim()}`;
  } else {
    vehicleName = `${state.vehicle.brandName} ${state.vehicle.modelName} (${state.vehicle.yearName})`;
  }
  elements.resultVehicleName.textContent = vehicleName;
  elements.resultFipeReference.textContent = `FIPE de Referência: ${utils.formatCurrency(results.inputs.valorFipe)} | Aquisição: ${utils.formatCurrency(results.inputs.valorPago)}`;
  syncVehiclePhotoUI();

  // Top Purchase Margin Badge
  if (elements.reportFipeMarginBadge) {
    if (results.margemInicialVsFipe >= 0) {
      elements.reportFipeMarginBadge.textContent = `Compra ${utils.formatPercent(results.descontoSobreFipe)} abaixo da FIPE (+${utils.formatCurrency(results.margemInicialVsFipe)} de margem)`;
    } else {
      elements.reportFipeMarginBadge.textContent = `Compra ${utils.formatPercent(Math.abs(results.descontoSobreFipe))} acima da FIPE`;
    }
  }

  // Highlighted Risk Alert Banner when Caixa Disponível < 0 or DSCR < 1.0
  if (elements.investorAlertBanner) {
    if (results.caixaDisponivelProjetado < 0 || (results.dscr !== null && results.dscr < 1.0)) {
      elements.investorAlertBanner.style.display = 'flex';
      elements.investorAlertTitle.textContent = results.dscr !== null && results.dscr < 1.0
        ? `Alerta Crítico: Cobertura da Dívida Insuficiente (DSCR ${results.dscr.toFixed(2).replace('.', ',')}x)`
        : `Alerta de Caixa Negativo na Ocupação de ${Math.round(taxaOcupacao * 100)}%`;
      elements.investorAlertDesc.textContent =
        `Neste cenário, a operação fecha o mês em ${utils.formatCurrency(results.caixaDisponivelProjetado)} de caixa disponível. A ocupação mínima de equilíbrio (break-even) para cobrir custos fixos, parcela e reservas é de ${utils.formatPercent(results.ocupacaoEquilibrio)} (${results.semanasEquilibrioMes.toFixed(2).replace('.', ',')} semanas/mês).`;
    } else {
      elements.investorAlertBanner.style.display = 'none';
    }
  }

  // Render Investor Narrative Box (Section 10 of Spec)
  renderInvestorNarrative(results, vehicleName);

  // =========================================================================
  // PAGE 1: 8 EXECUTIVE KPI CARDS
  // =========================================================================
  if (elements.execKpiFipe) elements.execKpiFipe.textContent = utils.formatCurrency(results.inputs.valorFipe);
  if (elements.execKpiPago) elements.execKpiPago.textContent = utils.formatCurrency(results.inputs.valorPago);
  if (elements.execKpiPagoSub) {
    elements.execKpiPagoSub.textContent = results.isLeveraged
      ? `Financiado (${results.inputs.qtdParcelas}x de ${utils.formatCurrency(results.parcelaFinanciamento)})`
      : 'Aquisição 100% à vista';
  }

  elements.kpiFipeDesconto.textContent = utils.formatPercent(results.descontoSobreFipe);
  const diffVal = Math.abs(results.margemInicialVsFipe);
  const diffDirection = results.margemInicialVsFipe >= 0 ? 'abaixo da FIPE (Colchão patrimonial)' : 'acima da FIPE (Ágio)';
  elements.kpiFipeDetalhe.textContent = `${utils.formatCurrency(diffVal)} ${diffDirection}`;

  if (elements.execKpiReceitaLabel) {
    elements.execKpiReceitaLabel.textContent = `RECEITA MENSAL (${Math.round(taxaOcupacao * 100)}% OCUP.)`;
  }
  elements.dreHeaderRevenue.textContent = utils.formatCurrency(results.receitaBrutaMensal);
  if (elements.execKpiReceitaSub) {
    elements.execKpiReceitaSub.textContent = `${utils.formatCurrency(results.inputs.valorSemanal)}/sem × ${String(results.inputs.semanasMes).replace('.', ',')} sem/mês`;
  }

  if (elements.execKpiCaixaOp) {
    elements.execKpiCaixaOp.textContent = utils.formatCurrency(results.caixaOperacionalAntesDivida);
  }
  if (elements.execKpiCustosSub) {
    const totalCustosETributos = results.custosOperacionaisRecorrentes + results.impostosSimplesNacional;
    elements.execKpiCustosSub.textContent = `Após ${utils.formatCurrency(totalCustosETributos)} de custos fixos/tributos`;
  }

  if (elements.execKpiDscr) {
    if (results.isLeveraged && results.parcelaFinanciamento > 0) {
      elements.execKpiDscr.textContent = utils.formatCurrency(results.parcelaFinanciamento);
      elements.execKpiDscrSub.textContent = `DSCR: ${results.dscr.toFixed(2).replace('.', ',')}x | Equilíbrio: ${utils.formatPercent(results.ocupacaoEquilibrio)}`;
    } else {
      elements.execKpiDscr.textContent = 'Sem Dívida';
      elements.execKpiDscrSub.textContent = `Operação à vista | Equilíbrio: ${utils.formatPercent(results.ocupacaoEquilibrio)}`;
    }
  }

  if (elements.execKpiCaixaDistribuivel) {
    elements.execKpiCaixaDistribuivel.textContent = utils.formatCurrency(results.caixaDisponivelProjetado);
    elements.execKpiCaixaDistribuivel.style.color = results.caixaDisponivelProjetado >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  }
  if (elements.execKpiCaixaDistSub) {
    elements.execKpiCaixaDistSub.textContent = `Livre após dívida e ${utils.formatCurrency(results.reservasRetidasMes)} de reserva (sem descontar depreciação)`;
  }

  // Card 8: ROI & Payback on Own Initial Capital (Handles 100% Financed / Zero Entry cleanly!)
  if (results.semCapitalProprioInicial) {
    if (elements.kpiRoiLabel) elements.kpiRoiLabel.textContent = 'ROI & PAYBACK (100% FINANCIADO)';
    elements.kpiRoiMensal.textContent = 'Sem Entrada';
    elements.kpiRoiMensal.style.fontSize = '18px';
    elements.kpiRoiAnual.textContent = `Compromisso total: ${utils.formatCurrency(results.totalNominalFinanciamento)} (${results.inputs.qtdParcelas}x)`;
    elements.kpiPayback.textContent = 'N/A (Sem capital próprio inicial)';
  } else {
    elements.kpiRoiMensal.style.fontSize = '';
    if (elements.kpiRoiLabel) {
      elements.kpiRoiLabel.textContent = results.isLeveraged
        ? `ROI & PAYBACK (SOBRE ENTRADA DE ${utils.formatCurrency(results.capitalProprioInicial)})`
        : 'ROI & PAYBACK (CAPITAL PRÓPRIO)';
    }
    elements.kpiRoiMensal.textContent = `${utils.formatPercent(results.roiMensal)} a.m.`;
    const paybackStr = results.paybackMeses && results.paybackMeses !== Infinity
      ? `Payback: ${results.paybackMeses.toFixed(1).replace('.', ',')} meses`
      : 'Payback: Indeterminado';
    elements.kpiRoiAnual.textContent = `${utils.formatPercent(results.roiAnual)} a.a. • ${paybackStr}`;
    elements.kpiPayback.textContent = paybackStr;
  }
  elements.kpiMargem.textContent = utils.formatPercent(results.margemCaixaDisponivel);

  // =========================================================================
  // PAGE 2: DEMONSTRATIVO DE CAIXA MENSAL VS. DEMONSTRATIVO ECONÔMICO (FIPE)
  // =========================================================================
  if (results.perdaVacanciaInadimplencia > 0.01) {
    if (elements.dreRowReceitaPotencial) elements.dreRowReceitaPotencial.style.display = 'flex';
    if (elements.dreReceitaPotencial) elements.dreReceitaPotencial.textContent = utils.formatCurrency(results.receitaPotencialMensal);
    if (elements.dreRowVacancia) elements.dreRowVacancia.style.display = 'flex';
    if (elements.dreLabelVacancia) {
      elements.dreLabelVacancia.textContent = `(-) Vacância / Inadimplência (${Math.round((1 - taxaOcupacao * taxaAdimplencia) * 100)}%)`;
    }
    if (elements.dreValVacancia) {
      elements.dreValVacancia.textContent = formatSignedNegativeBrl(results.perdaVacanciaInadimplencia);
    }
  } else {
    if (elements.dreRowReceitaPotencial) elements.dreRowReceitaPotencial.style.display = 'none';
    if (elements.dreRowVacancia) elements.dreRowVacancia.style.display = 'none';
  }

  if (elements.dreLabelReceitaBruta) {
    elements.dreLabelReceitaBruta.textContent = `(+) RECEITA MENSAL ESPERADA (${Math.round(taxaOcupacao * 100)}% OCUP.)`;
  }
  elements.dreReceitaBruta.textContent = utils.formatCurrency(results.receitaBrutaMensal);
  elements.dreImpostos.textContent = formatSignedNegativeBrl(results.impostosSimplesNacional);
  elements.dreReceitaLiquida.textContent = utils.formatCurrency(results.receitaLiquidaMensal);

  if (results.impostosSimplesNacional > 0) {
    if (elements.dreRowImpostos) elements.dreRowImpostos.style.display = 'flex';
    if (elements.dreRowReceitaLiquida) elements.dreRowReceitaLiquida.style.display = 'flex';
    if (elements.dreLabelImpostos) {
      elements.dreLabelImpostos.textContent = `(-) 4. Impostos (${utils.formatPercent(aliquotaImposto)})`;
    }
  } else {
    if (elements.dreRowImpostos) elements.dreRowImpostos.style.display = 'none';
    if (elements.dreRowReceitaLiquida) elements.dreRowReceitaLiquida.style.display = 'none';
  }
  
  elements.dreCustosRecorrentesTotal.textContent = formatSignedNegativeBrl(results.custosOperacionaisRecorrentes);
  elements.dreRastreador.textContent = formatSignedNegativeBrl(results.custosDetalhados.rastreador);
  elements.dreSeguro.textContent = formatSignedNegativeBrl(results.custosDetalhados.seguro);
  elements.dreManutencao.textContent = formatSignedNegativeBrl(results.custosDetalhados.manutencao);
  elements.dreSuporte.textContent = formatSignedNegativeBrl(results.custosDetalhados.suporteSistema);
  elements.dreContabilidade.textContent = formatSignedNegativeBrl(results.custosDetalhados.contabilidade);
  elements.dreIpva.textContent = formatSignedNegativeBrl(results.custosDetalhados.ipvaLicenciamento);

  if (elements.dreCaixaOperacional) {
    elements.dreCaixaOperacional.textContent = utils.formatCurrency(results.caixaOperacionalAntesDivida);
  }

  // Financing / Debt Service rows in Cash Flow Statement
  if (results.isLeveraged && results.parcelaFinanciamento > 0) {
    if (elements.dreFinanciamentoHeader) elements.dreFinanciamentoHeader.style.display = 'flex';
    if (elements.dreFinanciamentoRow) elements.dreFinanciamentoRow.style.display = 'flex';
    if (elements.dreRowCaixaAposDivida) elements.dreRowCaixaAposDivida.style.display = 'flex';
    const parcelaFormatted = formatSignedNegativeBrl(results.parcelaFinanciamento);
    if (elements.dreFinanciamentoTotal) elements.dreFinanciamentoTotal.textContent = parcelaFormatted;
    if (elements.dreFinanciamentoVal) elements.dreFinanciamentoVal.textContent = parcelaFormatted;
    if (elements.dreFinanciamentoLabel) {
      elements.dreFinanciamentoLabel.textContent = results.inputs.qtdParcelas > 0
        ? `Parcela Integral do Financiamento (${results.inputs.qtdParcelas}x)`
        : 'Parcela Integral do Financiamento';
    }
    if (elements.dreCaixaAposDivida) {
      elements.dreCaixaAposDivida.textContent = utils.formatCurrency(results.caixaAposServicoDivida);
    }
  } else {
    if (elements.dreFinanciamentoHeader) elements.dreFinanciamentoHeader.style.display = 'none';
    if (elements.dreFinanciamentoRow) elements.dreFinanciamentoRow.style.display = 'none';
    if (elements.dreRowCaixaAposDivida) elements.dreRowCaixaAposDivida.style.display = 'none';
  }

  // Reserve retentions (only Fundo de Reserva + Manutenção Extra; NOT non-cash depreciation!)
  elements.dreProvisoesTotal.textContent = formatSignedNegativeBrl(results.reservasRetidasMes);
  elements.dreFundoReserva.textContent = formatSignedNegativeBrl(results.fundoReserva);
  if (elements.dreManutencaoExtra) {
    elements.dreManutencaoExtra.textContent = formatSignedNegativeBrl(results.manutencaoExtra);
  }

  elements.dreSaidasTotal.textContent = formatSignedNegativeBrl(results.saidasCaixaTotaisMensais);
  
  // Net Monthly Distributable Cash (Caixa Mensal Disponível Projetado)
  if (results.caixaDisponivelProjetado >= 0) {
    elements.dreLucroLiquido.textContent = utils.formatCurrency(results.caixaDisponivelProjetado);
    elements.dreLucroLiquido.style.color = 'var(--color-success)';
  } else {
    elements.dreLucroLiquido.textContent = formatSignedNegativeBrl(results.caixaDisponivelProjetado);
    elements.dreLucroLiquido.style.color = 'var(--color-danger)';
  }

  // Separate Statement 2: Economic & Patrimonial Depreciation over FIPE
  if (elements.dreLabelDepreciacaoFipe) {
    elements.dreLabelDepreciacaoFipe.textContent =
      `(-) 3. Depreciação Mensal sobre a FIPE (${utils.formatPercent(results.taxaDepreciacaoAnualFipe)} a.a. sobre ${utils.formatCurrency(results.baseFipeDepreciacao)})`;
  }
  elements.dreDepreciacao.textContent = formatSignedNegativeBrl(results.depreciacaoMensal);
  if (elements.dreResultadoEconomico) {
    elements.dreResultadoEconomico.textContent = utils.formatCurrency(results.resultadoEconomicoMensal);
    elements.dreResultadoEconomico.style.color = results.resultadoEconomicoMensal >= 0 ? 'var(--accent-primary)' : 'var(--color-warning)';
  }

  // Render Operational Risk card & Break-Even / Reserves cards
  const r = results.analiseRisco;
  elements.riskCard.className = `risk-card ${r.status}`;
  elements.riskLabel.textContent = 'Diagnóstico de Risco & Liquidez';
  elements.riskBadge.textContent = r.score;
  elements.riskDesc.textContent = r.message;

  if (elements.kpiBreakevenPct) {
    elements.kpiBreakevenPct.textContent = utils.formatPercent(results.ocupacaoEquilibrio);
  }
  if (elements.kpiBreakevenSub) {
    elements.kpiBreakevenSub.textContent =
      `Equivale a ${results.semanasEquilibrioMes.toFixed(2).replace('.', ',')} semanas alugadas/mês (de ${String(results.inputs.semanasMes).replace('.', ',')}) para empatar o caixa`;
  }

  const hSelected = results.horizonteSelecionado;
  if (elements.kpiReservaAcumulada && hSelected) {
    elements.kpiReservaAcumulada.textContent = utils.formatCurrency(hSelected.reservasAcumuladas);
  }
  if (elements.kpiReservaAcumuladaSub && hSelected) {
    elements.kpiReservaAcumuladaSub.textContent =
      `Saldo retido em fundo próprio ao final de ${hSelected.meses} meses (${utils.formatCurrency(results.reservasRetidasMes)}/mês)`;
  }

  // Render Chart 1: Waterfall + Revenue Distribution Bar
  renderWaterfallChart(results);
  renderDistributionChart(results);

  // =========================================================================
  // PAGE 3: OCCUPANCY SENSITIVITY (100%, 90%, 80%) — CHART 2 & TABLE
  // =========================================================================
  renderOccupancyComparison(results);

  // =========================================================================
  // PAGE 4: 12/24/36/48M ACCUMULATED CASH (CHART 3) & FIPE PATRIMONY (CHART 4)
  // =========================================================================
  renderHorizonAndPatrimonyCharts(results);
}

/**
 * Generates the Executive Investor Narrative (Section 10 of Spec)
 */
function renderInvestorNarrative(results, vehicleName) {
  if (!elements.investorNarrativeText) return;
  const c100 = results.cenariosOcupacao[0];
  const c90 = results.cenariosOcupacao[1];
  const c80 = results.cenariosOcupacao[2];
  const hSel = results.horizonteSelecionado;

  const discountPhrase = results.margemInicialVsFipe > 0
    ? `adquirido por <strong>${utils.formatCurrency(results.inputs.valorPago)}</strong> frente à FIPE de <strong>${utils.formatCurrency(results.inputs.valorFipe)}</strong>, gerando uma margem patrimonial inicial na compra de <strong>${utils.formatCurrency(results.margemInicialVsFipe)} (${utils.formatPercent(results.descontoSobreFipe)} abaixo da FIPE)</strong>`
    : `adquirido por <strong>${utils.formatCurrency(results.inputs.valorPago)}</strong> (FIPE de referência: <strong>${utils.formatCurrency(results.inputs.valorFipe)}</strong>)`;

  const financingPhrase = results.isLeveraged && results.parcelaFinanciamento > 0
    ? `Após quitar os custos operacionais fixos de <strong>${utils.formatCurrency(results.custosOperacionaisRecorrentes + results.impostosSimplesNacional)}/mês</strong>, o caixa operacional antes da dívida é de <strong>${utils.formatCurrency(c100.caixaOperacionalAntesDivida)}/mês</strong>. Descontando a parcela do financiamento de <strong>${utils.formatCurrency(results.parcelaFinanciamento)}/mês</strong> (DSCR de <strong>${(c100.dscr || 0).toFixed(2).replace('.', ',')}x</strong>) e a retenção de reserva de <strong>${utils.formatCurrency(results.reservasRetidasMes)}/mês</strong>`
    : `Após quitar os custos operacionais fixos de <strong>${utils.formatCurrency(results.custosOperacionaisRecorrentes + results.impostosSimplesNacional)}/mês</strong> e reter <strong>${utils.formatCurrency(results.reservasRetidasMes)}/mês</strong> para o fundo de reserva`;

  elements.investorNarrativeText.innerHTML =
    `O veículo <strong>${vehicleName}</strong> foi ${discountPhrase}. Com aluguel semanal de <strong>${utils.formatCurrency(results.inputs.valorSemanal)}</strong> (${String(results.inputs.semanasMes).replace('.', ',')} sem/mês), a receita potencial em 100% de ocupação é de <strong>${utils.formatCurrency(results.receitaPotencialMensal)}/mês</strong>. ${financingPhrase}, o <strong>Caixa Mensal Disponível Projetado</strong> (sem descontar a depreciação não-caixa) é de <strong>${utils.formatCurrency(c100.caixaDisponivelProjetado)}/mês a 100% de ocupação</strong>, <strong>${utils.formatCurrency(c90.caixaDisponivelProjetado)}/mês a 90%</strong> e <strong>${utils.formatCurrency(c80.caixaDisponivelProjetado)}/mês a 80%</strong> (ponto de equilíbrio em <strong>${utils.formatPercent(results.ocupacaoEquilibrio)}</strong>). Em <strong>${hSel.meses} meses</strong>, a operação acumula <strong>${utils.formatCurrency(hSel.caixaDistribuivelAcumulado)}</strong> de caixa distribuível mais <strong>${utils.formatCurrency(hSel.reservasAcumuladas)}</strong> em reservas retidas, enquanto a depreciação calculada sobre a FIPE projeta valor de revenda líquido de <strong>${utils.formatCurrency(hSel.patrimonioLiquidoVeiculo)}</strong>.`;
}

/**
 * Chart 1: Waterfall of Monthly Cash Flow (Receita -> Custos Fixos -> Caixa Op -> Parcela -> Reserva -> Caixa Livre)
 */
function renderWaterfallChart(results) {
  if (!elements.waterfallChartContainer) return;
  const maxRef = Math.max(results.receitaPotencialMensal, results.receitaBrutaMensal, 1);

  const steps = [
    {
      label: `(+) Receita Mensal (${Math.round(results.inputs.taxaOcupacao * 100)}% ocup.)`,
      val: results.receitaBrutaMensal,
      cls: 'positive',
      prefix: ''
    },
    {
      label: '(-) Custos Fixos + Tributos',
      val: results.custosOperacionaisRecorrentes + results.impostosSimplesNacional,
      cls: 'negative',
      prefix: '-'
    },
    {
      label: '(=) Caixa Operacional',
      val: results.caixaOperacionalAntesDivida,
      cls: 'subtotal',
      prefix: ''
    }
  ];

  if (results.isLeveraged && results.parcelaFinanciamento > 0) {
    steps.push({
      label: `(-) Parcela Financiamento (${results.inputs.qtdParcelas}x)`,
      val: results.parcelaFinanciamento,
      cls: 'negative',
      prefix: '-'
    });
    steps.push({
      label: '(=) Caixa Após Dívida',
      val: results.caixaAposServicoDivida,
      cls: 'subtotal',
      prefix: ''
    });
  }

  steps.push({
    label: '(-) Retenção de Reserva',
    val: results.reservasRetidasMes,
    cls: 'reserve',
    prefix: '-'
  });

  steps.push({
    label: '(=) Caixa Disponível Projetado',
    val: results.caixaDisponivelProjetado,
    cls: results.caixaDisponivelProjetado >= 0 ? 'final' : 'negative',
    prefix: ''
  });

  elements.waterfallChartContainer.innerHTML = steps.map(s => {
    const pctWidth = Math.min(100, Math.max(3, (Math.abs(s.val) / maxRef) * 100));
    const formatted = s.prefix === '-' && s.val > 0
      ? formatSignedNegativeBrl(s.val)
      : utils.formatCurrency(s.val);
    return `
      <div class="wf-row">
        <span class="wf-label">${s.label}</span>
        <div class="wf-bar-track">
          <div class="wf-bar-fill ${s.cls}" style="width: ${pctWidth.toFixed(1)}%;"></div>
        </div>
        <span class="wf-val">${formatted}</span>
      </div>
    `;
  }).join('');
}

/**
 * Chart 2 & Table: 100%, 90%, and 80% Occupancy Scenarios
 */
function renderOccupancyComparison(results) {
  if (!elements.occupancyBarsContainer || !elements.occupancyTableBody) return;
  const scenarios = results.cenariosOcupacao || [];
  const maxCash = Math.max(...scenarios.map(s => Math.abs(s.caixaDisponivelProjetado)), 1);

  elements.occupancyBarsContainer.innerHTML = scenarios.map(sc => {
    const isCurrent = Math.abs(sc.taxaOcupacao - results.inputs.taxaOcupacao) < 0.02;
    const isPositive = sc.caixaDisponivelProjetado >= 0;
    const barPct = Math.min(100, Math.max(6, (Math.abs(sc.caixaDisponivelProjetado) / maxCash) * 100));
    const fillColor = isPositive
      ? 'linear-gradient(90deg, #10B981, #22D3EE)'
      : 'linear-gradient(90deg, #EF4444, #F87171)';

    return `
      <div class="occ-scenario-card ${isCurrent ? 'active-scenario' : ''}">
        <div class="occ-scenario-top">
          <span class="occ-scenario-title">Ocupação ${sc.ocupacaoPct}% (${sc.semanasAlugadasMes.toFixed(2).replace('.', ',')} sem/mês)</span>
          <span class="occ-scenario-badge ${isPositive ? 'ok' : 'warn'}">
            ${sc.dscr !== null ? `DSCR ${sc.dscr.toFixed(2).replace('.', ',')}x` : 'À Vista'}
          </span>
        </div>
        <div class="occ-cash-big" style="color: ${isPositive ? '#10B981' : '#EF4444'};">
          ${utils.formatCurrency(sc.caixaDisponivelProjetado)}<small style="font-size: 12px; font-weight: 500; color: var(--text-muted);">/mês livre</small>
        </div>
        <div class="occ-mini-bar-track">
          <div class="occ-mini-bar-fill" style="width: ${barPct.toFixed(1)}%; background: ${fillColor};"></div>
        </div>
        <div class="occ-scenario-meta">
          <span>Receita: <strong>${utils.formatCurrency(sc.receitaBrutaMensal)}</strong></span>
          <span>Em 48m: <strong>${utils.formatCurrency(sc.caixaAcumulado48m)}</strong></span>
        </div>
      </div>
    `;
  }).join('');

  elements.occupancyTableBody.innerHTML = scenarios.map(sc => {
    const isPositive = sc.caixaDisponivelProjetado >= 0;
    return `
      <tr>
        <td>${sc.ocupacaoPct}% (${sc.semanasAlugadasMes.toFixed(2).replace('.', ',')} sem)</td>
        <td>${utils.formatCurrency(sc.receitaBrutaMensal)}</td>
        <td>${utils.formatCurrency(sc.caixaOperacionalAntesDivida)}</td>
        <td>${sc.parcelaFinanciamento > 0 ? formatSignedNegativeBrl(sc.parcelaFinanciamento) : 'R$ 0,00'}</td>
        <td>${utils.formatCurrency(sc.caixaAposServicoDivida)}</td>
        <td>${formatSignedNegativeBrl(sc.reservasRetidasMes)}</td>
        <td class="${isPositive ? 'val-pos' : 'val-neg'}">${utils.formatCurrency(sc.caixaDisponivelProjetado)}</td>
        <td>${sc.dscr !== null ? `${sc.dscr.toFixed(2).replace('.', ',')}x` : 'N/A'}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Chart 3 (12/24/36/48m Accumulated Cash vs Reserves) & Chart 4 (Patrimony & Depreciation strictly over FIPE)
 */
function renderHorizonAndPatrimonyCharts(results) {
  if (!elements.horizonCashBars || !elements.fipePatrimonyBars || !elements.patrimonyProtectionSummary) return;

  const horizons = results.horizontes || [];
  const maxTotalCash = Math.max(
    ...horizons.map(h => Math.max(0, h.caixaDistribuivelAcumulado) + h.reservasAcumuladas),
    1
  );

  elements.horizonCashBars.innerHTML = horizons.map(h => {
    const isSelected = h.meses === results.inputs.prazoAnaliseMeses;
    const cashPos = Math.max(0, h.caixaDistribuivelAcumulado);
    const cashPct = Math.min(100, (cashPos / maxTotalCash) * 100);
    const resPct = Math.min(100 - cashPct, (h.reservasAcumuladas / maxTotalCash) * 100);

    return `
      <div class="horizon-row-item" style="${isSelected ? 'border-color: rgba(34, 211, 238, 0.55); background: rgba(34, 211, 238, 0.05);' : ''}">
        <div class="horizon-row-top">
          <strong>${h.meses} Meses (${h.anos} ${h.anos === 1 ? 'ano' : 'anos'})</strong>
          <span>Caixa Livre: <strong style="color: #10B981;">${utils.formatCurrency(h.caixaDistribuivelAcumulado)}</strong> + Reserva: <strong style="color: #22D3EE;">${utils.formatCurrency(h.reservasAcumuladas)}</strong></span>
        </div>
        <div class="horizon-dual-bar">
          <div class="horizon-bar-cash" style="width: ${cashPct.toFixed(1)}%;" title="Caixa Distribuível Acumulado"></div>
          <div class="horizon-bar-reserve" style="width: ${resPct.toFixed(1)}%;" title="Reservas Acumuladas"></div>
        </div>
        <div class="horizon-row-top" style="font-size: 11px; color: var(--text-muted);">
          <span>FIPE Projetada (${h.meses}m): ${utils.formatCurrency(h.valorFipeProjetado)}</span>
          <span>Patrimônio + Caixa + Reserva: <strong style="color: var(--text-main);">${utils.formatCurrency(h.riquezaTotalGerada)}</strong></span>
        </div>
      </div>
    `;
  }).join('');

  // Chart 4: Vehicle Patrimony & Depreciation over FIPE for the selected horizon
  const hSel = results.horizonteSelecionado || horizons[horizons.length - 1];
  if (elements.patrimonyChart4Title && hSel) {
    elements.patrimonyChart4Title.textContent =
      `Gráfico 4 — Patrimônio no Veículo & Depreciação sobre a FIPE (${hSel.meses}m)`;
  }

  if (hSel) {
    const maxFipeRef = Math.max(results.inputs.valorFipe, results.inputs.valorPago, hSel.valorFipeProjetado, 1);
    const fipe0Pct = (results.inputs.valorFipe / maxFipeRef) * 100;
    const pagoPct = (results.inputs.valorPago / maxFipeRef) * 100;
    const fipeProjPct = (hSel.valorFipeProjetado / maxFipeRef) * 100;
    const vendaLiqPct = (hSel.valorVendaProjetado / maxFipeRef) * 100;

    elements.fipePatrimonyBars.innerHTML = `
      <div class="fipe-bar-row">
        <div class="fipe-bar-label-line">
          <span>1. Valor Tabela FIPE na Compra (Base 100% da Depreciação)</span>
          <strong>${utils.formatCurrency(results.inputs.valorFipe)}</strong>
        </div>
        <div class="fipe-bar-track">
          <div class="fipe-bar-fill fipe-initial" style="width: ${fipe0Pct.toFixed(1)}%;"></div>
        </div>
      </div>

      <div class="fipe-bar-row">
        <div class="fipe-bar-label-line">
          <span>2. Valor Efetivamente Pago na Compra (${utils.formatPercent(results.descontoSobreFipe)} abaixo da FIPE)</span>
          <strong style="color: #10B981;">${utils.formatCurrency(results.inputs.valorPago)}</strong>
        </div>
        <div class="fipe-bar-track">
          <div class="fipe-bar-fill paid-price" style="width: ${pagoPct.toFixed(1)}%;"></div>
        </div>
      </div>

      <div class="fipe-bar-row">
        <div class="fipe-bar-label-line">
          <span>3. FIPE Projetada após ${hSel.meses}m (Depreciação sobre a FIPE: -${utils.formatCurrency(hSel.depreciacaoAcumuladaFipe)})</span>
          <strong style="color: #F59E0B;">${utils.formatCurrency(hSel.valorFipeProjetado)}</strong>
        </div>
        <div class="fipe-bar-track">
          <div class="fipe-bar-fill fipe-future" style="width: ${fipeProjPct.toFixed(1)}%;"></div>
        </div>
      </div>

      <div class="fipe-bar-row">
        <div class="fipe-bar-label-line">
          <span>4. Valor Estimado de Revenda (${results.inputs.desagioVendaFipe > 0 ? `Deságio de ${utils.formatPercent(results.inputs.desagioVendaFipe)} vs. FIPE futura` : '100% da FIPE futura'})</span>
          <strong style="color: #22D3EE;">${utils.formatCurrency(hSel.valorVendaProjetado)}</strong>
        </div>
        <div class="fipe-bar-track">
          <div class="fipe-bar-fill net-equity" style="width: ${vendaLiqPct.toFixed(1)}%;"></div>
        </div>
      </div>
    `;

    const diffVendaVsPago = hSel.ganhoOuPerdaSobreValorPago;
    const isProtected = diffVendaVsPago >= 0;
    elements.patrimonyProtectionSummary.innerHTML = `
      <strong>Análise de Proteção Patrimonial (Depreciação calculada sobre a FIPE):</strong><br>
      Em <strong>${hSel.meses} meses</strong>, a FIPE do veículo passa de <strong>${utils.formatCurrency(results.inputs.valorFipe)}</strong> para <strong>${utils.formatCurrency(hSel.valorFipeProjetado)}</strong> (depreciação acumulada de <strong>${utils.formatCurrency(hSel.depreciacaoAcumuladaFipe)}</strong> sobre a FIPE).
      ${isProtected
        ? `Como você comprou com desconto por <strong>${utils.formatCurrency(results.inputs.valorPago)}</strong> (${utils.formatCurrency(results.margemInicialVsFipe)} abaixo da FIPE), a margem de entrada <strong>absorveu 100% da depreciação da FIPE</strong> e o valor estimado de revenda (<strong>${utils.formatCurrency(hSel.valorVendaProjetado)}</strong>) ainda fica <strong>+${utils.formatCurrency(diffVendaVsPago)} acima do que você pagou</strong>!`
        : `A margem de compra abaixo da FIPE (<strong>${utils.formatCurrency(results.margemInicialVsFipe)}</strong>) amorteceu grande parte da queda da FIPE, resultando em uma diferença líquida na revenda de <strong>${utils.formatCurrency(diffVendaVsPago)}</strong> frente ao preço pago (amplamente superada pelo caixa acumulado de <strong>${utils.formatCurrency(hSel.caixaDistribuivelAcumulado)}</strong>).`
      }
      ${hSel.saldoDevedorEstimado > 0
        ? `<br><em>Nota sobre financiamento:</em> Em ${hSel.meses} meses restam ${Math.max(0, results.inputs.qtdParcelas - hSel.meses)} parcelas (saldo nominal aproximado de ${utils.formatCurrency(hSel.saldoDevedorEstimado)}; patrimônio líquido no ativo de <strong>${utils.formatCurrency(hSel.patrimonioLiquidoVeiculo)}</strong>).`
        : ''}
    `;
  }
}

/**
 * Calculates and updates widths of the visual CSS revenue distribution bar
 */
function renderDistributionChart(results) {
  const rev = results.receitaBrutaMensal;
  if (rev <= 0) {
    elements.sliceProfit.style.width = '0%';
    elements.sliceTaxes.style.width = '0%';
    elements.sliceOpex.style.width = '0%';
    elements.sliceProvisions.style.width = '100%';
    elements.sliceProvisions.style.background = 'var(--color-danger)';
    
    elements.legendProfitPct.textContent = '0,00%';
    elements.legendTaxesPct.textContent = '0,00%';
    elements.legendOpexPct.textContent = '0,00%';
    elements.legendProvisionsPct.textContent = '100,00%';
    return;
  }

  const profitPct = Math.max(0, results.caixaDisponivelProjetado / rev);
  const taxesPct = Math.max(0, results.impostosSimplesNacional / rev);
  const opexPct = Math.max(0, (results.custosOperacionaisRecorrentes + (results.parcelaFinanciamento || 0)) / rev);
  const provPct = Math.max(0, results.reservasRetidasMes / rev);

  const sumPct = profitPct + taxesPct + opexPct + provPct || 1;

  elements.sliceProfit.style.width = `${(profitPct / sumPct) * 100}%`;
  elements.sliceTaxes.style.width = `${(taxesPct / sumPct) * 100}%`;
  elements.sliceOpex.style.width = `${(opexPct / sumPct) * 100}%`;
  elements.sliceProvisions.style.width = `${(provPct / sumPct) * 100}%`;
  elements.sliceProvisions.style.background = 'var(--color-warning)';

  elements.legendProfitPct.textContent = utils.formatPercent(profitPct);
  elements.legendTaxesPct.textContent = utils.formatPercent(taxesPct);
  elements.legendOpexPct.textContent = utils.formatPercent(opexPct);
  elements.legendProvisionsPct.textContent = utils.formatPercent(provPct);
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', init);

/**
 * Helper to display a premium toast notification letting the user know
 * they received a welcome confirmation email, with a button to preview it!
 */
function showEmailToast(previewUrl) {
  const existing = document.getElementById('email-confirmation-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'email-confirmation-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: rgba(13, 20, 36, 0.95);
    border: 1px solid var(--accent-primary);
    border-radius: var(--radius-md);
    padding: 20px 24px;
    box-shadow: var(--card-shadow), 0 0 20px rgba(0, 242, 254, 0.15);
    z-index: 9999;
    max-width: 380px;
    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    color: #FFFFFF;
    font-family: var(--font-sans);
  `;

  toast.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="background: rgba(52, 211, 153, 0.1); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #34d399;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <strong style="font-family: var(--font-display); font-size: 15px; letter-spacing: 0.01em;">E-mail de Confirmação!</strong>
      </div>
      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0;">
        Um e-mail de boas-vindas foi enviado para seu endereço. Clique abaixo para pré-visualizar a caixa de entrada!
      </p>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
        <a href="${previewUrl}" target="_blank" style="background: var(--accent-gradient); color: var(--bg-primary); text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 50px; box-shadow: 0 4px 10px rgba(0, 242, 254, 0.25);">Ver E-mail &rarr;</a>
        <button onclick="document.getElementById('email-confirmation-toast').remove()" style="background: none; border: none; color: var(--text-dark); font-size: 12px; font-weight: 600; cursor: pointer; padding: 4px;">Fechar</button>
      </div>
    </div>
  `;

  if (!document.getElementById('toast-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%) translateY(0); opacity: 0; }
        to { transform: translateX(0) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
}

/**
 * Transforms a standard <select> element into a premium searchable dropdown (Combobox)
 * with native keyboard navigation, real-time filtering, and reactive MutationObserver
 * syncing.
 */
function normalizeSearchText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function makeSelectSearchable(selectId, placeholderText) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // 1. Create wrapper and custom DOM elements
  const container = document.createElement('div');
  container.className = 'custom-select-container';
  
  // Insert container before select and move select inside
  select.parentNode.insertBefore(container, select);
  container.appendChild(select);

  // Create search input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'custom-select-search';
  input.placeholder = placeholderText;
  input.autocomplete = 'off';
  input.disabled = select.disabled;
  container.appendChild(input);

  // Create dropdown arrow icon (SVG)
  const arrow = document.createElement('div');
  arrow.className = 'arrow-icon';
  arrow.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;
  container.appendChild(arrow);

  // Create dropdown overlay list
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-select-dropdown';
  dropdown.style.display = 'none';
  container.appendChild(dropdown);

  let highlightedIndex = -1;
  let items = [];
  let isUserTyping = false;

  // 2. Helper to populate and update custom dropdown list items from select options
  function updateDropdownItems() {
    dropdown.innerHTML = '';
    const options = Array.from(select.options);
    
    // Skip the first placeholder option if it has empty value
    const validOptions = options.filter(opt => opt.value !== "");

    if (validOptions.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'custom-select-no-results';
      noResults.textContent = select.disabled ? 'Aguardando seleção anterior...' : 'Nenhuma opção disponível';
      dropdown.appendChild(noResults);
      items = [];
      return;
    }

    items = validOptions.map(opt => {
      const item = document.createElement('div');
      item.className = 'custom-select-item';
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;

      if (select.value === opt.value) {
        item.classList.add('selected');
        input.value = opt.textContent;
      }

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent blur before selection completes
        isUserTyping = false;
        selectOption(opt.value, opt.textContent);
      });

      dropdown.appendChild(item);
      return item;
    });

    // If select doesn't have a value (e.g. placeholder), clear input text
    if (!select.value) {
      input.value = '';
    }
  }

  // 3. Selection handler
  function selectOption(value, text) {
    isUserTyping = false;
    select.value = value;
    input.value = text;
    
    // Highlight active in dropdown
    items.forEach(item => {
      if (item.dataset.value === value) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    closeDropdown(false);

    // Fire the native change event so app.js picks it up!
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 4. Dropdown visibility controls
  function openDropdown(selectText = false) {
    if (select.disabled) return;
    
    // Close other custom dropdowns
    document.querySelectorAll('.custom-select-container').forEach(c => {
      if (c !== container) c.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-dropdown').forEach(d => {
      if (d !== dropdown) d.style.display = 'none';
    });

    const wasClosed = dropdown.style.display === 'none';
    container.classList.add('open');
    dropdown.style.display = 'block';

    if (wasClosed && !isUserTyping) {
      // Show all options when first opening the dropdown
      items.forEach(item => {
        item.style.display = 'flex';
      });
      const existingNoResults = dropdown.querySelector('.custom-select-no-results');
      if (existingNoResults) existingNoResults.remove();

      // Highlight currently selected item
      highlightedIndex = items.findIndex(item => item.classList.contains('selected'));
      updateHighlight();

      if (highlightedIndex >= 0) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    if (selectText && input.value && !isUserTyping) {
      setTimeout(() => input.select(), 0);
    }
  }

  function closeDropdown(commitTypedMatch = true) {
    if (commitTypedMatch && isUserTyping) {
      const currentHighlighted = items[highlightedIndex];
      if (currentHighlighted && currentHighlighted.style.display !== 'none') {
        isUserTyping = false;
        selectOption(currentHighlighted.dataset.value, currentHighlighted.textContent);
        return;
      }
    }

    isUserTyping = false;
    container.classList.remove('open');
    dropdown.style.display = 'none';
    highlightedIndex = -1;
    
    // Sync input value back to select's text if empty/partially edited
    const selectedOpt = select.options[select.selectedIndex];
    if (selectedOpt && selectedOpt.value !== "") {
      input.value = selectedOpt.textContent;
    } else {
      input.value = '';
    }
  }

  function updateHighlight() {
    items.forEach((item, idx) => {
      if (idx === highlightedIndex) {
        item.classList.add('highlighted');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('highlighted');
      }
    });
  }

  // 5. Local filtering logic (accent-insensitive + smart ranking)
  function filterItems() {
    const query = normalizeSearchText(input.value);
    let visibleCount = 0;
    let bestIndex = -1;
    let bestScore = -1;

    items.forEach((item, idx) => {
      if (!query) {
        item.style.display = 'flex';
        visibleCount++;
        if (item.classList.contains('selected') && bestIndex === -1) {
          bestIndex = idx;
        }
        return;
      }

      const rawText = item.textContent || '';
      const primaryPart = rawText.split('—')[0] || rawText;
      const normPrimary = normalizeSearchText(primaryPart);
      const normFull = normalizeSearchText(rawText);
      const normVal = normalizeSearchText(item.dataset.value || '');
      // Extract state/item name before parentheses if present, e.g. "Sao Paulo (SP)" -> "sao paulo"
      const normNameOnly = normalizeSearchText(primaryPart.split('(')[0] || primaryPart);

      let score = 0;
      if (normVal === query || normNameOnly === query || normPrimary === query) {
        score = 100; // Exact code or name match (e.g. "sp", "sao paulo", "parana")
      } else if (normNameOnly.startsWith(query) || normPrimary.startsWith(query)) {
        score = 80; // Starts with query (e.g. "sao", "par")
      } else if (normPrimary.split(/[\s()-]+/).some(word => word.startsWith(query))) {
        score = 60; // Word starts with query (e.g. "paulo", "sul", "grosso")
      } else if (query.length > 2 && normPrimary.includes(query)) {
        score = 40; // Substring match in primary label (only for 3+ chars so "sp" won't match "E[sp]irito Santo")
      } else if (query.length > 2 && normFull.includes(query)) {
        score = 20; // Substring match in secondary info
      }

      if (score > 0) {
        item.style.display = 'flex';
        visibleCount++;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
      } else {
        item.style.display = 'none';
      }
    });

    highlightedIndex = bestIndex;
    updateHighlight();

    // Handle no results dynamically during search
    const existingNoResults = dropdown.querySelector('.custom-select-no-results');
    if (existingNoResults) existingNoResults.remove();

    if (visibleCount === 0 && items.length > 0) {
      const noResults = document.createElement('div');
      noResults.className = 'custom-select-no-results';
      noResults.textContent = 'Nenhum resultado encontrado';
      dropdown.appendChild(noResults);
    }
  }

  // 6. Register Event Listeners
  input.addEventListener('focus', () => openDropdown(true));
  input.addEventListener('click', () => openDropdown(true));
  
  input.addEventListener('input', () => {
    isUserTyping = true;
    if (dropdown.style.display === 'none') {
      openDropdown(false);
    }
    filterItems();
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        openDropdown(false);
        e.preventDefault();
      }
      return;
    }

    const visibleItems = items.filter(item => item.style.display !== 'none');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      
      const currentVisibleIdx = visibleItems.findIndex(item => item.classList.contains('highlighted'));
      let nextVisibleIdx = currentVisibleIdx + 1;
      if (nextVisibleIdx >= visibleItems.length) nextVisibleIdx = 0; // loop
      
      const targetItem = visibleItems[nextVisibleIdx];
      highlightedIndex = items.indexOf(targetItem);
      
      updateHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleItems.length === 0) return;

      const currentVisibleIdx = visibleItems.findIndex(item => item.classList.contains('highlighted'));
      let prevVisibleIdx = currentVisibleIdx - 1;
      if (prevVisibleIdx < 0) prevVisibleIdx = visibleItems.length - 1; // loop

      const targetItem = visibleItems[prevVisibleIdx];
      highlightedIndex = items.indexOf(targetItem);

      updateHighlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentHighlighted = items[highlightedIndex];
      if (currentHighlighted && currentHighlighted.style.display !== 'none') {
        selectOption(currentHighlighted.dataset.value, currentHighlighted.textContent);
      } else if (visibleItems.length > 0) {
        selectOption(visibleItems[0].dataset.value, visibleItems[0].textContent);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isUserTyping = false;
      closeDropdown(false);
    } else if (e.key === 'Tab') {
      closeDropdown(true);
    }
  });

  // Blur / outside click sync
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      closeDropdown(true);
    }
  });

  // 7. MutationObserver to react to FIPE cascade updates from app.js
  const observer = new MutationObserver(() => {
    input.disabled = select.disabled;
    updateDropdownItems();
  });
  
  observer.observe(select, { childList: true, attributes: true, attributeFilter: ['disabled'] });

  // 8. Form reset sync
  const form = select.form;
  if (form) {
    form.addEventListener('reset', () => {
      setTimeout(() => {
        isUserTyping = false;
        input.value = '';
        input.disabled = select.disabled;
        updateDropdownItems();
      }, 0);
    });
  }

  // 9. Initial sync load
  updateDropdownItems();
}

export default state;
