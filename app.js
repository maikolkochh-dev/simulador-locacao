/**
 * Main Application Controller for LocaSim Car Rental Simulator.
 * Manages state, wizard steps, input formatting masks, and visual outputs.
 */

import { fipeService } from './fipeService.js?v=20261019g';
import { simulationService } from './simulationService.js?v=20261019g';

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
    historicoDepreciacaoTaxaAnual: 0,
    historicoMeses: 0,
    isManual: false,
    isLeveraged: false,
    valorEntrada: 0,
    valorFinanciado: 0,
    qtdParcelas: 0,
    valorParcela: 0,
    isFinanciadoManual: false,
    photoUrl: '',
    isCustomPhoto: false,
    photoLicense: 'Imagem automática do modelo'
  },
  rental: {
    valorCaucao: 0,
    isCaucaoManual: false,
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
    deprecMultiplier: 'rate-fipe',
    deprecFipeAnnualRate: 0.05,
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
    prazoAnaliseMeses: 36,
    customSalePrice: null,
    customPayoffAmount: null
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

  // Step 3: Income (Caução 2.7% FIPE + Valor Cobrado na Semana)
  rentalForm: document.getElementById('rental-form'),
  valorCaucaoInput: document.getElementById('rental-valor-caucao'),
  caucaoFipeBadge: document.getElementById('caucao-fipe-badge'),
  caucaoFipeHint: document.getElementById('caucao-fipe-hint'),
  valorSemanalInput: document.getElementById('rental-valor-semanal'),
  semanasMesInput: document.getElementById('rental-semanas-mes'),

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
  btnDeprecHistorico: document.getElementById('btn-deprec-historico'),
  btnDeprec5pct: document.getElementById('btn-deprec-5pct'),
  btnDeprec10pct: document.getElementById('btn-deprec-10pct'),
  btnDeprecManual: document.getElementById('btn-deprec-manual'),
  reserveFundToggle: document.getElementById('reserve-fund-toggle'),
  reserveFundInputGroup: document.getElementById('reserve-fund-input-group'),
  costFundoReserva: document.getElementById('cost-fundo-reserva'),

  // Step 5: Resumo da Operação & Régua 12 a 60 Meses
  reportGeneratedDate: document.getElementById('report-generated-date'),
  step5PrazoBtns: document.getElementById('step5-prazo-btns'),
  periodRulerActiveLabel: document.getElementById('period-ruler-active-label'),
  reportFipeMarginBadge: document.getElementById('report-fipe-margin-badge'),
  vehiclePhotoImg: document.getElementById('vehicle-photo-img'),
  vehiclePhotoFallback: document.getElementById('vehicle-photo-fallback'),
  vehicleSilhouetteCaption: document.getElementById('vehicle-silhouette-caption'),
  vehiclePhotoUpload: document.getElementById('vehicle-photo-upload'),
  btnVehiclePhotoUrl: document.getElementById('btn-vehicle-photo-url'),
  btnVehiclePhotoRemove: document.getElementById('btn-vehicle-photo-remove'),

  resultVehicleName: document.getElementById('result-vehicle-name'),
  resultFipeReference: document.getElementById('result-fipe-reference'),
  execKpiFipe: document.getElementById('exec-kpi-fipe'),
  execKpiPago: document.getElementById('exec-kpi-pago'),
  execKpiPagoSub: document.getElementById('exec-kpi-pago-sub'),
  kpiFipeDesconto: document.getElementById('kpi-fipe-desconto'),
  kpiFipeDetalhe: document.getElementById('kpi-fipe-detalhe'),
  execKpiCaixaDistribuivel: document.getElementById('exec-kpi-caixa-distribuivel'),
  execKpiCaixaDistSub: document.getElementById('exec-kpi-caixa-dist-sub'),

  // Period Summary Cards (12, 24, 36, 48, 60m)
  periodSummaryTitle: document.getElementById('period-summary-title'),
  periodFinancingStatusBadge: document.getElementById('period-financing-status-badge'),
  periodLucroOperacional: document.getElementById('period-lucro-operacional'),
  periodLucroOperacionalSub: document.getElementById('period-lucro-operacional-sub'),
  periodDepreciacaoFipe: document.getElementById('period-depreciacao-fipe'),
  periodDepreciacaoFipeSub: document.getElementById('period-depreciacao-fipe-sub'),
  customSalePriceInput: document.getElementById('custom-sale-price'),
  btnResetSalePrice: document.getElementById('btn-reset-sale-price'),
  periodVendaSub: document.getElementById('period-venda-sub'),
  periodLucroMaisVenda: document.getElementById('period-lucro-mais-venda'),
  periodLucroMaisVendaSub: document.getElementById('period-lucro-mais-venda-sub'),

  // Conditional Financing Payoff Box
  financingPayoffPanel: document.getElementById('financing-payoff-panel'),
  financingPayoffTitle: document.getElementById('financing-payoff-title'),
  financingPayoffSubtitle: document.getElementById('financing-payoff-subtitle'),
  periodSomaParcelasFaltam: document.getElementById('period-soma-parcelas-faltam'),
  periodParcelasFaltamDetalhe: document.getElementById('period-parcelas-faltam-detalhe'),
  customPayoffAmountInput: document.getElementById('custom-payoff-amount'),
  btnResetPayoffAmount: document.getElementById('btn-reset-payoff-amount'),
  periodResultadoAposQuitacao: document.getElementById('period-resultado-apos-quitacao'),
  periodResultadoAposQuitacaoSub: document.getElementById('period-resultado-apos-quitacao-sub'),

  // Monthly Out-of-Pocket Statement
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
  dreSuporte: document.getElementById('dre-suporte'),
  dreRowContabilidade: document.getElementById('dre-row-contabilidade'),
  dreContabilidade: document.getElementById('dre-contabilidade'),
  dreIpva: document.getElementById('dre-ipva'),
  dreProvisoesTotal: document.getElementById('dre-provisoes-total'),
  dreDepreciacao: document.getElementById('dre-depreciacao'),
  dreLabelDepreciacaoFipe: document.getElementById('dre-label-depreciacao-fipe'),
  dreFinanciamentoRow: document.getElementById('dre-financiamento-row'),
  dreFinanciamentoLabel: document.getElementById('dre-financiamento-label'),
  dreFinanciamentoVal: document.getElementById('dre-financiamento-val'),
  dreSaidasTotal: document.getElementById('dre-saidas-total'),
  dreLucroLiquido: document.getElementById('dre-lucro-liquido'),

  // KPI Markers
  metricCardRoi: document.getElementById('metric-card-roi'),
  kpiRoiLabel: document.getElementById('kpi-roi-label'),
  kpiRoiMensal: document.getElementById('kpi-roi-mensal'),
  kpiRoiAnual: document.getElementById('kpi-roi-anual'),
  kpiPayback: document.getElementById('kpi-payback'),
  kpiPaybackSubtext: document.getElementById('kpi-payback-subtext'),
  kpiRoiPeriodo: document.getElementById('kpi-roi-periodo'),
  kpiRoiPeriodoSub: document.getElementById('kpi-roi-periodo-sub'),
  kpiMargem: document.getElementById('kpi-margem'),
  kpiBreakevenSub: document.getElementById('kpi-breakeven-sub'),

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
    if (!input) return;
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
    if (!input) return;
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
  if (elements.customSalePriceInput) utils.setupCurrencyMask(elements.customSalePriceInput);
  if (elements.customPayoffAmountInput) utils.setupCurrencyMask(elements.customPayoffAmountInput);

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

  // Initialize Apple-style translucent tooltips (triggered only after > 1s hover on titles)
  initAppleDelayedTooltips();

  // Initialize Global Theme (Light & Dark)
  initGlobalTheme();

  // Load the Landing Page at first loading
  showLandingPage();
}

function initGlobalTheme() {
  const savedTheme = localStorage.getItem('locador_theme') || 'dark';
  applyGlobalTheme(savedTheme);

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('theme-light');
      applyGlobalTheme(isLight ? 'dark' : 'light');
    });
  }
}

function applyGlobalTheme(theme) {
  const text = document.getElementById('theme-toggle-text');
  const sun = document.getElementById('theme-icon-sun');
  const moon = document.getElementById('theme-icon-moon');

  if (theme === 'light') {
    document.body.classList.add('theme-light');
    localStorage.setItem('locador_theme', 'light');
    if (text) text.textContent = 'Modo Escuro';
    if (sun) sun.style.display = 'none';
    if (moon) moon.style.display = 'block';
  } else {
    document.body.classList.remove('theme-light');
    localStorage.setItem('locador_theme', 'dark');
    if (text) text.textContent = 'Modo Claro';
    if (sun) sun.style.display = 'block';
    if (moon) moon.style.display = 'none';
  }
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

      state.costs.manualIpvaAnual = ipvaAnualEfetivo;
      if (elements.ipvaManualAnual) elements.ipvaManualAnual.value = utils.formatCurrency(ipvaAnualEfetivo);
      if (elements.ipvaManualMensal) elements.ipvaManualMensal.value = utils.formatCurrency(ipvaMensalEfetivo);
    }

    const totalAnual = licenciamentoAnual + ipvaAnualEfetivo;
    const totalMensal = licenciamentoMensal + ipvaMensalEfetivo;

    if (!options.skipCostIpvaInputSync) {
      elements.costIpva.value = utils.formatCurrency(totalMensal);
    }
    state.costs.ipvaLicenciamento = totalMensal;

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

