import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Neuron {
  id: string;
  value: number;
  bias: number;
  activation: 'sigmoid' | 'relu' | 'tanh' | 'linear';
}

export interface Connection {
  from: string;
  to: string;
  weight: number;
}

export interface Layer {
  id: string;
  name: string;
  neurons: Neuron[];
  type: 'input' | 'hidden' | 'output';
}

export interface NeuralNetwork {
  id: string;
  name: string;
  layers: Layer[];
  connections: Connection[];
  learningRate: number;
  epoch: number;
  accuracy: number;
}

export interface TrainingData {
  inputs: number[];
  outputs: number[];
  label?: string;
}

export interface TrainingSession {
  id: string;
  networkId: string;
  dataset: TrainingData[];
  epochs: number;
  batchSize: number;
  currentEpoch: number;
  loss: number[];
  accuracy: number[];
  isRunning: boolean;
  startTime: number;
}

export interface UseNeuralNetworkReturn {
  isInitialized: boolean;
  networks: NeuralNetwork[];
  currentNetwork: NeuralNetwork | null;
  trainingSession: TrainingSession | null;
  neuralNetwork: NeuralNetwork | null;
  error: string | null;
  createNetwork: (name: string, architecture: number[]) => NeuralNetwork;
  addLayer: (networkId: string, size: number, type: Layer['type']) => Layer;
  trainNetwork: (networkId: string, dataset: TrainingData[], epochs?: number) => Promise<void>;
  predict: (networkId: string, inputs: number[]) => number[];
  evaluateNetwork: (networkId: string, testData: TrainingData[]) => { accuracy: number; loss: number };
  saveNetwork: (network: NeuralNetwork) => void;
  loadNetwork: (networkId: string) => NeuralNetwork | null;
  visualizeNetwork: (networkId: string) => any;
  generateSyntheticData: (type: 'classification' | 'regression', samples: number) => TrainingData[];
  optimizeHyperparameters: (networkId: string) => Promise<{ learningRate: number; batchSize: number }>;
  exportModel: (networkId: string) => string;
  importModel: (modelData: string) => NeuralNetwork;
}

