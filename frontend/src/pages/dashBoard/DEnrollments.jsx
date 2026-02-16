import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faHourglass, faUserGraduate } from "@fortawesome/free-solid-svg-icons";
import { message } from "antd";
import { adminService } from "../../api/admin.service";

function DEnrollments() {
  const [pendingRequests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const result = await adminService.getPendingEnrollments();
      if (result.success) {
        setRequests(result.data);
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    try {
      const result = await adminService.approveEnrollment(enrollmentId);
      if (result.success) {
        message.success("Enrollment approved successfully!");
        fetchPendingRequests();
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("Failed to approve enrollment");
    }
  };

  const handleReject = async (enrollmentId) => {
    try {
      const result = await adminService.rejectEnrollment(enrollmentId);
      if (result.success) {
        message.success("Enrollment rejected");
        fetchPendingRequests();
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("Failed to reject enrollment");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-br from-orange-100 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Pending Enrollments</h1>
              <p className="text-gray-600">Review and approve student enrollment requests</p>
            </div>
            <div className="bg-white rounded-full px-4 py-2 shadow-md">
              <span className="text-2xl font-bold text-orange-600">{pendingRequests.length}</span>
              <span className="text-sm text-gray-600 ml-2">Pending</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading requests...</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faUserGraduate} className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No pending requests</h3>
              <p className="text-gray-500 max-w-md">
                All enrollment requests have been processed. New requests will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-200 transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-bold">
                          {request.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{request.username}</h3>
                          <p className="text-sm text-gray-500">{request.email}</p>
                        </div>
                      </div>
                      
                      <div className="ml-13 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FontAwesomeIcon icon={faHourglass} className="text-orange-500 text-sm" />
                          <span className="text-sm font-medium text-gray-700">Course:</span>
                          <span className="text-sm text-gray-900 font-semibold">{request.course_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Requested: {new Date(request.enrolled_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-medium rounded-lg transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DEnrollments;
