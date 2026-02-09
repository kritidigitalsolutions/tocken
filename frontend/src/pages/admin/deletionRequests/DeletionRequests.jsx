import { useEffect, useState } from "react";
import {
    fetchDeletionRequests,
    approveDeletionRequest,
    permanentlyDeleteUser
} from "../../../api/deletionRequest.api";
import Loader from "../../../components/common/Loader";
import toast, { Toaster } from "react-hot-toast";
import {
    UserX,
    User,
    Phone,
    Clock,
    CheckCircle,
    // XCircle,
    Trash2,
    AlertTriangle,
    MessageSquare,
    X
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const DeletionRequests = () => {
    const { isDark } = useTheme();
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("PENDING");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await fetchDeletionRequests({ status: selectedStatus });
            setRequests(res.data.requests);
            setStats(res.data.stats);
        } catch (error) {
            toast.error("Failed to load deletion requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatus]);

    const handleApprove = async (userId) => {
        try {
            await approveDeletionRequest(userId);
            toast.success("Deletion request approved. Account deactivated.");
            loadRequests();
            setShowModal(false);
            setShowConfirmModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve");
        }
    };


    const handlePermanentDelete = async (userId) => {
        try {
            await permanentlyDeleteUser(userId);
            toast.success("User permanently deleted");
            loadRequests();
            setShowModal(false);
            setShowConfirmModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete");
        }
    };

    const openViewModal = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
    };

    const openConfirmModal = (action) => {
        setConfirmAction(action);
        setShowConfirmModal(true);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Account Deletion Requests</h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Review and process user account deletion requests
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`rounded-lg p-4 border ${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-3">
                        <Clock className={isDark ? 'text-yellow-400' : 'text-yellow-600'} size={24} />
                        <div>
                            <p className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.pending}</p>
                            <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>Pending</p>
                        </div>
                    </div>
                </div>
                <div className={`rounded-lg p-4 border ${isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={isDark ? 'text-green-400' : 'text-green-600'} size={24} />
                        <div>
                            <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.approved}</p>
                            <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>Approved</p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-lg p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                        <UserX className={isDark ? 'text-slate-400' : 'text-gray-500'} size={24} />
                        <div>
                            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Requests</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {["PENDING", "APPROVED", "ALL"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${selectedStatus === status
                            ? "bg-indigo-600 text-white"
                            : isDark
                                ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <Loader />
            ) : requests.length === 0 ? (
                <div className={`text-center py-12 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <UserX className={`mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} size={48} />
                    <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>No {selectedStatus.toLowerCase()} deletion requests</p>
                </div>
            ) : (
                <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <table className="w-full">
                        <thead className={isDark ? 'bg-slate-900' : 'bg-gray-50'}>
                            <tr>
                                <th className={`text-left p-4 font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User</th>
                                <th className={`text-left p-4 font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Reason</th>
                                <th className={`text-left p-4 font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Requested</th>
                                <th className={`text-left p-4 font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Status</th>
                                <th className={`text-right p-4 font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request._id} className={`border-t ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                                {request.profileImage ? (
                                                    <img
                                                        src={request.profileImage}
                                                        alt={request.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={20} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{request.name || "User"}</p>
                                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{request.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className={`text-sm max-w-xs truncate ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                                            {request.deletionRequest?.reason || "N/A"}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                            {request.deletionRequest?.requestedAt
                                                ? formatDate(request.deletionRequest.requestedAt)
                                                : "N/A"}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${request.deletionRequest?.status === "PENDING"
                                                ? isDark ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                                                : request.deletionRequest?.status === "APPROVED"
                                                    ? isDark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"
                                                    : isDark ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {request.deletionRequest?.status || "N/A"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => openViewModal(request)}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* View Details Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        {/* Header */}
                        <div className={`flex justify-between items-center p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Deletion Request Details</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={20} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* User Info */}
                            <div className={`flex items-center gap-4 p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                    {selectedRequest.profileImage ? (
                                        <img
                                            src={selectedRequest.profileImage}
                                            alt={selectedRequest.name}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={28} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRequest.name || "User"}</p>
                                    <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        <Phone size={14} />
                                        <span>{selectedRequest.phone}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                                        {selectedRequest.userType}
                                    </span>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                                <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <AlertTriangle size={16} />
                                    <span className="text-sm font-medium">Reason for Deletion</span>
                                </div>
                                <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedRequest.deletionRequest?.reason || "N/A"}</p>
                            </div>

                            {/* Feedback */}
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                                <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <MessageSquare size={16} />
                                    <span className="text-sm font-medium">User Feedback</span>
                                </div>
                                <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>{selectedRequest.deletionRequest?.feedback || "No feedback provided"}</p>
                            </div>

                            {/* Timestamps */}
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                                <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                    <Clock size={16} />
                                    <span className="text-sm font-medium">Request Time</span>
                                </div>
                                <p className={isDark ? 'text-white' : 'text-gray-900'}>
                                    {selectedRequest.deletionRequest?.requestedAt
                                        ? formatDate(selectedRequest.deletionRequest.requestedAt)
                                        : "N/A"}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className="text-center">
                                <span
                                    className={`px-4 py-2 rounded-full font-medium ${selectedRequest.deletionRequest?.status === "PENDING"
                                        ? isDark ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                                        : selectedRequest.deletionRequest?.status === "APPROVED"
                                            ? isDark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"
                                            : isDark ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {selectedRequest.deletionRequest?.status}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        {selectedRequest.deletionRequest?.status === "PENDING" && (
                            <div className={`p-4 border-t flex gap-3 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => openConfirmModal("approve")}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    Approve
                                </button>

                            </div>
                        )}

                        {selectedRequest.deletionRequest?.status === "APPROVED" && (
                            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => openConfirmModal("permanent")}
                                    className="w-full py-3 bg-red-800 hover:bg-red-900 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Permanently Delete User
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirm Action Modal */}
            {showConfirmModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <div className={`rounded-xl w-full max-w-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="text-center mb-6">
                            <div
                                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${confirmAction === "approve" && isDark ? "bg-green-900" : "bg-green-100"
                                    }`}
                            >
                            {confirmAction === "approve" && <CheckCircle size={32} className={isDark ? 'text-green-400' : 'text-green-600'} />}
                            {confirmAction === "permanent" && <Trash2 size={32} className={isDark ? 'text-red-500' : 'text-red-700'} />}
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {confirmAction === "approve" && "Approve Deletion Request?"}
                            {confirmAction === "permanent" && "Permanently Delete User?"}
                        </h3>

                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className={`flex-1 py-3 rounded-lg font-medium ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (confirmAction === "approve") handleApprove(selectedRequest._id);
                                if (confirmAction === "permanent") handlePermanentDelete(selectedRequest._id);
                            }}
                            className={`flex-1 py-3 rounded-lg font-medium text-white ${confirmAction === "approve"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                                }`}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
                </div>
    )
}
        </div >
    );
};

export default DeletionRequests;
