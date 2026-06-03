import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadChatImage({ userId, chatRoomId, file }) {
  const fileName = `${userId}-${Date.now()}.jpg`;
  const storageRef = ref(storage, `chat_images/${chatRoomId}/${fileName}`);
  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return getDownloadURL(storageRef);
}
