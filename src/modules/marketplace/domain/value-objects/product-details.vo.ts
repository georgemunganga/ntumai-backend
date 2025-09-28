export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export enum ProductCondition {
  NEW = 'NEW',
  USED_LIKE_NEW = 'USED_LIKE_NEW',
  USED_GOOD = 'USED_GOOD',
  USED_FAIR = 'USED_FAIR',
  REFURBISHED = 'REFURBISHED'
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductWeight {
  value: number;
  unit: 'kg' | 'lb' | 'g' | 'oz';
}

export interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string>; // e.g., { "color": "red", "size": "M" }
  sku?: string;
  price?: number;
  stockQuantity?: number;
  images?: string[];
}

export interface ProductSpecification {
  name: string;
  value: string;
  group?: string;
}

export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  slug?: string;
}

export interface ProductShipping {
  weight?: ProductWeight;
  dimensions?: ProductDimensions;
  shippingClass?: string;
  freeShipping?: boolean;
  shippingCost?: number;
}

export class ProductDetails {
  private constructor(
    private readonly _name: string,
    private readonly _description: string,
    private readonly _shortDescription: string,
    private readonly _sku: string,
    private readonly _barcode: string | null,
    private readonly _status: ProductStatus,
    private readonly _condition: ProductCondition,
    private readonly _brand: string | null,
    private readonly _model: string | null,
    private readonly _tags: string[],
    private readonly _images: string[],
    private readonly _variants: ProductVariant[],
    private readonly _specifications: ProductSpecification[],
    private readonly _seo: ProductSEO,
    private readonly _shipping: ProductShipping,
    private readonly _isFeatured: boolean,
    private readonly _isDigital: boolean,
    private readonly _downloadUrl: string | null,
    private readonly _downloadLimit: number | null,
    private readonly _expiryDays: number | null,
    private readonly _minOrderQuantity: number,
    private readonly _maxOrderQuantity: number | null,
    private readonly _stockTrackingEnabled: boolean,
    private readonly _allowBackorders: boolean,
    private readonly _metadata: Record<string, any>
  ) {
    this.validateName(_name);
    this.validateDescription(_description);
    this.validateSku(_sku);
    this.validateImages(_images);
    this.validateVariants(_variants);
    this.validateSpecifications(_specifications);
    this.validateQuantityLimits(_minOrderQuantity, _maxOrderQuantity);
    this.validateDigitalProduct(_isDigital, _downloadUrl, _downloadLimit, _expiryDays);
  }

  static create(
    name: string,
    description: string,
    sku: string,
    options?: {
      shortDescription?: string;
      barcode?: string;
      status?: ProductStatus;
      condition?: ProductCondition;
      brand?: string;
      model?: string;
      tags?: string[];
      images?: string[];
      variants?: ProductVariant[];
      specifications?: ProductSpecification[];
      seo?: ProductSEO;
      shipping?: ProductShipping;
      isFeatured?: boolean;
      isDigital?: boolean;
      downloadUrl?: string;
      downloadLimit?: number;
      expiryDays?: number;
      minOrderQuantity?: number;
      maxOrderQuantity?: number;
      stockTrackingEnabled?: boolean;
      allowBackorders?: boolean;
      metadata?: Record<string, any>;
    }
  ): ProductDetails {
    return new ProductDetails(
      name,
      description,
      options?.shortDescription || '',
      sku,
      options?.barcode || null,
      options?.status || ProductStatus.DRAFT,
      options?.condition || ProductCondition.NEW,
      options?.brand || null,
      options?.model || null,
      options?.tags || [],
      options?.images || [],
      options?.variants || [],
      options?.specifications || [],
      options?.seo || {},
      options?.shipping || {},
      options?.isFeatured || false,
      options?.isDigital || false,
      options?.downloadUrl || null,
      options?.downloadLimit || null,
      options?.expiryDays || null,
      options?.minOrderQuantity || 1,
      options?.maxOrderQuantity || null,
      options?.stockTrackingEnabled || true,
      options?.allowBackorders || false,
      options?.metadata || {}
    );
  }

