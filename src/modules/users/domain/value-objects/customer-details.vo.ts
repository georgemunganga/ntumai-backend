export interface CustomerDetailsProps {
  preferences: {
    cuisineTypes?: string[]; // e.g., ['ITALIAN', 'CHINESE', 'INDIAN']
    dietaryRestrictions?: string[]; // e.g., ['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE']
    spiceLevel?: 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
    allergens?: string[]; // e.g., ['NUTS', 'DAIRY', 'SHELLFISH']
    preferredDeliveryTime?: {
      start: string; // HH:MM format
      end: string; // HH:MM format
    };
    maxDeliveryDistance?: number; // in kilometers
    budgetRange?: {
      min: number;
      max: number;
    };
  };
  loyaltyProgram: {
    membershipTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    points: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    memberSince: Date;
    nextTierRequirement?: number; // points needed for next tier
  };
  orderHistory: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    favoriteVendors: string[]; // vendor IDs
    favoriteItems: string[]; // product IDs
    lastOrderDate?: Date;
    cancelledOrders: number;
    completedOrders: number;
  };
  paymentPreferences: {
    preferredPaymentMethod: 'CASH' | 'CARD' | 'DIGITAL_WALLET';
    savedPaymentMethods: {
      id: string;
      type: 'CARD' | 'DIGITAL_WALLET';
      lastFourDigits?: string;
      expiryMonth?: number;
      expiryYear?: number;
      isDefault: boolean;
    }[];
    autoPayEnabled: boolean;
  };
  deliveryPreferences: {
    defaultDeliveryAddress?: string; // address ID
    deliveryInstructions?: string;
    contactlessDelivery: boolean;
    leaveAtDoor: boolean;
    callOnArrival: boolean;
    preferredDeliveryWindow?: {
      start: string; // HH:MM format
      end: string; // HH:MM format
    };
  };
  communicationPreferences: {
    orderUpdates: {
      sms: boolean;
      email: boolean;
      push: boolean;
    };
    promotionalOffers: {
      sms: boolean;
      email: boolean;
      push: boolean;
    };
    newVendorAlerts: boolean;
    weeklyDigest: boolean;
    preferredLanguage: string;
  };
  socialFeatures: {
    allowReviews: boolean;
    allowPhotos: boolean;
    shareOrderHistory: boolean;
    followFriends: boolean;
    publicProfile: boolean;
  };
  subscriptions?: {
    id: string;
    type: 'PREMIUM' | 'DELIVERY_PASS' | 'VENDOR_SPECIFIC';
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    autoRenew: boolean;
    benefits: string[];
  }[];
  specialOffers: {
    eligibleForNewUserDiscount: boolean;
    referralCode?: string;
    referredBy?: string; // user ID
    totalReferrals: number;
    appliedPromoCodes: string[];
  };
  customerSupport: {
    preferredContactMethod: 'PHONE' | 'EMAIL' | 'CHAT';
    previousTickets: number;
    satisfactionRating?: number; // 1-5 scale
    blockedVendors?: string[]; // vendor IDs
  };
}

export class CustomerDetails {
  private constructor(private readonly props: CustomerDetailsProps) {}

  static create(props: CustomerDetailsProps): CustomerDetails {
    const details = new CustomerDetails(props);
    details.validate();
    return details;
  }

