"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  transactionService,
  DashboardStats,
  Transaction,
} from "@/lib/transactions";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Plus,
  LogOut,
  User,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await transactionService.getDashboardStats(30);
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                UPI Fraud Detection
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-800">
                  {user?.first_name || user?.username}
                </p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<Activity className="h-6 w-6" />}
            title="Total Transactions"
            value={stats?.total_transactions || 0}
            gradient="from-blue-500 to-blue-600"
          />
          <StatsCard
            icon={<DollarSign className="h-6 w-6" />}
            title="Total Amount"
            value={`₹${stats?.total_amount.toFixed(2) || 0}`}
            gradient="from-green-500 to-green-600"
          />
          <StatsCard
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Fraud Detected"
            value={stats?.fraud_transactions || 0}
            gradient="from-red-500 to-red-600"
          />
          <StatsCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Fraud Rate"
            value={`${stats?.fraud_rate.toFixed(2)}%`}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Alerts Banner */}
        {stats && stats.unresolved_alerts > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <p className="font-semibold text-red-800">
                  {stats.unresolved_alerts} unresolved fraud alert
                  {stats.unresolved_alerts !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-red-700">
                  Review suspicious transactions immediately
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart and Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Fraud Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Fraud Detection Trend (30 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.fraud_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="fraud"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Fraud"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowTransactionForm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" />
                New Transaction
              </button>
              <button
                onClick={() => router.push("/transactions")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <CreditCard className="h-5 w-5" />
                View All Transactions
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <User className="h-5 w-5" />
                My Profile
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Transaction ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_transactions.map((transaction: Transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">
                      {transaction.transaction_id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      ₹{parseFloat(transaction.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {transaction.is_fraud ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Fraud (
                          {(transaction.fraud_probability * 100).toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Safe
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(
                        new Date(transaction.created_at),
                        "MMM dd, HH:mm"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionFormModal
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => {
            setShowTransactionForm(false);
            loadStats();
          }}
        />
      )}
    </div>
  );
}

function StatsCard({ icon, title, value, gradient }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div
        className={`bg-gradient-to-r ${gradient} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4`}
      >
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function TransactionFormModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    sender_upi: "",
    receiver_upi: "",
    amount: "",
    transaction_type: "SEND",
    description: "",
    location: "",
    device_id: "",
    ip_address: "",
  });
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("detecting");

  useEffect(() => {
    // Get device fingerprint
    const deviceId = `device_${navigator.userAgent.substring(0, 50).replace(/\s/g, '_')}_${Date.now()}`;
    
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, location, device_id: deviceId }));
          setLocationStatus("detected");
        },
        (error) => {
          console.error("Location error:", error);
          setFormData(prev => ({ ...prev, location: "Location unavailable", device_id: deviceId }));
          setLocationStatus("unavailable");
        }
      );
    } else {
      setFormData(prev => ({ ...prev, location: "Geolocation not supported", device_id: deviceId }));
      setLocationStatus("unsupported");
    }

    // Get IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({ ...prev, ip_address: data.ip }));
      })
      .catch(() => {
        setFormData(prev => ({ ...prev, ip_address: "Unknown" }));
      });
  }, []);

  const validateUPI = (upiId: string): boolean => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{3,}@[a-zA-Z]{3,}$/;
    return upiRegex.test(upiId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate UPI IDs
    if (!validateUPI(formData.sender_upi)) {
      toast.error("Invalid sender UPI ID format. Example: username@paytm");
      return;
    }
    if (!validateUPI(formData.receiver_upi)) {
      toast.error("Invalid receiver UPI ID format. Example: username@paytm");
      return;
    }

    // Check self-transfer
    if (formData.sender_upi === formData.receiver_upi) {
      toast.error("Sender and receiver cannot be the same!");
      return;
    }

    setLoading(true);

    try {
      const transaction = await transactionService.createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      if (transaction.is_fraud) {
        const riskLevel = transaction.fraud_probability * 100;
        const reasons = transaction.fraud_details?.reasons?.join(", ") || "High risk detected";
        toast.error(
          `⚠️ FRAUD ALERT! Risk: ${riskLevel.toFixed(0)}% - ${reasons}`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `✅ Transaction Safe! Confidence: ${(100 - transaction.fraud_probability * 100).toFixed(0)}%`
        );
      }

      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.amount?.[0] || "Failed to create transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          New Transaction
        </h2>
        
        {/* Security Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Security Status:</span>
            <span className={`ml-auto ${
              locationStatus === "detected" ? "text-green-600" : "text-orange-600"
            }`}>
              {locationStatus === "detected" && "✓ Location Verified"}
              {locationStatus === "detecting" && "⏳ Detecting location..."}
              {locationStatus === "unavailable" && "⚠ Location unavailable"}
              {locationStatus === "unsupported" && "⚠ Location not supported"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sender UPI ID *
            </label>
            <input
              type="text"
              required
              value={formData.sender_upi}
              onChange={(e) =>
                setFormData({ ...formData, sender_upi: e.target.value.toLowerCase().trim() })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="yourname@paytm"
            />
            <p className="text-xs text-gray-500 mt-1">Format: username@provider (e.g., john@paytm, user@ybl)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receiver UPI ID *
            </label>
            <input
              type="text"
              required
              value={formData.receiver_upi}
              onChange={(e) =>
                setFormData({ ...formData, receiver_upi: e.target.value.toLowerCase().trim() })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="receiver@paytm"
            />
            <p className="text-xs text-gray-500 mt-1">Valid providers: paytm, phonepe, googlepay, ybl, etc.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="1000.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              value={formData.transaction_type}
              onChange={(e) =>
                setFormData({ ...formData, transaction_type: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="SEND">Send Money</option>
              <option value="RECEIVE">Receive Money</option>
              <option value="REQUEST">Request Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Payment for..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
