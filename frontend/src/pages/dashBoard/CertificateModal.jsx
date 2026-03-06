import { Modal, Form, Input, Select, message } from "antd";
import { useState, useEffect } from "react";
import certificateService from "../../api/certificate.service";
import { adminService } from "../../api/admin.service";
import api from "../../api/api";

const { Option } = Select;

function CertificateModal({ isOpen, onClose, onSuccess, certificateId = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  const isEditMode = mode === "edit" || certificateId !== null;
  const modalTitle = isEditMode ? "Edit Certificate" : "Add New Certificate";
  const submitButtonText = isEditMode ? "Update Certificate" : "Add Certificate";
  const loadingText = isEditMode ? "Updating..." : "Adding...";

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchCourses();
      if (isEditMode && certificateId) {
        fetchCertificate();
      } else if (!isEditMode) {
        form.resetFields();
      }
    }
  }, [isOpen, certificateId, isEditMode]);

  const fetchUsers = async () => {
    try {
      const result = await adminService.getAllUsers();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/api/courses');
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchCertificate = async () => {
    setFetchingData(true);
    try {
      const result = await certificateService.getCertificateById(certificateId);
      if (result.success) {
        const cert = result.data;
        form.setFieldsValue({
          userId: String(cert.user_id),
          courseId: String(cert.course_id),
          certificateUrl: cert.certificate_url || "",
          status: cert.status,
        });
      } else {
        message.error(result.error);
        onClose();
      }
    } catch {
      message.error("Failed to fetch certificate data");
      onClose();
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        userId: values.userId,
        courseId: values.courseId,
        certificateUrl: values.certificateUrl,
        status: values.status,
      };
      let result;
      if (isEditMode) {
        result = await certificateService.updateCertificate(certificateId, payload);
      } else {
        result = await certificateService.createCertificate(payload);
      }
      if (result.success) {
        message.success(isEditMode ? "Certificate updated successfully!" : "Certificate added successfully!");
        form.resetFields();
        onClose();
        onSuccess?.();
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={modalTitle}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      className="custom-modal"
      destroyOnHidden
    >
      {fetchingData ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading certificate data...</span>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-2 space-y-4"
          initialValues={{
            userId: "",
            courseId: "",
            certificateUrl: "",
            status: "ISSUED",
          }}
        >
          <Form.Item
            label="User"
            name="userId"
            rules={[{ required: true, message: "User is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a user"
              filterOption={(input, option) => {
                const searchText = `${option.username} ${option.email}`.toLowerCase();
                return searchText.includes(input.toLowerCase());
              }}
            >
              {users.map((user) => (
                <Option 
                  key={user.id || user._id} 
                  value={String(user.id || user._id)}
                  username={user.username}
                  email={user.email}
                >
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Course"
            name="courseId"
            rules={[{ required: true, message: "Course is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a course"
              filterOption={(input, option) => {
                const searchText = option.title?.toLowerCase() || '';
                return searchText.includes(input.toLowerCase());
              }}
            >
              {courses.map((course) => (
                <Option 
                  key={course.id || course._id} 
                  value={String(course.id || course._id)}
                  title={course.title}
                >
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Certificate URL" name="certificateUrl">
            <Input placeholder="Optional URL (auto-generated if empty)" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select>
              <Option value="ISSUED">ISSUED</Option>
              <Option value="REVOKED">REVOKED</Option>
              <Option value="NOT_ISSUED">NOT_ISSUED</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[140px] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {loadingText}
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

export default CertificateModal;