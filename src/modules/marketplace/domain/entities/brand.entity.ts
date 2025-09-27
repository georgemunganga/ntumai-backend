import { AggregateRoot } from '@nestjs/cqrs';
import { BrandId } from '../value-objects/brand-id.vo';
import { BrandCreatedEvent } from '../events/brand-created.event';
import { BrandUpdatedEvent } from '../events/brand-updated.event';
import { BrandDeletedEvent } from '../events/brand-deleted.event';

export interface BrandProps {
  id: BrandId;
  name: string;
  description?: string;
  imageUrl?: string;
  website?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Brand extends AggregateRoot {
  private constructor(private readonly props: BrandProps) {
    super();
  }

  public static create(props: Omit<BrandProps, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>): Brand {
    const brandId = BrandId.generate();
    const now = new Date();
    
    const brand = new Brand({
      ...props,
      id: brandId,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    brand.apply(new BrandCreatedEvent(brandId.value, props.name));
    return brand;
  }

  public static fromPersistence(props: BrandProps): Brand {
    return new Brand(props);
  }

  // Getters
  get id(): BrandId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get productCount(): number {
    return this.props.productCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  public updateDetails(name: string, description?: string, imageUrl?: string, website?: string): void {
    this.props.name = name;
    this.props.description = description;
    this.props.imageUrl = imageUrl;
    this.props.website = website;
    this.props.updatedAt = new Date();

    this.apply(new BrandUpdatedEvent(this.props.id.value, name));
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public incrementProductCount(): void {
    this.props.productCount += 1;
    this.props.updatedAt = new Date();
  }

  public decrementProductCount(): void {
    if (this.props.productCount > 0) {
      this.props.productCount -= 1;
      this.props.updatedAt = new Date();
    }
  }

  public updateProductCount(count: number): void {
    if (count < 0) {
      throw new Error('Product count cannot be negative');
    }
    this.props.productCount = count;
    this.props.updatedAt = new Date();
  }

  public delete(): void {
    if (this.props.productCount > 0) {
      throw new Error('Cannot delete brand with existing products');
    }
    this.apply(new BrandDeletedEvent(this.props.id.value, this.props.name));
  }

  public canBeDeleted(): boolean {
    return this.props.productCount === 0;
  }

  public toSnapshot(): BrandProps {
    return { ...this.props };
  }
}