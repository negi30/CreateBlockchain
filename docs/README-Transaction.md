# `Transaction.cpp` — PKCS#1 v1.5 Digital Signatures

The `Transaction` class encapsulates the cryptographically verifiable transfer of value across the ledger. It utilizes standard OpenSSL primitives to ensure non-repudiation and sender authenticity without requiring central authority authorization.

## Class Architecture

### Data Structure
* `std::string sender`: The alphanumeric identifier (or public key alias) of the sender.
* `std::string receiver`: The identifier for the receiving wallet.
* `float amount`: The scalar value representing the transacted funds. Must be strictly positive.
* `int nonce`: An anti-replay integer variable (prevents broadcasting the exact same transaction hash twice).
* `std::string signature`: The raw binary RSA signature data cast to a `std::string` buffer.
* `unsigned int signatureLength`: The byte-length of the generated signature buffer.

## Cryptographic Operations

### `void sign(RSA* privateKey)`
Executes the asymmetric digital signing algorithm.
1. **Flattening:** Concatenates `sender`, `receiver`, `amount`, and `nonce` into a raw `dataToSign` byte stream.
2. **Pre-hashing:** Pushes the stream through OpenSSL's `SHA256()` function to generate a 32-byte deterministic digest (`hash`). PKCS#1 v1.5 requires signing the hash of the payload, not the payload itself, to bypass RSA block-size limits and padding vulnerabilities.
3. **Ciphering:** Allocates an `unsigned char` vector matching the mathematical size of the RSA key (`RSA_size(privateKey)`). It then invokes `RSA_sign(NID_sha256, hash, ...)` to encrypt the SHA-256 digest with the sender's Private Key.
4. Stores the resulting cipher-text into the `signature` buffer.

### `bool verify(RSA* publicKey) const`
Performs cryptographic auditing on the transaction.
1. Clears the OpenSSL error matrix via `ERR_clear_error()`.
2. Regenerates the exact same pre-hash digest from the raw payload parameters.
3. Invokes `RSA_verify(...)`, passing the newly calculated hash, the stored `signature`, and the sender's known `publicKey`.
4. The algorithm decrypts the `signature` using the public key; if the decrypted hash identically matches the locally computed hash, authenticity is mathematically proven (returns `true`). If they diverge, the payload was mutated or signed by an unauthorized private key (returns `false`).

### `bool isValid(RSA* publicKey) const`
High-level validation wrapper used by the `Blockchain` network auditor. 
1. Protects against basic integer/float overflows (`amount <= 0`).
2. Asserts non-negative nonces.
3. Defers to `verify(publicKey)` for the heavy cryptographic auditing.