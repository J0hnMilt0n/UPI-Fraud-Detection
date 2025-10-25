# How the UPI Fraud Detection System Works

## Overview

The system uses a **hybrid approach** combining Machine Learning (CNN) and Rule-Based detection to identify fraudulent UPI transactions in real-time.

---

## Detection Flow

```
User Creates Transaction
        ↓
Transaction Saved to Database
        ↓
Fraud Detector Analyzes Transaction
        ↓
    ┌───────────────────────┐
    │   Is ML Model         │
    │   Available?          │
    └───────────────────────┘
         ↓              ↓
       YES             NO
         ↓              ↓
   CNN Model      Rule-Based
   Prediction     Detection
         ↓              ↓
    ┌───────────────────────┐
    │ Fraud Probability     │
    │ Calculated            │
    └───────────────────────┘
         ↓
    If > 50% → FRAUD
    If ≤ 50% → SAFE
         ↓
    Update Transaction
    Create Alert if Fraud
```

---

## 1. CNN-Based Detection (Primary Method)

### Architecture

The system uses a **Convolutional Neural Network (CNN)** with the following structure:

```
Input (8x8x1) → Transaction features reshaped into 2D grid
    ↓
Conv2D Layer (32 filters, 3x3) + BatchNorm + ReLU
Conv2D Layer (32 filters, 3x3) + BatchNorm + ReLU
MaxPooling (2x2) + Dropout (25%)
    ↓
Conv2D Layer (64 filters, 3x3) + BatchNorm + ReLU
Conv2D Layer (64 filters, 3x3) + BatchNorm + ReLU
MaxPooling (2x2) + Dropout (25%)
    ↓
Conv2D Layer (128 filters, 3x3) + BatchNorm + Dropout (40%)
    ↓
Flatten
Dense (256) + BatchNorm + Dropout (50%)
Dense (128) + BatchNorm + Dropout (50%)
Dense (64) + Dropout (30%)
    ↓
Output (1 neuron, sigmoid) → Fraud Probability (0-1)
```

### Features Extracted (64 features total)

The system analyzes these transaction aspects:

1. **Amount Features**

   - Normalized transaction amount (amount / 100,000)
   - Amount × hour interaction

2. **Transaction Type** (One-hot encoded)

   - SEND: 0
   - RECEIVE: 1
   - REQUEST: 2

3. **Time Features**

   - Hour of day (0-23, normalized to 0-1)
   - Day of week (0-6, normalized to 0-1)

4. **UPI ID Features**

   - Sender UPI length (normalized)
   - Receiver UPI length (normalized)

5. **Security Features**

   - Location available? (0 or 1)
   - Device ID present? (0 or 1)

6. **Additional Features** (padded to 64)
   - Derived features and interactions
   - Future: user history, frequency patterns, etc.

### How CNN Prediction Works

```python
# Features are reshaped into 8x8 grid (like an image)
features = [amount, type, hour, day, sender_len, receiver_len, ...]
reshaped = features.reshape(8, 8, 1)

# CNN processes this "image" to find patterns
probability = model.predict(reshaped)

# Decision
is_fraud = probability > 0.5
```

**Example:**

- Input: ₹75,000 sent at 3 AM, no location data
- Features processed through CNN layers
- Output: 0.87 (87% fraud probability)
- Result: **FRAUD DETECTED** ⚠️

---

## 2. Rule-Based Detection (Fallback Method)

When the CNN model is unavailable or not trained, the system uses **rule-based heuristics**:

### Rules and Scoring

| Rule              | Condition                                  | Score Added | Reason                           |
| ----------------- | ------------------------------------------ | ----------- | -------------------------------- |
| **High Amount**   | Amount > ₹50,000                           | +0.3        | Large transactions are riskier   |
| **Unusual Time**  | Hour < 6 AM or > 10 PM                     | +0.2        | Fraud often occurs late at night |
| **Round Amount**  | Amount is multiple of ₹1,000 and > ₹10,000 | +0.15       | Suspicious pattern               |
| **Missing Info**  | No device ID or location                   | +0.25       | Lack of verification data        |
| **Self-Transfer** | Sender = Receiver UPI                      | +0.5        | Clear red flag                   |

