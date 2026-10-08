# CreateBlockchain Node Architecture

A dependency-lean, cross-platform blockchain architecture engineered in standard C++11. This project demonstrates low-level cryptographic ledger mechanics, encompassing asymmetric verification, deterministic SHA-256 hashing, and a localized Proof-of-Work (PoW) consensus algorithm. 

The system features a **Thread-Safe REST API Backend** running on a C++ daemon and a real-time **React Web Dashboard** allowing users to operate a local node: generating wallets, broadcasting transactions, dynamically adjusting computational difficulty, and cryptographically verifying the integrity of the chain matrix.

## 🏗️ Technical Architecture & Cryptographic Showcase

This system operates as a fully verifiable, append-only distributed ledger. It bypasses high-level abstractions to interface directly with OpenSSL's C-bindings for core cryptographic operations, ensuring maximum performance and strict memory management.

### 1. Cryptographic Primitives & OpenSSL Bindings
*   **Asymmetric Encryption (RSA-2048):** Wallets dynamically generate 2048-bit RSA key pairs (`EVP_PKEY` / `RSA`). The public exponent is strictly set to the 4th Fermat prime, `RSA_F4` (65537), enforcing optimal signature verification velocity while maintaining strict coprime mathematical security against low-exponent attacks.
*   **Digital Signatures (PKCS#1 v1.5):** Transactions are authenticated using OpenSSL's signing APIs (`RSA_sign`, `RSA_verify`). The transaction payload matrix (Sender, Receiver, Amount, Nonce) is flattened into a deterministic byte array, hashed, and ciphered using the sender's private key. The node cryptographically audits this signature against the sender's public key vector before appending it to the mempool.
*   **Cryptographic Hashing (SHA-256):** Block integrity and transaction fingerprints are secured via 32-byte SHA-256 digests. The `generateHash()` function serializes the block's chronometric timestamp, transaction tree, previous hash pointer, and nonce into a deterministic 64-character hexadecimal digest.

### 2. State, Consensus & Data Structures
*   **The Ledger (`Blockchain.cpp`):** Utilizes `std::vector<Block>` to maintain state history. Enforces strict chronologic immutability. Validations loop over the vector space, confirming that `Block[n].prevHash == Block[n-1].blockHash` and performing O(N) signature audits on the block's transaction matrix.
*   **Proof of Work (PoW):** The `mineBlock()` routine implements a computationally intensive `while` loop, aggressively incrementing a 32-bit integer `nonce` until the resultant SHA-256 hash satisfies the network's dynamically adjustable `difficulty` constraint (target zero-bits).
*   **Thread Safety & Concurrency:** The HTTP REST API (`main.cpp`) utilizes `std::mutex` and `std::lock_guard` to synchronize all endpoints, mitigating race conditions that occur when multiple block-mining commands attempt to fork the chain simultaneously.
*   **Memory Management:** Heap-allocated cryptographic key structures are strictly managed and safely deallocated in object destructors (`~Wallet()`) avoiding leaks during persistent daemon operation.

---

## 🚀 Building & Running the Node

This project utilizes **CMake**, orchestrating an automated build process across macOS, Linux, and Windows (MSYS2).

### Prerequisites
* A C++11 compliant compiler (GCC, Clang, or MSVC)
* **CMake** (v3.10+)
* **OpenSSL** (v3.0+)
* **Node.js & npm** (For the React Frontend)

### Compilation & Daemon Execution

1. **Compile the Backend (C++)**
   ```bash
   mkdir build && cd build
   cmake ..
   make
   ```
2. **Start the API Daemon**
   ```bash
   ./blockchain_app
   ```
   *The C++ backend will bind to `http://localhost:8080`.*

3. **Boot the React Frontend**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   *The interactive UI dashboard will bind to `http://localhost:3000` (or `3001`).*

---

## 📂 Documentation

Comprehensive technical documentation for each component class can be found in the `docs/` directory:
* [`docs/README-Block.md`](docs/README-Block.md) - Hashing and PoW logic.
* [`docs/README-Blockchain.md`](docs/README-Blockchain.md) - State management, array mapping, and consensus.
* [`docs/README-Transaction.md`](docs/README-Transaction.md) - PKCS#1 v1.5 RSA Digital Signatures.
* [`docs/README-Wallet.md`](docs/README-Wallet.md) - OpenSSL Key generation & memory management.
