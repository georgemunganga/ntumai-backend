import { ValueObject } from '../../../common/domain/value-object';

export type EarningsType = 'delivery' | 'bonus' | 'tip' | 'incentive' | 'penalty';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface EarningsDetailsProps {
  totalEarnings: number;
  deliveryEarnings: number;
  bonusEarnings: number;
  tips: number;
  incentiveEarnings: number;
  penalties: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  currency: string;
  lastPayoutDate?: Date;
  nextPayoutDate?: Date;
}

export class EarningsDetails extends ValueObject<EarningsDetailsProps> {
  private constructor(props: EarningsDetailsProps) {
    super(props);
  }

  public static create(props: EarningsDetailsProps): EarningsDetails {
    if (props.totalEarnings < 0 || props.deliveryEarnings < 0 || props.bonusEarnings < 0 || props.tips < 0) {
      throw new Error('Earnings amounts cannot be negative');
    }

    if (props.availableBalance < 0) {
      throw new Error('Available balance cannot be negative');
    }

    if (!props.currency || props.currency.length !== 3) {
      throw new Error('Currency must be a valid 3-letter code');
    }

    return new EarningsDetails(props);
  }

  public static createEmpty(currency: string = 'USD'): EarningsDetails {
    return new EarningsDetails({
      totalEarnings: 0,
      deliveryEarnings: 0,
      bonusEarnings: 0,
      tips: 0,
      incentiveEarnings: 0,
      penalties: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      currency,
    });
  }

  get totalEarnings(): number {
    return this.props.totalEarnings;
  }

  get deliveryEarnings(): number {
    return this.props.deliveryEarnings;
  }

  get bonusEarnings(): number {
    return this.props.bonusEarnings;
  }

  get tips(): number {
    return this.props.tips;
  }

  get incentiveEarnings(): number {
    return this.props.incentiveEarnings;
  }

  get penalties(): number {
    return this.props.penalties;
  }

  get availableBalance(): number {
    return this.props.availableBalance;
  }

  get pendingBalance(): number {
    return this.props.pendingBalance;
  }

  get totalWithdrawn(): number {
    return this.props.totalWithdrawn;
  }

  get currency(): string {
    return this.props.currency;
  }

  get lastPayoutDate(): Date | undefined {
    return this.props.lastPayoutDate;
  }

  get nextPayoutDate(): Date | undefined {
    return this.props.nextPayoutDate;
  }

  getNetEarnings(): number {
    return this.props.totalEarnings - this.props.penalties;
  }

  getTotalBalance(): number {
    return this.props.availableBalance + this.props.pendingBalance;
  }

  canWithdraw(amount: number): boolean {
    return amount > 0 && amount <= this.props.availableBalance;
  }

  getWithdrawalLimit(): number {
    return this.props.availableBalance;
  }

  addDeliveryEarning(amount: number): EarningsDetails {
    if (amount <= 0) {
      throw new Error('Delivery earning amount must be positive');
    }

    return EarningsDetails.create({
      ...this.props,
      deliveryEarnings: this.props.deliveryEarnings + amount,
      totalEarnings: this.props.totalEarnings + amount,
      pendingBalance: this.props.pendingBalance + amount,
    });
  }

  addBonus(amount: number): EarningsDetails {
    if (amount <= 0) {
      throw new Error('Bonus amount must be positive');
    }

    return EarningsDetails.create({
      ...this.props,
      bonusEarnings: this.props.bonusEarnings + amount,
      totalEarnings: this.props.totalEarnings + amount,
      pendingBalance: this.props.pendingBalance + amount,
    });
  }

  addTip(amount: number): EarningsDetails {
    if (amount <= 0) {
      throw new Error('Tip amount must be positive');
    }

    return EarningsDetails.create({
      ...this.props,
      tips: this.props.tips + amount,
      totalEarnings: this.props.totalEarnings + amount,
      pendingBalance: this.props.pendingBalance + amount,
    });
  }

  addIncentive(amount: number): EarningsDetails {
    if (amount <= 0) {
      throw new Error('Incentive amount must be positive');
    }

    return EarningsDetails.create({
      ...this.props,
      incentiveEarnings: this.props.incentiveEarnings + amount,
      totalEarnings: this.props.totalEarnings + amount,
      pendingBalance: this.props.pendingBalance + amount,
    });
  }

