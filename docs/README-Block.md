# `Block.cpp` — Proof of Work & Cryptographic Hashing

The `Block` class represents a single node within the blockchain array. It encapsulates the deterministic state of multiple transactions, the chronometric timestamp, the mining difficulty, and the `nonce` integer required for the Proof-of-Work (PoW) consensus algorithm.

## Class Architecture

### Core Variables
* `std::string prevHash`: The 256-bit SHA-256 digest of the chronologically preceding block. Secures the chain against deep-ledger mutation.
* `std::string blockHash`: The verified SHA-256 digest of this block's complete dataset, including the valid `nonce`.
* `std::vector<Transaction> transactions`: The payload matrix containing signed fund transfers.
* `std::time_t timestamp`: POSIX time integer marking block creation.
* `int nonce`: The scalar integer violently incremented during the mining phase to alter the block's deterministic hash until it satisfies the network target.
* `int difficulty`: The network-defined target condition (number of leading zero-bits required in the final hash).

## Cryptographic Methods

### `Block(std::vector<Transaction>, std::string, int)`
Constructs the block state and immediately invokes the PoW CPU-bound loop via `mineBlock()`.

### `std::string mineBlock()`
Executes the brute-force Proof-of-Work algorithm.
1. Generates a `target` string consisting of `difficulty` number of `'0'` characters (e.g., `"000"` for difficulty 3).
2. Initiates a `while` loop that compares the block's current hash substring `blockHash.substr(0, difficulty)` to the `target`.
3. If the hash fails the check, it increments `nonce++` and recalculates the entire block's hash.
4. This process mathematically simulates computational work, preventing Sybil attacks and network spam.

### `std::string generateHash() const`
Serializes the block's multi-dimensional state into a flat byte-stream for hashing. 
It pipes the `timestamp`, all `sender`/`receiver`/`amount` data from the `transactions` matrix, the `prevHash`, and the current `nonce` into a standard `std::stringstream`, which is then passed to `sha256()`.

### `std::string sha256(const std::string str) const`
Low-level wrapper for OpenSSL's C-bindings.
1. Instantiates a `SHA256_CTX` struct.
2. Initializes memory via `SHA256_Init`.
3. Streams the flattened block string bytes into the context via `SHA256_Update`.
4. Flushes the 32-byte hash buffer via `SHA256_Final`.
5. Converts the raw byte array into a 64-character deterministic hexadecimal `std::string` format for string-comparison in `mineBlock()`.