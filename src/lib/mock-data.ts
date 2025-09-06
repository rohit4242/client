// Mock data for dashboard components

export interface MockOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price: number;
  quantity: number;
  value: number;
  status: 'FILLED' | 'PENDING' | 'CANCELED';
  createdAt: Date;
}

export interface MockPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  currentPrice: number;
  profit: number;
  profitPercentage: number;
  value: number;
}

export interface PortfolioDataPoint {
  date: string;
  value: number;
  profit: number;
}

export interface DashboardStats {
  totalPortfolioValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  openPositions: number;
  todayPnL: number;
  todayPnLPercent: number;
  weeklyPnL: number;
  weeklyPnLPercent: number;
}

// Generate mock portfolio data for the last 30 days
export function generatePortfolioData(): PortfolioDataPoint[] {
  const data: PortfolioDataPoint[] = [];
  const baseValue = 50000;
  let currentValue = baseValue;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some realistic volatility
    const volatility = 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    currentValue = currentValue * (1 + change);
    
    const profit = currentValue - baseValue;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(currentValue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    });
  }
  
  return data;
}

// Generate mock recent orders
export function generateMockOrders(): MockOrder[] {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT', 'DOGEUSDT'];
  const sides: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  const types: ('MARKET' | 'LIMIT')[] = ['MARKET', 'LIMIT'];
  const statuses: ('FILLED' | 'PENDING' | 'CANCELED')[] = ['FILLED', 'PENDING', 'CANCELED'];
  
  const orders: MockOrder[] = [];
  
  for (let i = 0; i < 10; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate realistic prices based on symbol
    let basePrice = 100;
    if (symbol.includes('BTC')) basePrice = 45000;
    else if (symbol.includes('ETH')) basePrice = 3000;
    else if (symbol.includes('BNB')) basePrice = 600;
    else if (symbol.includes('ADA')) basePrice = 0.5;
    else if (symbol.includes('SOL')) basePrice = 100;
    else if (symbol.includes('XRP')) basePrice = 0.6;
    else if (symbol.includes('DOT')) basePrice = 8;
    else if (symbol.includes('DOGE')) basePrice = 0.08;
    
    const price = basePrice * (0.95 + Math.random() * 0.1); // ±5% variation
    const quantity = Math.random() * 10 + 0.1;
    const value = price * quantity;
    
    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 24));
    createdAt.setMinutes(createdAt.getMinutes() - Math.floor(Math.random() * 60));
    
    orders.push({
      id: `order_${i + 1}`,
      symbol,
      side,
      type,
      price: Math.round(price * 100) / 100,
      quantity: Math.round(quantity * 1000) / 1000,
      value: Math.round(value * 100) / 100,
      status,
      createdAt,
    });
  }
  
  return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Generate mock positions
export function generateMockPositions(): MockPosition[] {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];
  const positions: MockPosition[] = [];
  
  symbols.forEach((symbol, index) => {
    let basePrice = 100;
    if (symbol.includes('BTC')) basePrice = 45000;
    else if (symbol.includes('ETH')) basePrice = 3000;
    else if (symbol.includes('BNB')) basePrice = 600;
    else if (symbol.includes('ADA')) basePrice = 0.5;
    else if (symbol.includes('SOL')) basePrice = 100;
    
    const entryPrice = basePrice * (0.95 + Math.random() * 0.1);
    const currentPrice = entryPrice * (0.9 + Math.random() * 0.2); // ±10% from entry
    const quantity = Math.random() * 5 + 0.1;
    const value = currentPrice * quantity;
    const profit = (currentPrice - entryPrice) * quantity;
    const profitPercentage = ((currentPrice - entryPrice) / entryPrice) * 100;
    
    positions.push({
      id: `position_${index + 1}`,
      symbol,
      side: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      entryPrice: Math.round(entryPrice * 100) / 100,
      quantity: Math.round(quantity * 1000) / 1000,
      currentPrice: Math.round(currentPrice * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
      value: Math.round(value * 100) / 100,
    });
  });
  
  return positions;
}

// Generate dashboard statistics
export function generateDashboardStats(): DashboardStats {
  const positions = generateMockPositions();
  const portfolioData = generatePortfolioData();
  
  const totalPortfolioValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.profit, 0);
  const totalPnLPercent = (totalPnL / (totalPortfolioValue - totalPnL)) * 100;
  
  // Calculate today's P&L (difference from yesterday)
  const todayValue = portfolioData[portfolioData.length - 1]?.value || 0;
  const yesterdayValue = portfolioData[portfolioData.length - 2]?.value || 0;
  const todayPnL = todayValue - yesterdayValue;
  const todayPnLPercent = yesterdayValue > 0 ? (todayPnL / yesterdayValue) * 100 : 0;
  
  // Calculate weekly P&L (difference from 7 days ago)
  const weekAgoValue = portfolioData[portfolioData.length - 8]?.value || 0;
  const weeklyPnL = todayValue - weekAgoValue;
  const weeklyPnLPercent = weekAgoValue > 0 ? (weeklyPnL / weekAgoValue) * 100 : 0;
  
  return {
    totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    totalPnLPercent: Math.round(totalPnLPercent * 100) / 100,
    openPositions: positions.length,
    todayPnL: Math.round(todayPnL * 100) / 100,
    todayPnLPercent: Math.round(todayPnLPercent * 100) / 100,
    weeklyPnL: Math.round(weeklyPnL * 100) / 100,
    weeklyPnLPercent: Math.round(weeklyPnLPercent * 100) / 100,
  };
}

// Format currency values
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage values
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Format large numbers (K, M, B)
export function formatLargeNumber(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

// Mock symbol info for testing percentage slider with different step sizes
export const mockSymbolInfo = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    filters: [
      {
        filterType: "LOT_SIZE",
        minQty: "0.00001",
        maxQty: "9000",
        stepSize: "0.00001"
      },
      {
        filterType: "NOTIONAL",
        minNotional: "5.0",
        applyMinToMarket: true,
        avgPriceMins: 5
      }
    ]
  },
  ETHUSDT: {
    symbol: "ETHUSDT", 
    filters: [
      {
        filterType: "LOT_SIZE",
        minQty: "0.0001",
        maxQty: "100000",
        stepSize: "0.0001"
      },
      {
        filterType: "NOTIONAL",
        minNotional: "5.0",
        applyMinToMarket: true,
        avgPriceMins: 5
      }
    ]
  }
};