  static fromPersistence(data: {
    name: string;
    description: string;
    shortDescription: string;
    sku: string;
    barcode: string | null;
    status: ProductStatus;
    condition: ProductCondition;
    brand: string | null;
    model: string | null;
    tags: string[];
    images: string[];
    variants: ProductVariant[];
    specifications: ProductSpecification[];
    seo: ProductSEO;
    shipping: ProductShipping;
    isFeatured: boolean;
    isDigital: boolean;
    downloadUrl: string | null;
    downloadLimit: number | null;
    expiryDays: number | null;
    minOrderQuantity: number;
    maxOrderQuantity: number | null;
    stockTrackingEnabled: boolean;
    allowBackorders: boolean;
    metadata: Record<string, any>;
  }): ProductDetails {
    return new ProductDetails(
      data.name,
      data.description,
      data.shortDescription,
      data.sku,
      data.barcode,
      data.status,
      data.condition,
      data.brand,
      data.model,
      data.tags,
      data.images,
      data.variants,
      data.specifications,
      data.seo,
      data.shipping,
      data.isFeatured,
      data.isDigital,
      data.downloadUrl,
      data.downloadLimit,
      data.expiryDays,
      data.minOrderQuantity,
      data.maxOrderQuantity,
      data.stockTrackingEnabled,
      data.allowBackorders,
      data.metadata
    );
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get shortDescription(): string {
    return this._shortDescription;
  }

  get sku(): string {
    return this._sku;
  }

  get barcode(): string | null {
    return this._barcode;
  }

  get status(): ProductStatus {
    return this._status;
  }

  get condition(): ProductCondition {
    return this._condition;
  }

  get brand(): string | null {
    return this._brand;
  }

  get model(): string | null {
    return this._model;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get images(): string[] {
    return [...this._images];
  }

  get variants(): ProductVariant[] {
    return this._variants.map(v => ({ ...v }));
  }

  get specifications(): ProductSpecification[] {
    return this._specifications.map(s => ({ ...s }));
  }

  get seo(): ProductSEO {
    return { ...this._seo };
  }

  get shipping(): ProductShipping {
    return { ...this._shipping };
  }

  get isFeatured(): boolean {
    return this._isFeatured;
  }

  get isDigital(): boolean {
    return this._isDigital;
  }

  get downloadUrl(): string | null {
    return this._downloadUrl;
  }

  get downloadLimit(): number | null {
    return this._downloadLimit;
  }

  get expiryDays(): number | null {
    return this._expiryDays;
  }

  get minOrderQuantity(): number {
    return this._minOrderQuantity;
  }

  get maxOrderQuantity(): number | null {
    return this._maxOrderQuantity;
  }

  get stockTrackingEnabled(): boolean {
    return this._stockTrackingEnabled;
  }

  get allowBackorders(): boolean {
    return this._allowBackorders;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  // Validation methods
  private validateName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Product name is required and must be a string');
    }
    if (name.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }
    if (name.length > 255) {
      throw new Error('Product name cannot exceed 255 characters');
    }
  }

  private validateDescription(description: string): void {
    if (!description || typeof description !== 'string') {
      throw new Error('Product description is required and must be a string');
    }
    if (description.trim().length === 0) {
      throw new Error('Product description cannot be empty');
    }
  }

  private validateSku(sku: string): void {
    if (!sku || typeof sku !== 'string') {
      throw new Error('Product SKU is required and must be a string');
    }
    if (sku.trim().length === 0) {
      throw new Error('Product SKU cannot be empty');
    }
    if (!/^[A-Za-z0-9\-_]+$/.test(sku)) {
      throw new Error('Product SKU can only contain letters, numbers, hyphens, and underscores');
    }
  }

  private validateImages(images: string[]): void {
    if (!Array.isArray(images)) {
      throw new Error('Product images must be an array');
    }
    for (const image of images) {
      if (typeof image !== 'string' || image.trim().length === 0) {
        throw new Error('All product images must be non-empty strings');
      }
    }
  }

  private validateVariants(variants: ProductVariant[]): void {
    if (!Array.isArray(variants)) {
      throw new Error('Product variants must be an array');
    }
    
    const variantIds = new Set<string>();
    for (const variant of variants) {
      if (!variant.id || typeof variant.id !== 'string') {
        throw new Error('Variant ID is required and must be a string');
      }
      if (variantIds.has(variant.id)) {
        throw new Error(`Duplicate variant ID: ${variant.id}`);
      }
      variantIds.add(variant.id);
      
      if (!variant.name || typeof variant.name !== 'string') {
        throw new Error('Variant name is required and must be a string');
      }
      
      if (!variant.options || typeof variant.options !== 'object') {
        throw new Error('Variant options are required and must be an object');
      }
    }
  }

  private validateSpecifications(specifications: ProductSpecification[]): void {
    if (!Array.isArray(specifications)) {
      throw new Error('Product specifications must be an array');
    }
    
    for (const spec of specifications) {
      if (!spec.name || typeof spec.name !== 'string') {
        throw new Error('Specification name is required and must be a string');
      }
      if (!spec.value || typeof spec.value !== 'string') {
        throw new Error('Specification value is required and must be a string');
      }
    }
  }

  private validateQuantityLimits(minQuantity: number, maxQuantity: number | null): void {
    if (typeof minQuantity !== 'number' || minQuantity < 1 || !Number.isInteger(minQuantity)) {
      throw new Error('Minimum order quantity must be a positive integer');
    }
    
    if (maxQuantity !== null) {
      if (typeof maxQuantity !== 'number' || maxQuantity < 1 || !Number.isInteger(maxQuantity)) {
        throw new Error('Maximum order quantity must be a positive integer');
      }
      if (maxQuantity < minQuantity) {
        throw new Error('Maximum order quantity cannot be less than minimum order quantity');
      }
    }
  }

  private validateDigitalProduct(
    isDigital: boolean,
    downloadUrl: string | null,
    downloadLimit: number | null,
    expiryDays: number | null
  ): void {
    if (isDigital) {
      if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error('Digital products must have a download URL');
      }
      
      if (downloadLimit !== null && (typeof downloadLimit !== 'number' || downloadLimit < 1 || !Number.isInteger(downloadLimit))) {
        throw new Error('Download limit must be a positive integer');
      }
      
      if (expiryDays !== null && (typeof expiryDays !== 'number' || expiryDays < 1 || !Number.isInteger(expiryDays))) {
        throw new Error('Expiry days must be a positive integer');
      }
    }
  }

