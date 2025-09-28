# `npx nest start` status — September 27, 2025

The application boots successfully on the trimmed authentication-only footprint created in earlier fixes. Command output excerpt:

```
$ npx nest start
[Nest] ... LOG [NestApplication] Nest application successfully started
🚀 Application is running on:
   - Local: http://localhost:3000
   - Network: http://192.168.100.147:3000
📚 Swagger documentation available at:
   - Local: http://localhost:3000/api/docs
   - Network: http://192.168.100.147:3000/api/docs
```

Follow-up work focuses on restoring the remaining feature modules once their outstanding TypeScript errors are resolved.
