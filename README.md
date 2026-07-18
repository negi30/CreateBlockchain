#CreateBlockchain


An dependency-lean blockchain architecture implemented in C++. This project is designed to demonstrate low-level ledger mechanics, encompassing asymmetric cryptographic verification, cryptographic hashing, and a localized Proof-of-Work (PoW) consensus algorithm.

## 🏗️ Technical Architecture & Cryptographic Showcase

This system models a fully verifiable, append-only ledger, bypassing high-level abstractions to interact directly with OpenSSL's C-bindings for core cryptographic operations.

### 1. Cryptographic Primitives (OpenSSL)
*   **Asymmetric Encryption (RSA-2048):** Wallets dynamically generate 2048-bit RSA key pairs using `RSA_generate_key_ex`. The public exponent is strictly set to `RSA_F4` (65537, the 4th Fermat prime) to ensure optimal signature verification speed while maintaining strict coprime mathematical security against low-exponent attacks.
*   **Digital Signatures:** Transactions are authenticated using `RSA_sign` and `RSA_verify`. The transaction payload (Sender, Receiver, Amount, Nonce) is flattened, hashed, and encrypted with the sender's private key. The network cryptographically audits this signature against the sender's public key before allowing ledger inclusion.
*   **Cryptographic Hashing (SHA-256):** Block integrity and transaction fingerprints are secured via 32-byte SHA-256 digests, converting raw byte streams into deterministic 64-character hexadecimal strings.

### 2. State & Data Structures
*   **The Ledger (`Blockchain.cpp`):** Utilizes `std::vector<Block>` to maintain state history. Enforces strict chronologic immutability.
*   **Proof of Work (PoW):** The `mineBlock()` routine implements a computationally intensive `while` loop, aggressively incrementing a 32-bit `nonce` until the resultant SHA-256 hash satisfies the network's dynamically adjustable `difficulty` constraint (target zero-bits).
*   **Memory Management:** Heap-allocated RSA key structures (`BIGNUM`, `RSA`) are strictly managed and safely deallocated in object destructors (`~Wallet()`) to prevent memory leaks during continuous node operation.

