export class Price {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string
  ) {
    this.validateAmount(_amount);
    this.validateCurrency(_currency);
  }

  static create(amount: number, currency: string): Price {
    return new Price(amount, currency);
  }

  static fromString(priceString: string, currency: string): Price {
    const amount = parseFloat(priceString);
    if (isNaN(amount)) {
      throw new Error('Invalid price string format');
    }
    return new Price(amount, currency);
  }

  static zero(currency: string): Price {
    return new Price(0, currency);
  }

  // Getters
  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  // Validation methods
  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Price amount must be a valid number');
    }
    if (amount < 0) {
      throw new Error('Price amount cannot be negative');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Price amount must be finite');
    }
    // Check for reasonable precision (max 2 decimal places for most currencies)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new Error('Price amount cannot have more than 2 decimal places');
    }
  }

  private validateCurrency(currency: string): void {
    if (!currency || typeof currency !== 'string') {
      throw new Error('Currency must be a non-empty string');
    }
    if (currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error('Currency must be uppercase 3-letter ISO code');
    }
  }

  // Arithmetic operations
  add(other: Price): Price {
    this.ensureSameCurrency(other);
    return new Price(this._amount + other._amount, this._currency);
  }

  subtract(other: Price): Price {
    this.ensureSameCurrency(other);
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new Error('Subtraction would result in negative price');
    }
    return new Price(result, this._currency);
  }

  multiply(factor: number): Price {
    if (typeof factor !== 'number' || isNaN(factor) || factor < 0) {
      throw new Error('Multiplication factor must be a non-negative number');
    }
    return new Price(this._amount * factor, this._currency);
  }

  divide(divisor: number): Price {
    if (typeof divisor !== 'number' || isNaN(divisor) || divisor <= 0) {
      throw new Error('Division divisor must be a positive number');
    }
    return new Price(this._amount / divisor, this._currency);
  }

  // Percentage operations
  applyPercentage(percentage: number): Price {
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      throw new Error('Percentage must be a valid number');
    }
    const multiplier = 1 + (percentage / 100);
    return this.multiply(multiplier);
  }

  applyDiscount(discountPercentage: number): Price {
    if (typeof discountPercentage !== 'number' || isNaN(discountPercentage)) {
      throw new Error('Discount percentage must be a valid number');
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }
    const multiplier = 1 - (discountPercentage / 100);
    return this.multiply(multiplier);
  }

  calculateDiscount(discountAmount: Price): Price {
    this.ensureSameCurrency(discountAmount);
    if (discountAmount._amount > this._amount) {
      throw new Error('Discount amount cannot exceed original price');
    }
    return this.subtract(discountAmount);
  }

  // Comparison methods
  equals(other: Price): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  isGreaterThan(other: Price): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  isLessThan(other: Price): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  isGreaterThanOrEqual(other: Price): boolean {
    this.ensureSameCurrency(other);
    return this._amount >= other._amount;
  }

  isLessThanOrEqual(other: Price): boolean {
    this.ensureSameCurrency(other);
    return this._amount <= other._amount;
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  isPositive(): boolean {
    return this._amount > 0;
  }

  // Utility methods
  private ensureSameCurrency(other: Price): void {
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`);
    }
  }

  // Formatting methods
  toString(): string {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }

  toDisplayString(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this._amount);
  }

  toJSON() {
    return {
      amount: this._amount,
      currency: this._currency
    };
  }

  // Rounding methods
  round(precision: number = 2): Price {
    const factor = Math.pow(10, precision);
    const rounded = Math.round(this._amount * factor) / factor;
    return new Price(rounded, this._currency);
  }

  ceil(): Price {
    return new Price(Math.ceil(this._amount), this._currency);
  }

  floor(): Price {
    return new Price(Math.floor(this._amount), this._currency);
  }

  // Tax calculations
  addTax(taxRate: number): Price {
    if (typeof taxRate !== 'number' || isNaN(taxRate) || taxRate < 0) {
      throw new Error('Tax rate must be a non-negative number');
    }
    return this.applyPercentage(taxRate);
  }

  calculateTaxAmount(taxRate: number): Price {
    if (typeof taxRate !== 'number' || isNaN(taxRate) || taxRate < 0) {
      throw new Error('Tax rate must be a non-negative number');
    }
    const taxAmount = (this._amount * taxRate) / 100;
    return new Price(taxAmount, this._currency);
  }

  // Static utility methods
  static sum(prices: Price[]): Price {
    if (prices.length === 0) {
      throw new Error('Cannot sum empty array of prices');
    }
    
    const currency = prices[0].currency;
    let total = 0;
    
    for (const price of prices) {
      if (price.currency !== currency) {
        throw new Error(`All prices must have the same currency. Expected ${currency}, got ${price.currency}`);
      }
      total += price.amount;
    }
    
    return new Price(total, currency);
  }

  static min(prices: Price[]): Price {
    if (prices.length === 0) {
      throw new Error('Cannot find minimum of empty array');
    }
    
    return prices.reduce((min, current) => 
      current.isLessThan(min) ? current : min
    );
  }

  static max(prices: Price[]): Price {
    if (prices.length === 0) {
      throw new Error('Cannot find maximum of empty array');
    }
    
    return prices.reduce((max, current) => 
      current.isGreaterThan(max) ? current : max
    );
  }

  static average(prices: Price[]): Price {
    if (prices.length === 0) {
      throw new Error('Cannot calculate average of empty array');
    }
    
    const sum = Price.sum(prices);
    return sum.divide(prices.length);
  }
}