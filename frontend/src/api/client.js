import api, { API_BASE } from "./axios";

export { API_BASE };

// Media URLs come back as absolute in DEBUG; keep a helper just in case.
const ORIGIN = API_BASE.replace(/\/api\/?$/, "");
export function mediaUrl(path) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${ORIGIN}${path}`;
}

const unwrap = (res) => res.data;
const list = (res) => (Array.isArray(res.data) ? res.data : res.data.results);

// --------------------------------------------------------------------------- //
export const authApi = {
    login: (username, password) =>
        api.post("auth/token/", { username, password }).then(unwrap),
    register: (payload) => api.post("auth/register/", payload).then(unwrap),
    me: () => api.get("auth/me/").then(unwrap),
    updateProfile: (payload) => api.patch("auth/profile/", payload).then(unwrap),
    changePassword: (payload) =>
        api.post("auth/change-password/", payload).then(unwrap),
    team: () => api.get("team/").then(unwrap),
};

export const candidatesApi = {
    list: (params) => api.get("candidates/", { params }).then(unwrap),
    get: (id) => api.get(`candidates/${id}/`).then(unwrap),
    create: (data) => api.post("candidates/", data).then(unwrap),
    update: (id, data) => api.patch(`candidates/${id}/`, data).then(unwrap),
    uploadFiles: (id, formData) =>
        api
            .patch(`candidates/${id}/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(unwrap),
    remove: (id) => api.delete(`candidates/${id}/`),
    bulkTag: (ids, tag_ids) =>
        api.post("candidates/bulk_tag/", { ids, tag_ids }).then(unwrap),
    bulkDelete: (ids) =>
        api.post("candidates/bulk_delete/", { ids }).then(unwrap),
    export: (params) =>
        api.get("candidates/export/", { params, responseType: "blob" }),
    duplicates: () => api.get("candidates/duplicates/").then(unwrap),
    merge: (id, source) =>
        api.post(`candidates/${id}/merge/`, { source }).then(unwrap),
    importCsv: (formData) =>
        api
            .post("candidates/import_csv/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(unwrap),
    rate: (id, rating) =>
        api.post(`candidates/${id}/rate/`, { rating }).then(unwrap),
    toggleFavorite: (id) =>
        api.post(`candidates/${id}/toggle_favorite/`).then(unwrap),
    notes: (id) => api.get(`candidates/${id}/notes/`).then(unwrap),
    addNote: (id, body) =>
        api.post(`candidates/${id}/notes/`, { body }).then(unwrap),
    activity: (id) => api.get(`candidates/${id}/activity/`).then(unwrap),
};

export const jobsApi = {
    list: (params) => api.get("jobs/", { params }).then(unwrap),
    get: (slug) => api.get(`jobs/${slug}/`).then(unwrap),
    create: (data) => api.post("jobs/", data).then(unwrap),
    update: (slug, data) => api.patch(`jobs/${slug}/`, data).then(unwrap),
    remove: (slug) => api.delete(`jobs/${slug}/`),
    board: (slug) => api.get(`jobs/${slug}/board/`).then(unwrap),
    applications: (slug, params) =>
        api.get(`jobs/${slug}/applications/`, { params }).then(unwrap),
};

export const applicationsApi = {
    list: (params) => api.get("applications/", { params }).then(unwrap),
    get: (id) => api.get(`applications/${id}/`).then(unwrap),
    create: (data) => api.post("applications/", data).then(unwrap),
    update: (id, data) => api.patch(`applications/${id}/`, data).then(unwrap),
    move: (id, stageId, note) =>
        api.post(`applications/${id}/move/`, { stage_id: stageId, note }).then(unwrap),
    reject: (id, reason) =>
        api.post(`applications/${id}/reject/`, { reason }).then(unwrap),
};

export const interviewsApi = {
    list: (params) => api.get("interviews/", { params }).then(unwrap),
    get: (id) => api.get(`interviews/${id}/`).then(unwrap),
    create: (data) => api.post("interviews/", data).then(unwrap),
    update: (id, data) => api.patch(`interviews/${id}/`, data).then(unwrap),
    remove: (id) => api.delete(`interviews/${id}/`),
};

export const metaApi = {
    stages: () => api.get("pipeline-stages/").then(unwrap),
    createStage: (data) => api.post("pipeline-stages/", data).then(unwrap),
    updateStage: (id, data) => api.patch(`pipeline-stages/${id}/`, data).then(unwrap),
    removeStage: (id) => api.delete(`pipeline-stages/${id}/`),
    departments: () => api.get("departments/").then(unwrap),
    createDepartment: (data) => api.post("departments/", data).then(unwrap),
    removeDepartment: (id) => api.delete(`departments/${id}/`),
    tags: () => api.get("tags/").then(unwrap),
    createTag: (data) => api.post("tags/", data).then(unwrap),
    removeTag: (id) => api.delete(`tags/${id}/`),
};

export const activityApi = {
    list: (params) => api.get("activity/", { params }).then(unwrap),
};

export const sourcingApi = {
    providers: (kind) =>
        api.get("sourcing/providers/", { params: { kind } }).then(unwrap),
    search: (payload) => api.post("sourcing/search/", payload).then(unwrap),
    results: (params) =>
        api.get("sourcing/results/", { params }).then(unwrap),
    savedSearches: () => api.get("sourcing/saved-searches/").then(unwrap),
    createSavedSearch: (data) =>
        api.post("sourcing/saved-searches/", data).then(unwrap),
    removeSavedSearch: (id) => api.delete(`sourcing/saved-searches/${id}/`),
    runSavedSearch: (id) =>
        api.post(`sourcing/saved-searches/${id}/run/`).then(unwrap),
    importResult: (id) =>
        api.post(`sourcing/results/${id}/import/`).then(unwrap),
    bulkImport: (ids) =>
        api.post("sourcing/results/bulk-import/", { ids }).then(unwrap),
    dismissResult: (id) =>
        api.post(`sourcing/results/${id}/dismiss/`).then(unwrap),
};

export const statsApi = {
    dashboard: () => api.get("stats/dashboard/").then(unwrap),
    candidates: () => api.get("stats/candidates/").then(unwrap),
    reports: () => api.get("stats/reports/").then(unwrap),
};

export const publicApi = {
    jobs: (params) => api.get("public/jobs/", { params }).then(list),
    job: (slug) => api.get(`public/jobs/${slug}/`).then(unwrap),
    apply: (formData) =>
        api
            .post("public/apply/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then(unwrap),
};
