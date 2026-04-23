import { Modal, Form, Input, Select, message } from "antd";
import { useState, useEffect } from "react";
import certificateService from "../../api/certificate.service";
import { adminService } from "../../api/admin.service";
import api from "../../api/api";

const { Option } = Select;

function CertificateModal({ isOpen, onClose, onSuccess, certificateId = null, certificateData = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dataReady, setDataReady] = useState(false);

  const isEditMode = mode === "edit" || certificateId !== null;

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setDataReady(false);
      try {
        const [usersRes, coursesRes] = await Promise.all([
          adminService.getAllUsers(),
          api.get('/api/courses'),
        ]);
        if (usersRes.success) setUsers(usersRes.data);
        const courseList = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || [];
        setCourses(courseList);

        if (isEditMode && certificateData) {
          form.setFieldsValue({
            userId: String(certificateData.user_id),
            courseId: String(certificateData.course_id),
            certificateUrl: certificateData.certificate_url || '',
            status: certificateData.status,
          });
        } else {
          form.resetFields();
        }
      } catch (err) {
        console.error('Error loading modal data:', err);
      } finally {
        setDataReady(true);
      }
    };

    loadData();
  }, [isOpen, certificateData, isEditMode]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Auto-generate a frontend certificate URL if not provided
      const certUrl = values.certificateUrl || 
        `${window.location.origin}/certificate/${values.courseId}?userId=${values.userId}`;

      const payload = {
        userId: values.userId,
        courseId: values.courseId,
        certificateUrl: certUrl,
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
      title={isEditMode ? "Edit Certificate" : "Add New Certificate"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
      destroyOnHidden={false}
    >
      {!dataReady ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
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
                  {isEditMode ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEditMode ? "Update Certificate" : "Add Certificate"
              )}
            </button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

export default CertificateModal;