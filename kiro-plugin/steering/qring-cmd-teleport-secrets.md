---
inclusion: manual
---

# q-ring · Teleport Secrets (command)

> Activate by typing `#qring-cmd-teleport-secrets` in chat.

Pack secrets into an encrypted bundle or unpack a received bundle for cross-machine transfer.

## Workflow

Ask the user whether they want to **pack** (send) or **unpack** (receive).

### Pack (send secrets)

1. Call `list_secrets` to show available secrets.
2. Ask the user which keys to include (or use tag-based selection).
3. Ask for a passphrase for encryption.
4. Call `teleport_pack` with the selected keys and passphrase.
5. Present the encrypted bundle string to the user for transfer (clipboard, secure channel, etc.).
6. Remind the user to share the passphrase through a separate channel.

### Unpack (receive secrets)

1. Ask the user to paste the encrypted bundle string.
2. Ask for the passphrase used during packing.
3. Call `teleport_unpack` with the bundle and passphrase.
4. Report the imported secrets: count, names, and scopes.
5. Offer to verify the imports with `list_secrets`.

## Security notes

- The bundle is AES-256-GCM encrypted — safe to transfer over untrusted channels.
- Always share the passphrase through a separate, secure channel (different from the bundle).
- Bundles are one-time use by convention — re-pack for additional transfers.
