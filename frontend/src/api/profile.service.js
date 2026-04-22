import api from "./api";

async function getUserDetails(userId) {
  try {
    // Use /profile endpoint which gets user from token
    const { data } = await api.get(`/api/users/profile`);
    console.log('DEBUG - getUserDetails response:', {
      hasProfileImage: !!data.profile_image,
      imageLength: data.profile_image ? data.profile_image.length : 0,
      imagePreview: data.profile_image ? data.profile_image.substring(0, 100) : 'null'
    });
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
    // Profile image not found is expected, return default
    console.log("Profile image not available, using default", err);
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

    const { data } = await api.post(`/api/users/profile/upload-image`, formData, {
      headers: { 'Content-Type': undefined },
    });

    console.log('Upload response:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error uploading profile image:', err);
    return { success: false, error: 'Unable to upload image' };
  }
}

export const profileService = {
  getUserDetails,
  getUserById,
  getProfileImage,
  uploadProfileImage,
  updateUser,
};
