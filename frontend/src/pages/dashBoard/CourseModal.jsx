import { Modal, Form, Input, InputNumber, message } from "antd";
import { useState, useEffect } from "react";
import { adminService } from "../../api/admin.service";

const { TextArea } = Input;

function CourseModal({ isOpen, onClose, onSuccess, courseId = null, mode = "add" }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const isEditMode = mode === "edit" || courseId !== null;
  const modalTitle = isEditMode ? "Edit Course" : "Add New Course";
  const submitButtonText = isEditMode ? "Update Course" : "Add Course";
  const loadingText = isEditMode ? "Updating..." : "Adding...";

  useEffect(() => {
    if (isOpen && isEditMode && courseId) {
      fetchCourseData();
    } else if (isOpen && !isEditMode) {
      form.resetFields();
    }
  }, [isOpen, courseId, isEditMode]);

  const fetchCourseData = async () => {
    setFetchingData(true);
    try {
      const result = await adminService.getCourseById(courseId);
      if (result.success) {
        const formData = {
          title: result.data.title,
          instructor: result.data.instructor,
          price: result.data.price,
          description: result.data.description,
          video_url: result.data.video_url,
          image_url: result.data.image_url,
          duration: result.data.duration,
          level: result.data.level,
          category: result.data.category,
        };
        form.setFieldsValue(formData);
      } else {
        message.error(result.error);
        onClose();
      }
    } catch {
      message.error("Failed to fetch course data");
      onClose();
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let result;
      const courseData = {
        title: values.title,
        instructor: values.instructor,
        price: values.price,
        description: values.description,
        video_url: values.video_url,
        image_url: values.image_url,
        duration: values.duration,
        level: values.level,
        category: values.category,
      };
      
      if (isEditMode) {
        result = await adminService.updateCourse(courseId, courseData);
      } else {
        result = await adminService.createCourse(courseData);
      }

      if (result.success) {
        message.success(isEditMode ? "Course updated successfully!" : "Course added successfully!");
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
      width={600}
      className="custom-modal"
      destroyOnHidden
    >
      {fetchingData ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <span className="ml-3 text-gray-600">Loading course data...</span>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-2 space-y-4"
          initialValues={{
            title: "",
            instructor: "",
            price: 0,
            description: "",
            video_url: "",
            image_url: "",
            duration: "",
            level: "",
            category: "",
          }}
        >
          <Form.Item
            label="Course Title"
            name="title"
            rules={[
              { required: true, message: "Course title is required" },
              { min: 3, message: "Course title must be at least 3 characters" },
              { max: 255, message: "Course title cannot exceed 255 characters" },
            ]}
          >
            <Input placeholder="Enter course title" />
          </Form.Item>

          <Form.Item
            label="Instructor"
            name="instructor"
            rules={[
              { required: true, message: "Instructor is required" },
              { min: 2, message: "Instructor name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter instructor name" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Duration"
              name="duration"
              rules={[{ required: true, message: "Duration is required" }]}
            >
              <Input placeholder="e.g., 4 weeks" />
            </Form.Item>

            <Form.Item
              label="Level"
              name="level"
              rules={[{ required: true, message: "Level is required" }]}
            >
              <Input placeholder="e.g., Beginner" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: "Category is required" }]}
            >
              <Input placeholder="e.g., Programming" />
            </Form.Item>

            <Form.Item
              label="Price"
              name="price"
              rules={[
                { required: true, message: "Price is required" },
                { type: "number", min: 0, message: "Price must be a positive number" },
              ]}
            >
              <InputNumber
                placeholder="Enter price"
                className="w-full"
                min={0}
                step={0.01}
                formatter={(value) =>
                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { required: true, message: "Description is required" },
              { min: 10, message: "Description must be at least 10 characters" },
            ]}
          >
            <TextArea rows={4} placeholder="Enter course description" showCount />
          </Form.Item>

          <Form.Item
            label="Video URL"
            name="video_url"
            rules={[
              { required: true, message: "Video URL is required" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://example.com/video" />
          </Form.Item>

          <Form.Item
            label="Image URL"
            name="image_url"
            rules={[
              { required: true, message: "Image URL is required" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://example.com/image.jpg" />
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

export default CourseModal;