  static createDefault(): CustomerDetails {
    return CustomerDetails.create({
      preferences: {
        cuisineTypes: [],
        dietaryRestrictions: [],
        allergens: []
      },
      loyaltyProgram: {
        membershipTier: 'BRONZE',
        points: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        memberSince: new Date()
      },
      orderHistory: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteVendors: [],
        favoriteItems: [],
        cancelledOrders: 0,
        completedOrders: 0
      },
      paymentPreferences: {
        preferredPaymentMethod: 'CARD',
        savedPaymentMethods: [],
        autoPayEnabled: false
      },
      deliveryPreferences: {
        contactlessDelivery: false,
        leaveAtDoor: false,
        callOnArrival: true
      },
      communicationPreferences: {
        orderUpdates: {
          sms: true,
          email: true,
          push: true
        },
        promotionalOffers: {
          sms: false,
          email: true,
          push: false
        },
        newVendorAlerts: true,
        weeklyDigest: false,
        preferredLanguage: 'en'
      },
      socialFeatures: {
        allowReviews: true,
        allowPhotos: true,
        shareOrderHistory: false,
        followFriends: false,
        publicProfile: false
      },
      specialOffers: {
        eligibleForNewUserDiscount: true,
        totalReferrals: 0,
        appliedPromoCodes: []
      },
      customerSupport: {
        preferredContactMethod: 'EMAIL',
        previousTickets: 0
      }
    });
  }

  // Getters
  get preferences(): CustomerDetailsProps['preferences'] {
    return this.props.preferences;
  }

  get loyaltyProgram(): CustomerDetailsProps['loyaltyProgram'] {
    return this.props.loyaltyProgram;
  }

  get orderHistory(): CustomerDetailsProps['orderHistory'] {
    return this.props.orderHistory;
  }

  get paymentPreferences(): CustomerDetailsProps['paymentPreferences'] {
    return this.props.paymentPreferences;
  }

  get deliveryPreferences(): CustomerDetailsProps['deliveryPreferences'] {
    return this.props.deliveryPreferences;
  }

  get communicationPreferences(): CustomerDetailsProps['communicationPreferences'] {
    return this.props.communicationPreferences;
  }

  get socialFeatures(): CustomerDetailsProps['socialFeatures'] {
    return this.props.socialFeatures;
  }

  get subscriptions(): CustomerDetailsProps['subscriptions'] {
    return this.props.subscriptions;
  }

  get specialOffers(): CustomerDetailsProps['specialOffers'] {
    return this.props.specialOffers;
  }

  get customerSupport(): CustomerDetailsProps['customerSupport'] {
    return this.props.customerSupport;
  }

  // Update methods
  updatePreferences(preferences: Partial<CustomerDetailsProps['preferences']>): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      preferences: {
        ...this.props.preferences,
        ...preferences
      }
    });
  }

  updatePaymentPreferences(preferences: Partial<CustomerDetailsProps['paymentPreferences']>): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      paymentPreferences: {
        ...this.props.paymentPreferences,
        ...preferences
      }
    });
  }

  updateDeliveryPreferences(preferences: Partial<CustomerDetailsProps['deliveryPreferences']>): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      deliveryPreferences: {
        ...this.props.deliveryPreferences,
        ...preferences
      }
    });
  }

  updateCommunicationPreferences(preferences: Partial<CustomerDetailsProps['communicationPreferences']>): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      communicationPreferences: {
        ...this.props.communicationPreferences,
        orderUpdates: {
          ...this.props.communicationPreferences.orderUpdates,
          ...preferences.orderUpdates
        },
        promotionalOffers: {
          ...this.props.communicationPreferences.promotionalOffers,
          ...preferences.promotionalOffers
        },
        ...preferences
      }
    });
  }

  updateSocialFeatures(features: Partial<CustomerDetailsProps['socialFeatures']>): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      socialFeatures: {
        ...this.props.socialFeatures,
        ...features
      }
    });
  }

  updateCustomerSupport(support: Partial<CustomerDetailsProps['customerSupport']>): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      customerSupport: {
        ...this.props.customerSupport,
        ...support
      }
    });
  }

  // Loyalty program methods
  addLoyaltyPoints(points: number, reason?: string): CustomerDetails {
    if (points <= 0) {
      throw new Error('Points to add must be greater than 0');
    }

    const newTotalPoints = this.props.loyaltyProgram.points + points;
    const newTotalEarned = this.props.loyaltyProgram.totalPointsEarned + points;
    const newTier = this.calculateMembershipTier(newTotalEarned);

    return CustomerDetails.create({
      ...this.props,
      loyaltyProgram: {
        ...this.props.loyaltyProgram,
        points: newTotalPoints,
        totalPointsEarned: newTotalEarned,
        membershipTier: newTier,
        nextTierRequirement: this.calculateNextTierRequirement(newTotalEarned)
      }
    });
  }

  redeemLoyaltyPoints(points: number): CustomerDetails {
    if (points <= 0) {
      throw new Error('Points to redeem must be greater than 0');
    }

    if (points > this.props.loyaltyProgram.points) {
      throw new Error('Insufficient loyalty points');
    }

    return CustomerDetails.create({
      ...this.props,
      loyaltyProgram: {
        ...this.props.loyaltyProgram,
        points: this.props.loyaltyProgram.points - points,
        totalPointsRedeemed: this.props.loyaltyProgram.totalPointsRedeemed + points
      }
    });
  }

  // Order history methods
  addOrder(orderValue: number, vendorId: string, itemIds: string[]): CustomerDetails {
    const newTotalOrders = this.props.orderHistory.totalOrders + 1;
    const newTotalSpent = this.props.orderHistory.totalSpent + orderValue;
    const newAverageOrderValue = newTotalSpent / newTotalOrders;

    // Update favorite vendors (simple frequency-based)
    const favoriteVendors = [...this.props.orderHistory.favoriteVendors];
    if (!favoriteVendors.includes(vendorId)) {
      favoriteVendors.push(vendorId);
    }

    // Update favorite items
    const favoriteItems = [...this.props.orderHistory.favoriteItems];
    itemIds.forEach(itemId => {
      if (!favoriteItems.includes(itemId)) {
        favoriteItems.push(itemId);
      }
    });

    return CustomerDetails.create({
      ...this.props,
      orderHistory: {
        ...this.props.orderHistory,
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        averageOrderValue: newAverageOrderValue,
        favoriteVendors,
        favoriteItems,
        lastOrderDate: new Date()
      }
    });
  }

  completeOrder(): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      orderHistory: {
        ...this.props.orderHistory,
        completedOrders: this.props.orderHistory.completedOrders + 1
      }
    });
  }

  cancelOrder(): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      orderHistory: {
        ...this.props.orderHistory,
        cancelledOrders: this.props.orderHistory.cancelledOrders + 1
      }
    });
  }

  // Payment methods
  addPaymentMethod(paymentMethod: CustomerDetailsProps['paymentPreferences']['savedPaymentMethods'][0]): CustomerDetails {
    const savedMethods = [...this.props.paymentPreferences.savedPaymentMethods];
    
    // If this is set as default, remove default from others
    if (paymentMethod.isDefault) {
      savedMethods.forEach(method => method.isDefault = false);
    }
    
    savedMethods.push(paymentMethod);

    return CustomerDetails.create({
      ...this.props,
      paymentPreferences: {
        ...this.props.paymentPreferences,
        savedPaymentMethods: savedMethods
      }
    });
  }

  removePaymentMethod(methodId: string): CustomerDetails {
    const savedMethods = this.props.paymentPreferences.savedPaymentMethods
      .filter(method => method.id !== methodId);

    return CustomerDetails.create({
      ...this.props,
      paymentPreferences: {
        ...this.props.paymentPreferences,
        savedPaymentMethods: savedMethods
      }
    });
  }

  setDefaultPaymentMethod(methodId: string): CustomerDetails {
    const savedMethods = this.props.paymentPreferences.savedPaymentMethods.map(method => ({
      ...method,
      isDefault: method.id === methodId
    }));

    if (!savedMethods.some(method => method.id === methodId)) {
      throw new Error('Payment method not found');
    }

    return CustomerDetails.create({
      ...this.props,
      paymentPreferences: {
        ...this.props.paymentPreferences,
        savedPaymentMethods: savedMethods
      }
    });
  }

  // Subscription methods
  addSubscription(subscription: CustomerDetailsProps['subscriptions'][0]): CustomerDetails {
    const subscriptions = [...(this.props.subscriptions || [])];
    subscriptions.push(subscription);

    return CustomerDetails.create({
      ...this.props,
      subscriptions
    });
  }

  updateSubscription(subscriptionId: string, updates: Partial<CustomerDetailsProps['subscriptions'][0]>): CustomerDetails {
    const subscriptions = (this.props.subscriptions || []).map(sub => 
      sub.id === subscriptionId ? { ...sub, ...updates } : sub
    );

    return CustomerDetails.create({
      ...this.props,
      subscriptions
    });
  }

  cancelSubscription(subscriptionId: string): CustomerDetails {
    const subscriptions = (this.props.subscriptions || []).map(sub => 
      sub.id === subscriptionId ? { ...sub, isActive: false, autoRenew: false } : sub
    );

    return CustomerDetails.create({
      ...this.props,
      subscriptions
    });
  }

  // Special offers methods
  useNewUserDiscount(): CustomerDetails {
    if (!this.props.specialOffers.eligibleForNewUserDiscount) {
      throw new Error('Customer is not eligible for new user discount');
    }

    return CustomerDetails.create({
      ...this.props,
      specialOffers: {
        ...this.props.specialOffers,
        eligibleForNewUserDiscount: false
      }
    });
  }

  addReferral(): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      specialOffers: {
        ...this.props.specialOffers,
        totalReferrals: this.props.specialOffers.totalReferrals + 1
      }
    });
  }

  applyPromoCode(promoCode: string): CustomerDetails {
    if (this.props.specialOffers.appliedPromoCodes.includes(promoCode)) {
      throw new Error('Promo code already applied');
    }

    return CustomerDetails.create({
      ...this.props,
      specialOffers: {
        ...this.props.specialOffers,
        appliedPromoCodes: [...this.props.specialOffers.appliedPromoCodes, promoCode]
      }
    });
  }

  setReferralCode(referralCode: string): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      specialOffers: {
        ...this.props.specialOffers,
        referralCode
      }
    });
  }

  // Customer support methods
  addSupportTicket(): CustomerDetails {
    return CustomerDetails.create({
      ...this.props,
      customerSupport: {
        ...this.props.customerSupport,
        previousTickets: this.props.customerSupport.previousTickets + 1
      }
    });
  }

  blockVendor(vendorId: string): CustomerDetails {
    const blockedVendors = [...(this.props.customerSupport.blockedVendors || [])];
    if (!blockedVendors.includes(vendorId)) {
      blockedVendors.push(vendorId);
    }

    return CustomerDetails.create({
      ...this.props,
      customerSupport: {
        ...this.props.customerSupport,
        blockedVendors
      }
    });
  }

  unblockVendor(vendorId: string): CustomerDetails {
    const blockedVendors = (this.props.customerSupport.blockedVendors || [])
      .filter(id => id !== vendorId);

    return CustomerDetails.create({
      ...this.props,
      customerSupport: {
        ...this.props.customerSupport,
        blockedVendors
      }
    });
  }

  // Helper methods
  isVendorBlocked(vendorId: string): boolean {
    return (this.props.customerSupport.blockedVendors || []).includes(vendorId);
  }

  hasActiveSubscription(type?: string): boolean {
    if (!this.props.subscriptions) return false;
    
    return this.props.subscriptions.some(sub => {
      const isActive = sub.isActive && new Date() <= sub.endDate;
      return type ? isActive && sub.type === type : isActive;
    });
  }

  getActiveSubscriptions(): CustomerDetailsProps['subscriptions'] {
    if (!this.props.subscriptions) return [];
    
    return this.props.subscriptions.filter(sub => 
      sub.isActive && new Date() <= sub.endDate
    );
  }

  canReceivePromotions(): boolean {
    return this.props.communicationPreferences.promotionalOffers.email ||
           this.props.communicationPreferences.promotionalOffers.sms ||
           this.props.communicationPreferences.promotionalOffers.push;
  }

  getDefaultPaymentMethod(): CustomerDetailsProps['paymentPreferences']['savedPaymentMethods'][0] | undefined {
    return this.props.paymentPreferences.savedPaymentMethods
      .find(method => method.isDefault);
  }

  hasPaymentMethods(): boolean {
    return this.props.paymentPreferences.savedPaymentMethods.length > 0;
  }

  getCancellationRate(): number {
    const totalOrders = this.props.orderHistory.totalOrders;
    if (totalOrders === 0) return 0;
    
    return (this.props.orderHistory.cancelledOrders / totalOrders) * 100;
  }

  getCompletionRate(): number {
    const totalOrders = this.props.orderHistory.totalOrders;
    if (totalOrders === 0) return 0;
    
    return (this.props.orderHistory.completedOrders / totalOrders) * 100;
  }

  isLoyalCustomer(): boolean {
    return this.props.loyaltyProgram.membershipTier === 'GOLD' || 
           this.props.loyaltyProgram.membershipTier === 'PLATINUM';
  }

  isNewCustomer(): boolean {
    return this.props.orderHistory.totalOrders === 0 || 
           this.props.specialOffers.eligibleForNewUserDiscount;
  }

  isHighValueCustomer(): boolean {
    return this.props.orderHistory.averageOrderValue > 50 || // configurable threshold
           this.props.orderHistory.totalSpent > 500; // configurable threshold
  }

  hasPreferences(): boolean {
    return (this.props.preferences.cuisineTypes?.length || 0) > 0 ||
           (this.props.preferences.dietaryRestrictions?.length || 0) > 0 ||
           (this.props.preferences.allergens?.length || 0) > 0;
  }

  matchesCuisinePreference(cuisineType: string): boolean {
    if (!this.props.preferences.cuisineTypes?.length) return true; // no preference = matches all
    return this.props.preferences.cuisineTypes.includes(cuisineType);
  }

  hasDietaryRestriction(restriction: string): boolean {
    return (this.props.preferences.dietaryRestrictions || []).includes(restriction);
  }

  hasAllergen(allergen: string): boolean {
    return (this.props.preferences.allergens || []).includes(allergen);
  }

  isWithinBudget(price: number): boolean {
    const budget = this.props.preferences.budgetRange;
    if (!budget) return true;
    
    return price >= budget.min && price <= budget.max;
  }

  isWithinDeliveryDistance(distance: number): boolean {
    const maxDistance = this.props.preferences.maxDeliveryDistance;
    if (!maxDistance) return true;
    
    return distance <= maxDistance;
  }

  // Private helper methods
  private calculateMembershipTier(totalPointsEarned: number): CustomerDetailsProps['loyaltyProgram']['membershipTier'] {
    if (totalPointsEarned >= 10000) return 'PLATINUM';
    if (totalPointsEarned >= 5000) return 'GOLD';
    if (totalPointsEarned >= 1000) return 'SILVER';
    return 'BRONZE';
  }

  private calculateNextTierRequirement(totalPointsEarned: number): number | undefined {
    if (totalPointsEarned < 1000) return 1000 - totalPointsEarned;
    if (totalPointsEarned < 5000) return 5000 - totalPointsEarned;
    if (totalPointsEarned < 10000) return 10000 - totalPointsEarned;
    return undefined; // Already at highest tier
  }

  // Validation
  private validate(): void {
    const errors: string[] = [];

    // Validate loyalty program
    if (this.props.loyaltyProgram.points < 0) {
      errors.push('Loyalty points cannot be negative');
    }

    if (this.props.loyaltyProgram.totalPointsEarned < 0) {
      errors.push('Total points earned cannot be negative');
    }

    if (this.props.loyaltyProgram.totalPointsRedeemed < 0) {
      errors.push('Total points redeemed cannot be negative');
    }

    // Validate order history
    if (this.props.orderHistory.totalOrders < 0) {
      errors.push('Total orders cannot be negative');
    }

    if (this.props.orderHistory.totalSpent < 0) {
      errors.push('Total spent cannot be negative');
    }

    if (this.props.orderHistory.averageOrderValue < 0) {
      errors.push('Average order value cannot be negative');
    }

    // Validate budget range
    if (this.props.preferences.budgetRange) {
      const { min, max } = this.props.preferences.budgetRange;
      if (min < 0 || max < 0) {
        errors.push('Budget range values cannot be negative');
      }
      if (min > max) {
        errors.push('Budget minimum cannot be greater than maximum');
      }
    }

    // Validate delivery distance
    if (this.props.preferences.maxDeliveryDistance !== undefined && 
        this.props.preferences.maxDeliveryDistance <= 0) {
      errors.push('Max delivery distance must be greater than 0');
    }

    // Validate time formats
    if (this.props.preferences.preferredDeliveryTime) {
      const { start, end } = this.props.preferences.preferredDeliveryTime;
      if (!this.isValidTimeFormat(start) || !this.isValidTimeFormat(end)) {
        errors.push('Invalid preferred delivery time format');
      }
    }

    if (this.props.deliveryPreferences.preferredDeliveryWindow) {
      const { start, end } = this.props.deliveryPreferences.preferredDeliveryWindow;
      if (!this.isValidTimeFormat(start) || !this.isValidTimeFormat(end)) {
        errors.push('Invalid preferred delivery window format');
      }
    }

    // Validate payment methods
    this.props.paymentPreferences.savedPaymentMethods.forEach((method, index) => {
      if (!method.id?.trim()) {
        errors.push(`Payment method at index ${index} must have an ID`);
      }
      if (method.type === 'CARD' && method.lastFourDigits && !/^\d{4}$/.test(method.lastFourDigits)) {
        errors.push(`Invalid last four digits format for payment method at index ${index}`);
      }
    });

    // Validate subscriptions
    if (this.props.subscriptions) {
      this.props.subscriptions.forEach((sub, index) => {
        if (!sub.id?.trim()) {
          errors.push(`Subscription at index ${index} must have an ID`);
        }
        if (sub.startDate >= sub.endDate) {
          errors.push(`Subscription at index ${index} end date must be after start date`);
        }
      });
    }

    // Validate customer support rating
    if (this.props.customerSupport.satisfactionRating !== undefined) {
      const rating = this.props.customerSupport.satisfactionRating;
      if (rating < 1 || rating > 5) {
        errors.push('Customer satisfaction rating must be between 1 and 5');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Customer details validation failed: ${errors.join(', ')}`);
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  toPlainObject(): CustomerDetailsProps {
    return JSON.parse(JSON.stringify(this.props));
  }

  equals(other: CustomerDetails): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }
}