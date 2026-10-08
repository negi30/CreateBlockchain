# `Wallet.cpp` — Asymmetric Key Management & UTXO Simulation

The `Wallet` class operates as the local node's secure enclave. It generates cryptographic key pairs, manages the signing of outbound transactions, and processes global network state updates to calculate the current usable balance.

## Class Architecture

### Memory & State
* `std::string id`: Human-readable alias (or in a more advanced setup, the Base58-encoded public key hash).
* `float balance`: Cached state of the wallet's total funds. Re-calculated continuously based on network consensus.
* `RSA* publicKey`: Heap-allocated OpenSSL structure representing the wallet's public identity. Mapped to the global `Blockchain` state to allow network verification of transactions.
* `RSA* privateKey`: Secure, heap-allocated OpenSSL structure representing the private mathematical components (P, Q, D). Never exposed outside the class scope.

### Memory Lifecycle (`~Wallet`)
Due to C++'s manual memory management, OpenSSL `RSA` structures will leak memory if not properly freed. The destructor `~Wallet()` ensures that `RSA_free(privateKey)` and `RSA_free(publicKey)` are executed deterministically when the wallet object falls out of scope or the daemon is halted.

## Cryptographic Operations

### `void generateKeys()`
Interfaces with OpenSSL's prime generation APIs to create a 2048-bit RSA key pair.
1. Allocates a `BIGNUM` exponent and assigns it the 4th Fermat Prime (`RSA_F4` / 65537). This standardizes public exponents to optimize verification velocity while protecting against Coppersmith's low-exponent attacks.
2. Invokes `RSA_generate_key_ex` to process large prime factorization and populate the `privateKey` struct with the mathematical keying material.
3. Duplicates the Modulus (`N`) and Exponent (`E`) vectors into a distinct `publicKey` `RSA*` object via `RSA_set0_key`. This ensures the public key operates completely isolated from the private exponents.

### `Transaction sendFunds(Wallet& receiver, float amount)`
The transaction creation macro.
1. Instantiates a `Transaction` class targeting the receiver.
2. Passes the secured `privateKey` to the transaction's `sign()` method.
3. Returns the cryptographically signed `Transaction` object to the network for mempool inclusion.

### `void updateBalance(const std::vector<Transaction>& transactions)`
A local UTXO / balance recalculation simulator.
Iterates over all transactions within a newly mined block. If `tx.sender == id`, it deducts the localized `balance`. If `tx.receiver == id`, it increments it. This method is continuously called by the `Blockchain::notifyWallets` observer loop whenever the network reaches consensus on a new block.