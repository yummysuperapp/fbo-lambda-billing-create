## Project Overview

This is the **AWS Lambda** - a private AWS Lambda function template for Financial Backoffice (FBO) operations at Yummy Inc. This template serves as the foundation for building serverless financial services with strict quality standards and comprehensive testing.

### Key Information

- **Team**: Financial Backoffice (FBO)
- **Tech Lead**: José Carrillo <jose.carrillo@yummysuperapp.com>
- **Runtime**: Node.js 22.x with TypeScript
- **Architecture**: AWS Lambda serverless with multi-database support
- **Quality Standards**: 100% test coverage, ultra-strict TypeScript, comprehensive CI/CD

## Language and Communication Standards

### Critical Language Rules

- **Natural language** (comments, documentation, commit messages): **Spanish (es_CO)**
- **All code** (variables, functions, classes, file names, directories): **English (en_US)**
- **Code comments**: English unless explicitly Spanish context required
- **Documentation files**: Spanish for user-facing docs, English for technical specs

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes/Components**: `PascalCase`
- **Directories/Files**: `kebab-case`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase` with descriptive names

## Architecture and Technical Stack

### Core Technologies

- **Runtime**: Node.js 22.x
- **Language**: TypeScript (ultra-strict configuration)
- **Module System**: ESModules (`"type": "module"`)
- **Testing**: Vitest with 100% coverage requirement
- **Linting**: ESLint v9 with TypeScript rules
- **Build**: TypeScript compiler with strict settings

### Database Support

- **MongoDB**: Primary NoSQL database with Atlas connection
- **PostgreSQL**: Relational database with connection pooling
- **BigQuery**: Analytics and data warehouse integration
- **S3**: File storage and document management

### AWS Services Integration

- **Lambda**: Serverless compute platform
- **S3**: Object storage with presigned URLs
- **CloudWatch**: Logging and monitoring
- **IAM**: Security and access management

## Project Structure and Patterns

### Directory Structure

```
src/
├── @types/           # TypeScript type definitions
├── clients/          # External service clients (DB, APIs)
├── config/           # Configuration management
├── handlers/         # Lambda event handlers
├── interfaces/       # TypeScript interfaces
├── services/         # Business logic services
└── utils/            # Utility functions and helpers