export const useNeuralNetwork = (): UseNeuralNetworkReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [networks, setNetworks] = useState<NeuralNetwork[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState<NeuralNetwork | null>(null);
  const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Activation functions
  const activationFunctions = useMemo(() => ({
    sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
    relu: (x: number) => Math.max(0, x),
    tanh: (x: number) => Math.tanh(x),
    linear: (x: number) => x,
    softmax: (arr: number[]) => {
      const expArr = arr.map(x => Math.exp(x));
      const sumExp = expArr.reduce((sum, val) => sum + val, 0);
      return expArr.map(x => x / sumExp);
    }
  }), []);

  // Initialize with demo networks
  useEffect(() => {
    const initializeNeuralNetwork = async () => {
      try {
        setError(null);
        
        // Create demo networks
        const xorNetwork = createNetwork('XOR 분류기', [2, 4, 1]);
        const imageClassifier = createNetwork('이미지 분류기', [784, 128, 64, 10]);
        const sentimentAnalyzer = createNetwork('감정 분석기', [100, 50, 25, 3]);
        
        // Generate synthetic training data
        const xorData = generateSyntheticData('classification', 1000);
        
        console.log('🧠 신경망 시스템 초기화 완료');
        setIsInitialized(true);
        
      } catch (err: any) {
        setError(`신경망 초기화 실패: ${err.message}`);
      }
    };

    initializeNeuralNetwork();
  }, []);

  const createNetwork = useCallback((name: string, architecture: number[]): NeuralNetwork => {
    const networkId = `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const layers: Layer[] = [];
    const connections: Connection[] = [];

    // Create layers
    architecture.forEach((size, index) => {
      const layerType: Layer['type'] = 
        index === 0 ? 'input' : 
        index === architecture.length - 1 ? 'output' : 'hidden';
      
      const layer: Layer = {
        id: `layer_${index}`,
        name: `${layerType} Layer ${index + 1}`,
        type: layerType,
        neurons: Array(size).fill(0).map((_, neuronIndex) => ({
          id: `neuron_${index}_${neuronIndex}`,
          value: 0,
          bias: (Math.random() - 0.5) * 2, // Random bias between -1 and 1
          activation: index === architecture.length - 1 ? 'sigmoid' : 'relu'
        }))
      };
      
      layers.push(layer);

      // Create connections to previous layer
      if (index > 0) {
        const prevLayer = layers[index - 1];
        prevLayer.neurons.forEach(prevNeuron => {
          layer.neurons.forEach(neuron => {
            connections.push({
              from: prevNeuron.id,
              to: neuron.id,
              weight: (Math.random() - 0.5) * 2 // Random weight between -1 and 1
            });
          });
        });
      }
    });

    const network: NeuralNetwork = {
      id: networkId,
      name,
      layers,
      connections,
      learningRate: 0.01,
      epoch: 0,
      accuracy: 0
    };

    setNetworks(prev => [...prev, network]);
    
    if (!currentNetwork) {
      setCurrentNetwork(network);
    }

    return network;
  }, [currentNetwork]);

  const addLayer = useCallback((networkId: string, size: number, type: Layer['type']): Layer => {
    const layer: Layer = {
      id: `layer_${Date.now()}`,
      name: `${type} Layer`,
      type,
      neurons: Array(size).fill(0).map((_, index) => ({
        id: `neuron_${Date.now()}_${index}`,
        value: 0,
        bias: (Math.random() - 0.5) * 2,
        activation: type === 'output' ? 'sigmoid' : 'relu'
      }))
    };

    setNetworks(prev => prev.map(network => 
      network.id === networkId 
        ? { ...network, layers: [...network.layers, layer] }
        : network
    ));

    return layer;
  }, []);

  const forwardPass = useCallback((network: NeuralNetwork, inputs: number[]): number[] => {
    if (inputs.length !== network.layers[0].neurons.length) {
      throw new Error('입력 크기가 네트워크 입력 레이어와 일치하지 않습니다');
    }

    let currentValues = inputs;

    for (let layerIndex = 0; layerIndex < network.layers.length; layerIndex++) {
      const layer = network.layers[layerIndex];
      
      if (layerIndex === 0) {
        // Input layer - just set values
        layer.neurons.forEach((neuron, index) => {
          neuron.value = currentValues[index];
        });
      } else {
        // Hidden/Output layers - calculate weighted sum + bias
        const newValues: number[] = [];
        
        layer.neurons.forEach(neuron => {
          let sum = neuron.bias;
          
          // Sum weighted inputs from previous layer
          const prevLayer = network.layers[layerIndex - 1];
          prevLayer.neurons.forEach(prevNeuron => {
            const connection = network.connections.find(
              conn => conn.from === prevNeuron.id && conn.to === neuron.id
            );
            if (connection) {
              sum += prevNeuron.value * connection.weight;
            }
          });
          
          // Apply activation function
          neuron.value = activationFunctions[neuron.activation](sum);
          newValues.push(neuron.value);
        });
        
        currentValues = newValues;
      }
    }

    return currentValues;
  }, [activationFunctions]);

  const trainNetwork = useCallback(async (
    networkId: string, 
    dataset: TrainingData[], 
    epochs: number = 100
  ): Promise<void> => {
    const network = networks.find(net => net.id === networkId);
    if (!network) {
      throw new Error('네트워크를 찾을 수 없습니다');
    }

    const session: TrainingSession = {
      id: `session_${Date.now()}`,
      networkId,
      dataset,
      epochs,
      batchSize: Math.min(32, dataset.length),
      currentEpoch: 0,
      loss: [],
      accuracy: [],
      isRunning: true,
      startTime: Date.now()
    };

    setTrainingSession(session);

    try {
      for (let epoch = 0; epoch < epochs; epoch++) {
        let totalLoss = 0;
        let correctPredictions = 0;

        // Shuffle dataset
        const shuffledData = [...dataset].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffledData.length; i += session.batchSize) {
          const batch = shuffledData.slice(i, i + session.batchSize);
          
          for (const sample of batch) {
            // Forward pass
            const predicted = forwardPass(network, sample.inputs);
            
            // Calculate loss (mean squared error)
            const loss = sample.outputs.reduce((sum, target, index) => 
              sum + Math.pow(target - predicted[index], 2), 0
            ) / sample.outputs.length;
            
            totalLoss += loss;

            // Check if prediction is correct (for classification)
            const predictedClass = predicted.indexOf(Math.max(...predicted));
            const targetClass = sample.outputs.indexOf(Math.max(...sample.outputs));
            if (predictedClass === targetClass) {
              correctPredictions++;
            }

            // Backpropagation (simplified)
            const learningRate = network.learningRate;
            const outputLayer = network.layers[network.layers.length - 1];
            
            // Update output layer weights
            outputLayer.neurons.forEach((neuron, neuronIndex) => {
              const error = sample.outputs[neuronIndex] - predicted[neuronIndex];
              
              // Update connections to this neuron
              network.connections.forEach(conn => {
                if (conn.to === neuron.id) {
                  conn.weight += learningRate * error * neuron.value;
                }
              });
              
              // Update bias
              neuron.bias += learningRate * error;
            });
          }
        }

        const avgLoss = totalLoss / dataset.length;
        const accuracy = correctPredictions / dataset.length;

        // Update session
        setTrainingSession(prev => prev ? {
          ...prev,
          currentEpoch: epoch + 1,
          loss: [...prev.loss, avgLoss],
          accuracy: [...prev.accuracy, accuracy]
        } : null);

        // Update network
        setNetworks(prev => prev.map(net => 
          net.id === networkId 
            ? { ...net, epoch: epoch + 1, accuracy }
            : net
        ));

        // Yield control periodically
        if (epoch % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setTrainingSession(prev => prev ? { ...prev, isRunning: false } : null);
      console.log(`🧠 네트워크 ${network.name} 훈련 완료!`);

    } catch (err: any) {
      setError(`훈련 실패: ${err.message}`);
      setTrainingSession(prev => prev ? { ...prev, isRunning: false } : null);
    }
  }, [networks, forwardPass]);

  const predict = useCallback((networkId: string, inputs: number[]): number[] => {
    const network = networks.find(net => net.id === networkId);
    if (!network) {
      throw new Error('네트워크를 찾을 수 없습니다');
    }

    return forwardPass(network, inputs);
  }, [networks, forwardPass]);

  const evaluateNetwork = useCallback((networkId: string, testData: TrainingData[]) => {
    let correctPredictions = 0;
    let totalLoss = 0;

    testData.forEach(sample => {
      const predicted = predict(networkId, sample.inputs);
      
      // Calculate accuracy
      const predictedClass = predicted.indexOf(Math.max(...predicted));
      const targetClass = sample.outputs.indexOf(Math.max(...sample.outputs));
      if (predictedClass === targetClass) {
        correctPredictions++;
      }

      // Calculate loss
      const loss = sample.outputs.reduce((sum, target, index) => 
        sum + Math.pow(target - predicted[index], 2), 0
      );
      totalLoss += loss;
    });

    return {
      accuracy: correctPredictions / testData.length,
      loss: totalLoss / testData.length
    };
  }, [predict]);

  const generateSyntheticData = useCallback((
    type: 'classification' | 'regression', 
    samples: number
  ): TrainingData[] => {
    const data: TrainingData[] = [];

    for (let i = 0; i < samples; i++) {
      if (type === 'classification') {
        // Generate XOR-like data
        const x1 = Math.random() > 0.5 ? 1 : 0;
        const x2 = Math.random() > 0.5 ? 1 : 0;
        const output = x1 ^ x2; // XOR operation
        
        data.push({
          inputs: [x1, x2],
          outputs: [output],
          label: `XOR(${x1}, ${x2}) = ${output}`
        });
      } else {
        // Generate regression data
        const x = Math.random() * 10;
        const y = Math.sin(x) + (Math.random() - 0.5) * 0.1;
        
        data.push({
          inputs: [x],
          outputs: [y],
          label: `sin(${x.toFixed(2)}) ≈ ${y.toFixed(2)}`
        });
      }
    }

    return data;
  }, []);

  const saveNetwork = useCallback((network: NeuralNetwork) => {
    const saved = localStorage.getItem('neuralNetworks');
    const savedNetworks = saved ? JSON.parse(saved) : [];
    
    const updated = savedNetworks.filter((n: NeuralNetwork) => n.id !== network.id);
    updated.push(network);
    
    localStorage.setItem('neuralNetworks', JSON.stringify(updated));
  }, []);

  const loadNetwork = useCallback((networkId: string): NeuralNetwork | null => {
    const saved = localStorage.getItem('neuralNetworks');
    if (!saved) return null;
    
    const savedNetworks = JSON.parse(saved);
    return savedNetworks.find((n: NeuralNetwork) => n.id === networkId) || null;
  }, []);

  const visualizeNetwork = useCallback((networkId: string) => {
    const network = networks.find(net => net.id === networkId);
    if (!network) return null;

    return {
      nodes: network.layers.flatMap(layer => 
        layer.neurons.map(neuron => ({
          id: neuron.id,
          label: `${neuron.value.toFixed(2)}`,
          layer: layer.id,
          type: layer.type
        }))
      ),
      edges: network.connections.map(conn => ({
        from: conn.from,
        to: conn.to,
        weight: conn.weight,
        width: Math.abs(conn.weight) * 5
      }))
    };
  }, [networks]);

  const optimizeHyperparameters = useCallback(async (networkId: string) => {
    // Simple grid search for hyperparameters
    const learningRates = [0.001, 0.01, 0.1];
    const batchSizes = [16, 32, 64];
    
    let bestParams = { learningRate: 0.01, batchSize: 32 };
    let bestAccuracy = 0;

    for (const lr of learningRates) {
      for (const bs of batchSizes) {
        // This would involve training with different parameters
        // For now, simulate optimization
        const accuracy = Math.random() * 0.3 + 0.7; // Simulate 70-100% accuracy
        
        if (accuracy > bestAccuracy) {
          bestAccuracy = accuracy;
          bestParams = { learningRate: lr, batchSize: bs };
        }
      }
    }

    return bestParams;
  }, []);

  const exportModel = useCallback((networkId: string): string => {
    const network = networks.find(net => net.id === networkId);
    if (!network) {
      throw new Error('네트워크를 찾을 수 없습니다');
    }

    return JSON.stringify(network, null, 2);
  }, [networks]);

  const importModel = useCallback((modelData: string): NeuralNetwork => {
    try {
      const network: NeuralNetwork = JSON.parse(modelData);
      setNetworks(prev => [...prev, network]);
      return network;
    } catch (err) {
      throw new Error('모델 데이터를 파싱할 수 없습니다');
    }
  }, []);

  return {
    isInitialized,
    networks,
    currentNetwork,
    trainingSession,
    neuralNetwork: currentNetwork,
    error,
    createNetwork,
    addLayer,
    trainNetwork,
    predict,
    evaluateNetwork,
    saveNetwork,
    loadNetwork,
    visualizeNetwork,
    generateSyntheticData,
    optimizeHyperparameters,
    exportModel,
    importModel
  };
};