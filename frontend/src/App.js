import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins, Send, Pickaxe, CheckCircle, XCircle, Settings } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8080';

function App() {
  const [wallets, setWallets] = useState([]);
  const [blockchain, setBlockchain] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [difficulty, setDifficulty] = useState(2);
  
  const [newWalletId, setNewWalletId] = useState('');
  
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');

  const fetchData = async () => {
    try {
      const [walletRes, chainRes, validRes] = await Promise.all([
        axios.get(`${API_URL}/wallets`),
        axios.get(`${API_URL}/blockchain`),
        axios.get(`${API_URL}/validate`)
      ]);
      setWallets(walletRes.data);
      setBlockchain(chainRes.data.chain);
      setPendingTransactions(chainRes.data.pendingTransactions);
      setDifficulty(chainRes.data.difficulty || 2);
      setIsValid(validRes.data.isValid);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createWallet = async (e) => {
    e.preventDefault();
    if (!newWalletId) return;
    await axios.post(`${API_URL}/wallets`, { id: newWalletId });
    setNewWalletId('');
    fetchData();
  };

  const sendTransaction = async (e) => {
    e.preventDefault();
    if (!sender || !receiver || !amount) return;
    try {
      await axios.post(`${API_URL}/transactions`, {
        sender, receiver, amount: parseFloat(amount)
      });
      setSender('');
      setReceiver('');
      setAmount('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Transaction failed");
    }
  };

  const mineBlocks = async () => {
    await axios.post(`${API_URL}/mine`);
    fetchData();
  };

  const changeDifficulty = async (newDiff) => {
    await axios.post(`${API_URL}/difficulty`, { difficulty: newDiff });
    fetchData();
  };

  return (
    <div className="App">
      <div className="top-status-bar">
        <h1 className="main-heading">CreateBlockchain</h1>
        <div className={`status-badge ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? <><CheckCircle size={18}/> Chain Valid</> : <><XCircle size={18}/> Chain Invalid</>}
        </div>
      </div>

      <main className="dashboard">
        {/* Left Column */}
        <div className="column">
          <section className="card">
            <h2><Coins size={20}/> Wallets & Balances</h2>
            <ul className="wallet-list">
              {wallets.map(w => (
                <li key={w.id}>
                  <strong>{w.id}</strong>
                  <span className="balance">{w.balance} coins</span>
                </li>
              ))}
            </ul>
            <form onSubmit={createWallet} className="inline-form">
              <input 
                placeholder="New Wallet ID" 
                value={newWalletId} 
                onChange={(e) => setNewWalletId(e.target.value)}
              />
              <button type="submit">Create</button>
            </form>
          </section>

          <section className="card">
            <h2><Send size={20}/> Send Funds</h2>
            <form onSubmit={sendTransaction} className="vertical-form">
              <select value={sender} onChange={(e) => setSender(e.target.value)}>
                <option value="">Select Sender...</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.id} ({w.balance})</option>)}
              </select>
              <select value={receiver} onChange={(e) => setReceiver(e.target.value)}>
                <option value="">Select Receiver...</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.id}</option>)}
              </select>
              <input 
                type="number" 
                placeholder="Amount" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
              />
              <button type="submit">Sign & Send</button>
            </form>
          </section>

          <section className="card">
            <h2><Settings size={20}/> Network Settings</h2>
            <div className="difficulty-control">
              <label>Mining Difficulty (1-5): <strong>{difficulty}</strong></label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={difficulty} 
                onChange={(e) => changeDifficulty(parseInt(e.target.value))}
              />
              <small>Higher difficulty exponentially increases mining time.</small>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="column">
           <section className="card">
            <div className="card-header">
              <h2><Pickaxe size={20}/> Pending Transactions ({pendingTransactions})</h2>
              <button onClick={mineBlocks} className="mine-btn" disabled={pendingTransactions === 0}>
                Mine Block
              </button>
            </div>
            {pendingTransactions === 0 ? (
                <p className="empty-state">No transactions waiting to be mined.</p>
            ) : (
                <p>Transactions are queued up in the mempool.</p>
            )}
          </section>

          <section className="card">
            <h2>Blockchain Explorer</h2>
            <div className="blockchain">
              {blockchain.map((block, i) => (
                <div key={i} className="block">
                  <div className="block-header">
                    <h3>Block {i}</h3>
                    <span className="hash" title={block.blockHash}>{block.blockHash.substring(0, 16)}...</span>
                  </div>
                  <div className="block-details">
                    <p><strong>Nonce:</strong> {block.nonce}</p>
                    <p><strong>Difficulty:</strong> {block.difficulty}</p>
                    <p><strong>Prev:</strong> {block.prevHash === "0" ? "0" : block.prevHash.substring(0,16) + "..."}</p>
                    <div className="transactions">
                      <h4>Transactions ({block.transactions.length})</h4>
                      {block.transactions.length === 0 ? <p className="empty-state">No transactions (Genesis)</p> : null}
                      {block.transactions.map((tx, j) => (
                        <div key={j} className="tx">
                          {tx.sender} ➔ {tx.receiver} <strong>({tx.amount} coins)</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
