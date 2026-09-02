import { Routes, Route, Navigate } from "react-router-dom";

import { MODULES } from "./config/modules";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import CandidatesPage from "./features/candidates/CandidatesPage";
import CandidateDetailPage from "./features/candidates/CandidateDetailPage";
import ComparePage from "./features/candidates/ComparePage";
import DuplicatesPage from "./features/candidates/DuplicatesPage";
import SettingsPage from "./features/settings/SettingsPage";
import ActivityPage from "./features/activity/ActivityPage";
import GuidePage from "./features/guide/GuidePage";

import JobsPage from "./features/jobs/JobsPage";
import JobDetailPage from "./features/jobs/JobDetailPage";
import PipelinePage from "./features/pipeline/PipelinePage";
import InterviewsPage from "./features/interviews/InterviewsPage";
import ReportsPage from "./features/reports/ReportsPage";
import SourcingPage from "./features/sourcing/SourcingPage";
import OffersPage from "./features/offers/OffersPage";
import PoolsPage from "./features/pools/PoolsPage";

import PortalLayout from "./features/portal/PortalLayout";
import PortalJobsPage from "./features/portal/PortalJobsPage";
import PortalJobDetailPage from "./features/portal/PortalJobDetailPage";

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {MODULES.portal && (
                <Route path="/careers" element={<PortalLayout />}>
                    <Route index element={<PortalJobsPage />} />
                    <Route path=":slug" element={<PortalJobDetailPage />} />
                </Route>
            )}

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/candidates" element={<CandidatesPage />} />
                <Route path="/candidates/compare" element={<ComparePage />} />
                <Route path="/candidates/duplicates" element={<DuplicatesPage />} />
                <Route path="/candidates/:id" element={<CandidateDetailPage />} />
                <Route path="/pools" element={<PoolsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {MODULES.jobs && (
                    <>
                        <Route path="/jobs" element={<JobsPage />} />
                        <Route path="/jobs/:slug" element={<JobDetailPage />} />
                    </>
                )}
                {MODULES.pipeline && (
                    <>
                        <Route path="/pipeline" element={<PipelinePage />} />
                        <Route path="/offers" element={<OffersPage />} />
                    </>
                )}
                {MODULES.interviews && (
                    <Route path="/interviews" element={<InterviewsPage />} />
                )}
                {MODULES.reports && (
                    <Route path="/reports" element={<ReportsPage />} />
                )}
                {MODULES.sourcing && (
                    <Route path="/sourcing" element={<SourcingPage />} />
                )}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
