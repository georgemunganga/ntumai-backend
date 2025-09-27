export class Rating {
  private static readonly MIN_RATING = 1;
  private static readonly MAX_RATING = 5;
  private static readonly PRECISION = 1; // 1 decimal place

  private constructor(
    private readonly _value: number,
    private readonly _reviewCount: number = 0
  ) {
    this.validateRating(_value);
    this.validateReviewCount(_reviewCount);
  }

  static create(value: number, reviewCount: number = 0): Rating {
    return new Rating(value, reviewCount);
  }

  static fromReviews(ratings: number[]): Rating {
    if (ratings.length === 0) {
      return new Rating(0, 0);
    }

    // Validate all individual ratings
    ratings.forEach(rating => {
      if (rating < Rating.MIN_RATING || rating > Rating.MAX_RATING) {
        throw new Error(`Individual rating must be between ${Rating.MIN_RATING} and ${Rating.MAX_RATING}`);
      }
    });

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    const average = sum / ratings.length;
    const roundedAverage = Math.round(average * Math.pow(10, Rating.PRECISION)) / Math.pow(10, Rating.PRECISION);
    
    return new Rating(roundedAverage, ratings.length);
  }

  static zero(): Rating {
    return new Rating(0, 0);
  }

  static perfect(): Rating {
    return new Rating(Rating.MAX_RATING, 1);
  }

  // Getters
  get value(): number {
    return this._value;
  }

  get reviewCount(): number {
    return this._reviewCount;
  }

  get minRating(): number {
    return Rating.MIN_RATING;
  }

  get maxRating(): number {
    return Rating.MAX_RATING;
  }

  // Validation methods
  private validateRating(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Rating value must be a valid number');
    }
    if (!Number.isFinite(value)) {
      throw new Error('Rating value must be finite');
    }
    if (value < 0 || value > Rating.MAX_RATING) {
      throw new Error(`Rating must be between 0 and ${Rating.MAX_RATING}`);
    }
    if (value > 0 && value < Rating.MIN_RATING) {
      throw new Error(`Non-zero rating must be at least ${Rating.MIN_RATING}`);
    }
    
    // Check precision
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > Rating.PRECISION) {
      throw new Error(`Rating cannot have more than ${Rating.PRECISION} decimal place(s)`);
    }
  }

  private validateReviewCount(count: number): void {
    if (typeof count !== 'number' || isNaN(count)) {
      throw new Error('Review count must be a valid number');
    }
    if (count < 0 || !Number.isInteger(count)) {
      throw new Error('Review count must be a non-negative integer');
    }
    if (count === 0 && this._value > 0) {
      throw new Error('Cannot have a rating without reviews');
    }
  }

  // Business logic methods
  addRating(newRating: number): Rating {
    if (newRating < Rating.MIN_RATING || newRating > Rating.MAX_RATING) {
      throw new Error(`New rating must be between ${Rating.MIN_RATING} and ${Rating.MAX_RATING}`);
    }

    if (this._reviewCount === 0) {
      return new Rating(newRating, 1);
    }

    const totalRating = this._value * this._reviewCount + newRating;
    const newReviewCount = this._reviewCount + 1;
    const newAverage = totalRating / newReviewCount;
    const roundedAverage = Math.round(newAverage * Math.pow(10, Rating.PRECISION)) / Math.pow(10, Rating.PRECISION);
    
    return new Rating(roundedAverage, newReviewCount);
  }

  removeRating(ratingToRemove: number): Rating {
    if (this._reviewCount === 0) {
      throw new Error('Cannot remove rating from empty rating set');
    }
    if (this._reviewCount === 1) {
      return Rating.zero();
    }
    if (ratingToRemove < Rating.MIN_RATING || ratingToRemove > Rating.MAX_RATING) {
      throw new Error(`Rating to remove must be between ${Rating.MIN_RATING} and ${Rating.MAX_RATING}`);
    }

    const totalRating = this._value * this._reviewCount - ratingToRemove;
    const newReviewCount = this._reviewCount - 1;
    const newAverage = totalRating / newReviewCount;
    const roundedAverage = Math.round(newAverage * Math.pow(10, Rating.PRECISION)) / Math.pow(10, Rating.PRECISION);
    
    return new Rating(roundedAverage, newReviewCount);
  }

  updateRating(oldRating: number, newRating: number): Rating {
    if (this._reviewCount === 0) {
      throw new Error('Cannot update rating in empty rating set');
    }
    if (oldRating < Rating.MIN_RATING || oldRating > Rating.MAX_RATING) {
      throw new Error(`Old rating must be between ${Rating.MIN_RATING} and ${Rating.MAX_RATING}`);
    }
    if (newRating < Rating.MIN_RATING || newRating > Rating.MAX_RATING) {
      throw new Error(`New rating must be between ${Rating.MIN_RATING} and ${Rating.MAX_RATING}`);
    }

    const totalRating = this._value * this._reviewCount - oldRating + newRating;
    const newAverage = totalRating / this._reviewCount;
    const roundedAverage = Math.round(newAverage * Math.pow(10, Rating.PRECISION)) / Math.pow(10, Rating.PRECISION);
    
    return new Rating(roundedAverage, this._reviewCount);
  }

  // Comparison methods
  equals(other: Rating): boolean {
    return this._value === other._value && this._reviewCount === other._reviewCount;
  }

  isGreaterThan(other: Rating): boolean {
    return this._value > other._value;
  }

  isLessThan(other: Rating): boolean {
    return this._value < other._value;
  }

  isGreaterThanOrEqual(other: Rating): boolean {
    return this._value >= other._value;
  }

  isLessThanOrEqual(other: Rating): boolean {
    return this._value <= other._value;
  }

  // Status methods
  isEmpty(): boolean {
    return this._reviewCount === 0;
  }

  hasReviews(): boolean {
    return this._reviewCount > 0;
  }

  isExcellent(): boolean {
    return this._value >= 4.5;
  }

  isGood(): boolean {
    return this._value >= 3.5 && this._value < 4.5;
  }

  isAverage(): boolean {
    return this._value >= 2.5 && this._value < 3.5;
  }

  isPoor(): boolean {
    return this._value >= 1.5 && this._value < 2.5;
  }

  isTerrible(): boolean {
    return this._value > 0 && this._value < 1.5;
  }

  isPerfect(): boolean {
    return this._value === Rating.MAX_RATING;
  }

  // Quality assessment
  getQualityLevel(): string {
    if (this.isEmpty()) return 'No ratings';
    if (this.isExcellent()) return 'Excellent';
    if (this.isGood()) return 'Good';
    if (this.isAverage()) return 'Average';
    if (this.isPoor()) return 'Poor';
    if (this.isTerrible()) return 'Terrible';
    return 'Unknown';
  }

  getStarRating(): number {
    return Math.round(this._value);
  }

  getHalfStarRating(): number {
    return Math.round(this._value * 2) / 2;
  }

  // Statistical methods
  getPercentage(): number {
    return (this._value / Rating.MAX_RATING) * 100;
  }

  getReliabilityScore(): number {
    // More reviews = more reliable rating
    if (this._reviewCount === 0) return 0;
    if (this._reviewCount >= 100) return 1;
    return Math.min(this._reviewCount / 100, 1);
  }

  getWeightedScore(): number {
    // Combines rating value with reliability
    return this._value * this.getReliabilityScore();
  }

  // Display methods
  toString(): string {
    if (this.isEmpty()) {
      return 'No rating';
    }
    return `${this._value}/5 (${this._reviewCount} review${this._reviewCount === 1 ? '' : 's'})`;
  }

  toStarString(): string {
    if (this.isEmpty()) {
      return '☆☆☆☆☆';
    }
    
    const fullStars = Math.floor(this._value);
    const hasHalfStar = this._value % 1 >= 0.5;
    const emptyStars = Rating.MAX_RATING - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  toJSON() {
    return {
      value: this._value,
      reviewCount: this._reviewCount,
      qualityLevel: this.getQualityLevel(),
      percentage: this.getPercentage(),
      starRating: this.getStarRating()
    };
  }

  // Static utility methods
  static average(ratings: Rating[]): Rating {
    if (ratings.length === 0) {
      return Rating.zero();
    }

    const ratingsWithReviews = ratings.filter(r => r.hasReviews());
    if (ratingsWithReviews.length === 0) {
      return Rating.zero();
    }

    let totalWeightedRating = 0;
    let totalReviews = 0;

    ratingsWithReviews.forEach(rating => {
      totalWeightedRating += rating.value * rating.reviewCount;
      totalReviews += rating.reviewCount;
    });

    const averageRating = totalWeightedRating / totalReviews;
    const roundedAverage = Math.round(averageRating * Math.pow(10, Rating.PRECISION)) / Math.pow(10, Rating.PRECISION);
    
    return new Rating(roundedAverage, totalReviews);
  }

  static highest(ratings: Rating[]): Rating {
    if (ratings.length === 0) {
      return Rating.zero();
    }
    
    return ratings.reduce((highest, current) => 
      current.isGreaterThan(highest) ? current : highest
    );
  }

  static lowest(ratings: Rating[]): Rating {
    if (ratings.length === 0) {
      return Rating.zero();
    }
    
    const ratingsWithReviews = ratings.filter(r => r.hasReviews());
    if (ratingsWithReviews.length === 0) {
      return Rating.zero();
    }
    
    return ratingsWithReviews.reduce((lowest, current) => 
      current.isLessThan(lowest) ? current : lowest
    );
  }

  // Validation helpers
  static isValidRatingValue(value: number): boolean {
    try {
      new Rating(value, 1);
      return true;
    } catch {
      return false;
    }
  }

  static getValidRatingRange(): { min: number; max: number } {
    return { min: Rating.MIN_RATING, max: Rating.MAX_RATING };
  }
}