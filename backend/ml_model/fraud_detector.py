"""
Fraud Detector - Main interface for fraud detection
"""
import numpy as np
import os
from datetime import datetime
from django.conf import settings
from .cnn_model import FraudDetectionCNN


class FraudDetector:
    """
    Main fraud detection interface that uses the CNN model
    """
    
    def __init__(self):
        self.model = None
        self.load_model()
    
    def load_model(self):
        """
        Load the trained CNN model
        """
        try:
            model_path = settings.ML_MODEL_PATH
            scaler_path = settings.SCALER_PATH
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = FraudDetectionCNN()
                self.model.load_model(str(model_path), str(scaler_path))
                print("Fraud detection model loaded successfully")
            else:
                print("Model files not found. Using rule-based detection.")
                self.model = None
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.model = None
    
    def extract_features(self, transaction):
        """
        Extract features from a transaction object
        
        Args:
            transaction: Transaction model instance
            
        Returns:
            Feature array shaped for CNN input
        """
        # Extract basic features
        features = []
        
        # 1. Amount (normalized)
        amount = float(transaction.amount)
        features.append(amount / 100000.0)  # Normalize by max amount
        
        # 2. Transaction type (one-hot encoded)
        type_encoding = {'SEND': 0, 'RECEIVE': 1, 'REQUEST': 2}
        features.append(type_encoding.get(transaction.transaction_type, 0) / 2.0)
        
        # 3. Time features
        hour = transaction.created_at.hour / 23.0
        day_of_week = transaction.created_at.weekday() / 6.0
        features.extend([hour, day_of_week])
        
        # 4. UPI ID features (length and patterns)
        sender_len = len(transaction.sender_upi) / 100.0
        receiver_len = len(transaction.receiver_upi) / 100.0
        features.extend([sender_len, receiver_len])
        
        # 5. Location change (0 if no location, 1 otherwise)
        has_location = 1.0 if transaction.location else 0.0
        features.append(has_location)
        
        # 6. Device ID present
        has_device = 1.0 if transaction.device_id else 0.0
        features.append(has_device)
        
        # Add more features to reach 64 (8x8)
        # These could include: user history, transaction frequency, etc.
        # For now, pad with derived features
        while len(features) < 64:
            # Add some derived features and padding
            if len(features) < 16:
                features.append(amount * hour if len(features) == 8 else 0.0)
            else:
                features.append(0.0)
        
        # Reshape to (8, 8, 1) for CNN
        features = np.array(features[:64]).reshape(1, 8, 8, 1).astype(np.float32)
        return features
    
    def rule_based_detection(self, transaction):
        """
        Enhanced rule-based fraud detection with UPI validation
        
        Args:
            transaction: Transaction model instance
            
        Returns:
            dict with fraud detection results
        """
        fraud_score = 0.0
        reasons = []
        
        amount = float(transaction.amount)
        
        # Rule 1: Very high amount
        if amount > 50000:
            fraud_score += 0.3
            reasons.append("High transaction amount (>₹50,000)")
        elif amount > 100000:
            fraud_score += 0.5
            reasons.append("Extremely high amount (>₹1,00,000)")
        
        # Rule 2: Unusual time (late night/early morning)
        hour = transaction.created_at.hour
        if hour < 6 or hour > 22:
            fraud_score += 0.2
            reasons.append(f"Unusual transaction time ({hour}:00 hrs)")
        
        # Rule 3: Round amounts (often suspicious)
        if amount % 1000 == 0 and amount > 10000:
            fraud_score += 0.15
            reasons.append(f"Round amount (₹{int(amount):,})")
        
        # Rule 4: Missing device or location info - CRITICAL
        if not transaction.device_id or not transaction.location or \
           transaction.location in ["Location unavailable", "Geolocation not supported", "Unknown"]:
            fraud_score += 0.35
            reasons.append("Missing or invalid location/device data")
        
        # Rule 5: Same sender and receiver - CRITICAL
        if transaction.sender_upi == transaction.receiver_upi:
            fraud_score += 0.6
            reasons.append("Self-transfer detected (same UPI IDs)")
        
        # Rule 6: Invalid UPI format - CRITICAL
        sender_valid = self._validate_upi_format(transaction.sender_upi)
        receiver_valid = self._validate_upi_format(transaction.receiver_upi)
        
        if not sender_valid or not receiver_valid:
            fraud_score += 0.5
            if not sender_valid:
                reasons.append("Invalid sender UPI format")
            if not receiver_valid:
                reasons.append("Invalid receiver UPI format")
        
        # Rule 7: Suspicious UPI patterns
        if self._is_suspicious_upi(transaction.sender_upi) or self._is_suspicious_upi(transaction.receiver_upi):
            fraud_score += 0.25
            reasons.append("Suspicious UPI pattern detected")
        
        # Rule 8: Multiple small transactions pattern
        if 100 <= amount <= 500:
            fraud_score += 0.1
            reasons.append("Small amount transaction pattern")
        
        # Rule 9: Very unusual amounts (non-standard)
        if amount > 1000 and not (amount % 10 == 0):
            # Normal transactions usually end in 0 or 5
            if str(amount).split('.')[-1] not in ['0', '00', '5', '50']:
                fraud_score += 0.1
                reasons.append("Unusual amount precision")
        
        is_fraud = fraud_score > 0.5
        
        return {
            'is_fraud': is_fraud,
            'fraud_probability': min(fraud_score, 1.0),
            'detection_method': 'rule_based',
            'reasons': reasons,
            'timestamp': datetime.now().isoformat()
        }
    
    def _validate_upi_format(self, upi_id):
        """
        Validate UPI ID format
        Format: username@provider (e.g., john@paytm, user123@ybl)
        """
        import re
        if not upi_id:
            return False
        # UPI regex: alphanumeric + special chars before @, then provider name
        pattern = r'^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$'
        return bool(re.match(pattern, upi_id))
    
    def _is_suspicious_upi(self, upi_id):
        """
        Check for suspicious UPI patterns
        """
        if not upi_id:
            return True
        
        upi_lower = upi_id.lower()
        
        # Suspicious patterns
        suspicious_keywords = ['test', 'fake', 'dummy', 'fraud', 'scam', '123456', 'admin', 'temp']
        for keyword in suspicious_keywords:
            if keyword in upi_lower:
                return True
        
        # Too many numbers (e.g., 123456789@paytm)
        username = upi_id.split('@')[0]
        if len(username) > 0 and sum(c.isdigit() for c in username) / len(username) > 0.7:
            return True
        
        # Very short usernames (< 3 chars)
        if len(username) < 3:
            return True
            
        return False
    
    def predict(self, transaction):
        """
        Predict if a transaction is fraudulent
        
        Args:
            transaction: Transaction model instance
            
        Returns:
            dict with fraud detection results
        """
        try:
            if self.model is not None and self.model.model is not None:
                # Extract features
                features = self.extract_features(transaction)
                
                # Make prediction
                probability = float(self.model.predict(features)[0][0])
                is_fraud = probability > 0.5
                
                return {
                    'is_fraud': is_fraud,
                    'fraud_probability': probability,
                    'detection_method': 'cnn_model',
                    'confidence': abs(probability - 0.5) * 2,  # 0 to 1 confidence
                    'timestamp': datetime.now().isoformat()
                }
            else:
                # Fallback to rule-based detection
                return self.rule_based_detection(transaction)
                
        except Exception as e:
            print(f"Error in fraud detection: {str(e)}")
            # Fallback to rule-based detection
            return self.rule_based_detection(transaction)