tests/
├── __fixtures__/     # Test data and fixtures
├── __mocks__/        # Mock implementations
├── clients/          # Client tests
├── interfaces/       # Interface tests
├── services/         # Service tests
└── utils/            # Utility tests
```

### Path Aliases (tsconfig.json)

- `@/*` → `./src/*`
- `@/types` → `./src/@types/index.d.ts`
- `@/interfaces/*` → `./src/interfaces/*`
- `@/clients/*` → `./src/clients/*`
- `@/config/*` → `./src/config/*`
- `@/handlers/*` → `./src/handlers/*`
- `@/services/*` → `./src/services/*`
- `@/utils/*` → `./src/utils/*`

## TypeScript Configuration Standards

### Ultra-Strict TypeScript Rules

- **NO `any` types allowed** - Use `unknown` or precise types
- **Strict null checks**: All variables must handle null/undefined
- **No unused variables/parameters**: Clean code enforcement
- **Exact optional properties**: Precise type definitions
- **No unchecked indexed access**: Safe array/object access
- **Explicit function return types**: Clear API contracts

### Required TypeScript Settings

```json
{
	"strict": true,
	"noImplicitAny": true,
	"noImplicitReturns": true,
	"noUnusedLocals": true,
	"noUnusedParameters": true,
	"exactOptionalPropertyTypes": true,
	"noUncheckedIndexedAccess": true,
	"noImplicitOverride": true
}
```

## Code Quality and Testing Standards

### Testing Requirements

- **Framework**: Vitest with Node.js environment
- **Coverage**: 100% required (lines, functions, branches, statements)
- **Test Types**: Unit, integration, and service tests
- **Mocking**: Comprehensive mocks for external dependencies
- **Setup**: Global test setup in `tests/setup.ts`

### Test File Patterns

- **Location**: Co-located in `tests/` directory
- **Naming**: `*.test.ts` or `*.spec.ts`
- **Structure**: Describe blocks with clear test descriptions
- **Cleanup**: Proper cleanup after each test

### ESLint Rules

- **No console.log**: Use `console.warn` or `console.error` only
- **Prefer const**: Immutable variables by default
- **No var**: Use `const` or `let` only
- **Object shorthand**: Modern JavaScript patterns
- **Template literals**: Prefer template strings over concatenation

## Environment and Configuration

### Environment Variables

- **Validation**: All env vars validated in `environment.config.ts`
- **Type Safety**: Strongly typed environment configuration
- **Required Variables**: AWS credentials, database connections, API keys
- **Environment Detection**: `NODE_ENV` with proper environment flags

### Configuration Pattern

- **Centralized**: All config in `src/config/` directory
- **Typed**: Strong TypeScript interfaces for all configurations
- **Validated**: Runtime validation of all environment variables
- **Structured**: Organized by service (AWS, databases, APIs)

## Development Workflow

### Branch Naming Convention

- **Features**: `feat/FB-[JIRA-NUMBER]_[description]`
- **Fixes**: `fix/FB-[JIRA-NUMBER]_[description]`
- **Hotfixes**: `hotfix/FB-[JIRA-NUMBER]_[description]`
- **Validation**: Automatic branch name validation in CI/CD

### Available Scripts

```bash
# Development
npm run start:dev          # Development with tsx
npm run start:local        # Local environment
npm run build:watch        # Build with watch mode

# Quality Assurance
npm run type-check         # TypeScript validation
npm run lint               # ESLint checking
npm run lint:fix           # Auto-fix linting issues
npm test                   # Run test suite
npm run test:cov           # Tests with coverage
npm run test:watch         # Tests in watch mode

# Build and Deploy
npm run build              # Production build
npm run check-all          # Complete quality pipeline
npm run prepare-deploy     # Pre-deployment validation
```

## CI/CD Pipeline

### Testing Workflow (`.github/workflows/test.yml`)

1. **Type Checking**: Strict TypeScript validation
2. **Linting**: ESLint with TypeScript rules
3. **Testing**: Vitest with 100% coverage requirement
4. **Security Audit**: npm audit for vulnerabilities
5. **Quality Gates**: All checks must pass

### Deployment Workflow (`.github/workflows/deploy.yml`)

1. **Trigger**: Only after successful testing workflow
2. **Environment Detection**: Based on branch (develop/testing/master)
3. **Build**: TypeScript compilation and packaging
4. **Deploy**: AWS Lambda function update
5. **Validation**: Post-deployment health checks

## Security and Best Practices

### Security Standards

- **No hardcoded secrets**: All sensitive data in environment variables
- **IAM roles**: Prefer IAM roles over access keys in production
- **Input validation**: Validate all external inputs
- **Error handling**: Comprehensive error handling with proper logging
- **Audit logging**: Track all significant operations

### Performance Considerations

- **Connection pooling**: Reuse database connections
- **Lazy loading**: Load dependencies only when needed
- **Memory management**: Proper cleanup of resources
- **Cold start optimization**: Minimize initialization time

## Code Review Guidelines

### What to Review

1. **Type Safety**: Ensure no `any` types and proper type definitions
2. **Test Coverage**: Verify 100% coverage is maintained
3. **Error Handling**: Check comprehensive error handling
4. **Performance**: Review for potential performance issues
5. **Security**: Validate input sanitization and secret management
6. **Documentation**: Ensure code is well-documented
7. **Naming**: Verify naming conventions are followed
8. **Architecture**: Check adherence to established patterns

### Quality Checklist

- [ ] TypeScript strict mode compliance
- [ ] 100% test coverage maintained
- [ ] ESLint rules passing
- [ ] No console.log statements
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Documentation updated
- [ ] Environment variables properly configured
- [ ] Security best practices followed
- [ ] Performance considerations addressed

## Integration with External Services

### Slack Integration

After completing a code review, search for the associated Slack thread using the GitHub MCP and notify the team in the `#fbo-team` channel that a Copilot review has been completed. Include:

- Pull request link
- Summary of review findings
- Any critical issues identified
- Recommendations for improvement

### Notification Template

```
🤖 **Copilot Code Review Completed**

**PR**: [Link to Pull Request]
**Status**: ✅ Approved / ⚠️ Changes Requested / ❌ Rejected

**Key Findings**:
- [Summary of main review points]
- [Any security or performance concerns]
- [Compliance with FBO standards]

**Next Steps**: [Recommended actions]

*Review completed by GitHub Copilot for FBO Lambda Template*
```

## Documentation Standards

### Code Documentation

- **JSDoc**: Use JSDoc comments for all public functions and classes
- **Type Annotations**: Explicit type annotations for complex types
- **README Updates**: Keep README.md current with any architectural changes
- **API Documentation**: Document all external interfaces

### File Headers

Include file headers with:

- Purpose and functionality description
- Author information (José Carrillo <jose.carrillo@yummysuperapp.com>)
- Version and last update information
- Dependencies and usage notes

## Troubleshooting and Support

### Common Issues

1. **Type Errors**: Check for `any` types and ensure proper type definitions
2. **Test Failures**: Verify mocks are properly configured
3. **Build Issues**: Check TypeScript configuration and dependencies
4. **Deployment Failures**: Validate environment variables and AWS permissions

### Support Contacts

- **Tech Lead**: José Carrillo <jose.carrillo@yummysuperapp.com>
- **Team Channel**: #fbo-team (Slack)
- **Documentation**: [Confluence FBO Space](https://yummy.atlassian.net/wiki/spaces/FBO)
- **Repository**: [GitHub Issues](https://github.com/yummysuperapp/fbo-lambda-template/issues)

---

## Instructions for GitHub Copilot

When reviewing code in this repository:

1. **Enforce TypeScript Standards**: Reject any use of `any` types and ensure strict type safety
2. **Verify Test Coverage**: Ensure all new code has corresponding tests with 100% coverage
3. **Check Naming Conventions**: Validate English naming for code, Spanish for documentation
4. **Review Architecture Patterns**: Ensure adherence to established service and client patterns
5. **Validate Security**: Check for proper input validation and secret management
6. **Performance Review**: Look for potential performance bottlenecks or memory leaks
7. **Documentation Check**: Ensure code is properly documented with JSDoc comments
8. **Environment Configuration**: Verify proper environment variable usage and validation

**After completing the review, use the GitHub MCP to search for the associated Slack thread and post a notification in the #fbo-team channel with the review summary and any critical findings.**
