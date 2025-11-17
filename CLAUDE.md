- do not include any commit with claude ai mention or email
- Key Principles for Future Changes:

  ✅ Before Making Any Changes:

  1. Understand the full context - Read relevant files and understand how they interact
  2. Identify dependencies - Check what other parts of the system depend on the code being changed
  3. Review current implementation - Understand why it was built the way it is

  ✅ When Making Changes:

  1. Test affected areas - Consider all components that might be impacted:
    - Frontend components using the changed code
    - Backend functions calling modified APIs
    - Database queries affected by schema changes
    - Authentication/authorization flows
    - Real-time listeners that might break
  2. Preserve existing functionality - Make changes additive when possible:
    - Add new features without removing old ones
    - Maintain backward compatibility
    - Keep existing API signatures unless absolutely necessary
  3. Check cross-cutting concerns:
    - Multi-tenant isolation (restaurantId filtering)
    - Role-based permissions
    - Real-time Firestore listeners
    - Security rules impact
    - Performance implications

  ✅ Verification Checklist:

  - Read all affected files before editing
  - Understand data flow and dependencies
  - Check if changes affect authentication/authorization
  - Verify multi-tenant data isolation remains intact
  - Ensure backward compatibility
  - Consider impact on existing users/orders/data
  - Test critical paths (login, order creation, kitchen display, guest ordering)

  ✅ When in Doubt:

  - Ask clarifying questions before making changes
  - Propose a plan for review
  - Start with minimal, targeted changes
  - Test incrementally