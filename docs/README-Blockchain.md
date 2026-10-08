# `Blockchain.cpp` — Global Ledger & Consensus Implementation

The `Blockchain` class serves as the macro-manager for the cryptographic ledger. It enforces array integrity, validates digital signatures, processes Proof-of-Work (PoW) consensus algorithms, and encapsulates the mempool (pending transactions).

## Class Architecture

### Member Variables
* `std::vector<Block> chain`: The immutable chronological vector space of all mined blocks.
* `std::vector<Transaction> pendingTransactions`: The mempool. Caches unmined transactions awaiting inclusion in the next block.
* `int currentDifficulty`: The dynamic computational target for the PoW algorithm. Defines the required number of leading zero-bits in the SHA-256 digest.
* `std::unordered_map<std::string, RSA*> publicKeyMap`: An in-memory mapping linking Wallet IDs to their respective `RSA*` public keys for fast O(1) signature auditing.

## Methods & Cryptographic Logic

### `Blockchain()`
Initializes the ledger array and generates the **Genesis Block**. The Genesis block is initialized with a hardcoded previous hash of `"0"` and an empty transaction vector.

### `void createTransaction(Transaction transaction)`
Appends a fully signed transaction to the `pendingTransactions` mempool. *Note: In a decentralized environment, this method is triggered upon successful validation of a gossip protocol broadcast.*

### `void minePendingTransactions()`
Constructs a new `Block` object.
1. Passes the current `pendingTransactions` to the block constructor.
2. Passes `chain.back().blockHash` as the cryptographic pointer connecting this block to the ledger.
3. Passes `currentDifficulty` to enforce the PoW CPU-bound cracking loop.
4. Appends the successfully mined block to the `chain` and flushes the mempool via `pendingTransactions.clear()`.

### Cryptographic Validation Suite

* `bool isBlockHashValid(const Block& block)`: Re-hashes the block's current state (`generateHash()`) and checks if it mathematically equals the stored `blockHash`. Protects against localized data manipulation.
* `bool isTransactionValid(const Transaction& tx)`: Asserts structural conditions, such as `tx.amount > 0` and ensures valid signature pointers.
* `bool isChainValid()`: The core algorithmic auditor. Iterates linearly over the `chain` vector starting from index 1:
  1. Validates the current block's hash.
  2. Asserts linkage integrity: `currBlock.prevHash == prevBlock.blockHash`.
  3. Iterates over the block's transaction matrix, pulling the sender's public key from the `publicKeyMap`, and calls `RSA_verify` to audit the PKCS#1 v1.5 digital signature. Any single failure returns `false`, indicating chain corruption or a successful Byzantine fault.

### `void notifyWallets(std::vector<Wallet*>& wallets)`
Simulates network consensus mapping. Iterates over all known wallets, updating their global `publicKeyMap` entry and executing their specific UTXO/balance reduction algorithms based on the newly mined blocks.

## Thread Safety Note
When implemented in the REST API environment (`main.cpp`), all calls to `Blockchain` methods are enveloped in a `std::lock_guard<std::mutex>` to prevent concurrent mining requests from producing invalid branches (forks) that corrupt the `chain` array.