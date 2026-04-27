import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import certificateService from '../../api/certificate.service';
import CertificateModal from './CertificateModal';
import DeleteModal from './DeleteModal';

function DCertificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [courses, setCourses] = useState([]);
  const [certificateModal, setCertificateModal] = useState({
    isOpen: false,
    mode: 'add',
    certificateId: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    certificate: null,
  });
  const limit = 10;

  useEffect(() => {
    fetchCertificates();
    fetchCourses();
  }, [page, searchTerm, filterCourse, filterStatus]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (searchTerm) params.search = searchTerm;
      if (filterCourse) params.courseId = filterCourse;
      if (filterStatus) params.status = filterStatus;
      const response = await certificateService.searchCertificates(params);
      setCertificates(response.data.certificates || response.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (certificateId) => {
    if (window.confirm('Are you sure you want to revoke this certificate?')) {
      try {
        await certificateService.revokeCertificate(certificateId);
        setError('');
        fetchCertificates();
        setShowModal(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to revoke certificate');
      }
    }
  };

  const openAddCertificate = () => {
    setCertificateModal({ isOpen: true, mode: 'add', certificateId: null });
  };

  const openEditCertificate = (cert) => {
    setCertificateModal({ isOpen: true, mode: 'edit', certificateId: cert.id, certificate: cert });
  };

  const closeCertificateModal = () => {
    setCertificateModal({ isOpen: false, mode: 'add', certificateId: null, certificate: null });
  };

  const handleCertificateSuccess = () => {
    fetchCertificates();
  };

  const openDeleteCertificate = (cert) => {
    setDeleteModal({ isOpen: true, certificate: cert });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, certificate: null });
  };

  const handleDeleteCertificate = async (cert) => {
    return await certificateService.deleteCertificate(cert.id);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/api/courses');
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleViewDetails = (cert) => {
    setSelectedCertificate(cert);
    setShowModal(true);
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
        <h1 className="text-3xl font-bold text-gray-800">Certificate Management</h1>
        <button
          onClick={openAddCertificate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by user or course"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterCourse}
              onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ISSUED">Issued</option>
              <option value="REVOKED">Revoked</option>
              <option value="NOT_ISSUED">Not Issued</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="px-6 py-4 text-left font-semibold">User</th>
                <th className="px-6 py-4 text-left font-semibold">Course</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-left font-semibold">Issued Date</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certificates.length > 0 ? (
                certificates.map((cert) => (
                  <tr key={cert.id || cert._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{cert.username}</p>
                        <p className="text-sm text-gray-500">{cert.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{cert.course_title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          cert.status === 'ISSUED'
                            ? 'bg-green-100 text-green-800'
                            : cert.status === 'REVOKED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(cert)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditCertificate(cert)}
                        className="text-green-600 hover:text-green-800 font-medium text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteCertificate(cert)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm mr-2"
                      >
                        Delete
                      </button>
                      {cert.status === 'ISSUED' && (
                        <button
                          onClick={() => handleRevoke(cert.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No certificates found
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

      {/* Certificate Details Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Certificate Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">User</p>
                  <p className="text-gray-900 font-semibold">{selectedCertificate.username}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Email</p>
                  <p className="text-gray-900 font-semibold">{selectedCertificate.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Course</p>
                  <p className="text-gray-900 font-semibold">{selectedCertificate.course_title}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                      selectedCertificate.status === 'ISSUED'
                        ? 'bg-green-100 text-green-800'
                        : selectedCertificate.status === 'REVOKED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedCertificate.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm font-medium">Issued Date</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedCertificate.issued_at
                      ? new Date(selectedCertificate.issued_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                {selectedCertificate.certificate_url && (
                  <div className="col-span-2">
                    <p className="text-gray-600 text-sm font-medium">Certificate URL</p>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        navigate(`/certificate/${selectedCertificate.course_id}?userId=${selectedCertificate.user_id}&download=true`);
                      }}
                      className="text-blue-600 hover:text-blue-800 break-all text-left underline"
                    >
                      {selectedCertificate.certificate_url}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              {selectedCertificate.status === 'ISSUED' && (
                <>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate(`/certificate/${selectedCertificate.course_id}?userId=${selectedCertificate.user_id}&download=true`);
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    View & Download
                  </button>
                  <button
                    onClick={() => handleRevoke(selectedCertificate.id)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Revoke Certificate
                  </button>
                </>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Certificate Modal */}
      <CertificateModal
        isOpen={certificateModal.isOpen}
        mode={certificateModal.mode}
        certificateId={certificateModal.certificateId}
        certificateData={certificateModal.certificate}
        onClose={closeCertificateModal}
        onSuccess={handleCertificateSuccess}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onSuccess={handleCertificateSuccess}
        onDelete={handleDeleteCertificate}
        item={deleteModal.certificate}
        itemType="Certificate"
        title="Delete Certificate"
        description="Are you sure you want to delete this certificate?"
        itemDisplayName={`ID ${deleteModal.certificate?.id}`}
      />
    </div>
  );
}

export default DCertificates;
