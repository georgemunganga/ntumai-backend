import { AggregateRoot } from '@nestjs/cqrs';
import { CategoryId } from '../value-objects/category-id.vo';
import { CategoryCreatedEvent } from '../events/category-created.event';
import { CategoryUpdatedEvent } from '../events/category-updated.event';
import { CategoryDeletedEvent } from '../events/category-deleted.event';

export interface CategoryProps {
  id: CategoryId;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: CategoryId;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Category extends AggregateRoot {
  private constructor(private readonly props: CategoryProps) {
    super();
  }

  public static create(props: Omit<CategoryProps, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>): Category {
    const categoryId = CategoryId.generate();
    const now = new Date();
    
    const category = new Category({
      ...props,
      id: categoryId,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    category.apply(new CategoryCreatedEvent(categoryId.value, props.name, props.parentId?.value));
    return category;
  }

  public static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
  }

  // Getters
  get id(): CategoryId {
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

  get parentId(): CategoryId | undefined {
    return this.props.parentId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
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
  public updateDetails(name: string, description?: string, imageUrl?: string): void {
    this.props.name = name;
    this.props.description = description;
    this.props.imageUrl = imageUrl;
    this.props.updatedAt = new Date();

    this.apply(new CategoryUpdatedEvent(this.props.id.value, name));
  }

  public updateSortOrder(sortOrder: number): void {
    if (sortOrder < 0) {
      throw new Error('Sort order cannot be negative');
    }
    this.props.sortOrder = sortOrder;
    this.props.updatedAt = new Date();
  }

  public setParent(parentId: CategoryId): void {
    if (parentId.equals(this.props.id)) {
      throw new Error('Category cannot be its own parent');
    }
    this.props.parentId = parentId;
    this.props.updatedAt = new Date();
  }

  public removeParent(): void {
    this.props.parentId = undefined;
    this.props.updatedAt = new Date();
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
      throw new Error('Cannot delete category with existing products');
    }
    this.apply(new CategoryDeletedEvent(this.props.id.value, this.props.name));
  }

  public isRootCategory(): boolean {
    return this.props.parentId === undefined;
  }

  public isSubcategory(): boolean {
    return this.props.parentId !== undefined;
  }

  public canBeDeleted(): boolean {
    return this.props.productCount === 0;
  }

  public toSnapshot(): CategoryProps {
    return { ...this.props };
  }
}