// ==========================================================================
// BUSCA AUTOMÁTICA DA IMAGEM DO VEÍCULO (WIKIPEDIA API + BANCO CURADO)
// ==========================================================================
const CURATED_CAR_PHOTOS = [
  // Submodelos específicos primeiro (para não colidir com modelos-base)
  { match: /\bdolphin\s*mini\b|\bseagull\b/i, wikiQuery: 'BYD Seagull', catalog: { title: 'BYD_Seagull', lang: 'en', displayName: 'BYD Dolphin Mini' } },
  { match: /\bonix\s*plus\b/i, wikiQuery: 'Chevrolet Onix Plus', catalog: { title: 'Chevrolet_Onix_Plus', lang: 'pt', displayName: 'Chevrolet Onix Plus' } },
  { match: /\bpolo\s*track\b/i, wikiQuery: 'Volkswagen Polo Track', catalog: { title: 'Volkswagen_Polo', lang: 'en', displayName: 'Volkswagen Polo Track' } },
  { match: /\bhb20s\b/i, wikiQuery: 'Hyundai HB20S', catalog: { title: 'Hyundai_HB20', lang: 'pt', displayName: 'Hyundai HB20S' } },
  { match: /\bcorolla\s*cross\b/i, wikiQuery: 'Toyota Corolla Cross', catalog: { title: 'Toyota_Corolla_Cross', lang: 'en', displayName: 'Toyota Corolla Cross' } },
  { match: /\bc4\s*cactus\b/i, wikiQuery: 'Citroën C4 Cactus', catalog: { title: 'Citroën_C4_Cactus', lang: 'en', displayName: 'Citroën C4 Cactus' } },
  { match: /\bgrand\s*siena\b/i, wikiQuery: 'Fiat Grand Siena', catalog: { title: 'Fiat_Siena', lang: 'en', displayName: 'Fiat Grand Siena' } },
  { match: /\byuan\s*plus\b|\batto\s*3\b/i, wikiQuery: 'BYD Atto 3', catalog: { title: 'BYD_Atto_3', lang: 'en', displayName: 'BYD Yuan Plus' } },
  { match: /\bsong\s*plus\b/i, wikiQuery: 'BYD Song Plus', catalog: { title: 'BYD_Song_Plus', lang: 'en', displayName: 'BYD Song Plus' } },
  { match: /\bseal\b/i, wikiQuery: 'BYD Seal', catalog: { title: 'BYD_Seal', lang: 'en', displayName: 'BYD Seal' } },

  // Modelos de entrada / hatches e sedans compactos mais alugados
  { match: /\bmobi\b/i, wikiQuery: 'Fiat Mobi', catalog: { title: 'Fiat_Mobi', lang: 'en', displayName: 'Fiat Mobi' } },
  { match: /\bkwid\b/i, wikiQuery: 'Renault Kwid', catalog: { title: 'Renault_Kwid', lang: 'en', displayName: 'Renault Kwid' } },
  { match: /\bonix\b/i, wikiQuery: 'Chevrolet Onix', catalog: { title: 'Chevrolet_Onix', lang: 'en', displayName: 'Chevrolet Onix' } },
  { match: /\bprisma\b/i, wikiQuery: 'Chevrolet Prisma', catalog: { title: 'Chevrolet_Prisma', lang: 'en', displayName: 'Chevrolet Prisma' } },
  { match: /\bhb20\b/i, wikiQuery: 'Hyundai HB20', catalog: { title: 'Hyundai_HB20', lang: 'pt', displayName: 'Hyundai HB20' } },
  { match: /\bargo\b/i, wikiQuery: 'Fiat Argo', catalog: { title: 'Fiat_Argo', lang: 'en', displayName: 'Fiat Argo' } },
  { match: /\bcronos\b/i, wikiQuery: 'Fiat Cronos', catalog: { title: 'Fiat_Cronos', lang: 'pt', displayName: 'Fiat Cronos' } },
  { match: /\bstrada\b/i, wikiQuery: 'Fiat Strada', catalog: { title: 'Fiat_Strada', lang: 'en', displayName: 'Fiat Strada' } },
  { match: /\buno\b/i, wikiQuery: 'Fiat Uno', catalog: { title: 'Fiat_Uno', lang: 'en', displayName: 'Fiat Uno' } },
  { match: /\bpulse\b/i, wikiQuery: 'Fiat Pulse', catalog: { title: 'Fiat_Pulse', lang: 'en', displayName: 'Fiat Pulse' } },
  { match: /\bfastback\b/i, wikiQuery: 'Fiat Fastback', catalog: { title: 'Fiat_Fastback', lang: 'en', displayName: 'Fiat Fastback' } },
  { match: /\btoro\b/i, wikiQuery: 'Fiat Toro', catalog: { title: 'Fiat_Toro', lang: 'en', displayName: 'Fiat Toro' } },
  { match: /\bsiena\b/i, wikiQuery: 'Fiat Siena', catalog: { title: 'Fiat_Siena', lang: 'en', displayName: 'Fiat Siena' } },
  { match: /\bpalio\b/i, wikiQuery: 'Fiat Palio', catalog: { title: 'Fiat_Palio', lang: 'en', displayName: 'Fiat Palio' } },
  { match: /\bgol\b/i, wikiQuery: 'Volkswagen Gol', catalog: { title: 'Volkswagen_Gol', lang: 'en', displayName: 'Volkswagen Gol' } },
  { match: /\bvoyage\b/i, wikiQuery: 'Volkswagen Voyage', catalog: { title: 'Volkswagen_Voyage', lang: 'pt', displayName: 'Volkswagen Voyage' } },
  { match: /\bpolo\b/i, wikiQuery: 'Volkswagen Polo', catalog: { title: 'Volkswagen_Polo', lang: 'en', displayName: 'Volkswagen Polo' } },
  { match: /\bvirtus\b/i, wikiQuery: 'Volkswagen Virtus', catalog: { title: 'Volkswagen_Virtus', lang: 'en', displayName: 'Volkswagen Virtus' } },
  { match: /\bt-?cross\b/i, wikiQuery: 'Volkswagen T-Cross', catalog: { title: 'Volkswagen_T-Cross', lang: 'en', displayName: 'Volkswagen T-Cross' } },
  { match: /\bnivus\b/i, wikiQuery: 'Volkswagen Taigo', catalog: { title: 'Volkswagen_Taigo', lang: 'en', displayName: 'Volkswagen Nivus' } },
  { match: /\bsaveiro\b/i, wikiQuery: 'Volkswagen Saveiro', catalog: { title: 'Volkswagen_Saveiro', lang: 'pt', displayName: 'Volkswagen Saveiro' } },
  { match: /\bup!?\b/i, wikiQuery: 'Volkswagen Up', catalog: { title: 'Volkswagen_Up', lang: 'en', displayName: 'Volkswagen Up' } },
  { match: /\bfox\b/i, wikiQuery: 'Volkswagen Fox', catalog: { title: 'Volkswagen_Fox', lang: 'en', displayName: 'Volkswagen Fox' } },
  { match: /\bsandero\b/i, wikiQuery: 'Renault Sandero', catalog: { title: 'Renault_Sandero', lang: 'en', displayName: 'Renault Sandero' } },
  { match: /\blogan\b/i, wikiQuery: 'Renault Logan', catalog: { title: 'Renault_Logan', lang: 'en', displayName: 'Renault Logan' } },
  { match: /\bduster\b/i, wikiQuery: 'Renault Duster', catalog: { title: 'Renault_Duster', lang: 'en', displayName: 'Renault Duster' } },
  { match: /\bkardian\b/i, wikiQuery: 'Renault Kardian', catalog: { title: 'Renault_Kardian', lang: 'en', displayName: 'Renault Kardian' } },
  { match: /\b208\b/i, wikiQuery: 'Peugeot 208', catalog: { title: 'Peugeot_208', lang: 'en', displayName: 'Peugeot 208' } },
  { match: /\b2008\b/i, wikiQuery: 'Peugeot 2008', catalog: { title: 'Peugeot_2008', lang: 'en', displayName: 'Peugeot 2008' } },
  { match: /\bc3\b/i, wikiQuery: 'Citroën C3', catalog: { title: 'Citroën_C3', lang: 'en', displayName: 'Citroën C3' } },
  { match: /\bka\b/i, wikiQuery: 'Ford Ka', catalog: { title: 'Ford_Ka', lang: 'en', displayName: 'Ford Ka' } },
  { match: /\bfiesta\b/i, wikiQuery: 'Ford Fiesta', catalog: { title: 'Ford_Fiesta', lang: 'en', displayName: 'Ford Fiesta' } },
  { match: /\becosport\b/i, wikiQuery: 'Ford EcoSport', catalog: { title: 'Ford_EcoSport', lang: 'en', displayName: 'Ford EcoSport' } },
  { match: /\betios\b/i, wikiQuery: 'Toyota Etios', catalog: { title: 'Toyota_Etios', lang: 'en', displayName: 'Toyota Etios' } },
  { match: /\byaris\b/i, wikiQuery: 'Toyota Yaris', catalog: { title: 'Toyota_Yaris_(XP150)', lang: 'en', displayName: 'Toyota Yaris' } },
  { match: /\bcorolla\b/i, wikiQuery: 'Toyota Corolla', catalog: { title: 'Toyota_Corolla_(E210)', lang: 'en', displayName: 'Toyota Corolla' } },
  { match: /\bmarch\b/i, wikiQuery: 'Nissan Micra', catalog: { title: 'Nissan_Micra', lang: 'en', displayName: 'Nissan March' } },
  { match: /\bversa\b/i, wikiQuery: 'Nissan Versa', catalog: { title: 'Nissan_Versa', lang: 'en', displayName: 'Nissan Versa' } },
  { match: /\bkicks\b/i, wikiQuery: 'Nissan Kicks', catalog: { title: 'Nissan_Kicks', lang: 'en', displayName: 'Nissan Kicks' } },
  { match: /\bfit\b/i, wikiQuery: 'Honda Fit', catalog: { title: 'Honda_Fit', lang: 'en', displayName: 'Honda Fit' } },
  { match: /\bcity\b/i, wikiQuery: 'Honda City', catalog: { title: 'Honda_City', lang: 'en', displayName: 'Honda City' } },
  { match: /\bhr-?v\b/i, wikiQuery: 'Honda HR-V', catalog: { title: 'Honda_HR-V', lang: 'en', displayName: 'Honda HR-V' } },
  { match: /\brenegade\b/i, wikiQuery: 'Jeep Renegade', catalog: { title: 'Jeep_Renegade', lang: 'en', displayName: 'Jeep Renegade' } },
  { match: /\bcompass\b/i, wikiQuery: 'Jeep Compass', catalog: { title: 'Jeep_Compass', lang: 'en', displayName: 'Jeep Compass' } },
  { match: /\bcreta\b/i, wikiQuery: 'Hyundai Creta', catalog: { title: 'Hyundai_Creta', lang: 'en', displayName: 'Hyundai Creta' } },
  { match: /\bspin\b/i, wikiQuery: 'Chevrolet Spin', catalog: { title: 'Chevrolet_Spin', lang: 'pt', displayName: 'Chevrolet Spin' } },
  { match: /\btracker\b/i, wikiQuery: 'Chevrolet Tracker', catalog: { title: 'Chevrolet_Tracker', lang: 'pt', displayName: 'Chevrolet Tracker' } },
  { match: /\bcobalt\b/i, wikiQuery: 'Chevrolet Cobalt', catalog: { title: 'Chevrolet_Cobalt', lang: 'pt', displayName: 'Chevrolet Cobalt' } },
  { match: /\bmontana\b/i, wikiQuery: 'Chevrolet Montana', catalog: { title: 'Chevrolet_Montana', lang: 'pt', displayName: 'Chevrolet Montana' } },
  { match: /\bdolphin\b/i, wikiQuery: 'BYD Dolphin', catalog: { title: 'BYD_Dolphin', lang: 'en', displayName: 'BYD Dolphin' } }
];

