export enum ProofType {
  PHOTO = 'photo',
  RECEIPT = 'receipt',
  SIGNATURE = 'signature',
  DOCUMENT = 'document',
}

export interface ProofData {
  type: ProofType;
  url: string;
  description?: string;
  uploadedAt: Date;
}

export class ProofTypeVO {
  private constructor(private readonly _value: ProofType) {
    this.validate();
  }

  static create(value: string): ProofTypeVO {
    const proofType = value.toLowerCase() as ProofType;
    if (!Object.values(ProofType).includes(proofType)) {
      throw new Error(`Invalid proof type: ${value}`);
    }
    return new ProofTypeVO(proofType);
  }

  static fromEnum(proofType: ProofType): ProofTypeVO {
    return new ProofTypeVO(proofType);
  }

  get value(): ProofType {
    return this._value;
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('Proof type cannot be empty');
    }
  }

  isVisual(): boolean {
    return [ProofType.PHOTO, ProofType.SIGNATURE].includes(this._value);
  }

  isDocument(): boolean {
    return [ProofType.RECEIPT, ProofType.DOCUMENT].includes(this._value);
  }

  getAcceptedFileTypes(): string[] {
    const fileTypeMap: Record<ProofType, string[]> = {
      [ProofType.PHOTO]: ['image/jpeg', 'image/png', 'image/webp'],
      [ProofType.RECEIPT]: ['image/jpeg', 'image/png', 'application/pdf'],
      [ProofType.SIGNATURE]: ['image/jpeg', 'image/png', 'image/svg+xml'],
      [ProofType.DOCUMENT]: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };
    return fileTypeMap[this._value];
  }

  getMaxFileSize(): number {
    // Return max file size in bytes
    const sizeMap: Record<ProofType, number> = {
      [ProofType.PHOTO]: 5 * 1024 * 1024, // 5MB
      [ProofType.RECEIPT]: 10 * 1024 * 1024, // 10MB
      [ProofType.SIGNATURE]: 2 * 1024 * 1024, // 2MB
      [ProofType.DOCUMENT]: 20 * 1024 * 1024, // 20MB
    };
    return sizeMap[this._value];
  }

  equals(other: ProofTypeVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class ProofVO {
  private constructor(
    private readonly _type: ProofTypeVO,
    private readonly _url: string,
    private readonly _description?: string,
    private readonly _uploadedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static create(data: {
    type: string | ProofType;
    url: string;
    description?: string;
    uploadedAt?: Date;
  }): ProofVO {
    const proofType = typeof data.type === 'string' 
      ? ProofTypeVO.create(data.type)
      : ProofTypeVO.fromEnum(data.type);

    return new ProofVO(
      proofType,
      data.url,
      data.description,
      data.uploadedAt,
    );
  }

  get type(): ProofTypeVO {
    return this._type;
  }

  get url(): string {
    return this._url;
  }

  get description(): string | undefined {
    return this._description;
  }

  get uploadedAt(): Date {
    return this._uploadedAt;
  }

  private validate(): void {
    if (!this._url || this._url.trim().length === 0) {
      throw new Error('Proof URL is required');
    }

    if (this._description && this._description.length > 200) {
      throw new Error('Proof description cannot exceed 200 characters');
    }

    // Basic URL validation
    try {
      new URL(this._url);
    } catch {
      throw new Error('Invalid proof URL format');
    }
  }

  equals(other: ProofVO): boolean {
    return (
      this._type.equals(other._type) &&
      this._url === other._url &&
      this._description === other._description
    );
  }

  toJSON(): ProofData {
    return {
      type: this._type.value,
      url: this._url,
      description: this._description,
      uploadedAt: this._uploadedAt,
    };
  }
}