import { UserEntity } from '../entities/user.entity';
import { UserRepositoryInterface } from '../repositories/user.repository.interface';

export interface VerificationResult {
  success: boolean;
  message: string;
  requiresAction?: {
    type: 'OTP_VERIFICATION' | 'DOCUMENT_UPLOAD' | 'MANUAL_REVIEW';
    details: string;
  };
}

export interface OTPVerificationOptions {
  code: string;
  type: 'EMAIL' | 'PHONE';
  expirationMinutes?: number;
}

export interface DocumentVerificationOptions {
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'BUSINESS_LICENSE' | 'TAX_CERTIFICATE';
  documentUrl: string;
  documentNumber?: string;
  expirationDate?: Date;
}

export class UserVerificationService {
  constructor(
    private readonly userRepository: UserRepositoryInterface
  ) {}

  /**
   * Verify user's email address
   */
  async verifyEmail(userId: string, verificationCode: string): Promise<VerificationResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Email already verified'
      };
    }

    // In a real implementation, you would validate the verification code
    // against a stored code (possibly in a separate verification table)
    const isValidCode = await this.validateVerificationCode(user.email, verificationCode, 'EMAIL');
    
    if (!isValidCode) {
      return {
        success: false,
        message: 'Invalid or expired verification code'
      };
    }

    const verifiedUser = user.verifyEmail();
    await this.userRepository.save(verifiedUser);

    return {
      success: true,
      message: 'Email verified successfully'
    };
  }

  /**
   * Verify user's phone number
   */
  async verifyPhone(userId: string, verificationCode: string): Promise<VerificationResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (user.isPhoneVerified) {
      return {
        success: true,
        message: 'Phone already verified'
      };
    }

    const isValidCode = await this.validateVerificationCode(user.phone, verificationCode, 'PHONE');
    
    if (!isValidCode) {
      return {
        success: false,
        message: 'Invalid or expired verification code'
      };
    }

    const verifiedUser = user.verifyPhone();
    await this.userRepository.save(verifiedUser);

    return {
      success: true,
      message: 'Phone verified successfully'
    };
  }

  /**
   * Send verification code to email
   */
  async sendEmailVerification(userId: string): Promise<VerificationResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (user.isEmailVerified) {
      return {
        success: false,
        message: 'Email already verified'
      };
    }

    // Generate and store verification code
    const verificationCode = this.generateVerificationCode();
    await this.storeVerificationCode(user.email, verificationCode, 'EMAIL');
    
    // In a real implementation, send email via email service
    await this.sendVerificationEmail(user.email, verificationCode);

    return {
      success: true,
      message: 'Verification code sent to email'
    };
  }

  /**
   * Send verification code to phone
   */
  async sendPhoneVerification(userId: string): Promise<VerificationResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (user.isPhoneVerified) {
      return {
        success: false,
        message: 'Phone already verified'
      };
    }

    // Generate and store verification code
    const verificationCode = this.generateVerificationCode();
    await this.storeVerificationCode(user.phone, verificationCode, 'PHONE');
    
    // In a real implementation, send SMS via SMS service
    await this.sendVerificationSMS(user.phone, verificationCode);

    return {
      success: true,
      message: 'Verification code sent to phone'
    };
  }

  /**
   * Verify user documents (for drivers, vendors)
   */
  async verifyDocument(userId: string, options: DocumentVerificationOptions): Promise<VerificationResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Validate document based on type and user role
    const validationResult = await this.validateDocument(user, options);
    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.message,
        requiresAction: {
          type: 'DOCUMENT_UPLOAD',
          details: validationResult.message
        }
      };
    }

    // For automated verification (if possible)
    const autoVerificationResult = await this.performAutomaticDocumentVerification(options);
    
    if (autoVerificationResult.success) {
      // Update user verification status
      const updatedUser = this.updateDocumentVerificationStatus(user, options.documentType, true);
      await this.userRepository.save(updatedUser);
      
      return {
        success: true,
        message: 'Document verified successfully'
      };
    }

    // If automatic verification fails, require manual review
    await this.queueForManualReview(userId, options);
    
    return {
      success: false,
      message: 'Document submitted for manual review',
      requiresAction: {
        type: 'MANUAL_REVIEW',
        details: 'Your document has been submitted for manual verification. You will be notified once the review is complete.'
      }
    };
  }

  /**
   * Check if user is fully verified based on their role
   */
  async isUserFullyVerified(userId: string): Promise<{
    isVerified: boolean;
    missingVerifications: string[];
    nextSteps: string[];
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const missingVerifications: string[] = [];
    const nextSteps: string[] = [];

    // Basic verifications for all users
    if (!user.isEmailVerified) {
      missingVerifications.push('Email verification');
      nextSteps.push('Verify your email address');
    }

    if (!user.isPhoneVerified) {
      missingVerifications.push('Phone verification');
      nextSteps.push('Verify your phone number');
    }

    // Role-specific verifications
    const roleSpecificRequirements = this.getRoleSpecificVerificationRequirements(user);
    
    for (const requirement of roleSpecificRequirements) {
      if (!this.isRequirementMet(user, requirement)) {
        missingVerifications.push(requirement.name);
        nextSteps.push(requirement.action);
      }
    }

    return {
      isVerified: missingVerifications.length === 0,
      missingVerifications,
      nextSteps
    };
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<{
    email: {
      verified: boolean;
      verifiedAt?: Date;
    };
    phone: {
      verified: boolean;
      verifiedAt?: Date;
    };
    documents: {
      type: string;
      verified: boolean;
      verifiedAt?: Date;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }[];
    overall: {
      isFullyVerified: boolean;
      completionPercentage: number;
    };
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get document verification status from user's role details
    const documents = this.getDocumentVerificationStatus(user);
    
    // Calculate completion percentage
    const totalRequirements = this.getTotalVerificationRequirements(user);
    const completedRequirements = this.getCompletedVerificationRequirements(user);
    const completionPercentage = totalRequirements > 0 ? 
      Math.round((completedRequirements / totalRequirements) * 100) : 100;

    return {
      email: {
        verified: user.isEmailVerified,
        verifiedAt: user.emailVerifiedAt
      },
      phone: {
        verified: user.isPhoneVerified,
        verifiedAt: user.phoneVerifiedAt
      },
      documents,
      overall: {
        isFullyVerified: completedRequirements === totalRequirements,
        completionPercentage
      }
    };
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(userId: string, type: 'EMAIL' | 'PHONE'): Promise<VerificationResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check rate limiting
    const canResend = await this.checkResendRateLimit(userId, type);
    if (!canResend) {
      return {
        success: false,
        message: 'Please wait before requesting another verification code'
      };
    }

    if (type === 'EMAIL') {
      return this.sendEmailVerification(userId);
    } else {
      return this.sendPhoneVerification(userId);
    }
  }

  // Private helper methods
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async validateVerificationCode(
    contact: string, 
    code: string, 
    type: 'EMAIL' | 'PHONE'
  ): Promise<boolean> {
    // In a real implementation, this would check against stored codes
    // with expiration times, attempt limits, etc.
    return true; // Placeholder
  }

  private async storeVerificationCode(
    contact: string, 
    code: string, 
    type: 'EMAIL' | 'PHONE'
  ): Promise<void> {
    // Store verification code with expiration time
    // In a real implementation, this would use a verification code repository
  }

  private async sendVerificationEmail(email: string, code: string): Promise<void> {
    // Send email via email service
    console.log(`Sending verification email to ${email} with code: ${code}`);
  }

  private async sendVerificationSMS(phone: string, code: string): Promise<void> {
    // Send SMS via SMS service
    console.log(`Sending verification SMS to ${phone} with code: ${code}`);
  }

  private async validateDocument(
    user: UserEntity, 
    options: DocumentVerificationOptions
  ): Promise<{ isValid: boolean; message: string }> {
    // Validate document based on user role and document type
    const requiredDocuments = this.getRequiredDocuments(user);
    
    if (!requiredDocuments.includes(options.documentType)) {
      return {
        isValid: false,
        message: `Document type ${options.documentType} is not required for your role`
      };
    }

    // Check if document is expired
    if (options.expirationDate && options.expirationDate < new Date()) {
      return {
        isValid: false,
        message: 'Document has expired'
      };
    }

    // Additional validations based on document type
    return { isValid: true, message: 'Document is valid' };
  }

  private async performAutomaticDocumentVerification(
    options: DocumentVerificationOptions
  ): Promise<{ success: boolean; confidence?: number }> {
    // In a real implementation, this would use OCR/AI services
    // to automatically verify documents
    return { success: false }; // Placeholder - assume manual review needed
  }

  private async queueForManualReview(
    userId: string, 
    options: DocumentVerificationOptions
  ): Promise<void> {
    // Queue document for manual review by admin
    // In a real implementation, this would create a review task
  }

  private updateDocumentVerificationStatus(
    user: UserEntity, 
    documentType: string, 
    verified: boolean
  ): UserEntity {
    // Update verification status in user's role-specific details
    // This would depend on the specific role and document type
    return user; // Placeholder
  }

  private getRoleSpecificVerificationRequirements(user: UserEntity): {
    name: string;
    action: string;
    required: boolean;
  }[] {
    const requirements: { name: string; action: string; required: boolean }[] = [];

    if (user.roles.includes('DRIVER')) {
      requirements.push(
        { name: 'Driver license verification', action: 'Upload your driver license', required: true },
        { name: 'Vehicle registration', action: 'Upload vehicle registration documents', required: true },
        { name: 'Insurance verification', action: 'Upload insurance certificate', required: true }
      );
    }

    if (user.roles.includes('VENDOR')) {
      requirements.push(
        { name: 'Business license verification', action: 'Upload business license', required: true },
        { name: 'Tax certificate', action: 'Upload tax registration certificate', required: true },
        { name: 'Bank account verification', action: 'Verify bank account details', required: true }
      );
    }

    return requirements;
  }

  private isRequirementMet(user: UserEntity, requirement: { name: string }): boolean {
    // Check if specific requirement is met based on user's verification status
    // This would check the user's role-specific details
    return false; // Placeholder
  }

  private getRequiredDocuments(user: UserEntity): string[] {
    const documents: string[] = [];

    if (user.roles.includes('DRIVER')) {
      documents.push('DRIVER_LICENSE', 'ID_CARD');
    }

    if (user.roles.includes('VENDOR')) {
      documents.push('BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'ID_CARD');
    }

    return documents;
  }

  private getDocumentVerificationStatus(user: UserEntity): {
    type: string;
    verified: boolean;
    verifiedAt?: Date;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }[] {
    // Extract document verification status from user's role-specific details
    return []; // Placeholder
  }

  private getTotalVerificationRequirements(user: UserEntity): number {
    let total = 2; // Email and phone verification
    
    // Add role-specific requirements
    if (user.roles.includes('DRIVER')) {
      total += 3; // License, vehicle, insurance
    }
    
    if (user.roles.includes('VENDOR')) {
      total += 3; // Business license, tax cert, bank account
    }

    return total;
  }

  private getCompletedVerificationRequirements(user: UserEntity): number {
    let completed = 0;
    
    if (user.isEmailVerified) completed++;
    if (user.isPhoneVerified) completed++;
    
    // Add role-specific completed verifications
    // This would check the user's role-specific details
    
    return completed;
  }

  private async checkResendRateLimit(userId: string, type: 'EMAIL' | 'PHONE'): Promise<boolean> {
    // Check if user can resend verification code (rate limiting)
    // In a real implementation, this would check against a rate limiting store
    return true; // Placeholder
  }
}