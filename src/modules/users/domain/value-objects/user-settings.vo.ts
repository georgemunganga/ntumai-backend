export interface UserSettingsProps {
  notifications: {
    email: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
      security: boolean;
    };
    sms: {
      orderUpdates: boolean;
      promotions: boolean;
      security: boolean;
    };
    push: {
      orderUpdates: boolean;
      promotions: boolean;
      chat: boolean;
      general: boolean;
    };
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    theme: 'LIGHT' | 'DARK' | 'AUTO';
    language: string;
    timezone: string;
    currency: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12H' | '24H';
  };
  security: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number; // in minutes
    allowMultipleSessions: boolean;
  };
  delivery: {
    defaultAddressId?: string;
    preferredDeliveryTime?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
    specialInstructions?: string;
    contactlessDelivery: boolean;
  };
}

export class UserSettings {
  private constructor(private readonly props: UserSettingsProps) {}

  static create(props: Partial<UserSettingsProps>): UserSettings {
    const defaultSettings = UserSettings.getDefaultSettings();
    const mergedProps = UserSettings.deepMerge(defaultSettings, props);
    const settings = new UserSettings(mergedProps);
    settings.validate();
    return settings;
  }

  static getDefaultSettings(): UserSettingsProps {
    return {
      notifications: {
        email: {
          orderUpdates: true,
          promotions: false,
          newsletter: false,
          security: true
        },
        sms: {
          orderUpdates: true,
          promotions: false,
          security: true
        },
        push: {
          orderUpdates: true,
          promotions: false,
          chat: true,
          general: true
        }
      },
      privacy: {
        profileVisibility: 'PUBLIC',
        showOnlineStatus: true,
        allowDirectMessages: true,
        showEmail: false,
        showPhone: false
      },
      preferences: {
        theme: 'AUTO',
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24H'
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 60, // 1 hour
        allowMultipleSessions: true
      },
      delivery: {
        contactlessDelivery: false
      }
    };
  }

  // Getters
  get notifications(): UserSettingsProps['notifications'] {
    return this.props.notifications;
  }

  get privacy(): UserSettingsProps['privacy'] {
    return this.props.privacy;
  }

  get preferences(): UserSettingsProps['preferences'] {
    return this.props.preferences;
  }

  get security(): UserSettingsProps['security'] {
    return this.props.security;
  }

  get delivery(): UserSettingsProps['delivery'] {
    return this.props.delivery;
  }

  // Update methods
  updateNotificationSettings(notifications: Partial<UserSettingsProps['notifications']>): UserSettings {
    return UserSettings.create({
      ...this.props,
      notifications: UserSettings.deepMerge(this.props.notifications, notifications)
    });
  }

  updatePrivacySettings(privacy: Partial<UserSettingsProps['privacy']>): UserSettings {
    return UserSettings.create({
      ...this.props,
      privacy: {
        ...this.props.privacy,
        ...privacy
      }
    });
  }

  updatePreferences(preferences: Partial<UserSettingsProps['preferences']>): UserSettings {
    return UserSettings.create({
      ...this.props,
      preferences: {
        ...this.props.preferences,
        ...preferences
      }
    });
  }

  updateSecuritySettings(security: Partial<UserSettingsProps['security']>): UserSettings {
    return UserSettings.create({
      ...this.props,
      security: {
        ...this.props.security,
        ...security
      }
    });
  }

  updateDeliverySettings(delivery: Partial<UserSettingsProps['delivery']>): UserSettings {
    return UserSettings.create({
      ...this.props,
      delivery: {
        ...this.props.delivery,
        ...delivery
      }
    });
  }

  // Specific setting updates
  enableTwoFactor(): UserSettings {
    return this.updateSecuritySettings({ twoFactorEnabled: true });
  }

  disableTwoFactor(): UserSettings {
    return this.updateSecuritySettings({ twoFactorEnabled: false });
  }

  setTheme(theme: UserSettingsProps['preferences']['theme']): UserSettings {
    return this.updatePreferences({ theme });
  }

  setLanguage(language: string): UserSettings {
    return this.updatePreferences({ language });
  }

  setTimezone(timezone: string): UserSettings {
    return this.updatePreferences({ timezone });
  }

  setCurrency(currency: string): UserSettings {
    return this.updatePreferences({ currency });
  }

  setDefaultAddress(addressId: string): UserSettings {
    return this.updateDeliverySettings({ defaultAddressId: addressId });
  }

  enableContactlessDelivery(): UserSettings {
    return this.updateDeliverySettings({ contactlessDelivery: true });
  }

  disableContactlessDelivery(): UserSettings {
    return this.updateDeliverySettings({ contactlessDelivery: false });
  }

  // Helper methods
  isEmailNotificationEnabled(type: keyof UserSettingsProps['notifications']['email']): boolean {
    return this.props.notifications.email[type];
  }

  isSmsNotificationEnabled(type: keyof UserSettingsProps['notifications']['sms']): boolean {
    return this.props.notifications.sms[type];
  }

  isPushNotificationEnabled(type: keyof UserSettingsProps['notifications']['push']): boolean {
    return this.props.notifications.push[type];
  }

  isTwoFactorEnabled(): boolean {
    return this.props.security.twoFactorEnabled;
  }

  isProfilePublic(): boolean {
    return this.props.privacy.profileVisibility === 'PUBLIC';
  }

  isProfilePrivate(): boolean {
    return this.props.privacy.profileVisibility === 'PRIVATE';
  }

  allowsDirectMessages(): boolean {
    return this.props.privacy.allowDirectMessages;
  }

  getSessionTimeoutMinutes(): number {
    return this.props.security.sessionTimeout;
  }

  getSessionTimeoutMs(): number {
    return this.props.security.sessionTimeout * 60 * 1000;
  }

  hasDefaultAddress(): boolean {
    return !!this.props.delivery.defaultAddressId;
  }

  prefersContactlessDelivery(): boolean {
    return this.props.delivery.contactlessDelivery;
  }

  // Validation
  private validate(): void {
    const errors: string[] = [];

    // Validate session timeout
    if (this.props.security.sessionTimeout < 5 || this.props.security.sessionTimeout > 1440) {
      errors.push('Session timeout must be between 5 minutes and 24 hours');
    }

    // Validate language code
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(this.props.preferences.language)) {
      errors.push('Invalid language code format');
    }

    // Validate currency code
    if (!/^[A-Z]{3}$/.test(this.props.preferences.currency)) {
      errors.push('Invalid currency code format');
    }

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: this.props.preferences.timezone });
    } catch {
      errors.push('Invalid timezone');
    }

    if (errors.length > 0) {
      throw new Error(`Settings validation failed: ${errors.join(', ')}`);
    }
  }

  // Utility methods
  private static deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = UserSettings.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  toPlainObject(): UserSettingsProps {
    return JSON.parse(JSON.stringify(this.props));
  }

  equals(other: UserSettings): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }

  // Export/Import settings
  exportSettings(): string {
    return JSON.stringify(this.toPlainObject(), null, 2);
  }

  static importSettings(settingsJson: string): UserSettings {
    try {
      const parsed = JSON.parse(settingsJson);
      return UserSettings.create(parsed);
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }
}