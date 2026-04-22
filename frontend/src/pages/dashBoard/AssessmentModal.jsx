import { Modal, Form, InputNumber, Select, message } from "antd";
import { useState, useEffect, useCallback } from "react";
import { assessmentService } from "../../api/assessment.service";
import { adminService } from "../../api/admin.service";
import api from "../../api/api";

const { Option } = Select;

function AssessmentModal({ isOpen, onClose, onSuccess, assessmentId = null, assessmentData = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dataReady, setDataReady] = useState(false);

  const isEditMode = mode === "edit" || assessmentId !== null;

  // Load users + courses, then pre-fill form once both are ready
  const loadData = useCallback(async () => {
    setDataReady(false);
    try {
      const [usersRes, coursesRes] = await Promise.all([
        adminService.getAllUsers(),
        api.get('/api/courses'),
      ]);

      if (usersRes.success) setUsers(usersRes.data);
      const courseList = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data?.data || [];
      setCourses(courseList);

      // Pre-fill only after options are in state
      if (isEditMode && assessmentData) {
        form.setFieldsValue({
          userId: String(assessmentData.user_id),
          courseId: String(assessmentData.course_id),
          score: assessmentData.score,
          totalQuestions: assessmentData.total_questions,
          passed: assessmentData.passed ? "PASSED" : "FAILED",
        });
      } else {
        form.resetFields();
      }
    } catch (err) {
      console.error('Error loading modal data:', err);
    } finally {
      setDataReady(true);
    }
  }, [isOpen, assessmentData, isEditMode]);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, loadData]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        userId: values.userId,
        courseId: values.courseId,
        score: values.score,
        totalQuestions: values.totalQuestions,
        passed: values.passed === "PASSED",
      };

      const result = isEditMode
        ? await assessmentService.updateAssessment(assessmentId, payload)
        : await assessmentService.createAssessment(payload);

      if (result.success) {
        message.success(isEditMode ? "Assessment updated successfully!" : "Assessment added successfully!");
        form.resetFields();
        onClose();
        onSuccess?.();
      } else {
        message.error(result.error || "Operation failed");
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
      title={isEditMode ? "Edit Assessment" : "Add New Assessment"}
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      {!dataReady ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-2">
          <Form.Item label="User" name="userId" rules={[{ required: true, message: "User is required" }]}>
            <Select
              showSearch
              placeholder="Select a user"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user.id || user._id} value={String(user.id || user._id)}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Course" name="courseId" rules={[{ required: true, message: "Course is required" }]}>
            <Select
              showSearch
              placeholder="Select a course"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {courses.map((course) => (
                <Option key={course.id || course._id} value={String(course.id || course._id)}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Score" name="score" rules={[{ required: true, message: "Score is required" }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label="Total Questions" name="totalQuestions" rules={[{ required: true, message: "Required" }]}>
              <InputNumber className="w-full" min={1} />
            </Form.Item>
          </div>

          <Form.Item label="Status" name="passed" rules={[{ required: true, message: "Status is required" }]}>
            <Select>
              <Option value="PASSED">PASSED</Option>
              <Option value="FAILED">FAILED</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium min-w-[140px] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  {isEditMode ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEditMode ? "Update Assessment" : "Add Assessment"
              )}
            </button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

export default AssessmentModal;
