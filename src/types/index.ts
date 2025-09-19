export interface Student {
  id?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  courseEnrolled: string;
  password: string; // This will be stored encrypted
}

export interface UserCredentials {
  email: string;
  password: string;
}
