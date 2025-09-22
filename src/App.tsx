import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import StudentForm from "./components/StudentForm";
import StudentList from "./components/StudentList";
import { Student, UserCredentials } from "./types";
import {
  encryptStudentData,
  decryptStudentData,
  decryptData,
} from "./utils/crypto";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      fetchStudents();
    }
  }, [isLoggedIn]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("http://localhost:3001/students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleLogin = async (credentials: UserCredentials) => {
    try {
      console.log("🔄 Login attempt started for:", credentials.email);

      // Clear any previous errors
      setLoginError("");

      // 1. First check for admin login
      if (
        credentials.email === "admin@example.com" &&
        credentials.password === "admin123"
      ) {
        console.log("✅ Admin login successful");
        setIsLoggedIn(true);
        setCurrentUser({
          fullName: "Admin User",
          email: "admin@example.com",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "",
          address: "",
          courseEnrolled: "Administration",
          password: "",
        });
        navigate("/dashboard");
        return;
      }

      // 2. Student login
      console.log("🔍 Checking student login...");
      const response = await fetch("http://localhost:3001/students");
      const studentsData = await response.json();

      console.log("📊 Students in database:", studentsData);
      console.log("🔎 Looking for email:", credentials.email);

      // Find student by email (email is stored in plain text)
      const student = studentsData.find((s: any) => {
        console.log("Comparing with student email:", s.email);
        return s.email === credentials.email;
      });

      if (student) {
        console.log("✅ Student found:", student);
        console.log("🔐 Encrypted password in DB:", student.password);

        // Decrypt the stored password
        const decryptedPassword = decryptData(student.password);
        console.log("🔓 Decrypted password:", decryptedPassword);
        console.log("📝 Password provided:", credentials.password);

        if (decryptedPassword === credentials.password) {
          console.log("✅ Password matches! Logging in...");

          // Decrypt all student data for the session
          const decryptedStudent = decryptStudentData(student);
          console.log("👤 Decrypted student data:", decryptedStudent);

          setIsLoggedIn(true);
          setCurrentUser(decryptedStudent);
          setLoginError("");
          navigate("/dashboard");
        } else {
          console.log("❌ Password does not match");
          setLoginError("Invalid password. Please try again.");
        }
      } else {
        console.log("❌ No student found with this email");
        console.log(
          "Available emails:",
          studentsData.map((s: any) => s.email)
        );
        setLoginError(
          "No student found with this email. Please register first."
        );
      }
    } catch (error) {
      console.error("🚨 Login error:", error);
      setLoginError(
        "Login failed. Please check your connection and try again."
      );
    }
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudents([]);
    setEditingStudent(null);
    setCurrentUser(null);
    navigate("/");
  };

  const handleCreateStudent = async (student: Student) => {
    try {
      // Encrypt the student data (except email which remains plain text for login)
      const encryptedStudent = encryptStudentData(student);

      const response = await fetch("http://localhost:3001/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(encryptedStudent),
      });

      if (response.ok) {
        if (isLoggedIn && currentUser?.email === "admin@example.com") {
          // Admin adding student - stay on dashboard
          alert("Student added successfully!");
          navigate("/dashboard");
        } else {
          // New registration - go to login
          alert("Registration successful! Please login with your credentials.");
          navigate("/");
        }
        fetchStudents();
      }
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Registration failed. Please try again.");
    }
  };
  const handleUpdateStudent = async (student: Student) => {
    try {
      console.log("🔄 Starting student update...");
      console.log("📝 Student data to update:", student);

      if (!student.id) {
        console.error("❌ Student ID is missing");
        alert("Error: Student ID is missing");
        return;
      }

      // Encrypt the updated student data
      const encryptedStudent = encryptStudentData(student);
      console.log("🔐 Encrypted student data for update:", encryptedStudent);

      const response = await fetch(
        `http://localhost:3001/students/${student.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(encryptedStudent),
        }
      );

      if (response.ok) {
        console.log("✅ Student updated successfully");
        const updatedStudent = await response.json();
        console.log("📊 Updated student from server:", updatedStudent);

        setEditingStudent(null);
        fetchStudents(); // Refresh the student list
        navigate("/dashboard");
        alert("Student updated successfully!");
      } else {
        console.error("❌ Failed to update student. Status:", response.status);
        alert("Failed to update student. Please try again.");
      }
    } catch (error) {
      console.error("🚨 Error updating student:", error);
      alert(
        "Error updating student. Please check your connection and try again."
      );
    }
  };
  const handleDeleteStudent = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/students/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchStudents();
      }
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // Add this useEffect to debug what's in the database
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch("http://localhost:3001/students");
        const students = await response.json();
        console.log("🔍 CURRENT DATABASE CONTENTS:", students);
      } catch (error) {
        console.error("Error checking database:", error);
      }
    };

    checkDatabase();
  }, []);
  return (
    <div className="App">
      <Routes>
        {/* Login Route */}
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <LoginForm
                onLogin={handleLogin}
                onNavigateToRegister={() => navigate("/register-student")}
                error={loginError}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Registration Route - Allow both new registration and admin adding students */}
        <Route
          path="/register-student"
          element={
            !isLoggedIn || currentUser?.email === "admin@example.com" ? (
              <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-8">
                    <button
                      onClick={() => navigate(isLoggedIn ? "/dashboard" : "/")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isLoggedIn ? "Back to Dashboard" : "Back to Login"}
                    </button>
                  </div>
                  <StudentForm
                    student={null}
                    onSubmit={handleCreateStudent}
                    onCancel={() => navigate(isLoggedIn ? "/dashboard" : "/")}
                    isAdmin={
                      isLoggedIn && currentUser?.email === "admin@example.com"
                    }
                  />
                </div>
              </div>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <div className="min-h-screen bg-gray-100">
                <header className="bg-white shadow">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        Student Management System
                      </h1>
                      <p className="text-sm text-gray-600">
                        Welcome, {currentUser?.fullName} (
                        {currentUser?.email === "admin@example.com"
                          ? "Admin"
                          : "Student"}
                        )
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Logout
                    </button>
                  </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                      {currentUser?.email === "admin@example.com"
                        ? "All Students"
                        : "Your Information"}
                    </h2>
                    {currentUser?.email === "admin@example.com" && (
                      <button
                        onClick={() => navigate("/register-student")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add New Student
                      </button>
                    )}
                  </div>
                  <StudentList
                    students={
                      currentUser?.email === "admin@example.com"
                        ? students
                        : students.filter((s) => {
                            // For regular students, we need to decrypt to compare emails
                            try {
                              const decryptedStudent = decryptStudentData(s);
                              return (
                                decryptedStudent.email === currentUser?.email
                              );
                            } catch (error) {
                              return false;
                            }
                          })
                    }
                    onEdit={(student) => {
                      console.log(
                        "✏️ Edit button clicked for student:",
                        student
                      );
                      // Make sure we're passing the original encrypted student data, not decrypted
                      const originalStudent = students.find(
                        (s) => s.id === student.id
                      );
                      if (originalStudent) {
                        setEditingStudent(originalStudent);
                        navigate("/edit-student");
                      } else {
                        console.error(
                          "❌ Original student not found for editing"
                        );
                      }
                    }}
                    onDelete={handleDeleteStudent}
                  />
                </main>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Edit Student Route */}
        <Route
          path="/edit-student"
          element={
            isLoggedIn && editingStudent ? (
              <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-8">
                    <button
                      onClick={() => {
                        setEditingStudent(null);
                        navigate("/dashboard");
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                  <StudentForm
                    student={editingStudent}
                    onSubmit={handleUpdateStudent}
                    onCancel={() => {
                      setEditingStudent(null);
                      navigate("/dashboard");
                    }}
                    isAdmin={currentUser?.email === "admin@example.com"}
                  />
                </div>
              </div>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;