  // Status checking methods
  isDraft(): boolean {
    return this._status === ProductStatus.DRAFT;
  }

  isActive(): boolean {
    return this._status === ProductStatus.ACTIVE;
  }

  isInactive(): boolean {
    return this._status === ProductStatus.INACTIVE;
  }

  isOutOfStock(): boolean {
    return this._status === ProductStatus.OUT_OF_STOCK;
  }

  isDiscontinued(): boolean {
    return this._status === ProductStatus.DISCONTINUED;
  }

  // Business logic methods
  isAvailableForPurchase(): boolean {
    return this.isActive() && !this.isOutOfStock() && !this.isDiscontinued();
  }

  isPublished(): boolean {
    return this.isActive() || this.isOutOfStock();
  }

  hasVariants(): boolean {
    return this._variants.length > 0;
  }

  hasImages(): boolean {
    return this._images.length > 0;
  }

  hasPrimaryImage(): boolean {
    return this._images.length > 0;
  }

  getPrimaryImage(): string | null {
    return this._images.length > 0 ? this._images[0] : null;
  }

  hasSpecifications(): boolean {
    return this._specifications.length > 0;
  }

  hasTags(): boolean {
    return this._tags.length > 0;
  }

  hasTag(tag: string): boolean {
    return this._tags.includes(tag.toLowerCase());
  }

  isValidQuantity(quantity: number): boolean {
    if (quantity < this._minOrderQuantity) return false;
    if (this._maxOrderQuantity && quantity > this._maxOrderQuantity) return false;
    return true;
  }

  requiresShipping(): boolean {
    return !this._isDigital;
  }

  hasDownloadLimit(): boolean {
    return this._isDigital && this._downloadLimit !== null;
  }

  hasExpiryLimit(): boolean {
    return this._isDigital && this._expiryDays !== null;
  }

  // Variant methods
  getVariantById(variantId: string): ProductVariant | null {
    return this._variants.find(v => v.id === variantId) || null;
  }

  getVariantsBySku(sku: string): ProductVariant[] {
    return this._variants.filter(v => v.sku === sku);
  }

  getVariantsByOption(optionName: string, optionValue: string): ProductVariant[] {
    return this._variants.filter(v => v.options[optionName] === optionValue);
  }

