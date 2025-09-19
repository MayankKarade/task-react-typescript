import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import StudentForm from "./components/StudentForm";
import StudentList from "./components/StudentList";
import { Student, UserCredentials } from "./types";
import { decryptData } from "./utils/crypto";

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
      if (
        credentials.email === "admin@example.com" &&
        credentials.password === "admin123"
      ) {
        setIsLoggedIn(true);
        setLoginError("");
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

      const studentsResponse = await fetch("http://localhost:3001/students");
      const studentsData = await studentsResponse.json();

      const student = studentsData.find(
        (s: Student) => s.email === credentials.email
      );

      if (student) {
        const decryptedPassword = decryptData(student.password);
        if (decryptedPassword === credentials.password) {
          setIsLoggedIn(true);
          setLoginError("");
          setCurrentUser(student);
          navigate("/dashboard");
          return;
        }
      }

      setLoginError(
        "Invalid credentials. Use admin@example.com / admin123 for admin access, or register as a student first."
      );
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Login failed. Please try again.");
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
      const response = await fetch("http://localhost:3001/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      });

      if (response.ok) {
        alert("Registration successful! Please login with your credentials.");
        navigate("/");
        fetchStudents();
      }
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Registration failed. Please try again.");
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    try {
      const response = await fetch(
        `http://localhost:3001/students/${student.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(student),
        }
      );

      if (response.ok) {
        setEditingStudent(null);
        fetchStudents();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error updating student:", error);
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

        {/* Registration Route */}
        <Route
          path="/register-student"
          element={
            !isLoggedIn ? (
              <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-8">
                    <button
                      onClick={() => navigate("/")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Back to Login
                    </button>
                  </div>
                  <StudentForm
                    student={null}
                    onSubmit={handleCreateStudent}
                    onCancel={() => navigate("/")}
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
                        : students.filter((s) => s.email === currentUser?.email)
                    }
                    onEdit={(student) => {
                      setEditingStudent(student);
                      navigate("/edit-student");
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