### Decision Logic

```
Total Score > 0.5 → FRAUD
Total Score ≤ 0.5 → SAFE
```

**Example 1 (Fraud):**

- ₹60,000 at 2 AM, no location = 0.3 + 0.2 + 0.25 = **0.75 → FRAUD**

**Example 2 (Safe):**

- ₹2,500 at 3 PM, has location = **0.0 → SAFE**

---

## 3. Real-Time Detection Process

### When Transaction is Created:

**File:** `backend/transactions/views.py`

```python
def perform_create(self, serializer):
    # 1. Save transaction to database
    transaction = serializer.save(user=request.user)

    # 2. Initialize fraud detector
    detector = FraudDetector()

    # 3. Run prediction
    fraud_result = detector.predict(transaction)
    # Returns: {
    #   'is_fraud': True/False,
    #   'fraud_probability': 0.0-1.0,
    #   'detection_method': 'cnn_model' or 'rule_based',
    #   'confidence': 0.0-1.0
    # }

    # 4. Update transaction with results
    transaction.is_fraud = fraud_result['is_fraud']
    transaction.fraud_probability = fraud_result['fraud_probability']
    transaction.fraud_details = fraud_result
    transaction.save()

    # 5. Create alert if fraud detected
    if fraud_result['is_fraud']:
        severity = 'CRITICAL' if probability > 0.9 else 'HIGH'
        FraudAlert.objects.create(
            transaction=transaction,
            alert_type='FRAUD_DETECTED',
            severity=severity,
            message=f"Fraud detected: {probability*100:.2f}%"
        )
```

---

## 4. Alert Severity Levels

| Probability | Severity        | Action                              |
| ----------- | --------------- | ----------------------------------- |
| 90-100%     | 🔴 **CRITICAL** | Block transaction, immediate review |
| 50-89%      | 🟠 **HIGH**     | Flag for review, notify user        |
| 30-49%      | 🟡 **MEDIUM**   | Monitor closely                     |
| 0-29%       | 🟢 **LOW/SAFE** | Allow transaction                   |

---

## 5. Dashboard Visualization

The dashboard shows:

### Statistics

- **Total Transactions**: All user transactions in period
- **Total Amount**: Sum of all transaction amounts
- **Fraud Detected**: Count of flagged transactions
- **Fraud Rate**: Percentage of fraudulent transactions

### Fraud Trend Chart

Shows daily counts of:

- Total transactions (blue line)
- Fraudulent transactions (red line)

### Recent Transactions Table

Each transaction shows:

- Badge: 🟢 **Safe** or 🔴 **Fraud (87%)**
- Amount, type, date, transaction ID

---

## 6. Model Training (For Reference)

The CNN model can be trained using:

```bash
cd backend/ml_model
python cnn_model.py
```

This creates:

- `fraud_detection_cnn.h5` - Trained model weights
- `scaler.pkl` - Feature normalization parameters

**Note:** Currently uses synthetic data. For production, train on real historical transaction data with labeled fraud/safe examples.

---

## 7. How to Check Detection Method

When viewing a transaction, check `fraud_details`:

```json
{
  "is_fraud": true,
  "fraud_probability": 0.87,
  "detection_method": "cnn_model", // or "rule_based"
  "confidence": 0.74,
  "timestamp": "2025-10-25T13:45:00",
  "reasons": ["High transaction amount", "Unusual time"] // for rule-based
}
```

---

## 8. Current Status

✅ **Active:** Rule-based detection (always available)  
⚠️ **Pending:** CNN model training with real data

**To enable CNN detection:**

1. Collect historical transaction data (fraud + safe)
2. Train model: `python backend/ml_model/cnn_model.py`
3. Place trained files in `backend/ml_model/trained_models/`
   - `fraud_detection_cnn.h5`
   - `scaler.pkl`
4. Restart backend server

---

## Summary

The system protects users by:

1. **Analyzing** every transaction in real-time
2. **Extracting** 64+ features about transaction patterns
3. **Predicting** fraud using AI (CNN) or rules
4. **Alerting** users immediately when fraud is detected
5. **Tracking** fraud trends over time for insights

**Detection happens in milliseconds** before the user sees the result!
