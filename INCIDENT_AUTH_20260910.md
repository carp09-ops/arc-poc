# ARC Auth / Boot Incident — 2026-09-10

Preserved incident state before production rollback.

The main production regression was isolated to the auth/recovery/boot changes made after commit `8e06953559f9072d1297fe16ab1a3420d9628448`.

Affected files across the incident window:
- index.html
- v073.js
- reset.html
- v076.js
- v078.js
- v079.js

This file marks the incident snapshot. The full commit history remains available in Git.