  addPenalty(amount: number): EarningsDetails {
    if (amount <= 0) {
      throw new Error('Penalty amount must be positive');
    }

    return EarningsDetails.create({
      ...this.props,
      penalties: this.props.penalties + amount,
      availableBalance: Math.max(0, this.props.availableBalance - amount),
    });
  }

  movePendingToAvailable(amount?: number): EarningsDetails {
    const amountToMove = amount || this.props.pendingBalance;
    
    if (amountToMove > this.props.pendingBalance) {
      throw new Error('Cannot move more than pending balance');
    }

    return EarningsDetails.create({
      ...this.props,
      availableBalance: this.props.availableBalance + amountToMove,
      pendingBalance: this.props.pendingBalance - amountToMove,
    });
  }

  processWithdrawal(amount: number): EarningsDetails {
    if (!this.canWithdraw(amount)) {
      throw new Error('Insufficient available balance for withdrawal');
    }

    return EarningsDetails.create({
      ...this.props,
      availableBalance: this.props.availableBalance - amount,
      totalWithdrawn: this.props.totalWithdrawn + amount,
      lastPayoutDate: new Date(),
    });
  }

  setNextPayoutDate(date: Date): EarningsDetails {
    return EarningsDetails.create({
      ...this.props,
      nextPayoutDate: date,
    });
  }

  getEarningsBreakdown(): {
    delivery: { amount: number; percentage: number };
    bonus: { amount: number; percentage: number };
    tips: { amount: number; percentage: number };
    incentives: { amount: number; percentage: number };
  } {
    const total = this.getNetEarnings();
    
    if (total === 0) {
      return {
        delivery: { amount: 0, percentage: 0 },
        bonus: { amount: 0, percentage: 0 },
        tips: { amount: 0, percentage: 0 },
        incentives: { amount: 0, percentage: 0 },
      };
    }

    return {
      delivery: {
        amount: this.props.deliveryEarnings,
        percentage: (this.props.deliveryEarnings / total) * 100,
      },
      bonus: {
        amount: this.props.bonusEarnings,
        percentage: (this.props.bonusEarnings / total) * 100,
      },
      tips: {
        amount: this.props.tips,
        percentage: (this.props.tips / total) * 100,
      },
      incentives: {
        amount: this.props.incentiveEarnings,
        percentage: (this.props.incentiveEarnings / total) * 100,
      },
    };
  }

  getAverageEarningsPerOrder(totalOrders: number): number {
    if (totalOrders === 0) return 0;
    return this.getNetEarnings() / totalOrders;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.props.currency,
    }).format(amount);
  }

  getFormattedTotalEarnings(): string {
    return this.formatAmount(this.props.totalEarnings);
  }

  getFormattedAvailableBalance(): string {
    return this.formatAmount(this.props.availableBalance);
  }

  getFormattedPendingBalance(): string {
    return this.formatAmount(this.props.pendingBalance);
  }

  getFormattedNetEarnings(): string {
    return this.formatAmount(this.getNetEarnings());
  }

  isPayoutDue(): boolean {
    if (!this.props.nextPayoutDate) return false;
    return new Date() >= this.props.nextPayoutDate;
  }

  getDaysUntilNextPayout(): number | null {
    if (!this.props.nextPayoutDate) return null;
    
    const now = new Date();
    const diffTime = this.props.nextPayoutDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  toJSON() {
    return {
      totalEarnings: this.props.totalEarnings,
      deliveryEarnings: this.props.deliveryEarnings,
      bonusEarnings: this.props.bonusEarnings,
      tips: this.props.tips,
      incentiveEarnings: this.props.incentiveEarnings,
      penalties: this.props.penalties,
      availableBalance: this.props.availableBalance,
      pendingBalance: this.props.pendingBalance,
      totalWithdrawn: this.props.totalWithdrawn,
      currency: this.props.currency,
      lastPayoutDate: this.props.lastPayoutDate,
      nextPayoutDate: this.props.nextPayoutDate,
    };
  }
}