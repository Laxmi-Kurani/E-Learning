import api from "./api";

async function getQuestionsByCourse(courseId) {
  try {
    const response = await api.get(`/api/questions/course/${courseId}`);
    // Backend /course/:courseId already aliases fields: question, option1-4, answer
    const questions = response.data.data || [];
    return { success: true, data: questions };
  } catch (err) {
    console.error("Error fetching questions:", err);
    return { success: false, error: err.response?.data?.message || "Unable to fetch questions" };
  }
}

async function getQuestionById(questionId) {
  try {
    const { data } = await api.get(`/api/questions/${questionId}`);
    // Backend /:id also aliases fields: question, option1-4, answer
    return { success: true, data };
  } catch (err) {
    if (err.response?.status === 404) {
      return { success: false, error: "Question not found" };
    }
    console.error("Error fetching question:", err);
    return { success: false, error: err.response?.data?.message || "Unable to fetch question" };
  }
}

export const questionService = {
  getQuestionsByCourse,
  getQuestionById,
};
