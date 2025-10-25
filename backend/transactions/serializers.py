from rest_framework import serializers
from .models import Transaction, FraudAlert
import re


class TransactionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'user', 'user_username',
            'sender_upi', 'receiver_upi', 'amount', 'transaction_type',
            'description', 'device_id', 'ip_address', 'location',
            'is_fraud', 'fraud_probability', 'fraud_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['transaction_id', 'user', 'is_fraud', 'fraud_probability', 'fraud_details', 'created_at', 'updated_at']


class FraudAlertSerializer(serializers.ModelSerializer):
    transaction_details = TransactionSerializer(source='transaction', read_only=True)

    class Meta:
        model = FraudAlert
        fields = ['id', 'transaction', 'transaction_details', 'alert_type', 'severity', 'message', 'is_resolved', 'resolved_at', 'created_at']
        read_only_fields = ['created_at']


class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'sender_upi', 'receiver_upi', 'amount', 'transaction_type',
            'description', 'device_id', 'ip_address', 'location'
        ]

    def validate_upi_id(self, value):
        """Validate UPI ID format"""
        if not value:
            raise serializers.ValidationError("UPI ID is required.")
        
        # UPI format: username@provider
        pattern = r'^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Invalid UPI ID format. Must be in format: username@provider (e.g., john@paytm)"
            )
        
        # Check for suspicious patterns
        suspicious_keywords = ['test', 'fake', 'dummy', 'fraud', 'scam']
        if any(keyword in value.lower() for keyword in suspicious_keywords):
            raise serializers.ValidationError(
                "UPI ID contains suspicious keywords."
            )
        
        return value.lower()

    def validate_sender_upi(self, value):
        return self.validate_upi_id(value)

    def validate_receiver_upi(self, value):
        return self.validate_upi_id(value)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if value > 100000:
            raise serializers.ValidationError("Amount exceeds maximum transaction limit (₹1,00,000).")
        return value

    def validate(self, data):
        # Check if sender and receiver are the same
        if data.get('sender_upi') == data.get('receiver_upi'):
            raise serializers.ValidationError({
                "receiver_upi": "Sender and receiver cannot be the same."
            })
        return data
