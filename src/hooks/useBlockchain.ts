import { useState, useEffect, useCallback, useMemo } from 'react';
import CryptoJS from 'crypto-js';

export interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature?: string;
  data?: any;
}

export interface Wallet {
  address: string;
  balance: number;
  privateKey: string;
  publicKey: string;
}

export interface MiningStats {
  hashRate: number;
  difficulty: number;
  blocksFound: number;
  totalReward: number;
  power: number;
}

export interface UseBlockchainReturn {
  isInitialized: boolean;
  blockchainEnabled: boolean;
  blockchainVerified: boolean;
  blockchain: Block[];
  currentBlock: Block | null;
  wallet: Wallet | null;
  transactions: Transaction[];
  miningStats: MiningStats;
  networkStats: {
    totalNodes: number;
    activeMiners: number;
    networkHash: number;
    difficulty: number;
  };
  error: string | null;
  createWallet: () => Wallet;
  createTransaction: (to: string, amount: number, data?: any) => Transaction;
  mineBlock: (transactions: Transaction[]) => Promise<Block>;
  createBlock: (data: any) => Promise<Block>;
  validateChain: () => boolean;
  getBalance: (address: string) => number;
  broadcastTransaction: (transaction: Transaction) => Promise<boolean>;
  startMining: () => void;
  stopMining: () => void;
  getChainStats: () => any;
  encryptData: (data: string, password: string) => string;
  decryptData: (encryptedData: string, password: string) => string;
}

