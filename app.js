/**
 * Main Application Controller for LocaSim Car Rental Simulator.
 * Manages state, wizard steps, input formatting masks, and visual outputs.
 */

import { fipeService } from './fipeService.js';
import { simulationService } from './simulationService.js';

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
    isManual: false
  },
  rental: {
    valorCaucao: 0,
    valorSemanal: 0,
    semanasMes: 4.3
  },
  costs: {
    rastreador: 50,
    seguro: 200,
    manutencao: 150,
    suporteSistema: 39,
    contabilidade: 0,
    ipvaLicenciamento: 0,
    aliquotaImposto: 0.06,
    fundoReserva: 0,
    depreciacaoMensal: 0,
    useFundoReserva: false
  }
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

  // Step 3: Income
  rentalForm: document.getElementById('rental-form'),
  valorCaucaoInput: document.getElementById('rental-valor-caucao'),
  valorSemanalInput: document.getElementById('rental-valor-semanal'),
  semanasMesInput: document.getElementById('rental-semanas-mes'),

  // Step 4: Costs
  costsForm: document.getElementById('costs-form'),
  costRastreador: document.getElementById('cost-rastreador'),
  costSeguro: document.getElementById('cost-seguro'),
  costManutencao: document.getElementById('cost-manutencao'),
  costSuporte: document.getElementById('cost-suporte'),
  costContabilidade: document.getElementById('cost-contabilidade'),
  costIpva: document.getElementById('cost-ipva'),
  costTaxRate: document.getElementById('cost-tax-rate'),
  costDepreciacao: document.getElementById('cost-depreciacao'),
  reserveFundToggle: document.getElementById('reserve-fund-toggle'),
  reserveFundInputGroup: document.getElementById('reserve-fund-input-group'),
  costFundoReserva: document.getElementById('cost-fundo-reserva'),

  // Step 5: DRE Results
  resultVehicleName: document.getElementById('result-vehicle-name'),
  resultFipeReference: document.getElementById('result-fipe-reference'),
  dreHeaderRevenue: document.getElementById('dre-header-revenue'),
  
  dreReceitaBruta: document.getElementById('dre-receita-bruta'),
  dreImpostos: document.getElementById('dre-impostos'),
  dreReceitaLiquida: document.getElementById('dre-receita-liquida'),
  dreCustosRecorrentesTotal: document.getElementById('dre-custos-recorrentes-total'),
  dreRastreador: document.getElementById('dre-rastreador'),
  dreSeguro: document.getElementById('dre-seguro'),
  dreManutencao: document.getElementById('dre-manutencao'),
  dreSuporte: document.getElementById('dre-suporte'),
  dreContabilidade: document.getElementById('dre-contabilidade'),
  dreIpva: document.getElementById('dre-ipva'),
  dreProvisoesTotal: document.getElementById('dre-provisoes-total'),
  dreFundoReserva: document.getElementById('dre-fundo-reserva'),
  dreDepreciacao: document.getElementById('dre-depreciacao'),
  dreSaidasTotal: document.getElementById('dre-saidas-total'),
  dreLucroLiquido: document.getElementById('dre-lucro-liquido'),

  // KPI Results
  riskCard: document.getElementById('risk-card'),
  riskLabel: document.getElementById('risk-label'),
  riskBadge: document.getElementById('risk-badge'),
  riskDesc: document.getElementById('risk-desc'),
  metricCardRoi: document.getElementById('metric-card-roi'),
  kpiRoiMensal: document.getElementById('kpi-roi-mensal'),
  kpiRoiAnual: document.getElementById('kpi-roi-anual'),
  kpiPayback: document.getElementById('kpi-payback'),
  kpiMargem: document.getElementById('kpi-margem'),
  kpiFipeDesconto: document.getElementById('kpi-fipe-desconto'),
  kpiFipeDetalhe: document.getElementById('kpi-fipe-detalhe'),

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
  utils.setupCurrencyMask(elements.valorCaucaoInput);
  utils.setupCurrencyMask(elements.valorSemanalInput);
  utils.setupCurrencyMask(elements.costRastreador);
  utils.setupCurrencyMask(elements.costSeguro);
  utils.setupCurrencyMask(elements.costManutencao);
  utils.setupCurrencyMask(elements.costSuporte);
  utils.setupCurrencyMask(elements.costContabilidade);
  utils.setupCurrencyMask(elements.costIpva);
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

  // Load the Landing Page at first loading
  showLandingPage();
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
    elements.authForm.reset();
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
        // Cache numeric FIPE value in state
        const parsedVal = utils.parseCurrency(priceDetails.Valor);
        state.vehicle.valorFipe = parsedVal;
        
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
  });

  elements.valorFipeInput.addEventListener('blur', () => {
    triggerSmartDefaults();
  });

  // Step 4 Costs: Optional Reserve Fund Toggle
  elements.reserveFundToggle.addEventListener('change', (e) => {
    const active = e.target.checked;
    state.costs.useFundoReserva = active;
    if (active) {
      elements.reserveFundInputGroup.style.display = 'block';
    } else {
      elements.reserveFundInputGroup.style.display = 'none';
    }
  });

  // Landing Page Start Triggers
  elements.btnLandingStart.addEventListener('click', startSimulation);
  elements.btnLandingStartBanner.addEventListener('click', startSimulation);
  
  // Depreciation scenarios buttons click
  const btnDeprecMedia = document.getElementById('btn-deprec-media');
  const btnDeprecAlta = document.getElementById('btn-deprec-alta');

  if (btnDeprecMedia && btnDeprecAlta) {
    btnDeprecMedia.addEventListener('click', () => {
      applyDepreciationScenario(0.07, btnDeprecMedia, btnDeprecAlta);
    });

    btnDeprecAlta.addEventListener('click', () => {
      applyDepreciationScenario(0.12, btnDeprecAlta, btnDeprecMedia);
    });
  }

  // Deactivate active states when the user types manually
  elements.costDepreciacao.addEventListener('input', () => {
    if (btnDeprecMedia && btnDeprecAlta) {
      btnDeprecMedia.classList.remove('active');
      btnDeprecAlta.classList.remove('active');
    }
  });

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
  const fields = [
    elements.costRastreador,
    elements.costSeguro,
    elements.costManutencao,
    elements.costSuporte,
    elements.costContabilidade,
    elements.costIpva,
    elements.costDepreciacao,
    elements.costTaxRate
  ];

  fields.forEach(f => f.style.borderColor = '');

  fields.forEach(field => {
    if (field === elements.costTaxRate) {
      const pct = parseFloat(field.value);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        field.style.borderColor = 'var(--color-danger)';
        isValid = false;
      }
    } else {
      const val = utils.parseCurrency(field.value);
      if (val < 0) {
        field.style.borderColor = 'var(--color-danger)';
        isValid = false;
      }
    }
  });

  if (elements.reserveFundToggle.checked) {
    elements.costFundoReserva.style.borderColor = '';
    const val = utils.parseCurrency(elements.costFundoReserva.value);
    if (val < 0) {
      elements.costFundoReserva.style.borderColor = 'var(--color-danger)';
      isValid = false;
    }
  }

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
  elements.vehicleForm.reset();
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
    isManual: false
  };

  state.costs = {
    rastreador: 50,
    seguro: 200,
    manutencao: 150,
    suporteSistema: 39,
    contabilidade: 0,
    ipvaLicenciamento: 0,
    aliquotaImposto: 0.06,
    fundoReserva: 0,
    depreciacaoMensal: 0,
    useFundoReserva: false
  };

  elements.fipeManualToggle.checked = false;
  elements.fipeManualToggle.dispatchEvent(new Event('change'));
  elements.reserveFundToggle.checked = false;
  elements.reserveFundToggle.dispatchEvent(new Event('change'));
  
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
      
      deprecVal.textContent = data.historicoDepreciacaoBrl;
      deprecBadge.textContent = data.historicoDepreciacaoPct;
      deprecNote.textContent = data.historicoTexto;
      
      if (data.historicoTipo === 'success') {
        historyCard.classList.add('appreciated');
        deprecBadge.className = 'history-badge appreciated';
        historyCard.querySelector('.history-card-header span').textContent = 'Histórico de Valorização Real (Últimos 2 Anos)';
      } else {
        historyCard.classList.remove('appreciated');
        deprecBadge.className = 'history-badge';
        historyCard.querySelector('.history-card-header span').textContent = 'Histórico de Depreciação Real (Últimos 2 Anos)';
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

  if (diffPct > 0) {
    elements.comparisonDirection.textContent = 'abaixo';
    elements.comparisonBadge.className = 'badge-comparison discount';
    elements.comparisonBadge.textContent = `${utils.formatPercent(diffPct)} de Desconto`;
  } else {
    elements.comparisonDirection.textContent = 'acima';
    elements.comparisonBadge.className = 'badge-comparison premium';
    elements.comparisonBadge.textContent = `${utils.formatPercent(Math.abs(diffPct))} de Ágio`;
  }
}

