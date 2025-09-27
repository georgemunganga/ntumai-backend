from pathlib import Path

path = Path('src/modules/users/presentation/controllers/user.controller.ts')
text = path.read_text()

old_tail = "    return {\n      success: true,\n      message: 'Bulk operation completed successfully',\n      affectedCount,\n    };\n    private toAddressResponse(address: AddressEntity): AddressResponseDto {\n    return {\n      id: address.id,\n      userId: address.userId,\n      type: address.type,\n      label: address.label ?? address.getDisplayName(),\n      addressLine1: address.addressLine1,\n      addressLine2: address.addressLine2,\n      landmark: address.landmark,\n      city: address.city,\n      state: address.state,\n      postalCode: address.postalCode,\n      country: address.country,\n      latitude: address.latitude,\n      longitude: address.longitude,\n      contactName: address.contactName,\n      contactPhone: address.contactPhone,\n      deliveryInstructions: address.deliveryInstructions,\n      accessCode: address.accessCode,\n      floorNumber: address.floorNumber,\n      isDefault: address.isDefault,\n      isActive: address.isActive,\n      usageCount: address.usageCount ?? 0,\n      lastUsedAt: address.lastUsedAt,\n      createdAt: address.createdAt,\n      updatedAt: address.updatedAt,\n      fullAddress: address.getFullAddress(),\n    };\n  }\n\n}\n}\n"

new_tail = "    return {\n      success: true,\n      message: 'Bulk operation completed successfully',\n      affectedCount,\n    };\n  }\n\n  private toAddressResponse(address: AddressEntity): AddressResponseDto {\n    return {\n      id: address.id,\n      userId: address.userId,\n      type: address.type,\n      label: address.label ?? address.getDisplayName(),\n      addressLine1: address.addressLine1,\n      addressLine2: address.addressLine2,\n      landmark: address.landmark,\n      city: address.city,\n      state: address.state,\n      postalCode: address.postalCode,\n      country: address.country,\n      latitude: address.latitude,\n      longitude: address.longitude,\n      contactName: address.contactName,\n      contactPhone: address.contactPhone,\n      deliveryInstructions: address.deliveryInstructions,\n      accessCode: address.accessCode,\n      floorNumber: address.floorNumber,\n      isDefault: address.isDefault,\n      isActive: address.isActive,\n      usageCount: address.usageCount ?? 0,\n      lastUsedAt: address.lastUsedAt,\n      createdAt: address.createdAt,\n      updatedAt: address.updatedAt,\n      fullAddress: address.getFullAddress(),\n    };\n  }\n}\n"

if old_tail not in text:
    raise SystemExit('Expected old tail not found')

text = text.replace(old_tail, new_tail)
path.write_text(text)