  getAllVariantOptions(): Record<string, string[]> {
    const options: Record<string, Set<string>> = {};
    
    for (const variant of this._variants) {
      for (const [key, value] of Object.entries(variant.options)) {
        if (!options[key]) {
          options[key] = new Set();
        }
        options[key].add(value);
      }
    }
    
    const result: Record<string, string[]> = {};
    for (const [key, valueSet] of Object.entries(options)) {
      result[key] = Array.from(valueSet).sort();
    }
    
    return result;
  }

  // Specification methods
  getSpecificationsByGroup(group: string): ProductSpecification[] {
    return this._specifications.filter(s => s.group === group);
  }

  getSpecificationByName(name: string): ProductSpecification | null {
    return this._specifications.find(s => s.name === name) || null;
  }

  getAllSpecificationGroups(): string[] {
    const groups = new Set<string>();
    for (const spec of this._specifications) {
      if (spec.group) {
        groups.add(spec.group);
      }
    }
    return Array.from(groups).sort();
  }

  // SEO methods
  getMetaTitle(): string {
    return this._seo.metaTitle || this._name;
  }

  getMetaDescription(): string {
    return this._seo.metaDescription || this._shortDescription || this._description.substring(0, 160);
  }

  getSlug(): string {
    return this._seo.slug || this._name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  getKeywords(): string[] {
    const keywords = new Set<string>();
    
    // Add SEO keywords
    if (this._seo.keywords) {
      this._seo.keywords.forEach(k => keywords.add(k.toLowerCase()));
    }
    
    // Add tags
    this._tags.forEach(t => keywords.add(t.toLowerCase()));
    
    // Add brand
    if (this._brand) {
      keywords.add(this._brand.toLowerCase());
    }
    
    return Array.from(keywords);
  }

  // Shipping methods
  getWeight(): ProductWeight | null {
    return this._shipping.weight || null;
  }

  getDimensions(): ProductDimensions | null {
    return this._shipping.dimensions || null;
  }

  getShippingClass(): string | null {
    return this._shipping.shippingClass || null;
  }

  isFreeShipping(): boolean {
    return this._shipping.freeShipping || false;
  }

  getShippingCost(): number | null {
    return this._shipping.shippingCost || null;
  }

  // State transition methods
  activate(): ProductDetails {
    if (this.isActive()) {
      throw new Error('Product is already active');
    }
    
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      ProductStatus.ACTIVE,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      this._images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  deactivate(): ProductDetails {
    if (this.isInactive()) {
      throw new Error('Product is already inactive');
    }
    
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      ProductStatus.INACTIVE,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      this._images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  markOutOfStock(): ProductDetails {
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      ProductStatus.OUT_OF_STOCK,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      this._images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  discontinue(): ProductDetails {
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      ProductStatus.DISCONTINUED,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      this._images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  // Update methods
  updateBasicInfo(name: string, description: string, shortDescription?: string): ProductDetails {
    return new ProductDetails(
      name,
      description,
      shortDescription || this._shortDescription,
      this._sku,
      this._barcode,
      this._status,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      this._images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  updateImages(images: string[]): ProductDetails {
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      this._status,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  updateTags(tags: string[]): ProductDetails {
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      this._status,
      this._condition,
      this._brand,
      this._model,
      tags,
      this._images,
      this._variants,
      this._specifications,
      this._seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  updateSEO(seo: ProductSEO): ProductDetails {
    return new ProductDetails(
      this._name,
      this._description,
      this._shortDescription,
      this._sku,
      this._barcode,
      this._status,
      this._condition,
      this._brand,
      this._model,
      this._tags,
      this._images,
      this._variants,
      this._specifications,
      seo,
      this._shipping,
      this._isFeatured,
      this._isDigital,
      this._downloadUrl,
      this._downloadLimit,
      this._expiryDays,
      this._minOrderQuantity,
      this._maxOrderQuantity,
      this._stockTrackingEnabled,
      this._allowBackorders,
      this._metadata
    );
  }

  // Display methods
  getStatusDisplayName(): string {
    const displayNames: Record<ProductStatus, string> = {
      [ProductStatus.DRAFT]: 'Draft',
      [ProductStatus.ACTIVE]: 'Active',
      [ProductStatus.INACTIVE]: 'Inactive',
      [ProductStatus.OUT_OF_STOCK]: 'Out of Stock',
      [ProductStatus.DISCONTINUED]: 'Discontinued'
    };
    
    return displayNames[this._status] || this._status;
  }

  getConditionDisplayName(): string {
    const displayNames: Record<ProductCondition, string> = {
      [ProductCondition.NEW]: 'New',
      [ProductCondition.USED_LIKE_NEW]: 'Used - Like New',
      [ProductCondition.USED_GOOD]: 'Used - Good',
      [ProductCondition.USED_FAIR]: 'Used - Fair',
      [ProductCondition.REFURBISHED]: 'Refurbished'
    };
    
    return displayNames[this._condition] || this._condition;
  }

  getDisplayName(): string {
    if (this._brand && this._model) {
      return `${this._brand} ${this._model} - ${this._name}`;
    }
    if (this._brand) {
      return `${this._brand} - ${this._name}`;
    }
    return this._name;
  }

  // Persistence helper
  toPersistence() {
    return {
      name: this._name,
      description: this._description,
      shortDescription: this._shortDescription,
      sku: this._sku,
      barcode: this._barcode,
      status: this._status,
      condition: this._condition,
      brand: this._brand,
      model: this._model,
      tags: this._tags,
      images: this._images,
      variants: this._variants,
      specifications: this._specifications,
      seo: this._seo,
      shipping: this._shipping,
      isFeatured: this._isFeatured,
      isDigital: this._isDigital,
      downloadUrl: this._downloadUrl,
      downloadLimit: this._downloadLimit,
      expiryDays: this._expiryDays,
      minOrderQuantity: this._minOrderQuantity,
      maxOrderQuantity: this._maxOrderQuantity,
      stockTrackingEnabled: this._stockTrackingEnabled,
      allowBackorders: this._allowBackorders,
      metadata: this._metadata
    };
  }

  toJSON() {
    return {
      name: this._name,
      displayName: this.getDisplayName(),
      description: this._description,
      shortDescription: this._shortDescription,
      sku: this._sku,
      barcode: this._barcode,
      status: this._status,
      statusDisplayName: this.getStatusDisplayName(),
      condition: this._condition,
      conditionDisplayName: this.getConditionDisplayName(),
      brand: this._brand,
      model: this._model,
      tags: this._tags,
      images: this._images,
      primaryImage: this.getPrimaryImage(),
      variants: this._variants,
      variantOptions: this.getAllVariantOptions(),
      specifications: this._specifications,
      specificationGroups: this.getAllSpecificationGroups(),
      seo: {
        ...this._seo,
        metaTitle: this.getMetaTitle(),
        metaDescription: this.getMetaDescription(),
        slug: this.getSlug(),
        keywords: this.getKeywords()
      },
      shipping: this._shipping,
      isFeatured: this._isFeatured,
      isDigital: this._isDigital,
      downloadUrl: this._downloadUrl,
      downloadLimit: this._downloadLimit,
      expiryDays: this._expiryDays,
      minOrderQuantity: this._minOrderQuantity,
      maxOrderQuantity: this._maxOrderQuantity,
      stockTrackingEnabled: this._stockTrackingEnabled,
      allowBackorders: this._allowBackorders,
      isAvailableForPurchase: this.isAvailableForPurchase(),
      isPublished: this.isPublished(),
      hasVariants: this.hasVariants(),
      hasImages: this.hasImages(),
      hasSpecifications: this.hasSpecifications(),
      requiresShipping: this.requiresShipping(),
      metadata: this._metadata
    };
  }

  // Static utility methods
  static getAllStatuses(): ProductStatus[] {
    return Object.values(ProductStatus);
  }

  static getAllConditions(): ProductCondition[] {
    return Object.values(ProductCondition);
  }

  static isValidStatus(status: string): boolean {
    return Object.values(ProductStatus).includes(status as ProductStatus);
  }

  static isValidCondition(condition: string): boolean {
    return Object.values(ProductCondition).includes(condition as ProductCondition);
  }

  static generateSku(prefix: string = 'PRD', suffix?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const parts = [prefix, timestamp, random];
    
    if (suffix) {
      parts.push(suffix);
    }
    
    return parts.join('-').toUpperCase();
  }

  static createSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}