/**
 * Triggered automatically on input blur of prices.
 * Dynamically updates IPVA & Depreciation operational inputs based on Vehicle Price metrics,
 * but leaves them editable so the user has the final word.
 */
function triggerSmartDefaults() {
  const valorPago = utils.parseCurrency(elements.valorPagoInput.value);
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value);

  // If FIPE has a value, IPVA provision is annual 4% / 12 months
  if (valorFipe > 0) {
    const monthlyIpva = simulationService.estimateMonthlyIpva(valorFipe);
    elements.costIpva.value = utils.formatCurrency(monthlyIpva);
  }

  // If Paid price has a value, monthly depreciation is 15% annual / 12 months
  // Skip this default if a custom depreciation scenario (7% or 12%) has been selected
  const btnDeprecMedia = document.getElementById('btn-deprec-media');
  const btnDeprecAlta = document.getElementById('btn-deprec-alta');
  const isScenarioActive = (btnDeprecMedia && btnDeprecMedia.classList.contains('active')) ||
                            (btnDeprecAlta && btnDeprecAlta.classList.contains('active'));

  if (valorPago > 0 && !isScenarioActive) {
    const monthlyDepr = simulationService.estimateMonthlyDepreciation(valorPago);
    elements.costDepreciacao.value = utils.formatCurrency(monthlyDepr);
  }

  // Live recalculate the discount banner on step 2 if FipeCard is rendered
  if (state.currentStep === 2 && !state.vehicle.isManual && state.vehicle.valorFipe > 0) {
    renderComparisonBanner();
  }
}

