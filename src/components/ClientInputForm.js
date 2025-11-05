import React, { useState } from 'react';
import './ClientInputForm.css';

function ClientInputForm({ onSubmit }) {
  const [numClients, setNumClients] = useState('');
  const [instancesPerClient, setInstancesPerClient] = useState('');
  const [clients, setClients] = useState([]);

  const handleNumClientsChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setNumClients(value);
    if (value > 0 && parseInt(instancesPerClient) > 0) {
      const count = parseInt(instancesPerClient);
      const newClients = Array.from({ length: value }, (_, i) => ({
        id: i + 1,
        instances: Array.from({ length: count }, (_, j) => ({ id: j + 1, value: '' }))
      }));
      setClients(newClients);
    } else if (value === 0) {
      setClients([]);
    }
  };

  const handleInstancesPerClientChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setInstancesPerClient(value);
    if (value > 0 && parseInt(numClients) > 0) {
      const newClients = Array.from({ length: parseInt(numClients) }, (_, i) => ({
        id: i + 1,
        instances: Array.from({ length: value }, (_, j) => ({ id: j + 1, value: '' }))
      }));
      setClients(newClients);
    } else if (value === 0) {
      setClients([]);
    }
  };

  const handleInstanceChange = (clientId, instanceId, value) => {
    const updatedClients = clients.map(client => {
      if (client.id === clientId) {
        return {
          id: client.id,
          instances: client.instances.map(inst => {
            if (inst.id === instanceId) {
              return { id: inst.id, value: value };
            } else {
              return { id: inst.id, value: inst.value };
            }
          })
        };
      } else {
        return {
          id: client.id,
          instances: client.instances.map(inst => ({ 
            id: inst.id, 
            value: inst.value 
          }))
        };
      }
    });
    setClients(updatedClients);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (numClients <= 0) {
      alert('Please enter a valid number of clients');
      return;
    }
    if (!instancesPerClient || parseInt(instancesPerClient) <= 0) {
      alert('Please enter a valid number of instances per client');
      return;
    }
    
    const allFilled = clients.every(client => 
      client.instances.every(inst => inst.value !== '' && !isNaN(inst.value) && parseFloat(inst.value) >= 0)
    );
    
    if (!allFilled) {
      alert('Please fill all instance voltage values');
      return;
    }
    
    const processedClients = clients.map(client => {
      const sortedInstances = [...client.instances]
        .sort((a, b) => a.id - b.id)
        .map(inst => ({
          id: inst.id,
          value: parseFloat(inst.value) || 0
        }));
      
      return {
        id: client.id,
        instances: sortedInstances
      };
    });
    
    onSubmit({
      numClients,
      instancesPerClient,
      clients: processedClients
    });
  };

  return (
    <div className="client-input-form">
      <h2>Input Parameters</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="numClients">Number of Clients</label>
          <input
            type="number"
            id="numClients"
            min="1"
            value={numClients}
            onChange={handleNumClientsChange}
            placeholder="Enter number of clients"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="instancesPerClient">Instances per Client</label>
          <input
            type="number"
            id="instancesPerClient"
            min="1"
            value={instancesPerClient}
            onChange={handleInstancesPerClientChange}
            placeholder="Enter instances per client"
            required
          />
        </div>

        {clients.length > 0 && (
          <div className="clients-section">
            <h3>Client Instances ({instancesPerClient || 0} instances per client - Enter power factor values)</h3>
            <div className="clients-grid">
              {clients.map((client) => (
                <div key={`client-${client.id}`} className="client-card">
                  <h4>Client {client.id}</h4>
                  <div className="instances">
                    {client.instances.map((instance) => (
                      <div key={`client-${client.id}-inst-${instance.id}`} className="instance-input">
                        <label htmlFor={`client-${client.id}-inst-${instance.id}`}>
                          Instance {instance.id} (Power Factor):
                        </label>
                        <input
                          type="number"
                          id={`client-${client.id}-inst-${instance.id}`}
                          step="0.01"
                          min="0"
                          value={instance.value || ''}
                          onChange={(e) =>
                            handleInstanceChange(client.id, instance.id, e.target.value)
                          }
                          placeholder="Power factor value"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {clients.length > 0 && (
          <button type="submit" className="submit-button">
            Calculate Results
          </button>
        )}
      </form>
    </div>
  );
}

export default ClientInputForm;

