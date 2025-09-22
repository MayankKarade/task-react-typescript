export interface Student {
  id?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  password: string;
}

export interface EncryptedStudent {
  id?: number;
  fullName: string;
  email: string; // Encrypted
  phoneNumber: string; // Encrypted
  dateOfBirth: string;
  gender: string;
  address: string; // Encrypted
  courseEnrolled: string;
  password: string; // Encrypted
}

export interface UserCredentials {
  email: string;
  password: string;
}