/**
 * Helper to calculate and apply a depreciation scenario to the monthly depreciation input
 * @param {number} annualRate (e.g. 0.07 or 0.12)
 * @param {HTMLButtonElement} activeBtn
 * @param {HTMLButtonElement} inactiveBtn
 */
function applyDepreciationScenario(annualRate, activeBtn, inactiveBtn) {
  const valorPago = utils.parseCurrency(elements.valorPagoInput.value);
  const valorFipe = utils.parseCurrency(elements.valorFipeInput.value);
  
  // Use valorPago as primary (capital invested), fallback to valorFipe
  const baseValue = valorPago > 0 ? valorPago : valorFipe;

  if (baseValue <= 0) {
    alert('Por favor, defina o valor do veículo no Passo 2 antes de selecionar um cenário de depreciação.');
    return;
  }

  // Monthly depreciation = (baseValue * annualRate) / 12
  const monthlyDeprec = (baseValue * annualRate) / 12;
  
  elements.costDepreciacao.value = utils.formatCurrency(monthlyDeprec);
  
  // Update state
  state.costs.depreciacaoMensal = monthlyDeprec;

  // Toggle active button states
  activeBtn.classList.add('active');
  inactiveBtn.classList.remove('active');
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
  const lucro = elements.dreLucroLiquido.textContent;
  const margem = elements.kpiMargem.textContent;
  const roi = elements.kpiRoiAnual.textContent;
  const payback = elements.kpiPayback.textContent;

  const message = 
`🚗 *LOCADOR NÔMADE - SIMULAÇÃO FINANCEIRA DE LOCAÇÃO* 🚗

*Veículo:* ${brand} ${model}
*Preço FIPE:* ${fipe} | *Pago:* ${pago}
*Valor da Locação:* ${semanal} por semana

*--- RESULTADO DRE MENSAL ---*
*Receita Bruta:* ${receita}
*Lucro Líquido:* ${lucro}
*Margem Líquida:* ${margem}

*--- MÉTRICAS FINANCEIRAS ---*
*ROI Anual:* ${roi} a.a.
*Payback Estimado:* ${payback}

*Para maiores informações nos siga em nossas redes sociais:*
👉 *@locadornomade*

*Faça sua própria simulação em:*
👉 http://localhost:3000`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
}


// ==========================================================================
// FINANCIAL ENGINE COMPILATION & RESULTS DASHBOARD RENDERING
// ==========================================================================

