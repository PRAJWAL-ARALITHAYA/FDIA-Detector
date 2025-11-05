import React, { useState } from 'react';
import './App.css';
import ClientInputForm from './components/ClientInputForm';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [numClients, setNumClients] = useState(0);
  const [clients, setClients] = useState([]);
  const [results, setResults] = useState(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const handleFormSubmit = (formData) => {
    setNumClients(formData.numClients);
    setClients(formData.clients);
    const calculatedResults = calculateResults(formData);
    setResults(calculatedResults);
    setIsResultsOpen(true);
  };

  const calculateResults = (formData) => {
    const { clients } = formData;

    const clientWeights = [];
    
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      if (!client || client.id !== i + 1) {
        console.error(`Client mismatch at index ${i}: expected ID ${i + 1}, got ${client?.id}`);
        continue;
      }

      const instanceValues = [];
      for (let j = 0; j < client.instances.length; j++) {
        const inst = client.instances[j];
        const val = parseFloat(inst.value) || 0;
        instanceValues.push(val);
      }

      const sum = instanceValues.reduce((acc, val) => acc + val, 0);
      const w_k = instanceValues.length > 0 ? sum / instanceValues.length : 0;
      
      clientWeights.push({
        clientId: client.id,
        w_k: w_k
      });
    }

    const allW_k = clientWeights.map(cw => cw.w_k).sort((a, b) => a - b);
    const mid = Math.floor(allW_k.length / 2);
    const medianW_k = allW_k.length % 2 === 0
      ? allW_k[mid - 1]
      : allW_k[mid];

    const trustScores = [];
    
    for (let i = 0; i < clientWeights.length; i++) {
      const clientWeight = clientWeights[i];
      if (!clientWeight || clientWeight.clientId !== i + 1) {
        console.error(`Client weight mismatch at index ${i}`);
        continue;
      }

      const w_k = Number(clientWeight.w_k);
      if (isNaN(w_k)) {
        console.error(`Invalid w_k for Client ${clientWeight.clientId}:`, clientWeight.w_k);
        continue;
      }

      const d_k = Math.abs(w_k - medianW_k);
      const T_k = d_k < 0.0001 
        ? 1.0
        : 1 / (1 + d_k);
      
      const finalTrustScore = parseFloat(T_k.toFixed(4));
      const trustLevel = getTrustLevel(finalTrustScore);
      
      trustScores.push({
        clientId: clientWeight.clientId,
        w_k: parseFloat(w_k.toFixed(4)),
        d_k: parseFloat(d_k.toFixed(4)),
        trustScore: finalTrustScore,
        trustLevel: trustLevel
      });
    }

    const fedAvg = calculateTrustAwareFedAvg(clients, trustScores);

    const compFactor = 0.01;
    const energyFedAvg = clients.map((client) => {
      const energy = client.instances.reduce((sum, inst) => {
        const v = Number(inst.value) || 0;
        return sum + v * v;
      }, 0) * compFactor;
      return { clientId: client.id, energy: parseFloat(energy.toFixed(4)) };
    });

    const energyTrustFedAvg = clients.map((client) => {
      const ts = trustScores.find(t => t.clientId === client.id)?.trustScore || 0;
      const energy = client.instances.reduce((sum, inst) => {
        const v = Number(inst.value) || 0;
        return sum + (v * v * ts);
      }, 0) * compFactor;
      return { clientId: client.id, energy: parseFloat(energy.toFixed(4)) };
    });

    const attackedNodes = detectFDIA(clients, trustScores);
    
    return {
      fedAvg,
      trustScores,
      attackedNodes,
      energyFedAvg,
      energyTrustFedAvg
    };
  };

  const getTrustLevel = (trustScore) => {
    if (trustScore === 1.0 || Math.abs(trustScore - 1.0) < 0.0001) {
      return 'Perfect';
    } else if (trustScore >= 0.75) {
      return 'High';
    } else {
      return 'Low';
    }
  };
  const calculateTrustAwareFedAvg = (clients, trustScores) => {
    const K = clients.length;
    if (K === 0) return 0;

    let numeratorSum = 0;
    let denominatorSum = 0;
    
    clients.forEach((client) => {
      const trustScoreData = trustScores.find(ts => ts.clientId === client.id);
      if (!trustScoreData) return;
      const T_k = trustScoreData.trustScore;
      const n_k = client.instances.length;
      const w_k = trustScoreData.w_k;

      numeratorSum += T_k * n_k * w_k;
      denominatorSum += T_k * n_k;
    });
    const fedAvg = denominatorSum > 0 ? numeratorSum / denominatorSum : 0;
    
    return parseFloat(fedAvg.toFixed(4));
  };
  const calculateConventionalFedAvg = (clients) => {
    const K = clients.length;
    if (K === 0) return 0;
    const n = clients.reduce((sum, client) => sum + client.instances.length, 0);
    
    let weightedSum = 0;
    
    clients.forEach((client) => {
      const n_k = client.instances.length;
      const w_k_avg = client.instances.reduce((sum, inst) => sum + (inst.value || 0), 0) / n_k;
      weightedSum += (n_k / n) * w_k_avg;
    });
    
    return parseFloat(weightedSum.toFixed(4));
  };

  const detectFDIA = (clients, trustScores) => {
    const trustScoreValues = trustScores.map(ts => ts.trustScore);
    
    if (trustScoreValues.length === 0) return [];

    const lowTrustClients = trustScores
      .filter(ts => ts.trustScore < 0.75)
      .map(ts => ts.clientId);

    const meanTrust = trustScoreValues.reduce((a, b) => a + b, 0) / trustScoreValues.length;
    const variance = trustScoreValues.reduce((sum, val) => sum + Math.pow(val - meanTrust, 2), 0) / trustScoreValues.length;
    const stdDev = Math.sqrt(variance);

    const sampleSize = trustScoreValues.length;
    let threshold;
    
    if (sampleSize <= 3) {
      threshold = stdDev > 0.01 
        ? meanTrust - (1.0 * stdDev)
        : 0.75; // Fallback to trust level threshold
    } else {
      threshold = meanTrust - (1.5 * stdDev);
    }
    const statisticalAnomalies = trustScores
      .filter(ts => ts.trustScore < threshold)
      .map(ts => ts.clientId);
    const attacked = [...new Set([...lowTrustClients, ...statisticalAnomalies])];
    
    return attacked;
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <div className="brand">
            <div className="brand-mark">FL</div>
            <div>
              <h1>Federated Learning FDIA Detection System</h1>
              <p className="subtitle">Frontend Interface</p>
            </div>
          </div>
          <div className="header-actions">
            {results && (
              <button
                className="action-button"
                onClick={() => setIsResultsOpen(true)}
                title="Open results panel"
              >
                View Results
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="App-main">
        <ClientInputForm onSubmit={handleFormSubmit} />
      </main>

      {results && (
        <div className={`results-overlay ${isResultsOpen ? 'open' : ''}`} onClick={() => setIsResultsOpen(false)}>
          <div className={`results-panel ${isResultsOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>Analysis Results</h2>
              <button className="panel-close" onClick={() => setIsResultsOpen(false)} aria-label="Close results">
                ×
              </button>
            </div>
            <div className="panel-content">
              <ResultsDisplay 
                results={results}
                numClients={numClients}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