/**
 * Searches Wikimedia Commons for multiple candidate exterior photos of the car model,
 * prioritizing white cars and rejecting red cars or interior/detail shots.
 */
async function queryCommonsCandidateImages(searchQuery, limit = 12) {
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=${limit}&gsrsearch=${encodeURIComponent(searchQuery)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const candidates = [];
    for (const page of Object.values(pages)) {
      const title = String(page?.title || '');
      const info = page?.imageinfo?.[0];
      const imgUrl = info?.thumburl || info?.url;
      if (!imgUrl) continue;

      const desc = String(info?.extmetadata?.ImageDescription?.value || '').replace(/<[^>]+>/g, '');
      const combinedText = `${title} ${desc}`.toLowerCase();

      // Reject non-photos, interiors, closeups, or explicitly red cars in metadata
      if (/\.(svg|gif|pdf|tif|tiff|webp)$/i.test(title)) continue;
      if (/\b(interior|cockpit|dashboard|steering|uconnect|engine|motor|logo|badge|emblem|bumper|lamp|headlight|taillight|wheel|rim|sketch|diagram|map)\b/i.test(combinedText)) continue;
      if (/\b(red|vermelho|vermelha|rojo|roja|rosso|rot|rouge|crimson)\b/i.test(combinedText)) continue;

      let metaPriority = 0;
      if (/\b(white|branco|branca|blanco|blanca|blanc|bianco|weiss|weiß)\b/i.test(combinedText)) {
        metaPriority += 100; // Prefer white first
      } else if (/\b(silver|prata|gray|grey|cinza|black|preto|preta|blue|azul)\b/i.test(combinedText)) {
        metaPriority += 50;
      }
      if (/\b(front|2021|2022|2023|2024|2025)\b/i.test(combinedText)) {
        metaPriority += 15;
      }

      candidates.push({ url: imgUrl, title, metaPriority, index: page.index || 99 });
    }

    return candidates.sort((a, b) => (b.metaPriority - a.metaPriority) || (a.index - b.index));
  } catch (e) {
    return [];
  }
}

async function queryWikipediaFallbackImages(searchQuery, lang = 'pt') {
  try {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail|original&pithumbsize=800&generator=search&gsrlimit=4&gsrsearch=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];
    const sortedPages = Object.values(pages).sort((a, b) => (a.index || 99) - (b.index || 99));
    const urls = [];
    for (const page of sortedPages) {
      const imgUrl = page?.thumbnail?.source || page?.original?.source;
      if (imgUrl && !/\.svg$/i.test(imgUrl) && !/logo|icon|flag|emblem/i.test(imgUrl)) {
        urls.push({ url: imgUrl, title: page.title || '', metaPriority: 0 });
      }
    }
    return urls;
  } catch (e) {
    return [];
  }
}

/**
 * Inspects the actual pixels of a candidate car image using an offscreen <canvas>.
 * - Detects if the car has red paint (`isRedCar`)
 * - Measures how much of the car body is white (`whiteScore`) or neutral silver/gray (`neutralScore`)
 * - Also provides `convertRedToWhiteDataUrl(img)` so if no non-red photo exists, red paint is converted to pearl white!
 */
function inspectCarImageColors(imgUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => resolve(null), 4500);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const sampleW = 140;
        const sampleH = 95;
        const canvas = document.createElement('canvas');
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, sampleW, sampleH);

        // Sample the center region where the vehicle body sits (x: 18%..82%, y: 24%..82%)
        const startX = Math.floor(sampleW * 0.18);
        const endX = Math.floor(sampleW * 0.82);
        const startY = Math.floor(sampleH * 0.24);
        const endY = Math.floor(sampleH * 0.82);

        const imgData = ctx.getImageData(startX, startY, endX - startX, endY - startY).data;
        let totalPixels = 0;
        let redPixels = 0;
        let whitePixels = 0;
        let neutralPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const chroma = max - min;

          totalPixels++;

          // Detect red / crimson / burgundy / orange-red paint
          if (r > 105 && chroma > 30 && r === max && (r - Math.max(g, b)) > 24 && g < 135) {
            redPixels++;
          } else if (r > 175 && g > 175 && b > 175 && chroma < 28) {
            // Bright white / pearl white car paint
            whitePixels++;
          } else if (chroma < 26 && max >= 35 && max <= 185) {
            // Silver / gray / black neutral paint
            neutralPixels++;
          }
        }

        const redRatio = totalPixels > 0 ? (redPixels / totalPixels) : 0;
        const whiteRatio = totalPixels > 0 ? (whitePixels / totalPixels) : 0;
        const neutralRatio = totalPixels > 0 ? (neutralPixels / totalPixels) : 0;

        resolve({
          url: imgUrl,
          imgElement: img,
          isRedCar: redRatio > 0.042, // Reject if > 4.2% of center area has red paint
          redRatio,
          whiteRatio,
          neutralRatio
        });
      } catch (e) {
        // If CORS prevents reading pixels, treat as unknown/low priority
        resolve({
          url: imgUrl,
          imgElement: img,
          isRedCar: false,
          redRatio: 0,
          whiteRatio: 0,
          neutralRatio: 0
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };

    img.src = imgUrl;
  });
}

/**
 * Fallback converter: if a rare car model only has red photos available,
 * converts all red paint pixels on the car into clean Pearl White / Silver!
 */
