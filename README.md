# Federated Learning FDIA Detection System - Frontend

A React-based frontend application for Federated Learning with False Data Injection Attack (FDIA) detection.

## Features

1. **Input Parameters:**
   - Number of clients
   - Voltage (weight)
   - 3 instances per client with individual values

2. **Calculations & Results:**
   - Federated Average (FedAvg) calculation using Trust-Aware Aggregation
   - Trust score calculation for each client
   - Energy consumption calculation per client
   - FDIA attacked node detection using statistical anomaly detection

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
src/
├── App.js              # Main application component
├── App.css             # Main application styles
├── index.js            # Application entry point
├── index.css           # Global styles
└── components/
    ├── ClientInputForm.js      # Input form component
    ├── ClientInputForm.css     # Input form styles
    ├── ResultsDisplay.js       # Results display component
    └── ResultsDisplay.css      # Results display styles
```

## Usage

1. Enter the number of clients
2. Enter the voltage (weight) value
3. Fill in 3 instance values for each client
4. Click "Calculate Results" to see:
   - Federated Average
   - Trust scores for each client
   - Energy consumption per client
   - FDIA attacked nodes (if any)

## Mathematical Formulas

The application implements the following formulas from Trust-Aware Federated Learning research:

### 1. Trust Score (Equation 2)
```
T_k = 1 / (1 + ||w_k^t - median(W_t)||₂)
```
Where:
- `T_k`: Trust score for client k
- `w_k^t`: Local model weights from client k at round t (3 instance values)
- `median(W_t)`: Median of all client updates
- `||.||₂`: Euclidean (L2) norm

### 2. Trust-Aware Federated Averaging (Equation 3)
```
W_{t+1} = (Σ_{k=1}^K T_k * n_k * w_k^t) / (Σ_{k=1}^K T_k * n_k)
```
Where:
- `W_{t+1}`: Global model parameters at round t+1
- `K`: Total number of clients
- `T_k`: Trust score for client k
- `n_k`: Size of local dataset for client k (3 instances per client)
- `w_k^t`: Local model weights from client k

### 3. Conventional Federated Averaging (Equation 1) - Alternative
```
W_{t+1} = Σ_{k=1}^K (n_k / n) * w_k^t
```
Where:
- `n_k`: Size of local dataset for client k
- `n`: Total number of samples across all clients (n = Σ_{k=1}^K n_k)

Note: This formula is available in the code but the application uses the Trust-Aware Aggregation (Equation 3) by default.

### 4. FDIA Detection
Uses statistical anomaly detection with adaptive threshold:
- Clients with trust scores significantly below the mean (mean - 1.5σ) are flagged as potentially attacked
- Based on variance analysis: data exceeding the adaptive threshold indicates possible FDIA

## Backend Integration

Currently, the application implements the formulas directly in the frontend. To integrate with the backend:

1. Replace the calculation functions in `App.js` with API calls to your backend
2. Update the `handleFormSubmit` function to make HTTP requests
3. Handle API responses and error states

Example API integration:
```javascript
const response = await fetch('/api/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
const results = await response.json();
setResults(results);
```

## Technologies

- React 18.2.0
- React DOM 18.2.0
- CSS3 (Modern styling with gradients and animations)

