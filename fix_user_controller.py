from pathlib import Path
import re

path = Path('src/modules/users/presentation/controllers/user.controller.ts')
text = path.read_text()

# Add import for AddressEntity if not present
import_statement = "import { AddressEntity } from '../../domain/entities/address.entity';\n"
if 'AddressEntity' not in text:
    pattern = re.compile(r"import {\\n  Controller,", re.MULTILINE)
    text = pattern.sub("import {\n  Controller,", text)  # ensure pattern exists
    # We'll insert after existing import block for DTOs? Instead of messing, find location before '@ApiTags'.

# Instead, we will add import manually after existing DTO imports.
marker = "import {\n  ChangePasswordDto,"
if marker not in text:
    raise SystemExit('DTO import marker not found')

if "AddressEntity" not in text.split('\n')[0]:
    text = text.replace(marker, "import { AddressEntity } from '../../domain/entities/address.entity';\n\n" + marker)

# Update searchAddresses method body
search_pattern = re.compile(r"  async searchAddresses\(\n    @Request\(\) req,\n    @Query\(\) searchDto: SearchAddressesDto,\n  \): Promise<AddressListResponseDto> {\n    return await this.addressManagementService.searchUserAddresses\(\n      req.user.id,\n      searchDto,\n    \);\n  }",
                            re.MULTILINE)

search_replacement = "  async searchAddresses(\n    @Request() req,\n    @Query() searchDto: SearchAddressesDto,\n  ): Promise<AddressListResponseDto> {\n    const result = await this.addressManagementService.searchUserAddresses(\n      req.user.id,\n      searchDto,\n    );\n\n    return {\n      addresses: result.addresses.map((address) => this.toAddressResponse(address)),\n      total: result.total,\n      page: result.page,\n      limit: result.limit,\n      totalPages: result.totalPages,\n      hasNext: result.hasNext,\n      hasPrev: result.hasPrev,\n    };\n  }"

text, count_search = search_pattern.subn(search_replacement, text)
if count_search != 1:
    raise SystemExit('Failed to update searchAddresses method')

# Add helper method before class closing brace
helper_method = "  private toAddressResponse(address: AddressEntity): AddressResponseDto {\n    return {\n      id: address.id,\n      userId: address.userId,\n      type: address.type,\n      label: address.label ?? address.getDisplayName(),\n      addressLine1: address.addressLine1,\n      addressLine2: address.addressLine2,\n      landmark: address.landmark,\n      city: address.city,\n      state: address.state,\n      postalCode: address.postalCode,\n      country: address.country,\n      latitude: address.latitude,\n      longitude: address.longitude,\n      contactName: address.contactName,\n      contactPhone: address.contactPhone,\n      deliveryInstructions: address.deliveryInstructions,\n      accessCode: address.accessCode,\n      floorNumber: address.floorNumber,\n      isDefault: address.isDefault,\n      isActive: address.isActive,\n      usageCount: address.usageCount ?? 0,\n      lastUsedAt: address.lastUsedAt,\n      createdAt: address.createdAt,\n      updatedAt: address.updatedAt,\n      fullAddress: address.getFullAddress(),\n    };\n  }\n\n"

if 'private toAddressResponse(' not in text:
    insert_location = text.rfind('}')
    text = text[:insert_location] + helper_method + text[insert_location:]

path.write_text(text)
