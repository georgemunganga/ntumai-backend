from pathlib import Path

path = Path('src/modules/users/presentation/controllers/user.controller.ts')
text = path.read_text()

bad_literal = "    return {\\r\\n      success: true,\\r\\n      message: 'Bulk operation completed successfully',\\r\\n      affectedCount,\\r\\n    };\\\\r\\\\n  }\\\\r\\\\n\\\\r\\\\n  private toAddressResponse(address: AddressEntity): AddressResponseDto {"
if bad_literal in text:
    replacement = "    return {\n      success: true,\n      message: 'Bulk operation completed successfully',\n      affectedCount,\n    };\n  }\n\n  private toAddressResponse(address: AddressEntity): AddressResponseDto {"
    text = text.replace(bad_literal, replacement)
else:
    alt_literal = "    return {\\n      success: true,\\n      message: 'Bulk operation completed successfully',\\n      affectedCount,\\n    };\\n  }\\n\\n  private toAddressResponse(address: AddressEntity): AddressResponseDto {"
    if alt_literal in text:
        text = text.replace(alt_literal, replacement)

# Ensure file ends with single closing brace for class
text = text.rstrip()
if text.endswith('}\n}\n'):
    pass
elif text.endswith('}\n}'):  # already fine
    pass
elif text.endswith('}\n}\r\n'):
    pass
else:
    if text.endswith('}\n}\n}\n'):
        text = text[:-3]

text += '\n'
path.write_text(text)
