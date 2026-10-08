#include <iostream>
#include <vector>
#include <string>
#include <mutex>
#include "Blockchain.h"
#include "Wallet.h"
#include "httplib.h"
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

// Global state for the server
Blockchain myBlockchain;
vector<Wallet*> wallets;
std::mutex blockchain_mutex;

// Helper to handle CORS
void set_cors(httplib::Response &res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

int main() {
    httplib::Server svr;

    // Give Alice and Bob some initial setup for the frontend
    Wallet* genesisWallet = new Wallet("Genesis");
    genesisWallet->balance = 10000.0f;
    wallets.push_back(genesisWallet);

    // OPTIONS handler for CORS preflight requests
    svr.Options(R"(.*)", [](const httplib::Request &, httplib::Response &res) {
        set_cors(res);
    });

    // GET /wallets
    svr.Get("/wallets", [](const httplib::Request &, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        json j_wallets = json::array();
        for (const auto& w : wallets) {
            j_wallets.push_back({
                {"id", w->id},
                {"balance", w->balance}
            });
        }
        res.set_content(j_wallets.dump(), "application/json");
    });

    // POST /wallets
    svr.Post("/wallets", [](const httplib::Request &, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        
        Wallet* newWallet = new Wallet();
        wallets.push_back(newWallet);
        
        json response = {{"status", "success"}, {"id", newWallet->id}, {"balance", 0}};
        res.set_content(response.dump(), "application/json");
    });

    // POST /transactions
    svr.Post("/transactions", [](const httplib::Request &req, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        auto j = json::parse(req.body);
        string senderId = j["sender"];
        string receiverId = j["receiver"];
        float amount = j["amount"];

        Wallet* sender = nullptr;
        Wallet* receiver = nullptr;

        for (auto& w : wallets) {
            if (w->id == senderId) sender = w;
            if (w->id == receiverId) receiver = w;
        }

        if (!sender || !receiver) {
            json error = {{"status", "error"}, {"message", "Sender or Receiver not found"}};
            res.status = 400;
            res.set_content(error.dump(), "application/json");
            return;
        }

        if (amount <= 0) {
            json error = {{"status", "error"}, {"message", "Amount must be strictly positive"}};
            res.status = 400;
            res.set_content(error.dump(), "application/json");
            return;
        }

        if (sender->balance < amount) {
            json error = {{"status", "error"}, {"message", "Insufficient balance"}};
            res.status = 400;
            res.set_content(error.dump(), "application/json");
            return;
        }

        Transaction tx = sender->sendFunds(*receiver, amount);
        myBlockchain.createTransaction(tx);

        json response = {{"status", "success"}, {"message", "Transaction queued"}};
        res.set_content(response.dump(), "application/json");
    });

    // POST /mine
    svr.Post("/mine", [](const httplib::Request &, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        myBlockchain.minePendingTransactions();
        myBlockchain.notifyWallets(wallets);
        
        json response = {{"status", "success"}, {"message", "Mining complete"}};
        res.set_content(response.dump(), "application/json");
    });

    // GET /blockchain
    svr.Get("/blockchain", [](const httplib::Request &, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        
        json j_chain = json::array();
        for (const auto& block : myBlockchain.chain) {
            json j_block = {
                {"timestamp", block.timestamp},
                {"prevHash", block.prevHash},
                {"blockHash", block.blockHash},
                {"nonce", block.nonce},
                {"difficulty", block.difficulty}
            };

            json j_txs = json::array();
            for (const auto& tx : block.transactions) {
                j_txs.push_back({
                    {"sender", tx.sender},
                    {"receiver", tx.receiver},
                    {"amount", tx.amount},
                    {"nonce", tx.nonce},
                    {"signatureLength", tx.signatureLength}
                });
            }
            j_block["transactions"] = j_txs;
            j_chain.push_back(j_block);
        }

        json response = {
            {"status", "success"},
            {"chain", j_chain},
            {"pendingTransactions", myBlockchain.pendingTransactions.size()},
            {"difficulty", myBlockchain.currentDifficulty}
        };
        res.set_content(response.dump(), "application/json");
    });

    // POST /difficulty
    svr.Post("/difficulty", [](const httplib::Request &req, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        auto j = json::parse(req.body);
        int newDiff = j["difficulty"];
        if (newDiff >= 1 && newDiff <= 5) {
            myBlockchain.currentDifficulty = newDiff;
            res.set_content("{\"status\":\"success\"}", "application/json");
        } else {
            res.status = 400;
            res.set_content("{\"error\":\"Difficulty must be between 1 and 5\"}", "application/json");
        }
    });

    // GET /validate
    svr.Get("/validate", [](const httplib::Request &, httplib::Response &res) {
        set_cors(res);
        std::lock_guard<std::mutex> lock(blockchain_mutex);
        bool isValid = myBlockchain.isChainValid();
        json response = {{"status", "success"}, {"isValid", isValid}};
        res.set_content(response.dump(), "application/json");
    });

    // Serve React Frontend
    svr.set_mount_point("/", "./frontend/build");

    cout << "Starting Backend Server on http://localhost:8080" << endl;
    svr.listen("0.0.0.0", 8080);

    return 0;
}
