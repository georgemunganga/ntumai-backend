export interface UserProfileProps {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  profileImageUrl?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    currency: string;
  };
}

export class UserProfile {
  private constructor(private readonly props: UserProfileProps) {}

  static create(props: UserProfileProps): UserProfile {
    const profile = new UserProfile(props);
    profile.validate();
    return profile;
  }

  static empty(): UserProfile {
    return new UserProfile({
      preferences: {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD'
      }
    });
  }

  // Getters
  get firstName(): string | undefined {
    return this.props.firstName;
  }

  get lastName(): string | undefined {
    return this.props.lastName;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get profileImageUrl(): string | undefined {
    return this.props.profileImageUrl;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get socialLinks(): UserProfileProps['socialLinks'] {
    return this.props.socialLinks;
  }

  get emergencyContact(): UserProfileProps['emergencyContact'] {
    return this.props.emergencyContact;
  }

  get preferences(): UserProfileProps['preferences'] {
    return this.props.preferences;
  }

  // Helper methods
  getFullName(): string {
    const parts = [this.props.firstName, this.props.lastName].filter(Boolean);
    return parts.join(' ') || 'Unknown User';
  }

  getInitials(): string {
    const firstName = this.props.firstName || '';
    const lastName = this.props.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  }

  getAge(): number | null {
    if (!this.props.dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(this.props.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  isProfileComplete(): boolean {
    return !!
      this.props.firstName &&
      this.props.lastName &&
      this.props.dateOfBirth &&
      this.props.gender;
  }

  hasEmergencyContact(): boolean {
    return !!
      this.props.emergencyContact?.name &&
      this.props.emergencyContact?.phone &&
      this.props.emergencyContact?.relationship;
  }

  hasSocialLinks(): boolean {
    const links = this.props.socialLinks;
    return !!(links?.facebook || links?.twitter || links?.instagram || links?.linkedin);
  }

  // Update methods
  updateBasicInfo(updates: Pick<UserProfileProps, 'firstName' | 'lastName' | 'dateOfBirth' | 'gender'>): UserProfile {
    return UserProfile.create({
      ...this.props,
      ...updates
    });
  }

  updateProfileImage(imageUrl: string): UserProfile {
    return UserProfile.create({
      ...this.props,
      profileImageUrl: imageUrl
    });
  }

  updateBio(bio: string): UserProfile {
    return UserProfile.create({
      ...this.props,
      bio: bio.trim()
    });
  }

  updateWebsite(website: string): UserProfile {
    return UserProfile.create({
      ...this.props,
      website: website.trim()
    });
  }

  updateSocialLinks(socialLinks: UserProfileProps['socialLinks']): UserProfile {
    return UserProfile.create({
      ...this.props,
      socialLinks
    });
  }

  updateEmergencyContact(emergencyContact: UserProfileProps['emergencyContact']): UserProfile {
    return UserProfile.create({
      ...this.props,
      emergencyContact
    });
  }

  updatePreferences(preferences: UserProfileProps['preferences']): UserProfile {
    return UserProfile.create({
      ...this.props,
      preferences: {
        ...this.props.preferences,
        ...preferences
      }
    });
  }

  // Validation
  private validate(): void {
    const errors: string[] = [];

    // Validate date of birth
    if (this.props.dateOfBirth) {
      const age = this.getAge();
      if (age !== null && (age < 13 || age > 120)) {
        errors.push('Age must be between 13 and 120 years');
      }
    }

    // Validate website URL
    if (this.props.website && !this.isValidUrl(this.props.website)) {
      errors.push('Invalid website URL format');
    }

    // Validate social links
    if (this.props.socialLinks) {
      Object.entries(this.props.socialLinks).forEach(([platform, url]) => {
        if (url && !this.isValidUrl(url)) {
          errors.push(`Invalid ${platform} URL format`);
        }
      });
    }

    // Validate emergency contact phone
    if (this.props.emergencyContact?.phone && !this.isValidPhoneNumber(this.props.emergencyContact.phone)) {
      errors.push('Invalid emergency contact phone number');
    }

    // Validate bio length
    if (this.props.bio && this.props.bio.length > 500) {
      errors.push('Bio must be less than 500 characters');
    }

    if (errors.length > 0) {
      throw new Error(`Profile validation failed: ${errors.join(', ')}`);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  }

  toPlainObject(): UserProfileProps {
    return {
      ...this.props,
      socialLinks: this.props.socialLinks ? { ...this.props.socialLinks } : undefined,
      emergencyContact: this.props.emergencyContact ? { ...this.props.emergencyContact } : undefined,
      preferences: this.props.preferences ? { ...this.props.preferences } : undefined
    };
  }

  equals(other: UserProfile): boolean {
    return JSON.stringify(this.toPlainObject()) === JSON.stringify(other.toPlainObject());
  }
}