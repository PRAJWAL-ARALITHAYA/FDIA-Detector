import React from 'react';
import './ResultsDisplay.css';

function ResultsDisplay({ results, numClients }) {
  const { fedAvg, trustScores, attackedNodes, energyFedAvg, energyTrustFedAvg } = results;

  return (
    <div className="results-display">
      <h2>Calculation Results</h2>
      
      <div className="results-summary">
        <div className="summary-item">
          <span className="summary-label">Number of Clients:</span>
          <span className="summary-value">{numClients}</span>
        </div>
      </div>

      <div className="results-grid">
        <div className="result-card fedavg-card">
          <div className="result-header">
            <h3>Federated Average (FedAvg)</h3>
            <div className="result-icon">📊</div>
          </div>
          <div className="result-content">
            <div className="result-value">{fedAvg}</div>
            <p className="result-description">
              The weighted average across all client instances (power factor)
            </p>
          </div>
        </div>

        <div className="result-card trust-scores-card">
          <div className="result-header">
            <h3>Trust Scores & Trust Levels</h3>
            <div className="result-icon">🔒</div>
          </div>
          <div className="result-content">
            <div className="trust-scores-list">
              {trustScores
                .sort((a, b) => a.clientId - b.clientId)
                .map((score) => (
                <div 
                  key={score.clientId} 
                  className={`trust-score-item ${attackedNodes.includes(score.clientId) ? 'attacked' : ''} ${score.trustLevel === 'Perfect' ? 'perfect' : score.trustLevel === 'High' ? 'high' : 'low'}`}
                >
                  <div className="trust-info">
                    <span className="trust-client">Client {score.clientId}:</span>
                    <span className="trust-value">{score.trustScore.toFixed(2)}</span>
                  </div>
                  <div className={`trust-level-badge trust-level-${score.trustLevel.toLowerCase()}`}>
                    {score.trustLevel}
                  </div>
                </div>
              ))}
            </div>
            <p className="result-description">
              Trust score (0-1 scale) and trust level for each client
            </p>
          </div>
        </div>

        <div className="result-card">
          <div className="result-header">
            <h3>Energy Consumption Rate</h3>
            <div className="result-icon">⚡</div>
          </div>
          <div className="result-content">
            <div>
              <strong>FedAvg:</strong>
              {energyFedAvg && energyFedAvg.map((e) => (
                <div key={`ef-${e.clientId}`} className="energy-item">
                  Client {e.clientId}: {e.energy}
                </div>
              ))}
            </div>
            <div>
              <strong>Trust-Aware FedAvg:</strong>
              {energyTrustFedAvg && energyTrustFedAvg.map((e) => (
                <div key={`et-${e.clientId}`} className="energy-item">
                  Client {e.clientId}: {e.energy}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="result-card fdia-card">
          <div className="result-header">
            <h3>FDIA Attack Detection</h3>
            <div className="result-icon">🛡️</div>
          </div>
          <div className="result-content">
            {attackedNodes.length > 0 ? (
              <div className="attacked-nodes">
                <div className="warning-message">
                  ⚠️ {attackedNodes.length} node(s) detected as compromised
                </div>
                <div className="attacked-list">
                  {attackedNodes.map((nodeId) => (
                    <div key={nodeId} className="attacked-node">
                      Client {nodeId}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="safe-message">
                ✅ No attacked nodes detected. All clients are secure.
              </div>
            )}
            <p className="result-description">
              Detection of False Data Injection Attack (FDIA) nodes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;