export const useBlockchain = (): UseBlockchainReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [blockchainVerified, setBlockchainVerified] = useState(false);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [miningStats, setMiningStats] = useState<MiningStats>({
    hashRate: 0,
    difficulty: 4,
    blocksFound: 0,
    totalReward: 0,
    power: 0
  });
  const [networkStats, setNetworkStats] = useState({
    totalNodes: 1,
    activeMiners: 0,
    networkHash: 0,
    difficulty: 4
  });
  const [error, setError] = useState<string | null>(null);
  const [isMining, setIsMining] = useState(false);

  // Genesis block
  const genesisBlock = useMemo((): Block => ({
    index: 0,
    timestamp: Date.now(),
    data: { message: "Jihyung Genesis Block - 최첨단 블록체인 시스템" },
    previousHash: "0",
    hash: calculateHash(0, Date.now(), { message: "Genesis Block" }, "0", 0),
    nonce: 0,
    difficulty: 4
  }), []);

  function calculateHash(index: number, timestamp: number, data: any, previousHash: string, nonce: number): string {
    return CryptoJS.SHA256(index + timestamp + JSON.stringify(data) + previousHash + nonce).toString();
  }

  function calculateHashForBlock(block: Block): string {
    return calculateHash(block.index, block.timestamp, block.data, block.previousHash, block.nonce);
  }

  useEffect(() => {
    initializeBlockchain();
  }, [genesisBlock]);

  const initializeBlockchain = useCallback(async () => {
    try {
      setError(null);
      
      // Initialize with genesis block
      setBlockchain([genesisBlock]);
      setCurrentBlock(genesisBlock);
      
      // Create default wallet
      const defaultWallet = createWallet();
      setWallet(defaultWallet);
      
      // Simulate network initialization
      setNetworkStats({
        totalNodes: Math.floor(Math.random() * 50) + 10,
        activeMiners: Math.floor(Math.random() * 20) + 5,
        networkHash: Math.floor(Math.random() * 1000000) + 100000,
        difficulty: 4
      });

      setBlockchainEnabled(true);
      setBlockchainVerified(true);
      setIsInitialized(true);

      console.log('🔗 블록체인 시스템 초기화 완료');
      
    } catch (err: any) {
      setError(`블록체인 초기화 실패: ${err.message}`);
    }
  }, [genesisBlock]);

  const createWallet = useCallback((): Wallet => {
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    const address = CryptoJS.RIPEMD160(publicKey).toString().substring(0, 34);
    
    const newWallet: Wallet = {
      address: `JH${address}`,
      balance: 1000, // Starting balance
      privateKey,
      publicKey
    };
    
    return newWallet;
  }, []);

  const createTransaction = useCallback((to: string, amount: number, data?: any): Transaction => {
    if (!wallet) {
      throw new Error('지갑이 초기화되지 않았습니다');
    }
    
    if (wallet.balance < amount + 1) { // +1 for fee
      throw new Error('잔액이 부족합니다');
    }

    const transaction: Transaction = {
      id: CryptoJS.lib.WordArray.random(16).toString(),
      from: wallet.address,
      to,
      amount,
      fee: 1,
      timestamp: Date.now(),
      data: data || {}
    };

    // Create signature
    const transactionData = JSON.stringify({
      from: transaction.from,
      to: transaction.to,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    });
    transaction.signature = CryptoJS.HmacSHA256(transactionData, wallet.privateKey).toString();

    setTransactions(prev => [...prev, transaction]);
    return transaction;
  }, [wallet]);

  const mineBlock = useCallback(async (transactionsToMine: Transaction[]): Promise<Block> => {
    if (blockchain.length === 0) {
      throw new Error('블록체인이 초기화되지 않았습니다');
    }

    const previousBlock = blockchain[blockchain.length - 1];
    const newBlock: Block = {
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      data: {
        transactions: transactionsToMine,
        miner: wallet?.address || 'unknown',
        reward: 50
      },
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
      difficulty: miningStats.difficulty
    };

    setIsMining(true);
    const startTime = performance.now();
    
    // Proof of Work
    return new Promise((resolve) => {
      const mine = () => {
        const target = Array(miningStats.difficulty + 1).join("0");
        
        while (newBlock.hash.substring(0, miningStats.difficulty) !== target) {
          newBlock.nonce++;
          newBlock.hash = calculateHashForBlock(newBlock);
          
          // Update hash rate
          const elapsed = (performance.now() - startTime) / 1000;
          const hashRate = Math.floor(newBlock.nonce / elapsed);
          
          setMiningStats(prev => ({
            ...prev,
            hashRate,
            power: Math.min(100, hashRate / 1000)
          }));

          // Yield control periodically
          if (newBlock.nonce % 1000 === 0) {
            setTimeout(mine, 0);
            return;
          }
        }

        // Block mined successfully
        setBlockchain(prev => [...prev, newBlock]);
        setCurrentBlock(newBlock);
        
        // Update mining stats
        setMiningStats(prev => ({
          ...prev,
          blocksFound: prev.blocksFound + 1,
          totalReward: prev.totalReward + 50
        }));

        // Update wallet balance (mining reward)
        if (wallet) {
          setWallet(prev => prev ? { ...prev, balance: prev.balance + 50 } : null);
        }

        // Process transactions (update balances)
        transactionsToMine.forEach(tx => {
          if (wallet?.address === tx.from) {
            setWallet(prev => prev ? { 
              ...prev, 
              balance: prev.balance - tx.amount - tx.fee 
            } : null);
          }
        });

        setTransactions(prev => prev.filter(tx => 
          !transactionsToMine.some(minedTx => minedTx.id === tx.id)
        ));

        setIsMining(false);
        console.log(`⛏️ 블록 #${newBlock.index} 채굴 완료! Hash: ${newBlock.hash}`);
        resolve(newBlock);
      };
      
      mine();
    });
  }, [blockchain, miningStats.difficulty, wallet]);

  const createBlock = useCallback(async (data: any): Promise<Block> => {
    const pendingTransactions = transactions.slice(0, 10); // Max 10 transactions per block
    const block = await mineBlock(pendingTransactions);
    return block;
  }, [transactions, mineBlock]);

  const validateChain = useCallback((): boolean => {
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const previousBlock = blockchain[i - 1];

      if (currentBlock.hash !== calculateHashForBlock(currentBlock)) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    setBlockchainVerified(true);
    return true;
  }, [blockchain]);

  const getBalance = useCallback((address: string): number => {
    let balance = 0;
    
    for (const block of blockchain) {
      if (block.data.transactions) {
        for (const tx of block.data.transactions) {
          if (tx.from === address) {
            balance -= tx.amount + tx.fee;
          }
          if (tx.to === address) {
            balance += tx.amount;
          }
        }
      }
      
      // Mining rewards
      if (block.data.miner === address) {
        balance += block.data.reward || 0;
      }
    }
    
    return balance;
  }, [blockchain]);

  const broadcastTransaction = useCallback(async (transaction: Transaction): Promise<boolean> => {
    try {
      // Simulate network broadcast
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      // Validate transaction signature
      const transactionData = JSON.stringify({
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        timestamp: transaction.timestamp
      });
      
      // In a real implementation, we would verify the signature with the public key
      if (!transaction.signature) {
        throw new Error('거래 서명이 없습니다');
      }
      
      setTransactions(prev => [...prev, transaction]);
      return true;
      
    } catch (err) {
      console.error('거래 브로드캐스트 실패:', err);
      return false;
    }
  }, []);

  const startMining = useCallback(() => {
    if (transactions.length > 0 && !isMining) {
      const pendingTransactions = transactions.slice(0, 5);
      mineBlock(pendingTransactions).catch(console.error);
    }
  }, [transactions, isMining, mineBlock]);

  const stopMining = useCallback(() => {
    setIsMining(false);
  }, []);

  const getChainStats = useCallback(() => {
    return {
      totalBlocks: blockchain.length,
      totalTransactions: blockchain.reduce((sum, block) => 
        sum + (block.data.transactions?.length || 0), 0
      ),
      avgBlockTime: blockchain.length > 1 ? 
        (blockchain[blockchain.length - 1].timestamp - blockchain[1].timestamp) / (blockchain.length - 1) : 0,
      chainSize: JSON.stringify(blockchain).length,
      hashRate: miningStats.hashRate,
      difficulty: miningStats.difficulty
    };
  }, [blockchain, miningStats]);

  const encryptData = useCallback((data: string, password: string): string => {
    return CryptoJS.AES.encrypt(data, password).toString();
  }, []);

  const decryptData = useCallback((encryptedData: string, password: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  }, []);

  return {
    isInitialized,
    blockchainEnabled,
    blockchainVerified,
    blockchain,
    currentBlock,
    wallet,
    transactions,
    miningStats,
    networkStats,
    error,
    createWallet,
    createTransaction,
    mineBlock,
    createBlock,
    validateChain,
    getBalance,
    broadcastTransaction,
    startMining,
    stopMining,
    getChainStats,
    encryptData,
    decryptData
  };
};