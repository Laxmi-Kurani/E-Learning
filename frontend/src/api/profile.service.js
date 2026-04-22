import api from "./api";

async function getUserDetails(userId) {
  try {
    const { data } = await api.get(`/api/users/profile`);
    return { success: true, data };
  } catch (err) {
    console.error("Error fetching user details:", err);
    return { success: false, error: "Unable to fetch user details" };
  }
}

async function getUserById(userId) {
  try {
    const { data } = await api.get(`/api/users/${userId}`);
    return { success: true, data };
  } catch (err) {
    console.error("Error fetching user by id:", err);
    return { success: false, error: "Unable to fetch user" };
  }
}

async function getProfileImage(userId) {
  try {
    const res = await api.get(`/api/users/${userId}/profile-image`, {
      responseType: "arraybuffer",
    });

    const contentType = res.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      const jsonString = new TextDecoder().decode(res.data);
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.profile_image) {
        return { success: true, data: parsed.profile_image };
      }
      return { success: false, error: "No profile image" };
    }

    const blob = new Blob([res.data], { type: contentType || "application/octet-stream" });
    const blobUrl = URL.createObjectURL(blob);
    return { success: true, data: blobUrl };
  } catch (err) {
    return { success: false, error: "No profile image" };
  }
}

async function updateUser(userId, updatedData) {
  try {
    // Use /profile endpoint which updates current user from token
    const { data } = await api.put(`/api/users/profile`, updatedData);
    return { success: true, data };
  } catch (err) {
    console.error("Error updating user:", err);
    return { success: false, error: "Unable to update user" };
  }
}

async function uploadProfileImage(userId, file) {
  try {
    const formData = new FormData();
    formData.append('profileImage', file);

    const { data } = await api.post(`/api/users/profile/upload-image`, formData);
    return { success: true, data };
  } catch (err) {
    console.error('Error uploading profile image:', err);
    return { success: false, error: err.response?.data?.message || 'Unable to upload image' };
  }
}

export const profileService = {
  getUserDetails,
  getUserById,
  getProfileImage,
  uploadProfileImage,
  updateUser,
};
