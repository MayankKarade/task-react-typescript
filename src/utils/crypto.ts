import CryptoJS from "crypto-js";

const SECRET_KEY = "student-management-secret-key-2024";

export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return data; // Return original data if encryption fails
  }
};

export const decryptData = (cipherText: string): string => {
  try {
    if (!cipherText || !cipherText.includes("U2FsdGVkX1")) {
      return cipherText; // Return as-is if not encrypted
    }

    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText; // Return original if decryption fails
  } catch (error) {
    console.error("Decryption error:", error);
    return cipherText; // Return original if decryption fails
  }
};

// Store email in plain text, encrypt everything else
export const encryptStudentData = (student: any) => {
  return {
    ...student,
    fullName: encryptData(student.fullName),
    phoneNumber: encryptData(student.phoneNumber),
    dateOfBirth: encryptData(student.dateOfBirth),
    gender: encryptData(student.gender),
    address: encryptData(student.address),
    courseEnrolled: encryptData(student.courseEnrolled),
    password: encryptData(student.password),
    // Email is kept as plain text intentionally
  };
};

export const decryptStudentData = (student: any) => {
  return {
    ...student,
    fullName: decryptData(student.fullName),
    phoneNumber: decryptData(student.phoneNumber),
    dateOfBirth: decryptData(student.dateOfBirth),
    gender: decryptData(student.gender),
    address: decryptData(student.address),
    courseEnrolled: decryptData(student.courseEnrolled),
    password: decryptData(student.password),
  };
};
