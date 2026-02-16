import api from "./api";

async function getEnrollments(userId) {
  try {
    const { data } = await api.get(`/api/learning/my-courses`);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return { success: false, error: "Could not fetch enrollments" };
  }
}

async function enrollCourse(userId, courseId) {
  try {
    const { data } = await api.post("/api/learning/enroll", { courseId });
    return { success: true, data: data.message };
  } catch (error) {
    console.error("Enrollment error:", error);
    const errorMessage = error.response?.data?.message || "Could not enroll in course";
    return { success: false, error: errorMessage };
  }
}

export const learningService = {
  getEnrollments,
  enrollCourse,
};
