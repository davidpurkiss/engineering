# fixtures

Tiny projects used to prove the boundary checker actually fires. They are not examples to
copy — `queue-violations/` is deliberately wrong.

`npm run test:fixtures` asserts that the violating fixture produces exactly the expected rule
ids and that the clean one produces none. A checker that cannot be shown to fail is not a
checker.
