import api from "./api";

async function getProgress(userId, courseId) {
  try {
    const { data } = await api.get(`/api/progress/${userId}/${courseId}`);
    // Return played time (completion_percentage converted back to seconds if needed)
    // For now, return completion_percentage as the progress value
    return { success: true, data: data.completion_percentage || 0 };
  } catch (err) {
    console.error("Error fetching progress:", err);
    return { success: false, error: err.response?.data?.message || "Unable to fetch progress" };
  }
}

async function updateDuration(userId, courseId, duration) {
  try {
    await api.put(`/api/progress/update-duration`, { userId, courseId, duration });
    return { success: true };
  } catch (err) {
    console.error("Error updating duration:", err);
    return { success: false, error: err.response?.data?.message || "Unable to update duration" };
  }
}

async function updateProgress(userId, courseId, playedTime, duration) {
  try {
    await api.put(`/api/progress/update-progress`, { userId, courseId, playedTime, duration });
    return { success: true };
  } catch (err) {
    console.error("Error updating progress:", err);
    return { success: false, error: err.response?.data?.message || "Unable to update progress" };
  }
}

export const progressService = {
  getProgress,
  updateDuration,
  updateProgress,
};