function runCalculationsAndRender() {
  // Collect data from forms
  const data = {
    valorPago: utils.parseCurrency(elements.valorPagoInput.value),
    valorFipe: utils.parseCurrency(elements.valorFipeInput.value),
    valorCaucao: utils.parseCurrency(elements.valorCaucaoInput.value),
    valorSemanal: utils.parseCurrency(elements.valorSemanalInput.value),
    semanasMes: parseFloat(elements.semanasMesInput.value) || 4.3,
    
    rastreador: utils.parseCurrency(elements.costRastreador.value),
    seguro: utils.parseCurrency(elements.costSeguro.value),
    manutencao: utils.parseCurrency(elements.costManutencao.value),
    suporteSistema: utils.parseCurrency(elements.costSuporte.value),
    contabilidade: utils.parseCurrency(elements.costContabilidade.value),
    ipvaLicenciamento: utils.parseCurrency(elements.costIpva.value),
    
    aliquotaImposto: (parseFloat(elements.costTaxRate.value) || 0) / 100,
    depreciacaoMensal: utils.parseCurrency(elements.costDepreciacao.value),
    fundoReserva: elements.reserveFundToggle.checked ? utils.parseCurrency(elements.costFundoReserva.value) : 0
  };

  // Compile calculations through the simulation service
  const results = simulationService.calculate(data);

  // Render DRE header and titles
  let vehicleName = '';
  if (state.vehicle.isManual) {
    vehicleName = `${elements.manualBrand.value.trim()} ${elements.manualModel.value.trim()}`;
  } else {
    vehicleName = `${state.vehicle.brandName} ${state.vehicle.modelName}`;
  }
  elements.resultVehicleName.textContent = vehicleName;
  elements.resultFipeReference.textContent = `FIPE de Referência: ${utils.formatCurrency(results.inputs.valorFipe)}`;

  // Populate DRE table values
  elements.dreHeaderRevenue.textContent = utils.formatCurrency(results.receitaBrutaMensal);
  elements.dreReceitaBruta.textContent = utils.formatCurrency(results.receitaBrutaMensal);
  elements.dreImpostos.textContent = `R$ -${utils.formatCurrency(results.impostosSimplesNacional).replace('R$', '').trim()}`;
  elements.dreReceitaLiquida.textContent = utils.formatCurrency(results.receitaLiquidaMensal);
  
  elements.dreCustosRecorrentesTotal.textContent = `R$ -${utils.formatCurrency(results.custosOperacionaisRecorrentes).replace('R$', '').trim()}`;
  elements.dreRastreador.textContent = `R$ -${utils.formatCurrency(results.custosDetalhados.rastreador).replace('R$', '').trim()}`;
  elements.dreSeguro.textContent = `R$ -${utils.formatCurrency(results.custosDetalhados.seguro).replace('R$', '').trim()}`;
  elements.dreManutencao.textContent = `R$ -${utils.formatCurrency(results.custosDetalhados.manutencao).replace('R$', '').trim()}`;
  elements.dreSuporte.textContent = `R$ -${utils.formatCurrency(results.custosDetalhados.suporteSistema).replace('R$', '').trim()}`;
  elements.dreContabilidade.textContent = `R$ -${utils.formatCurrency(results.custosDetalhados.contabilidade).replace('R$', '').trim()}`;
  elements.dreIpva.textContent = `R$ -${utils.formatCurrency(results.custosDetalhados.ipvaLicenciamento).replace('R$', '').trim()}`;

  elements.dreProvisoesTotal.textContent = `R$ -${utils.formatCurrency(results.totalProvisoes).replace('R$', '').trim()}`;
  elements.dreFundoReserva.textContent = `R$ -${utils.formatCurrency(results.fundoReserva).replace('R$', '').trim()}`;
  elements.dreDepreciacao.textContent = `R$ -${utils.formatCurrency(results.depreciacaoMensal).replace('R$', '').trim()}`;

  elements.dreSaidasTotal.textContent = `R$ -${utils.formatCurrency(results.custosTotaisMensais).replace('R$', '').trim()}`;
  
  // Format net profit depending on it being positive or negative
  if (results.lucroLiquido >= 0) {
    elements.dreLucroLiquido.textContent = utils.formatCurrency(results.lucroLiquido);
    elements.dreLucroLiquido.style.color = 'var(--color-success)';
  } else {
    elements.dreLucroLiquido.textContent = `R$ -${utils.formatCurrency(Math.abs(results.lucroLiquido)).replace('R$', '').trim()}`;
    elements.dreLucroLiquido.style.color = 'var(--color-danger)';
  }

  // Render Operational Risk card
  const r = results.analiseRisco;
  elements.riskCard.className = `risk-card ${r.status}`;
  elements.riskLabel.textContent = 'Risco Operacional';
  elements.riskBadge.textContent = r.score;
  elements.riskDesc.textContent = r.message;

  // KPI Scorecards
  // ROI
  elements.kpiRoiMensal.textContent = utils.formatPercent(results.roiMensal);
  elements.kpiRoiAnual.textContent = `Taxa Anual Equivalente: ${utils.formatPercent(results.roiAnual)}`;
  elements.metricCardRoi.className = `metric-card ${r.status}`;

  // Payback
  if (results.paybackMeses === Infinity) {
    elements.kpiPayback.textContent = 'N/A';
  } else {
    elements.kpiPayback.textContent = `${results.paybackMeses.toFixed(1)} meses`;
  }
  
  // Margem Líquida
  elements.kpiMargem.textContent = utils.formatPercent(results.margemLiquida);

  // FIPE discount comparison card
  elements.kpiFipeDesconto.textContent = utils.formatPercent(results.descontoSobreFipe);
  const diffVal = Math.abs(results.inputs.valorFipe - results.inputs.valorPago);
  const diffDirection = results.descontoSobreFipe >= 0 ? 'abaixo' : 'acima';
  elements.kpiFipeDetalhe.textContent = `Valor pago ${utils.formatCurrency(diffVal)} ${diffDirection} da média FIPE`;

  // Render CSS Distribution chart slices
  renderDistributionChart(results);
}

