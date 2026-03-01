import { useEffect, useState } from 'react';
import api from '../../api/api';
import { assessmentService } from '../../api/assessment.service';
import AssessmentModal from './AssessmentModal';
import DeleteModal from './DeleteModal';

function DAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [assessmentModal, setAssessmentModal] = useState({
    isOpen: false,
    mode: 'add',
    assessmentId: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    assessment: null,
  });
  const limit = 10;

  useEffect(() => {
    fetchAssessments();
    fetchCourses();
  }, [page, filterCourse, filterStatus, searchTerm]);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/api/courses');
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // use admin service to take advantage of search & filtering
      const params = { page, limit };
      if (filterCourse) params.courseId = filterCourse;
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;
      const res = await assessmentService.getAllAssessments(params);
      if (res.success) {
        setAssessments(res.data.assessments || res.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(res.error || 'Failed to load assessments');
        setAssessments([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assessments');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (assessment) => {
    setSelectedAssessment(assessment);
    setShowDetailsModal(true);
  };

  const openAddAssessment = () => {
    setAssessmentModal({ isOpen: true, mode: 'add', assessmentId: null });
  };

  const openEditAssessment = (assessment) => {
    setAssessmentModal({ isOpen: true, mode: 'edit', assessmentId: assessment.id });
  };

  const closeAssessmentModal = () => {
    setAssessmentModal({ isOpen: false, mode: 'add', assessmentId: null });
  };

  const handleAssessmentSuccess = () => {
    fetchAssessments();
  };

  const openDeleteAssessment = (assessment) => {
    setDeleteModal({ isOpen: true, assessment });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, assessment: null });
  };

  const handleDeleteAssessment = async (assessment) => {
    return await assessmentService.deleteAssessment(assessment.id);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const getPassStatus = (score, totalQuestions) => {
    const percentage = (score / totalQuestions) * 100;
    return percentage >= 70 ? 'PASSED' : 'FAILED';
  };

  const getScore = (assessment) => {
    return ((assessment.score / assessment.total_questions) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Assessment Management</h1>
        <button
          onClick={openAddAssessment}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {/* search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by user name or email"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* details modal */}
      {showDetailsModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Assessment Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">User ID</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.user_id}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Username</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Course</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.course_title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Course ID</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.course_id}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Score</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedAssessment.score} / {selectedAssessment.total_questions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Percentage</p>
                  <p className="text-gray-900 font-semibold">
                    {getScore(selectedAssessment)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                      selectedAssessment.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedAssessment.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm font-medium">Submitted Date</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedAssessment.completed_at
                      ? new Date(selectedAssessment.completed_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Score Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      selectedAssessment.passed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(getScore(selectedAssessment), 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Course</label>
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="px-6 py-4 text-left font-semibold">User</th>
                <th className="px-6 py-4 text-left font-semibold">Course</th>
                <th className="px-6 py-4 text-left font-semibold">Score</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-left font-semibold">Submitted Date</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assessments.length > 0 ? (
                assessments.map((assessment) => {
                  const status = assessment.passed ? 'PASSED' : 'FAILED';
                  const score = getScore(assessment);
                  return (
                    <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{assessment.username || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{assessment.user_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{assessment.course_title || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="font-semibold text-gray-900">{score}%</span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${score >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(score, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            status === 'PASSED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {assessment.completed_at
                          ? new Date(assessment.completed_at).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(assessment)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditAssessment(assessment)}
                          className="text-green-600 hover:text-green-800 font-medium text-sm mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteAssessment(assessment)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No assessments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
          >
            Previous
          </button>
          <span className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Assessment Details Modal */}
      {showDetailsModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Assessment Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">User ID</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.user_id}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Username</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Course</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.course_title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Course ID</p>
                  <p className="text-gray-900 font-semibold">{selectedAssessment.course_id}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Score</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedAssessment.score} / {selectedAssessment.total_questions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Percentage</p>
                  <p className="text-gray-900 font-semibold">
                    {getScore(selectedAssessment)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                      selectedAssessment.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedAssessment.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm font-medium">Submitted Date</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedAssessment.completed_at
                      ? new Date(selectedAssessment.completed_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Score Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      selectedAssessment.passed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(getScore(selectedAssessment), 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Assessment Modal */}
      <AssessmentModal
        isOpen={assessmentModal.isOpen}
        mode={assessmentModal.mode}
        assessmentId={assessmentModal.assessmentId}
        onClose={closeAssessmentModal}
        onSuccess={handleAssessmentSuccess}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onSuccess={handleAssessmentSuccess}
        onDelete={handleDeleteAssessment}
        item={deleteModal.assessment}
        itemType="Assessment"
        title="Delete Assessment"
        description="Are you sure you want to delete this assessment?"
        itemDisplayName={`ID ${deleteModal.assessment?.id}`}
      />
    </div>
  );
}

export default DAssessments;
