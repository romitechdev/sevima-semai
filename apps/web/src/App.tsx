import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateQuizPage } from "./pages/CreateQuizPage";
import { CreateMaterialPage } from "./pages/CreateMaterialPage";
import { EssayGraderPage } from "./pages/EssayGraderPage";
import { DocumentPage } from "./pages/DocumentPage";
import { AssessmentPage } from "./pages/AssessmentPage";
import { GradebookPage } from "./pages/GradebookPage";
import { TakeQuizPage } from "./pages/TakeQuizPage";
import { MonitorQuizPage } from "./pages/MonitorQuizPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/trpc",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/quiz/:code" element={<TakeQuizPage />} />
              <Route path="/quiz" element={<TakeQuizPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreateQuizPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/material"
                element={
                  <ProtectedRoute>
                    <CreateMaterialPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/essay"
                element={
                  <ProtectedRoute>
                    <EssayGraderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <DocumentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assessment"
                element={
                  <ProtectedRoute>
                    <AssessmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gradebook"
                element={
                  <ProtectedRoute>
                    <GradebookPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monitor/:id"
                element={
                  <ProtectedRoute>
                    <MonitorQuizPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