function convertRedCarToWhiteDataUrl(img) {
  try {
    const maxW = 760;
    const scale = img.naturalWidth > maxW ? (maxW / img.naturalWidth) : 1;
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;

      // Target red / reddish pixels and convert smoothly to pearl white / bright silver
      if (r > 75 && chroma > 20 && r === max && (r - Math.max(g, b)) > 16) {
        const redness = Math.min(1, (r - Math.max(g, b)) / 65);
        const pearlVal = Math.min(248, Math.round(r * 0.90 + 38));
        data[i] = Math.round(r * (1 - redness) + pearlVal * redness);
        data[i + 1] = Math.round(g * (1 - redness) + pearlVal * redness);
        data[i + 2] = Math.round(b * (1 - redness) + Math.min(255, pearlVal + 3) * redness);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch (e) {
    return null;
  }
}

async function fetchVehicleImageAutomatically(brandName, modelName) {
  if (state.vehicle.isCustomPhoto) return;

  const cleanBrand = String(brandName || '').replace(/[-_]/g, ' ').trim();
  const cleanModelFirstWord = String(modelName || '').trim().split(/\s+/)[0] || '';
  const fullLabel = `${cleanBrand} ${modelName || ''}`.trim();

  if (!fullLabel) return;

  let targetQuery = `${cleanBrand} ${cleanModelFirstWord}`.trim();
  let matchedItem = null;
  for (const item of CURATED_CAR_PHOTOS) {
    if (item.match.test(fullLabel)) {
      matchedItem = item;
      targetQuery = item.wikiQuery;
      break;
    }
  }

  // 1. TIER 1: Foto Oficial de Catálogo / Estúdio de Montadora (Lead Studio Press Shot)
  if (matchedItem && matchedItem.catalog) {
    try {
      const { title, lang = 'en', displayName } = matchedItem.catalog;
      const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=960&origin=*`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const pages = data?.query?.pages || {};
        const firstPage = Object.values(pages)[0];
        const catalogThumb = firstPage?.thumbnail?.source;
        if (catalogThumb) {
          const inspected = await inspectCarImageColors(catalogThumb);
          let finalCatalogUrl = catalogThumb;
          if (inspected && inspected.isRedCar) {
            const converted = convertRedCarToWhiteDataUrl(inspected.imgElement);
            if (converted) finalCatalogUrl = converted;
          }
          if (!state.vehicle.isCustomPhoto) {
            state.vehicle.photoUrl = finalCatalogUrl;
            state.vehicle.photoLicense = `Foto de Catálogo Oficial: ${displayName || targetQuery}`;
            syncVehiclePhotoUI();
            return; // Imagem oficial de estúdio aplicada com sucesso!
          }
        }
      }
    } catch (e) {
      console.warn('Fallback catálogo oficial -> buscando commons:', e);
    }
  }

  // 2. TIER 2: Busca por candidatos no Wikimedia Commons e Wikipedia Search
  const [whiteCandidates, modelCandidates, wikiPtCandidates] = await Promise.all([
    queryCommonsCandidateImages(`${targetQuery} white`, 6),
    queryCommonsCandidateImages(targetQuery, 12),
    queryWikipediaFallbackImages(targetQuery, 'pt')
  ]);

  // Deduplica URLs candidatas mantendo candidatas com tag branca no topo
  const seenUrls = new Set();
  const allCandidates = [];
  for (const cand of [...whiteCandidates, ...modelCandidates, ...wikiPtCandidates]) {
    if (cand && cand.url && !seenUrls.has(cand.url)) {
      seenUrls.add(cand.url);
      allCandidates.push(cand);
    }
  }

  if (allCandidates.length === 0) return;

  // 3. Inspeciona pixels dos melhores candidatos em paralelo para banir carros vermelhos e priorizar branco
  const topToInspect = allCandidates.slice(0, 8);
  const inspectedList = (await Promise.all(topToInspect.map(async (cand) => {
    const res = await inspectCarImageColors(cand.url);
    if (!res) return null;
    return {
      ...res,
      metaPriority: cand.metaPriority || 0
    };
  }))).filter(Boolean);

  if (inspectedList.length === 0) return;

  // Filtra qualquer carro vermelho
  const nonRedCars = inspectedList.filter(item => !item.isRedCar);

  let finalPhotoUrl = null;

  if (nonRedCars.length > 0) {
    // Ordena de modo que a foto com carro mais branco/prata vença
    nonRedCars.sort((a, b) => {
      const scoreA = (a.whiteRatio * 3.0) + (a.neutralRatio * 1.2) + (a.metaPriority * 0.002) - (a.redRatio * 5.0);
      const scoreB = (b.whiteRatio * 3.0) + (b.neutralRatio * 1.2) + (b.metaPriority * 0.002) - (b.redRatio * 5.0);
      return scoreB - scoreA;
    });
    finalPhotoUrl = nonRedCars[0].url;
  } else {
    // Se todos os candidatos forem vermelhos, converte a lataria vermelha em Branco Pérola via Canvas
    const convertedWhiteUrl = convertRedCarToWhiteDataUrl(inspectedList[0].imgElement);
    finalPhotoUrl = convertedWhiteUrl || inspectedList[0].url;
  }

  if (finalPhotoUrl && !state.vehicle.isCustomPhoto) {
    state.vehicle.photoUrl = finalPhotoUrl;
    state.vehicle.photoLicense = `Imagem automática: ${targetQuery}`;
    syncVehiclePhotoUI();
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

  // Step 1: Register Form Submit
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

      if (data.emailPreviewUrl) {
        console.log('[WELCOME EMAIL PREVIEW LINK]', data.emailPreviewUrl);
        showEmailToast(data.emailPreviewUrl);
      } else {
        alert('Cadastro realizado com sucesso! E-mail de confirmação enviado.');
      }
      
      goToStep(2);
    } catch (err) {
      console.error('API Register Error:', err);
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

  // Prevent accidental native form submissions on wizard steps 2, 3, and 4
  [elements.vehicleForm, elements.rentalForm, elements.costsForm].forEach(formEl => {
    if (!formEl) return;
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const nextBtn = formEl.querySelector('.btn-next');
      if (nextBtn) nextBtn.click();
    });
  });

  // Step Indicators Navigation
  elements.stepIndicators.forEach(ind => {
    ind.addEventListener('click', () => {
      const step = parseInt(ind.dataset.step);
      if (!state.currentUser && step > 1) return;
      
      if (step > state.currentStep) {
        if (!validateStep(state.currentStep)) return;
      }
      if (step === 5) {
        try {
          runCalculationsAndRender();
        } catch (err) {
          console.error('Erro ao renderizar cálculos da etapa 5:', err);
        }
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
        const nextStep = state.currentStep + 1;
        if (state.currentStep === 4) {
          state.report.customSalePrice = null;
          state.report.customPayoffAmount = null;
          try {
            runCalculationsAndRender();
          } catch (err) {
            console.error('Erro ao calcular relatório na transição para a etapa 5:', err);
          }
        }
        goToStep(nextStep);
      }
    });
  });

  // Logout button
  elements.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('locasim_user');
    state.currentUser = null;
    elements.userWidget.style.display = 'none';
    
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

    // Fetch vehicle image automatically as soon as brand + model are selected
    if (!state.vehicle.isCustomPhoto) {
      state.vehicle.photoUrl = '';
      fetchVehicleImageAutomatically(state.vehicle.brandName, state.vehicle.modelName);
    }

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
        const parsedVal = utils.parseCurrency(priceDetails.Valor);
        state.vehicle.valorFipe = parsedVal;
        state.vehicle.historicoDepreciacaoMensal = priceDetails.historicoDepreciacaoMensalNum || 0;
        state.vehicle.historicoDepreciacaoTotal = priceDetails.historicoDepreciacaoTotalNum || 0;
        state.vehicle.historicoDepreciacaoTaxaAnual = priceDetails.historicoTaxaAnualNum || 0;
        state.vehicle.historicoMeses = priceDetails.historicoMeses || 0;

        // Reset auto-calculated Caução (2.7% FIPE), Seguro (0.34% FIPE) & Depreciação flags when a new vehicle is selected
        state.rental.isCaucaoManual = false;
        state.costs.isSeguroManual = false;
        if (state.costs.deprecMultiplier === 'manual') {
          state.costs.deprecMultiplier = 'rate-fipe';
          state.costs.deprecFipeAnnualRate = 0.05;
        }
        
        elements.valorFipeInput.value = priceDetails.Valor;
        
        renderFipeCard(priceDetails);
        triggerSmartDefaults();
        fetchVehicleImageAutomatically(state.vehicle.brandName, state.vehicle.modelName);
      }
    } catch (err) {
      alert('Falha ao buscar preço FIPE na API.');
      hideFipePreview();
    }
  });

  // Also fetch vehicle photo when user types manual brand/model
  if (elements.manualModel) {
    elements.manualModel.addEventListener('blur', () => {
      if (state.vehicle.isManual && !state.vehicle.isCustomPhoto) {
        fetchVehicleImageAutomatically(elements.manualBrand.value, elements.manualModel.value);
      }
    });
  }

  // Smart defaults triggers
  elements.valorPagoInput.addEventListener('blur', () => {
    triggerSmartDefaults();
    updateAutoFinanciado();
  });

  elements.valorPagoInput.addEventListener('input', () => {
    updateAutoFinanciado();
  });

  elements.valorFipeInput.addEventListener('blur', () => {
    state.rental.isCaucaoManual = false;
    state.costs.isSeguroManual = false;
    triggerSmartDefaults();
  });

  // Allow user to edit Caução manually while preserving 2.7% FIPE initial prefill
  if (elements.valorCaucaoInput) {
    elements.valorCaucaoInput.addEventListener('input', () => {
      state.rental.isCaucaoManual = true;
    });
  }

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

  // Step 4: Depreciation Buttons (Média 2 Anos FIPE, 5% ao ano, 10% ao ano, Manual)
  const allDeprecBtns = [
    elements.btnDeprecHistorico,
    elements.btnDeprec5pct,
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
        updateManualDepreciationPercentageUI();
        elements.costDepreciacao.focus();
        elements.costDepreciacao.select();
      } else if (multAttr === 'historico') {
        state.costs.deprecMultiplier = 'historico';
        state.costs.deprecFipeAnnualRate = null;
        if (elements.btnDeprecManual) {
          elements.btnDeprecManual.textContent = 'Manual';
        }
        applyHistoricoDepreciationUI();
      } else if (rateFipeAttr) {
        const rate = parseFloat(rateFipeAttr) || 0.05;
        state.costs.deprecMultiplier = 'rate-fipe';
        state.costs.deprecFipeAnnualRate = rate;
        if (elements.btnDeprecManual) {
          elements.btnDeprecManual.textContent = 'Manual';
        }
        recalculateDepreciationFromFirstScreen();
      }
    });
  });

  elements.costDepreciacao.addEventListener('input', () => {
    state.costs.deprecMultiplier = 'manual';
    state.costs.deprecFipeAnnualRate = null;
    allDeprecBtns.forEach(b => {
      b.classList.toggle('active', b === elements.btnDeprecManual);
    });
    updateManualDepreciationPercentageUI();
  });

  // Step 5: Interactive Period Ruler (12, 24, 36, 48, 60 meses)
  if (elements.step5PrazoBtns) {
    elements.step5PrazoBtns.querySelectorAll('[data-prazo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const prazo = parseInt(btn.getAttribute('data-prazo'), 10) || 36;
        state.report.prazoAnaliseMeses = prazo;
        // Reset custom overrides when switching period on the ruler so it shows the fresh period calculation
        state.report.customSalePrice = null;
        state.report.customPayoffAmount = null;
        elements.step5PrazoBtns.querySelectorAll('[data-prazo]').forEach(b => b.classList.toggle('active', b === btn));
        runCalculationsAndRender();
      });
    });
  }

  // Step 5: Editable Vehicle Sale Price (#custom-sale-price)
  if (elements.customSalePriceInput) {
    elements.customSalePriceInput.addEventListener('input', () => {
      state.report.customSalePrice = utils.parseCurrency(elements.customSalePriceInput.value);
      if (elements.btnResetSalePrice) elements.btnResetSalePrice.style.display = 'inline-block';
      runCalculationsAndRender({ skipSaleInputSync: true });
    });
  }

  if (elements.btnResetSalePrice) {
    elements.btnResetSalePrice.addEventListener('click', () => {
      state.report.customSalePrice = null;
      elements.btnResetSalePrice.style.display = 'none';
      runCalculationsAndRender();
    });
  }

  // Step 5: Editable Financing Payoff Amount (#custom-payoff-amount)
  if (elements.customPayoffAmountInput) {
    elements.customPayoffAmountInput.addEventListener('input', () => {
      state.report.customPayoffAmount = utils.parseCurrency(elements.customPayoffAmountInput.value);
      if (elements.btnResetPayoffAmount) elements.btnResetPayoffAmount.style.display = 'inline-block';
      runCalculationsAndRender({ skipPayoffInputSync: true });
    });
  }

  if (elements.btnResetPayoffAmount) {
    elements.btnResetPayoffAmount.addEventListener('click', () => {
      state.report.customPayoffAmount = null;
      elements.btnResetPayoffAmount.style.display = 'none';
      runCalculationsAndRender();
    });
  }

  // Step 5: Vehicle Photo Upload / URL / Restore Automatic Photo
  if (elements.vehiclePhotoUpload) {
    elements.vehiclePhotoUpload.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        state.vehicle.photoUrl = ev.target.result;
        state.vehicle.isCustomPhoto = true;
        syncVehiclePhotoUI();
      };
      reader.readAsDataURL(file);
    });
  }

  if (elements.btnVehiclePhotoUrl) {
    elements.btnVehiclePhotoUrl.addEventListener('click', () => {
      const url = prompt('Cole a URL da imagem do veículo:', state.vehicle.photoUrl || '');
      if (url && url.trim()) {
        state.vehicle.photoUrl = url.trim();
        state.vehicle.isCustomPhoto = true;
        syncVehiclePhotoUI();
      }
    });
  }

  if (elements.btnVehiclePhotoRemove) {
    elements.btnVehiclePhotoRemove.addEventListener('click', () => {
      state.vehicle.isCustomPhoto = false;
      state.vehicle.photoUrl = '';
      if (elements.vehiclePhotoUpload) elements.vehiclePhotoUpload.value = '';
      syncVehiclePhotoUI();
      const bName = state.vehicle.isManual ? elements.manualBrand.value : state.vehicle.brandName;
      const mName = state.vehicle.isManual ? elements.manualModel.value : state.vehicle.modelName;
      fetchVehicleImageAutomatically(bName, mName);
    });
  }

  // Step 4: 4. Impostos (%) input mask & live preview (accepts only 0,1 to 100%)
  if (elements.costTaxRate) {
    elements.costTaxRate.addEventListener('input', (e) => {
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
      const waNumber = '5547999919781';
      const message = 'Olá! Estou utilizando o Simulador Locador Nômade e gostaria de saber mais sobre a consultoria de aluguel de carros.';
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    });
  }
}

/**
 * Updates the vehicle photo box in Step 5
 */
function syncVehiclePhotoUI() {
  if (!elements.vehiclePhotoImg || !elements.vehiclePhotoFallback) return;
  if (state.vehicle.photoUrl) {
    elements.vehiclePhotoImg.src = state.vehicle.photoUrl;
    elements.vehiclePhotoImg.style.display = 'block';
    elements.vehiclePhotoFallback.style.display = 'none';
    if (elements.btnVehiclePhotoRemove) {
      elements.btnVehiclePhotoRemove.style.display = state.vehicle.isCustomPhoto ? 'inline-block' : 'none';
    }
  } else {
    elements.vehiclePhotoImg.src = '';
    elements.vehiclePhotoImg.style.display = 'none';
    elements.vehiclePhotoFallback.style.display = 'flex';
    if (elements.btnVehiclePhotoRemove) elements.btnVehiclePhotoRemove.style.display = 'none';
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
  if (!state.currentUser) {
    alert('Por favor, crie uma conta ou faça login para continuar.');
    return false;
  }
  return true;
}

function validateStep2() {
  let isValid = true;
  
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

  return isValid;
}

function validateStep4() {
  let isValid = true;

  if (elements.costUf) {
    const customSearchInput = elements.costUf.parentElement?.querySelector('.custom-select-search');
    if (customSearchInput) customSearchInput.style.borderColor = '';

    // If user typed a state name or UF code into the search box without clicking the dropdown item, auto-match it
    if (!elements.costUf.value && customSearchInput && customSearchInput.value.trim()) {
      const typed = normalizeSearchText(customSearchInput.value);
      for (const [code, info] of Object.entries(UF_TAX_DATA_2026)) {
        const normCode = normalizeSearchText(code);
        const normName = normalizeSearchText(info.nome);
        if (typed === normCode || typed === normName || normName.startsWith(typed) || typed.includes(normName)) {
          elements.costUf.value = code;
          recalculateStateIpvaAndLicenciamento();
          break;
        }
      }
    }

    if (!elements.costUf.value) {
      if (customSearchInput) {
        customSearchInput.style.borderColor = 'var(--color-danger)';
        customSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => customSearchInput.focus(), 200);
      }
      alert('Por favor, selecione o Estado (UF) de registro do veículo no topo da tela.');
      isValid = false;
    }
  }

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

function goToStep(step) {
  state.currentStep = step;
  
  if (step === 1) {
    elements.wizardNav.style.display = 'none';
  } else {
    elements.wizardNav.style.display = 'flex';
  }
  
  elements.stepIndicators.forEach(ind => {
    const s = parseInt(ind.dataset.step);
    ind.classList.remove('active', 'completed');
    if (s === step) {
      ind.classList.add('active');
    } else if (s < step) {
      ind.classList.add('completed');
    }
  });

  const percent = ((step - 1) / 4) * 100;
  elements.wizardFill.style.width = `${percent}%`;

  elements.pages.forEach(p => {
    p.classList.remove('active');
    if (p.id === `page-step-${step}`) {
      p.classList.add('active');
    }
  });

  if (step === 2 && !state.vehicle.isManual && elements.fipeBrand.options.length <= 1) {
    loadBrands();
  }

  if (step === 3) {
    recalculateCaucaoFromFipe();
  }

  if (step === 4) {
    recalculateStateIpvaAndLicenciamento();
    recalculateSeguroFromFipe();
    recalculateDepreciationFromFirstScreen();
    updateTaxPreviewTag();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderLoggedInWidget() {
  elements.userWidgetName.textContent = state.currentUser.nome.split(' ')[0];
  elements.userWidget.style.display = 'flex';
}

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
    historicoDepreciacaoTaxaAnual: 0,
    historicoMeses: 0,
    isManual: false,
    isLeveraged: false,
    valorEntrada: 0,
    valorFinanciado: 0,
    qtdParcelas: 0,
    valorParcela: 0,
    isFinanciadoManual: false,
    photoUrl: '',
    isCustomPhoto: false,
    photoLicense: 'Imagem automática do modelo'
  };

  state.rental = {
    valorCaucao: 0,
    isCaucaoManual: false,
    valorSemanal: 0,
    semanasMes: 4.3,
    taxaOcupacao: 1.0,
    taxaAdimplencia: 1.0
  };

  state.report = {
    prazoAnaliseMeses: 36,
    customSalePrice: null,
    customPayoffAmount: null
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
    deprecMultiplier: 'rate-fipe',
    deprecFipeAnnualRate: 0.05,
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
    elements.btnDeprecHistorico,
    elements.btnDeprec5pct,
    elements.btnDeprec10pct,
    elements.btnDeprecManual
  ].filter(Boolean);
  deprecBtns.forEach(btn => {
    btn.classList.toggle('active', btn === elements.btnDeprec5pct);
  });
  if (elements.btnDeprecManual) {
    elements.btnDeprecManual.textContent = 'Manual';
  }
  if (elements.btnDeprecHistorico) {
    elements.btnDeprecHistorico.textContent = 'Média 2 Anos FIPE';
  }

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
  
  elements.fipeComparisonBanner.className = 'comparison-banner';
  elements.comparisonBadge.className = 'badge-comparison';

  if (diffPct < 0) {
    textElement.innerHTML = `O valor de aquisição está <span>acima</span> da FIPE.`;
    elements.fipeComparisonBanner.classList.add('neutral-state');
    elements.comparisonBadge.classList.add('neutral-badge');
    elements.comparisonBadge.textContent = `${utils.formatPercent(Math.abs(diffPct))} de Ágio`;
  } else {
    const marginPct = diffPct;
    
    if (marginPct >= 0 && marginPct < 0.05) {
      textElement.textContent = "Margem baixa para operacao de aluguel de carros! Chance alta de perca com depreciaçao!";
      elements.fipeComparisonBanner.classList.add('danger-state');
      elements.comparisonBadge.classList.add('danger-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    } else if (marginPct >= 0.05 && marginPct < 0.10) {
      textElement.innerHTML = `O valor de aquisição está <span>abaixo</span> da FIPE.`;
      elements.fipeComparisonBanner.classList.add('neutral-state');
      elements.comparisonBadge.classList.add('neutral-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Desconto`;
    } else if (marginPct >= 0.10 && marginPct < 0.15) {
      textElement.textContent = "Margem de aquisição moderada! Verifique estado do veiculo!";
      elements.fipeComparisonBanner.classList.add('warning-state');
      elements.comparisonBadge.classList.add('warning-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    } else if (marginPct >= 0.15 && marginPct < 0.25) {
      textElement.textContent = "Margem favoravel para compra! Risco baixo de assumir depreciação";
      elements.fipeComparisonBanner.classList.add('success-state');
      elements.comparisonBadge.classList.add('success-badge');
      elements.comparisonBadge.textContent = `${utils.formatPercent(marginPct)} de Margem`;
    } else {
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
  const valorSemanal = elements.valorSemanalInput ? utils.parseCurrency(elements.valorSemanalInput.value) : 0;
  const semanasMes = elements.semanasMesInput ? (parseFloat(elements.semanasMesInput.value) || 4.3) : 4.3;
  const receitaBruta = valorSemanal * semanasMes;
  const impostoMensal = receitaBruta * (pct / 100);
  elements.taxPreviewTag.style.display = 'inline-block';
  elements.taxPreviewTag.textContent = `${utils.formatCurrency(impostoMensal)}/mês (${String(pct).replace('.', ',')}%)`;
}

/**
 * Pre-fills Valor da Caução in Step 3 with 2.7% of the vehicle's FIPE value (editable by the user)
 */
function recalculateCaucaoFromFipe() {
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value) || state.vehicle.valorFipe || 0;
  if (valorFipe <= 0) return;

  const caucaoSugerida = valorFipe * 0.027; // 2,7% em relação à FIPE do veículo
  if (elements.caucaoFipeBadge) {
    elements.caucaoFipeBadge.textContent = `Sugestão 2,7% FIPE: ${utils.formatCurrency(caucaoSugerida)}`;
  }

  if (!state.rental.isCaucaoManual && elements.valorCaucaoInput) {
    elements.valorCaucaoInput.value = utils.formatCurrency(caucaoSugerida);
    state.rental.valorCaucao = caucaoSugerida;
  }
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
 * Updates the "Manual" button text and badge to display the exact % of depreciation over FIPE
 * whenever the user types a manual value in #cost-depreciacao.
 */
function updateManualDepreciationPercentageUI() {
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value) || state.vehicle.valorFipe || 0;
  const valorMensal = elements.costDepreciacao ? utils.parseCurrency(elements.costDepreciacao.value) : 0;
  state.costs.depreciacaoMensal = valorMensal;

  if (valorFipe > 0 && valorMensal > 0) {
    const pctAnual = (valorMensal * 12) / valorFipe;
    const pctMensal = valorMensal / valorFipe;
    if (elements.btnDeprecManual) {
      elements.btnDeprecManual.textContent = `${utils.formatPercent(pctAnual)} a.a. (${utils.formatPercent(pctMensal)}/mês)`;
    }
    if (elements.deprecOriginTag) {
      elements.deprecOriginTag.textContent = `Manual: ${utils.formatPercent(pctAnual)} ao ano (${utils.formatPercent(pctMensal)}/mês FIPE)`;
    }
  } else {
    if (elements.btnDeprecManual) {
      elements.btnDeprecManual.textContent = valorMensal === 0 && elements.costDepreciacao.value.trim() !== ''
        ? '0,00% ao ano (Manual)'
        : 'Manual';
    }
    if (elements.deprecOriginTag) {
      elements.deprecOriginTag.textContent = `Manual: 0,00% ao ano FIPE`;
    }
  }
}

function updateHistoricoDeprecBtnLabel() {
  if (!elements.btnDeprecHistorico) return;
  const rate = state.vehicle.historicoDepreciacaoTaxaAnual || 0;
  if (rate > 0) {
    elements.btnDeprecHistorico.textContent = `Média 2 Anos (${utils.formatPercent(rate)})`;
  } else {
    elements.btnDeprecHistorico.textContent = 'Média 2 Anos FIPE';
  }
}

function applyHistoricoDepreciationUI() {
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value) || state.vehicle.valorFipe || 0;
  const rate = state.vehicle.historicoDepreciacaoTaxaAnual || 0;
  const deprecMensal = (valorFipe * rate) / 12;

  if (elements.btnDeprecHistorico) elements.btnDeprecHistorico.classList.add('active');
  if (elements.btnDeprec5pct) elements.btnDeprec5pct.classList.remove('active');
  if (elements.btnDeprec10pct) elements.btnDeprec10pct.classList.remove('active');
  if (elements.btnDeprecManual) {
    elements.btnDeprecManual.classList.remove('active');
    elements.btnDeprecManual.textContent = 'Manual';
  }

  elements.costDepreciacao.value = utils.formatCurrency(deprecMensal);
  state.costs.depreciacaoMensal = deprecMensal;

  if (elements.deprecOriginTag) {
    if (rate > 0) {
      elements.deprecOriginTag.textContent = `Média 2 Anos FIPE: ${utils.formatPercent(rate)} ao ano (${utils.formatCurrency(deprecMensal)}/mês)`;
    } else {
      elements.deprecOriginTag.textContent = `Média 2 Anos FIPE: 0,00% ao ano (sem desvalorização apurada)`;
    }
  }
}

/**
 * MANDATORY RULE: Depreciation is ALWAYS calculated over the vehicle's FIPE value (`valorFipe`),
 * NEVER over the purchase price paid (`valorPago`).
 * Supports modes: Média 2 Anos FIPE, 5% ao ano, 10% ao ano, or Manual (showing live % over FIPE).
 */
function recalculateDepreciationFromFirstScreen() {
  updateHistoricoDeprecBtnLabel();

  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value) || state.vehicle.valorFipe || 0;

  if (state.costs.deprecMultiplier === 'manual') {
    updateManualDepreciationPercentageUI();
    return;
  }

  if (state.costs.deprecMultiplier === 'historico') {
    applyHistoricoDepreciationUI();
    return;
  }

  const rate = state.costs.deprecFipeAnnualRate || 0.05;
  const deprecMensalFipe = (valorFipe * rate) / 12;

  if (elements.btnDeprecManual) {
    elements.btnDeprecManual.textContent = 'Manual';
  }
  if (elements.btnDeprecHistorico) {
    elements.btnDeprecHistorico.classList.remove('active');
  }
  if (elements.btnDeprec5pct && elements.btnDeprec10pct) {
    elements.btnDeprec5pct.classList.toggle('active', Math.abs(rate - 0.05) < 0.001);
    elements.btnDeprec10pct.classList.toggle('active', Math.abs(rate - 0.10) < 0.001);
    if (elements.btnDeprecManual) elements.btnDeprecManual.classList.remove('active');
  }

  if (elements.deprecOriginTag) {
    elements.deprecOriginTag.textContent = `${utils.formatPercent(rate)} ao ano sobre FIPE (${utils.formatCurrency(deprecMensalFipe)}/mês)`;
  }

  elements.costDepreciacao.value = utils.formatCurrency(deprecMensalFipe);
  state.costs.depreciacaoMensal = deprecMensalFipe;
}

function triggerSmartDefaults() {
  // 1. Pre-fill Caução in Step 3 at 2.7% of FIPE (if not manually edited)
  recalculateCaucaoFromFipe();

  // 2. Update IPVA + Licenciamento based on selected UF
  recalculateStateIpvaAndLicenciamento();

  // 3. Pre-fill Seguro Mensal at 0.34% of FIPE (if not manually edited)
  recalculateSeguroFromFipe();

  // 4. Update Depreciation strictly based on FIPE
  recalculateDepreciationFromFirstScreen();

  if (state.currentStep === 2 && !state.vehicle.isManual && state.vehicle.valorFipe > 0) {
    renderComparisonBanner();
  }
}

function shareSimulationOnWhatsApp() {
  const brand = state.vehicle.isManual ? elements.manualBrand.value : state.vehicle.brandName;
  const model = state.vehicle.isManual ? elements.manualModel.value : `${state.vehicle.modelName} (${state.vehicle.yearName})`;
  const fipe = elements.valorFipeInput.value;
  const pago = elements.valorPagoInput.value;
  const semanal = elements.valorSemanalInput.value;
  const prazo = state.report.prazoAnaliseMeses || 36;
  const lucroMes = elements.dreLucroLiquido ? elements.dreLucroLiquido.textContent : '';
  const lucroPeriodo = elements.periodLucroOperacional ? elements.periodLucroOperacional.textContent : '';
  const lucroMaisVenda = elements.periodLucroMaisVenda ? elements.periodLucroMaisVenda.textContent : '';
  const roi = elements.kpiRoiMensal ? elements.kpiRoiMensal.textContent : '';

  const message = 
`*LOCADOR NÔMADE — RESUMO DA OPERAÇÃO (${prazo} MESES)*

*Veículo:* ${brand} ${model}
*FIPE:* ${fipe} | *Compra:* ${pago}
*Aluguel Semanal:* ${semanal}

*Lucro Operacional Mensal (no bolso):* ${lucroMes}
*Lucro Operacional em ${prazo} meses:* ${lucroPeriodo}
*Lucro Operacional + Venda do Veículo (${prazo}m):* ${lucroMaisVenda}
*ROI Mensal:* ${roi}

*@locadornomade*`;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
}

// ==========================================================================
// STEP 5: CÁLCULO E RENDERIZAÇÃO DIRETA COM RÉGUA DE 12, 24, 36, 48 E 60 MESES
// ==========================================================================

function formatSignedNegativeBrl(val) {
  const num = Math.abs(Number(val) || 0);
  if (num === 0) return 'R$ 0,00';
  return `R$ -${utils.formatCurrency(num).replace('R$', '').trim()}`;
}

function runCalculationsAndRender(options = {}) {
  const parsedTaxPct = elements.costTaxRate ? utils.parseTaxPercent(elements.costTaxRate.value) : null;
  const aliquotaImposto = parsedTaxPct !== null && parsedTaxPct > 0 ? (parsedTaxPct / 100) : 0;

  const prazoAnaliseMeses = state.report.prazoAnaliseMeses || 36;

  // Sync ruler buttons active state
  if (elements.step5PrazoBtns) {
    elements.step5PrazoBtns.querySelectorAll('[data-prazo]').forEach(btn => {
      const p = parseInt(btn.getAttribute('data-prazo'), 10);
      btn.classList.toggle('active', p === prazoAnaliseMeses);
    });
  }
  if (elements.periodRulerActiveLabel) {
    const anos = prazoAnaliseMeses / 12;
    elements.periodRulerActiveLabel.textContent = `${prazoAnaliseMeses} Meses (${anos} ${anos === 1 ? 'Ano' : 'Anos'})`;
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
    valorCaucao: elements.valorCaucaoInput ? utils.parseCurrency(elements.valorCaucaoInput.value) : 0,
    valorSemanal: elements.valorSemanalInput ? utils.parseCurrency(elements.valorSemanalInput.value) : 0,
    semanasMes: elements.semanasMesInput ? (parseFloat(elements.semanasMesInput.value) || 4.3) : 4.3,
    
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

    prazoAnaliseMeses,
    customSalePrice: state.report.customSalePrice,
    customPayoffAmount: state.report.customPayoffAmount
  };

  const results = simulationService.calculate(data);
  const hSel = results.horizonteSelecionado;

  // Persist simulation parameters so PRO module screens automatically inherit all numbers
  try {
    const monthlyRent = (data.valorSemanal * (data.semanasMes || 4.3));
    localStorage.setItem('locador_last_simulation', JSON.stringify({
      carPurchaseVal: data.valorPago,
      fipeVal: data.valorFipe,
      weeklyRent: data.valorSemanal,
      rentVal: monthlyRent,
      upsellM1Val: data.valorCaucao,
      uf: state.selectedUf || 'SP',
      ipvaVal: data.ipvaLicenciamento,
      trackerVal: data.rastreador,
      insuranceVal: data.seguro,
      maintRecVal: data.manutencao,
      contabRecVal: data.contabilidade || 0,
      taxRate: data.aliquotaImposto || 0,
      reserveFundVal: data.fundoReserva || 0,
      deprecRate: (results.depreciacaoAnualEstimada || 8),
      horizon: data.prazoAnaliseMeses || 24
    }));
  } catch (e) {
    // Ignore localStorage storage errors
  }

  // Header Date
  if (elements.reportGeneratedDate) {
    elements.reportGeneratedDate.textContent = `Data: ${new Date().toLocaleDateString('pt-BR')}`;
  }

  // Vehicle Name & Photo
  let vehicleName = '';
  if (state.vehicle.isManual) {
    vehicleName = `${elements.manualBrand.value.trim()} ${elements.manualModel.value.trim()}`;
  } else {
    vehicleName = `${state.vehicle.brandName} ${state.vehicle.modelName} (${state.vehicle.yearName})`;
  }
  if (elements.resultVehicleName) elements.resultVehicleName.textContent = vehicleName;
  if (elements.resultFipeReference) {
    elements.resultFipeReference.textContent =
      `FIPE: ${utils.formatCurrency(results.inputs.valorFipe)} • Compra: ${utils.formatCurrency(results.inputs.valorPago)} • Caução: ${utils.formatCurrency(results.inputs.valorCaucao)}`;
  }

  if (!state.vehicle.photoUrl && !state.vehicle.isCustomPhoto) {
    const bName = state.vehicle.isManual ? elements.manualBrand.value : state.vehicle.brandName;
    const mName = state.vehicle.isManual ? elements.manualModel.value : state.vehicle.modelName;
    fetchVehicleImageAutomatically(bName, mName);
  }
  syncVehiclePhotoUI();

  if (elements.reportFipeMarginBadge) {
    if (results.margemInicialVsFipe >= 0) {
      elements.reportFipeMarginBadge.textContent = `Compra ${utils.formatPercent(results.descontoSobreFipe)} abaixo da FIPE (+${utils.formatCurrency(results.margemInicialVsFipe)})`;
    } else {
      elements.reportFipeMarginBadge.textContent = `Compra ${utils.formatPercent(Math.abs(results.descontoSobreFipe))} acima da FIPE`;
    }
  }

  // Top 4 Mini KPIs
  if (elements.execKpiFipe) elements.execKpiFipe.textContent = utils.formatCurrency(results.inputs.valorFipe);
  if (elements.execKpiPago) elements.execKpiPago.textContent = utils.formatCurrency(results.inputs.valorPago);
  if (elements.execKpiPagoSub) {
    elements.execKpiPagoSub.textContent = results.isLeveraged
      ? `Financiado em ${results.inputs.qtdParcelas}x de ${utils.formatCurrency(results.parcelaFinanciamento)}`
      : 'Compra à vista';
  }
  if (elements.kpiFipeDesconto) elements.kpiFipeDesconto.textContent = utils.formatPercent(results.descontoSobreFipe);
  if (elements.kpiFipeDetalhe) {
    const diffVal = Math.abs(results.margemInicialVsFipe);
    elements.kpiFipeDetalhe.textContent = results.margemInicialVsFipe >= 0
      ? `${utils.formatCurrency(diffVal)} abaixo da FIPE`
      : `${utils.formatCurrency(diffVal)} acima da FIPE`;
  }

  if (elements.execKpiCaixaDistribuivel) {
    elements.execKpiCaixaDistribuivel.textContent = utils.formatCurrency(results.lucroOperacionalMensal);
    elements.execKpiCaixaDistribuivel.style.color = results.lucroOperacionalMensal >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  }
  if (elements.execKpiCaixaDistSub) {
    elements.execKpiCaixaDistSub.textContent = results.isLeveraged
      ? `Líquido no bolso (já descontando custos e parcela)`
      : `Líquido no bolso (descontando custos que saem do caixa)`;
  }

  // =========================================================================
  // PAINEL DO PERÍODO ESCOLHIDO NA RÉGUA (12, 24, 36, 48 OU 60 MESES)
  // =========================================================================
  if (elements.periodSummaryTitle) {
    elements.periodSummaryTitle.textContent = `Resultado da Operação em ${hSel.meses} Meses (${hSel.anos} ${hSel.anos === 1 ? 'Ano' : 'Anos'})`;
  }

  // 1. Lucro Operacional durante o período escolhido
  if (elements.periodLucroOperacional) {
    elements.periodLucroOperacional.textContent = utils.formatCurrency(hSel.lucroOperacionalAcumulado);
    elements.periodLucroOperacional.className = `period-box-value ${hSel.lucroOperacionalAcumulado >= 0 ? 'positive' : 'negative'}`;
  }
  if (elements.periodLucroOperacionalSub) {
    if (results.isLeveraged && hSel.mesesSemParcela > 0) {
      elements.periodLucroOperacionalSub.textContent =
        `${hSel.mesesComParcela}m com parcela (${utils.formatCurrency(results.lucroOperacionalMensal)}/mês) + ${hSel.mesesSemParcela}m já quitado (${utils.formatCurrency(results.lucroOperacionalMensalSemParcela)}/mês)`;
    } else {
      elements.periodLucroOperacionalSub.textContent =
        `${utils.formatCurrency(results.lucroOperacionalMensal)}/mês × ${hSel.meses} meses (descontando apenas custos do bolso)`;
    }
  }

  // 2. Depreciação em cima da FIPE nesse período escolhido
  if (elements.periodDepreciacaoFipe) {
    elements.periodDepreciacaoFipe.textContent = `-\u00A0${utils.formatCurrency(hSel.depreciacaoPeriodoFipe)}`;
  }
  if (elements.periodDepreciacaoFipeSub) {
    elements.periodDepreciacaoFipeSub.textContent =
      `${utils.formatCurrency(results.depreciacaoMensal)}/mês × ${hSel.meses} meses (sempre sobre a FIPE de ${utils.formatCurrency(results.inputs.valorFipe)})`;
  }

  // 3. Valor de Venda do Veículo já descontada a depreciação do período (Caixa Editável)
  if (elements.customSalePriceInput && !options.skipSaleInputSync) {
    elements.customSalePriceInput.value = utils.formatCurrency(hSel.valorVendaVeiculo);
  }
  if (elements.periodVendaSub) {
    elements.periodVendaSub.textContent =
      `Sugerido (FIPE - Depreciação de ${hSel.meses}m): ${utils.formatCurrency(hSel.valorVeiculoAposDepreciacao)} — edite acima se desejar`;
  }

  // 4. Resultado do Caixa Total Acumulado no Período (Lucro Operacional + Valor de Venda do Veículo)
  if (elements.periodLucroMaisVenda) {
    elements.periodLucroMaisVenda.textContent = utils.formatCurrency(hSel.resultadoOperacionalMaisVenda);
  }
  if (elements.periodLucroMaisVendaSub) {
    const lucroRealText = utils.formatCurrency(hSel.ganhoLiquidoSobreCapitalInicial);
    const entradaText = utils.formatCurrency(hSel.capitalInicialDesembolsado);
    elements.periodLucroMaisVendaSub.textContent =
      `Lucro em Caixa (${utils.formatCurrency(hSel.lucroOperacionalAcumulado)}) + Venda (${utils.formatCurrency(hSel.valorVendaVeiculo)}) • Lucro Real: ${lucroRealText} (descontada a entrada de ${entradaText})`;
  }

  // 5. Condicional de Financiamento:
  // Se financiou em ex: 48x e escolheu 12, 24 ou 36 meses (< qtdParcelas), mostra a soma das parcelas que faltam e espaço para quitação.
  // Se escolheu >= qtdParcelas (ex: 36m para 36x, ou 48m para 48x) ou à vista, não há saldo de financiamento a descontar!
  if (results.isLeveraged && hSel.TemFinanciamentoRestante) {
    if (elements.financingPayoffPanel) elements.financingPayoffPanel.style.display = 'flex';
    if (elements.periodFinancingStatusBadge) {
      elements.periodFinancingStatusBadge.textContent = `Faltam ${hSel.parcelasRestantes} parcelas no mês ${hSel.meses}`;
      elements.periodFinancingStatusBadge.style.borderColor = 'rgba(245, 158, 11, 0.5)';
      elements.periodFinancingStatusBadge.style.color = 'var(--color-warning)';
    }
    if (elements.financingPayoffTitle) {
      elements.financingPayoffTitle.textContent =
        `Financiamento em Aberto aos ${hSel.meses} Meses (Restam ${hSel.parcelasRestantes} de ${results.inputs.qtdParcelas} parcelas)`;
    }
    if (elements.periodSomaParcelasFaltam) {
      elements.periodSomaParcelasFaltam.textContent = utils.formatCurrency(hSel.somaParcelasRestantes);
    }
    if (elements.periodParcelasFaltamDetalhe) {
      elements.periodParcelasFaltamDetalhe.textContent =
        `${hSel.parcelasRestantes} parcelas restantes × ${utils.formatCurrency(results.parcelaFinanciamento)}`;
    }
    if (elements.customPayoffAmountInput && !options.skipPayoffInputSync) {
      elements.customPayoffAmountInput.value = utils.formatCurrency(hSel.valorQuitacao);
    }
    if (elements.periodResultadoAposQuitacao) {
      elements.periodResultadoAposQuitacao.textContent = utils.formatCurrency(hSel.resultadoLiquidoAposQuitacao);
      elements.periodResultadoAposQuitacao.className =
        `period-box-value ${hSel.resultadoLiquidoAposQuitacao >= 0 ? 'positive' : 'negative'}`;
    }
    if (elements.periodResultadoAposQuitacaoSub) {
      elements.periodResultadoAposQuitacaoSub.textContent =
        `Lucro + Venda (${utils.formatCurrency(hSel.resultadoOperacionalMaisVenda)}) - Quitação (${utils.formatCurrency(hSel.valorQuitacao)})`;
    }
  } else {
    if (elements.financingPayoffPanel) elements.financingPayoffPanel.style.display = 'none';
    if (elements.periodFinancingStatusBadge) {
      elements.periodFinancingStatusBadge.style.borderColor = '';
      elements.periodFinancingStatusBadge.style.color = '';
      elements.periodFinancingStatusBadge.textContent = results.isLeveraged
        ? `Financiamento 100% Quitado em ${hSel.meses} Meses (R$ 0,00 a descontar)`
        : `Aquisição à Vista • Sem Saldo de Financiamento`;
    }
  }

  // =========================================================================
  // RESUMO DA OPERAÇÃO MENSAL (APENAS SAÍDAS QUE SAEM DO BOLSO DA EMPRESA)
  // =========================================================================
  if (elements.dreReceitaBruta) elements.dreReceitaBruta.textContent = utils.formatCurrency(results.receitaBrutaMensal);
  if (elements.dreImpostos) elements.dreImpostos.textContent = formatSignedNegativeBrl(results.impostosSimplesNacional);
  if (elements.dreReceitaLiquida) elements.dreReceitaLiquida.textContent = utils.formatCurrency(results.receitaLiquidaMensal);

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

  if (elements.dreCustosRecorrentesTotal) {
    elements.dreCustosRecorrentesTotal.textContent = formatSignedNegativeBrl(results.custosOperacionaisRecorrentes);
  }
  if (elements.dreRastreador) elements.dreRastreador.textContent = formatSignedNegativeBrl(results.custosDetalhados.rastreador);
  if (elements.dreSeguro) elements.dreSeguro.textContent = formatSignedNegativeBrl(results.custosDetalhados.seguro);
  if (elements.dreManutencao) elements.dreManutencao.textContent = formatSignedNegativeBrl(results.custosDetalhados.manutencao);
  if (elements.dreSuporte) elements.dreSuporte.textContent = formatSignedNegativeBrl(results.custosDetalhados.suporteSistema);
  if (elements.dreContabilidade) elements.dreContabilidade.textContent = formatSignedNegativeBrl(results.custosDetalhados.contabilidade);
  if (elements.dreIpva) elements.dreIpva.textContent = formatSignedNegativeBrl(results.custosDetalhados.ipvaLicenciamento);

  if (results.isLeveraged && results.parcelaFinanciamento > 0) {
    if (elements.dreFinanciamentoRow) elements.dreFinanciamentoRow.style.display = 'flex';
    if (elements.dreFinanciamentoVal) elements.dreFinanciamentoVal.textContent = formatSignedNegativeBrl(results.parcelaFinanciamento);
    if (elements.dreFinanciamentoLabel) {
      elements.dreFinanciamentoLabel.textContent = `Parcela do Financiamento (${results.inputs.qtdParcelas}x)`;
    }
  } else {
    if (elements.dreFinanciamentoRow) elements.dreFinanciamentoRow.style.display = 'none';
  }

  if (elements.dreSaidasTotal) {
    elements.dreSaidasTotal.textContent = formatSignedNegativeBrl(results.saidasCaixaBolsoMensais);
  }

  if (elements.dreLucroLiquido) {
    if (results.lucroOperacionalMensal >= 0) {
      elements.dreLucroLiquido.textContent = utils.formatCurrency(results.lucroOperacionalMensal);
      elements.dreLucroLiquido.style.color = 'var(--color-success)';
    } else {
      elements.dreLucroLiquido.textContent = formatSignedNegativeBrl(results.lucroOperacionalMensal);
      elements.dreLucroLiquido.style.color = 'var(--color-danger)';
    }
  }

  if (elements.dreProvisoesTotal) {
    elements.dreProvisoesTotal.textContent = formatSignedNegativeBrl(results.reservasRetidasMes);
  }
  if (elements.dreDepreciacao) {
    elements.dreDepreciacao.textContent = formatSignedNegativeBrl(results.depreciacaoMensal);
  }

  // =========================================================================
  // MARCADORES DE RETORNO (ROI DA OPERAÇÃO COMPLETA, GANHO LÍQUIDO, PAYBACK, MARGEM)
  // Fórmula do ROI: (1. Lucro Operacional no Período + 2. Valor de Venda do Veículo - Quitação - 3. Investimento Inicial)
  // =========================================================================
  if (results.semCapitalProprioInicial) {
    if (elements.kpiRoiLabel) {
      elements.kpiRoiLabel.textContent = `LUCRO MENSAL NO BOLSO (100% FINANCIADO • SEM ENTRADA)`;
    }
    if (elements.kpiRoiMensal) {
      elements.kpiRoiMensal.innerHTML = `${utils.formatCurrency(results.lucroOperacionalMensal)}/mês <span class="roi-anual-inline">(${utils.formatCurrency(results.lucroOperacionalMensal * 12)}/ano)</span>`;
    }
    if (elements.kpiRoiAnual) {
      elements.kpiRoiAnual.textContent =
        `Sem entrada inicial • Lucro de ${utils.formatCurrency(results.lucroOperacionalMensal * 12)}/ano no bolso`;
    }
    if (elements.kpiPayback) elements.kpiPayback.textContent = 'Imediato (R$ 0 entrada)';
    if (elements.kpiPaybackSubtext) {
      elements.kpiPaybackSubtext.textContent = `Financiamento pago pelo próprio fluxo da locação (${results.inputs.qtdParcelas}x)`;
    }
    const kpiRoiPeriodoLabel = document.getElementById('kpi-roi-periodo-label');
    if (kpiRoiPeriodoLabel) {
      kpiRoiPeriodoLabel.textContent = `LUCRO TOTAL COM VENDA DO VEÍCULO (${hSel.meses}M)`;
    }
    if (elements.kpiRoiPeriodo) {
      elements.kpiRoiPeriodo.textContent = utils.formatCurrency(hSel.ganhoLiquidoSobreCapitalInicial);
    }
    if (elements.kpiRoiPeriodoSub) {
      elements.kpiRoiPeriodoSub.textContent = `Lucro operacional acumulado + venda do carro com R$ 0 de capital inicial desembolsado`;
    }
  } else {
    const capInicialBrl = utils.formatCurrency(hSel.capitalInicialDesembolsado);
    const tipoCap = results.isLeveraged ? `ENTRADA DE ${capInicialBrl}` : `COMPRA DE ${capInicialBrl}`;

    // Card 1: Retorno Mensal no Bolso (Fluxo de Caixa Líquido Real)
    if (elements.kpiRoiLabel) {
      elements.kpiRoiLabel.textContent = results.isLeveraged
        ? `RETORNO MENSAL NO BOLSO (SOBRE ${tipoCap})`
        : `RETORNO MENSAL NO BOLSO (SOBRE ${tipoCap})`;
    }
    if (elements.kpiRoiMensal) {
      const signM = results.roiFluxoMensal >= 0 ? '+' : '';
      const signA = results.roiFluxoAnual >= 0 ? '+' : '';
      elements.kpiRoiMensal.innerHTML = `${signM}${utils.formatPercent(results.roiFluxoMensal)} a.m. <span class="roi-anual-inline">(${signA}${utils.formatPercent(results.roiFluxoAnual)} a.a.)</span>`;
    }
    if (elements.kpiRoiAnual) {
      const signA = results.roiFluxoAnual >= 0 ? '+' : '';
      elements.kpiRoiAnual.textContent =
        `${signA}${utils.formatPercent(results.roiFluxoAnual)} ao ano • Sobra de ${utils.formatCurrency(results.lucroOperacionalMensal)}/mês`;
    }

    // Card 2: Payback do Investimento Inicial
    if (elements.kpiPayback) {
      elements.kpiPayback.textContent = results.paybackMeses && results.paybackMeses !== Infinity
        ? `${results.paybackMeses.toFixed(1).replace('.', ',')} meses`
        : 'Na venda do ativo';
    }
    if (elements.kpiPaybackSubtext) {
      elements.kpiPaybackSubtext.textContent =
        `Tempo para recuperar o investimento inicial (${capInicialBrl}) com o lucro mensal no bolso`;
    }

    // Card 3: Lucro Total com Venda do Veículo no Período
    const kpiRoiPeriodoLabel = document.getElementById('kpi-roi-periodo-label');
    if (kpiRoiPeriodoLabel) {
      kpiRoiPeriodoLabel.textContent = `LUCRO TOTAL COM VENDA DO VEÍCULO (${hSel.meses}M)`;
    }
    if (elements.kpiRoiPeriodo) {
      const roiTot = hSel.roiTotalPeriodo !== null && hSel.roiTotalPeriodo !== undefined
        ? hSel.roiTotalPeriodo
        : (results.roiTotalPeriodo || 0);
      const sign = roiTot >= 0 ? '+' : '';
      elements.kpiRoiPeriodo.textContent = `${sign}${utils.formatPercent(roiTot)} (${utils.formatCurrency(hSel.ganhoLiquidoSobreCapitalInicial)})`;
    }
    if (elements.kpiRoiPeriodoSub) {
      const cagrText = hSel.cagrAnual !== null ? ` (+${utils.formatPercent(hSel.cagrAnual)} a.a. composto real)` : '';
      const multText = hSel.multiplicadorPatrimonial !== null ? `Multiplica o capital em ${hSel.multiplicadorPatrimonial.toFixed(1).replace('.', ',')}x${cagrText} • ` : '';
      elements.kpiRoiPeriodoSub.textContent =
        `${multText}Lucro Líquido Real após quitar financiamento e abater a entrada`;
    }
  }

  if (elements.kpiMargem) {
    elements.kpiMargem.textContent = utils.formatPercent(results.margemLucroOperacional || 0);
  }
  if (elements.kpiBreakevenSub) {
    const semEq = Number(results.semanasEquilibrioMes) || 0;
    const ocupEq = Number(results.ocupacaoEquilibrio) || 0;
    elements.kpiBreakevenSub.textContent =
      `Ponto de equilíbrio: ${semEq.toFixed(2).replace('.', ',')} semanas alugadas/mês (${utils.formatPercent(ocupEq)})`;
  }
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

/**
 * Initializes Apple-style translucent glass tooltips on elements with [data-apple-tooltip].
 * Opens ONLY if the pointer remains hovered over the title for more than 1 second (1000ms).
 */
function initAppleDelayedTooltips() {
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'apple-glass-tooltip';
  tooltipEl.setAttribute('role', 'tooltip');
  tooltipEl.style.display = 'none';
  document.body.appendChild(tooltipEl);

  let hoverTimer = null;
  let hideTimer = null;
  let activeTrigger = null;

  function positionTooltip(trigger) {
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const margin = 10;

    let top = rect.top - tooltipRect.height - margin;
    let left = rect.left;

    // Flip below the title if there isn't enough room above
    if (top < 12) {
      top = rect.bottom + margin;
    }

    // Clamp horizontally inside viewport
    if (left + tooltipRect.width > window.innerWidth - 16) {
      left = Math.max(12, window.innerWidth - tooltipRect.width - 16);
    }
    if (left < 12) left = 12;

    tooltipEl.style.top = `${Math.round(top)}px`;
    tooltipEl.style.left = `${Math.round(left)}px`;
  }

  function showTooltip(trigger) {
    const text = trigger.getAttribute('data-apple-tooltip');
    if (!text) return;

    activeTrigger = trigger;
    tooltipEl.textContent = text;
    tooltipEl.style.display = 'block';
    positionTooltip(trigger);

    requestAnimationFrame(() => {
      tooltipEl.classList.add('visible');
    });
  }

  function hideTooltip() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    activeTrigger = null;
    tooltipEl.classList.remove('visible');
    setTimeout(() => {
      if (!activeTrigger) {
        tooltipEl.style.display = 'none';
      }
    }, 200);
  }

  document.querySelectorAll('[data-apple-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (hoverTimer) clearTimeout(hoverTimer);

      // Open ONLY if mouse stays on the title for more than 1 second (1000ms)
      hoverTimer = setTimeout(() => {
        showTooltip(el);
      }, 1000);
    });

    el.addEventListener('mouseleave', () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      hideTimer = setTimeout(() => {
        hideTooltip();
      }, 120);
    });

    // Mobile / Touch or immediate click
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeTrigger === el && tooltipEl.classList.contains('visible')) {
        hideTooltip();
      } else {
        if (hoverTimer) clearTimeout(hoverTimer);
        showTooltip(el);
      }
    });
  });

  // Keep tooltip visible if user moves pointer onto the balloon itself (WCAG 1.4.13 Hoverable)
  tooltipEl.addEventListener('mouseenter', () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  });

  tooltipEl.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      hideTooltip();
    }, 150);
  });

  // Dismiss on Escape, scroll, or clicking/touching outside
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeTrigger) {
      hideTooltip();
    }
  });

  document.addEventListener('click', (e) => {
    if (activeTrigger && !tooltipEl.contains(e.target) && !e.target.closest('[data-apple-tooltip]')) {
      hideTooltip();
    }
  });

  document.addEventListener('touchstart', (e) => {
    if (activeTrigger && !tooltipEl.contains(e.target) && !e.target.closest('[data-apple-tooltip]')) {
      hideTooltip();
    }
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if (hoverTimer || activeTrigger) {
      hideTooltip();
    }
  }, { passive: true });
}

export default state;
