# Security Spec for Firebase

## Data Invariants
- A user can only access their own wallet document in `exchange_wallets`.
- Wallet documents must contain a `balance` field (number).

## The "Dirty Dozen" Payloads
1. { "balance": 100 } - Valid creation
2. { "balance": -100 } - Invalid: negative balance
3. { "balance": "100" } - Invalid: string instead of number
4. { "foo": 100 } - Invalid: unknown field
5. { "balance": 100, "extra": 1 } - Invalid: extra field
6. { "uid": "other" } - Invalid: attempting to change ID
7. {} - Invalid: missing balance
8. { "balance": "100" } - Invalid: type mismatch
9. { "balance": 100 } - Valid update
10. { "balance": 0 } - Valid update
11. { } - Valid update (nothing changed)
12. { "balance": 100000000000000000000000000 } - Invalid: too large

## Test Runner (firestore.rules.test.ts)
```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "fs";

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "project-9b02a69f-1bd8-4dcc-880",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

test("user can read their own wallet", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertSucceeds(alice.firestore().doc("exchange_wallets/alice").get());
});

test("user cannot read others wallets", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertFails(alice.firestore().doc("exchange_wallets/bob").get());
});
```