/**
 * Calculates and updates widths of the visual CSS revenue distribution bar
 */
function renderDistributionChart(results) {
  const rev = results.receitaBrutaMensal;
  if (rev <= 0 || results.lucroLiquido <= 0) {
    // If loss or 0 revenue, show 100% opex / expenses
    elements.sliceProfit.style.width = '0%';
    elements.sliceTaxes.style.width = '0%';
    elements.sliceOpex.style.width = '0%';
    elements.sliceProvisions.style.width = '100%';
    elements.sliceProvisions.style.background = 'var(--color-danger)';
    
    elements.legendProfitPct.textContent = '0.00%';
    elements.legendTaxesPct.textContent = '0.00%';
    elements.legendOpexPct.textContent = '0.00%';
    elements.legendProvisionsPct.textContent = '100.00%';
    return;
  }

  // Calculate slices ratios
  const profitPct = results.lucroLiquido / rev;
  const taxesPct = results.impostosSimplesNacional / rev;
  const opexPct = results.custosOperacionaisRecorrentes / rev;
  const provPct = results.totalProvisoes / rev;

  elements.sliceProfit.style.width = `${profitPct * 100}%`;
  elements.sliceTaxes.style.width = `${taxesPct * 100}%`;
  elements.sliceOpex.style.width = `${opexPct * 100}%`;
  elements.sliceProvisions.style.width = `${provPct * 100}%`;
  elements.sliceProvisions.style.background = 'var(--color-warning)'; // Restore normal yellow

  // Write legend values
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

      item.addEventListener('click', () => {
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

    closeDropdown();

    // Fire the native change event so app.js picks it up!
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 4. Dropdown visibility controls
  function openDropdown() {
    if (select.disabled) return;
    
    // Close other custom dropdowns
    document.querySelectorAll('.custom-select-container').forEach(c => {
      if (c !== container) c.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-dropdown').forEach(d => {
      if (d !== dropdown) d.style.display = 'none';
    });

    container.classList.add('open');
    dropdown.style.display = 'block';
    
    // Highlight currently selected item
    highlightedIndex = items.findIndex(item => item.classList.contains('selected'));
    updateHighlight();

    // Scroll selected into view
    if (highlightedIndex >= 0) {
      items[highlightedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function closeDropdown() {
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

  // 5. Local filtering logic
  function filterItems() {
    const text = input.value.toLowerCase().trim();
    let visibleCount = 0;

    items.forEach((item) => {
      const itemText = item.textContent.toLowerCase();
      if (itemText.includes(text)) {
        item.style.display = 'flex';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

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
  input.addEventListener('focus', openDropdown);
  input.addEventListener('click', openDropdown);
  
  input.addEventListener('input', () => {
    if (dropdown.style.display === 'none') {
      openDropdown();
    }
    filterItems();
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        openDropdown();
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
        // Default to first visible if none highlighted
        selectOption(visibleItems[0].dataset.value, visibleItems[0].textContent);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
    } else if (e.key === 'Tab') {
      closeDropdown();
    }
  });

  // Blur sync
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      closeDropdown();
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
