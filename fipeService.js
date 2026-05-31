/**
 * Service to interact with the high-performance, stable fipeX Tabela FIPE API.
 * Uses the spec described in openapi.yaml (https://api.fipex.com.br).
 * Fully backwards compatible with the frontend by mapping fields dynamically.
 */

const BASE_URL = 'https://api.fipex.com.br/v1';
const CAR_TYPE_UUID = '01988fb7-d43e-73f7-8164-a038033e943c';

// Simple in-memory cache for API requests
const cache = {
  brands: null,
  models: {},
  years: {},
  prices: {}
};

export const fipeService = {
  /**
   * Fetches all car brands from Tabela FIPE (handling pagination transparently).
   * @returns {Promise<Array<{ codigo: string, nome: string }>>}
   */
  async getBrands() {
    if (cache.brands) {
      return cache.brands;
    }

    try {
      console.log('[FIPEX SERVICE] Buscando marcas de carros...');
      
      // Page 1
      const response = await fetch(`${BASE_URL}/makes?type_id=${CAR_TYPE_UUID}&limit=50&page=1`);
      if (!response.ok) throw new Error('Falha ao buscar marcas (página 1)');
      const firstPage = await response.json();
      
      let allData = [...(firstPage.data || [])];
      const totalPages = firstPage.pagination?.pages || 1;

      // Fetch remaining pages in parallel
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(
            fetch(`${BASE_URL}/makes?type_id=${CAR_TYPE_UUID}&limit=50&page=${page}`)
              .then(res => {
                if (!res.ok) throw new Error(`Falha ao buscar marcas (página ${page})`);
                return res.json();
              })
              .then(json => json.data || [])
          );
        }
        const pagesData = await Promise.all(promises);
        pagesData.forEach(pageData => {
          allData = allData.concat(pageData);
        });
      }

      // Map to frontend-compatible format
      const mappedBrands = allData.map(brand => ({
        codigo: brand.id,
        nome: brand.name
      }));

      // Sort alphabetically
      mappedBrands.sort((a, b) => a.nome.localeCompare(b.nome));

      cache.brands = mappedBrands;
      return mappedBrands;
    } catch (error) {
      console.error('[FIPEX SERVICE] Erro ao buscar marcas:', error);
      throw error;
    }
  },

  /**
   * Fetches all models for a specific brand (handling pagination transparently).
   * @param {string} brandId 
   * @returns {Promise<Array<{ codigo: string, nome: string }>>}
   */
  async getModels(brandId) {
    if (!brandId) return [];
    if (cache.models[brandId]) {
      return cache.models[brandId];
    }

    try {
      console.log(`[FIPEX SERVICE] Buscando modelos para a marca ${brandId}...`);
      
      // Page 1
      const response = await fetch(`${BASE_URL}/models?make_id=${brandId}&limit=50&page=1`);
      if (!response.ok) throw new Error('Falha ao buscar modelos (página 1)');
      const firstPage = await response.json();
      
      let allData = [...(firstPage.data || [])];
      const totalPages = firstPage.pagination?.pages || 1;

      // Fetch remaining pages in parallel
      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(
            fetch(`${BASE_URL}/models?make_id=${brandId}&limit=50&page=${page}`)
              .then(res => {
                if (!res.ok) throw new Error(`Falha ao buscar modelos (página ${page})`);
                return res.json();
              })
              .then(json => json.data || [])
          );
        }
        const pagesData = await Promise.all(promises);
        pagesData.forEach(pageData => {
          allData = allData.concat(pageData);
        });
      }

      // Map to frontend-compatible format
      const mappedModels = allData.map(model => ({
        codigo: model.id,
        nome: model.name
      }));

      // Sort alphabetically
      mappedModels.sort((a, b) => a.nome.localeCompare(b.nome));

      cache.models[brandId] = mappedModels;
      return mappedModels;
    } catch (error) {
      console.error(`[FIPEX SERVICE] Erro ao buscar modelos da marca ${brandId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches all years available for a specific model and brand.
   * Leverages the rich model detail endpoint from fipeX which yields the entire year_fuels array.
   * @param {string} brandId 
   * @param {string} modelId 
   * @returns {Promise<Array<{ codigo: string, nome: string }>>}
   */
  async getYears(brandId, modelId) {
    if (!brandId || !modelId) return [];
    const cacheKey = `${brandId}_${modelId}`;
    if (cache.years[cacheKey]) {
      return cache.years[cacheKey];
    }

    try {
      console.log(`[FIPEX SERVICE] Buscando anos e combustíveis para o modelo ${modelId}...`);
      const response = await fetch(`${BASE_URL}/models/${modelId}`);
      if (!response.ok) throw new Error('Falha ao buscar detalhes do modelo');
      const json = await response.json();
      
      const yearFuels = json.data?.year_fuels || [];
      const mappedYears = [];

      // Map each combination of year + fuel into a single option to emulate original FIPE options
      yearFuels.forEach(yf => {
        const year = yf.model_year;
        const isZeroKm = yf.is_zero_km ? ' 0km' : '';
        yf.fuels.forEach(fuel => {
          mappedYears.push({
            codigo: `${year}_${fuel.id}`,
            nome: `${year}${isZeroKm} ${fuel.name}`
          });
        });
      });

      // Sort years in descending order (newest first)
      mappedYears.sort((a, b) => b.nome.localeCompare(a.nome));

      cache.years[cacheKey] = mappedYears;
      return mappedYears;
    } catch (error) {
      console.error(`[FIPEX SERVICE] Erro ao buscar anos do modelo ${modelId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches the official FIPE price and details for a specific brand, model, and year.
   * Parses the custom yearId compound back into its components.
   * @param {string} brandId 
   * @param {string} modelId 
   * @param {string} yearId (Format: "YEAR_FUELID")
   * @returns {Promise<{ Valor: string, Marca: string, Modelo: string, AnoModelo: number, Combustivel: string, CodigoFipe: string, MesReferencia: string }>}
   */
  async getPrice(brandId, modelId, yearId) {
    if (!brandId || !modelId || !yearId) return null;
    const cacheKey = `${brandId}_${modelId}_${yearId}`;
    if (cache.prices[cacheKey]) {
      return cache.prices[cacheKey];
    }

    try {
      // Split the composite yearId back to year and fuelId
      const [year, fuelId] = yearId.split('_');
      console.log(`[FIPEX SERVICE] Buscando preço expandido para o ano: ${year}, combustível: ${fuelId}...`);

      const response = await fetch(`${BASE_URL}/prices/expanded?model_id=${modelId}&year=${year}&fuel_id=${fuelId}`);
      if (!response.ok) throw new Error('Falha ao buscar cotação expandida fipeX');
      const json = await response.json();
      
      const data = json.data;
      if (!data) throw new Error('Nenhum dado de preço retornado');

      const priceObj = data.price;
      if (!priceObj) throw new Error('Nenhum dado do preço atual retornado');

      const history = data.history || [];

      // Calculate historical depreciation (last 2 years) for year <= 2025
      let deprecBrl = '';
      let deprecPct = '';
      let deprecText = '';
      let deprecTipo = 'none';

      if (parseInt(year) <= 2025 && history.length > 0) {
        // Sort history by year and month descending (newest first)
        const sortedHistory = [...history].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });

        const newest = sortedHistory[0];
        
        // Target: 24 months ago (2 years)
        const targetYear = newest.year - 2;
        const targetMonth = newest.month;

        // Find closest historical item to 24 months ago
        let closestItem = null;
        let minDiff = Infinity;

        sortedHistory.forEach(item => {
          const diff = Math.abs((item.year * 12 + item.month) - (targetYear * 12 + targetMonth));
          if (diff < minDiff) {
            minDiff = diff;
            closestItem = item;
          }
        });

        if (closestItem && closestItem !== newest) {
          const oldPrice = closestItem.market_price_cents;
          const newPrice = newest.market_price_cents;
          const diffCents = oldPrice - newPrice; // Positive means depreciated (lost value)
          const diffPctVal = (diffCents / oldPrice) * 100;
          
          const monthsDiff = Math.abs((newest.year * 12 + newest.month) - (closestItem.year * 12 + closestItem.month));

          deprecTipo = diffCents >= 0 ? 'danger' : 'success';
          
          const absDiffFormatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(Math.abs(diffCents) / 100);

          const pctFormatted = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }).format(Math.abs(diffPctVal)) + '%';

          if (diffCents >= 0) {
            deprecBrl = absDiffFormatted;
            deprecPct = pctFormatted;
            deprecText = `Desvalorizou ${absDiffFormatted} (${pctFormatted}) nos últimos ${monthsDiff} meses.`;
          } else {
            deprecBrl = absDiffFormatted;
            deprecPct = pctFormatted;
            deprecText = `Valorizou ${absDiffFormatted} (${pctFormatted}) nos últimos ${monthsDiff} meses.`;
          }
        }
      }

      // Map back to compatible keys so the UI is seamlessly updated
      const mappedResult = {
        Valor: priceObj.formatted_price,
        Marca: priceObj.make?.name || 'Marca',
        Modelo: priceObj.model?.name || 'Modelo',
        AnoModelo: priceObj.model_year,
        Combustivel: priceObj.fuel?.name || 'Combustível',
        CodigoFipe: priceObj.model?.slug || 'fipeX',
        MesReferencia: priceObj.reference ? `${priceObj.reference.month_name} de ${priceObj.reference.year}` : 'Mês atual',
        
        // New historical fields
        historicoDepreciacaoBrl: deprecBrl,
        historicoDepreciacaoPct: deprecPct,
        historicoTexto: deprecText,
        historicoTipo: deprecTipo
      };

      cache.prices[cacheKey] = mappedResult;
      return mappedResult;
    } catch (error) {
      console.error('[FIPEX SERVICE] Erro ao buscar preço expandido fipeX:', error);
      throw error;
    }
  }
};
