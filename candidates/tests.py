from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import (
    Application,
    Candidate,
    Interview,
    Job,
    JobTemplate,
    Offer,
    PipelineStage,
    ScorecardTemplate,
    Tag,
    TalentPool,
)


class AuthTests(APITestCase):
    def test_register_and_login(self):
        res = self.client.post(
            "/api/auth/register/",
            {"username": "amir", "password": "Sup3rSecret!42", "email": "a@a.com"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)

        res = self.client.post(
            "/api/auth/token/",
            {"username": "amir", "password": "Sup3rSecret!42"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)

    def test_protected_endpoint_requires_auth(self):
        self.assertEqual(self.client.get("/api/candidates/").status_code, 401)


class RecruitmentFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("recruiter", password="pw12345678")
        self.client.force_authenticate(self.user)
        self.s1 = PipelineStage.objects.create(name="New", order=1, kind="active")
        self.s2 = PipelineStage.objects.create(name="Interview", order=2, kind="active")
        self.hired = PipelineStage.objects.create(name="Hired", order=3, kind="won")
        self.job = Job.objects.create(title="Backend Dev", status="open")

    def test_create_candidate_with_nested(self):
        res = self.client.post(
            "/api/candidates/",
            {
                "first_name": "Sara",
                "last_name": "K",
                "email": "sara@example.com",
                "skills": [{"name": "Python", "level": "Expert"}],
                "work_experiences": [
                    {"company_name": "Acme", "position": "Dev", "start_date": "2021-01-01"}
                ],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        cand = Candidate.objects.get(email="sara@example.com")
        self.assertEqual(cand.skills.count(), 1)
        self.assertEqual(cand.work_experiences.count(), 1)

    def test_application_move_updates_status_and_history(self):
        cand = Candidate.objects.create(first_name="A", last_name="B", email="ab@x.com")
        app = Application.objects.create(candidate=cand, job=self.job, stage=self.s1)

        res = self.client.post(
            f"/api/applications/{app.id}/move/",
            {"stage_id": self.hired.id, "note": "great fit"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        app.refresh_from_db()
        self.assertEqual(app.stage, self.hired)
        self.assertEqual(app.status, Application.STATUS_HIRED)
        self.assertEqual(app.stage_history.count(), 1)

    def test_dashboard_stats(self):
        Candidate.objects.create(first_name="A", last_name="B", email="ab@x.com")
        res = self.client.get("/api/stats/dashboard/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["total_candidates"], 1)
        self.assertEqual(res.data["open_jobs"], 1)

    def test_job_board_groups_by_stage(self):
        cand = Candidate.objects.create(first_name="A", last_name="B", email="ab@x.com")
        Application.objects.create(candidate=cand, job=self.job, stage=self.s2)
        res = self.client.get(f"/api/jobs/{self.job.slug}/board/")
        self.assertEqual(res.status_code, 200)
        cols = {c["stage"]["name"]: len(c["applications"]) for c in res.data["columns"]}
        self.assertEqual(cols["Interview"], 1)
        self.assertEqual(cols["New"], 0)


class SourcingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("rec", password="pw12345678")
        self.client.force_authenticate(self.user)

    def test_only_candidate_providers_registered(self):
        res = self.client.get("/api/sourcing/providers/")
        slugs = [p["slug"] for p in res.data]
        self.assertIn("github", slugs)
        self.assertIn("stackoverflow", slugs)
        self.assertIn("devto", slugs)
        self.assertIn("demo-candidates", slugs)
        # job providers are gone from رزومه‌بان
        self.assertNotIn("jobvision", slugs)
        self.assertNotIn("remotive", slugs)

    def test_demo_candidate_search_import_and_bulk(self):
        res = self.client.post(
            "/api/sourcing/search/",
            {
                "provider": "demo-candidates",
                "query": {"role": "Data Engineer", "count": 4},
                "save_as": "Data engineers",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 4)
        self.assertIsNotNone(res.data["saved_search"])

        result_id = res.data["results"][0]["id"]
        imp = self.client.post(f"/api/sourcing/results/{result_id}/import/")
        self.assertEqual(imp.status_code, 201)
        self.assertEqual(imp.data["kind"], "candidate")
        self.assertEqual(Candidate.objects.count(), 1)

        again = self.client.post(f"/api/sourcing/results/{result_id}/import/")
        self.assertEqual(again.status_code, 400)

        ids = [r["id"] for r in res.data["results"][1:4]]
        bulk = self.client.post(
            "/api/sourcing/results/bulk-import/", {"ids": ids}, format="json"
        )
        self.assertEqual(bulk.data["imported"], 3)
        self.assertEqual(Candidate.objects.count(), 4)


class CandidateBankTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("rec", password="pw12345678")
        self.client.force_authenticate(self.user)
        self.tag = Tag.objects.create(name="Senior", color="blue")
        self.a = Candidate.objects.create(
            first_name="A", last_name="One", email="a@x.com", rating=5, source="linkedin"
        )
        self.b = Candidate.objects.create(
            first_name="B", last_name="Two", email="b@x.com", rating=2, source="referral"
        )

    def test_rating_and_source_filters(self):
        res = self.client.get("/api/candidates/?rating__gte=4")
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["email"], "a@x.com")

        res = self.client.get("/api/candidates/?source=referral")
        self.assertEqual(res.data["count"], 1)

    def test_bulk_tag_and_delete(self):
        res = self.client.post(
            "/api/candidates/bulk_tag/",
            {"ids": [self.a.id, self.b.id], "tag_ids": [self.tag.id]},
            format="json",
        )
        self.assertEqual(res.data["updated"], 2)
        self.assertIn(self.tag, self.a.tags.all())

        res = self.client.get(f"/api/candidates/?tags={self.tag.id}")
        self.assertEqual(res.data["count"], 2)

        res = self.client.post(
            "/api/candidates/bulk_delete/", {"ids": [self.b.id]}, format="json"
        )
        self.assertEqual(res.data["deleted"], 1)
        self.assertFalse(Candidate.objects.filter(id=self.b.id).exists())

    def test_csv_export_respects_filters(self):
        res = self.client.get("/api/candidates/export/?rating__gte=4")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "text/csv; charset=utf-8-sig")
        body = res.content.decode("utf-8-sig")
        self.assertIn("a@x.com", body)
        self.assertNotIn("b@x.com", body)

    def test_candidate_stats_endpoint(self):
        res = self.client.get("/api/stats/candidates/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["total_candidates"], 2)
        self.assertEqual(len(res.data["candidates_trend"]), 30)

    def test_detail_exposes_applications(self):
        job = Job.objects.create(title="Role", status="open")
        stage = PipelineStage.objects.create(name="New", order=1, kind="active")
        Application.objects.create(candidate=self.a, job=job, stage=stage)
        res = self.client.get(f"/api/candidates/{self.a.id}/")
        self.assertEqual(len(res.data["applications"]), 1)
        self.assertEqual(res.data["applications"][0]["job_title"], "Role")

    def test_duplicate_detection_and_merge(self):
        dup = Candidate.objects.create(
            first_name="A", last_name="One-dup", email="A@X.COM", rating=4
        )
        res = self.client.get("/api/candidates/duplicates/")
        self.assertEqual(res.data["count"], 1)
        group_ids = {c["id"] for c in res.data["groups"][0]["candidates"]}
        self.assertEqual(group_ids, {self.a.id, dup.id})

        job = Job.objects.create(title="R", status="open")
        Application.objects.create(candidate=dup, job=job)
        res = self.client.post(
            f"/api/candidates/{self.a.id}/merge/", {"source": dup.id}, format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertFalse(Candidate.objects.filter(id=dup.id).exists())
        self.assertEqual(self.a.applications.count(), 1)
        self.a.refresh_from_db()
        self.assertEqual(self.a.rating, 5)  # max(5, 4)

    def test_csv_import(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        csv = (
            "first_name,last_name,email\n"
            "Sara,Karimi,sara.import@x.com\n"
            "Dup,Row,a@x.com\n"
            ",,\n"
        ).encode("utf-8")
        res = self.client.post(
            "/api/candidates/import_csv/",
            {"file": SimpleUploadedFile("c.csv", csv, content_type="text/csv")},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["created"], 1)
        self.assertEqual(res.data["skipped"], 1)  # a@x.com already exists
        self.assertEqual(len(res.data["errors"]), 1)  # the blank row
        self.assertTrue(
            Candidate.objects.filter(email="sara.import@x.com").exists()
        )


class OfferPoolScorecardTemplateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("rec", password="pw12345678")
        self.client.force_authenticate(self.user)
        self.won = PipelineStage.objects.create(name="Hired", order=9, kind="won")
        self.job = Job.objects.create(title="Backend", status="open")
        self.cand = Candidate.objects.create(
            first_name="Sara", last_name="K", email="sara@x.com"
        )
        self.app = Application.objects.create(candidate=self.cand, job=self.job)

    def test_offer_lifecycle(self):
        res = self.client.post(
            "/api/offers/",
            {"application": self.app.id, "title": "Backend Dev", "salary": 50_000_000},
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        offer_id = res.data["id"]
        self.assertEqual(res.data["status"], "draft")

        res = self.client.post(f"/api/offers/{offer_id}/send/")
        self.assertEqual(res.data["status"], "sent")
        self.assertIsNotNone(res.data["sent_at"])

        res = self.client.post(f"/api/offers/{offer_id}/accept/")
        self.assertEqual(res.data["status"], "accepted")
        self.app.refresh_from_db()
        self.assertEqual(self.app.status, Application.STATUS_HIRED)
        self.assertEqual(self.app.stage, self.won)

    def test_talent_pool_add_remove(self):
        res = self.client.post(
            "/api/talent-pools/", {"name": "High potential"}, format="json"
        )
        pid = res.data["id"]
        self.client.post(
            f"/api/talent-pools/{pid}/add/",
            {"candidate_ids": [self.cand.id]},
            format="json",
        )
        res = self.client.get(f"/api/talent-pools/{pid}/")
        self.assertEqual(len(res.data["candidates"]), 1)
        self.client.post(
            f"/api/talent-pools/{pid}/remove/",
            {"candidate_ids": [self.cand.id]},
            format="json",
        )
        self.assertEqual(TalentPool.objects.get(id=pid).candidates.count(), 0)

    def test_scorecard_and_interview_criteria(self):
        sc = ScorecardTemplate.objects.create(
            name="فنی", criteria=[{"label": "دانش", "weight": 2}]
        )
        iv = Interview.objects.create(
            application=self.app,
            scheduled_at=timezone.now() + timedelta(days=1),
        )
        res = self.client.patch(
            f"/api/interviews/{iv.id}/",
            {"scorecard": sc.id, "criteria_scores": {"دانش": 4}, "score": 4},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)
        iv.refresh_from_db()
        self.assertEqual(iv.scorecard, sc)
        self.assertEqual(iv.criteria_scores["دانش"], 4)

    def test_job_template_crud(self):
        res = self.client.post(
            "/api/job-templates/",
            {"name": "بک‌اند", "title": "توسعه‌دهندهٔ بک‌اند", "description": "..."},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(JobTemplate.objects.count(), 1)

    def test_stage_move_can_notify(self):
        from django.core import mail

        stage = PipelineStage.objects.create(name="مصاحبه", order=2, kind="active")
        res = self.client.post(
            f"/api/applications/{self.app.id}/move/",
            {"stage_id": stage.id, "notify": True},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.cand.email, mail.outbox[0].to)


class TaskRequisitionTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user("mgr", password="pw12345678")
        self.admin = User.objects.create_user(
            "boss", password="pw12345678", is_staff=True, email="boss@x.com"
        )
        self.client.force_authenticate(self.manager)

    def test_task_autoassigns_and_toggles(self):
        res = self.client.post("/api/tasks/", {"title": "پیگیری"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["assignee"]["username"], "mgr")
        tid = res.data["id"]
        res = self.client.post(f"/api/tasks/{tid}/toggle/")
        self.assertTrue(res.data["done"])
        self.assertIsNotNone(res.data["done_at"])

        res = self.client.get("/api/tasks/?mine=true")
        self.assertEqual(res.data["count"], 1)

    def test_requisition_submit_review_and_scoping(self):
        from django.core import mail

        res = self.client.post(
            "/api/requisitions/",
            {"title": "کارشناس", "headcount": 2, "reason": "رشد", "submit": True},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["status"], "submitted")
        req_id = res.data["id"]
        self.assertTrue(any("درخواست جذب" in m.subject for m in mail.outbox))

        # the manager (non-staff) can only see their own
        self.assertEqual(self.client.get("/api/requisitions/").data["count"], 1)

        # admin reviews & converts to a job
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            f"/api/requisitions/{req_id}/approve/",
            {"note": "ok", "create_job": True},
            format="json",
        )
        self.assertEqual(res.data["status"], "approved")
        self.assertIsNotNone(res.data["job"])
        self.assertTrue(Job.objects.filter(title="کارشناس", status="draft").exists())

    def test_reports_include_funnel_and_export(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/stats/reports/")
        for key in ("funnel", "time_in_stage", "source_effectiveness"):
            self.assertIn(key, res.data)
        exp = self.client.get("/api/stats/reports/export/")
        self.assertEqual(exp.status_code, 200)
        self.assertIn("text/csv", exp["Content-Type"])

    def test_interview_ics_and_note_mention(self):
        from django.core import mail

        job = Job.objects.create(title="R", status="open")
        cand = Candidate.objects.create(
            first_name="C", last_name="D", email="cd@x.com"
        )
        app = Application.objects.create(candidate=cand, job=job)
        iv = Interview.objects.create(
            application=app, scheduled_at=timezone.now() + timedelta(days=1)
        )
        res = self.client.get(f"/api/interviews/{iv.id}/ics/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"BEGIN:VCALENDAR", res.content)

        mail.outbox.clear()
        res = self.client.post(
            f"/api/candidates/{cand.id}/notes/",
            {"body": "لطفاً @boss این را ببیند"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(any("منشن" in m.subject for m in mail.outbox))


class PublicPortalTests(APITestCase):
    def setUp(self):
        PipelineStage.objects.create(name="New", order=1, kind="active")
        self.open_job = Job.objects.create(title="Open Role", status="open")
        self.draft_job = Job.objects.create(title="Draft Role", status="draft")

    def test_public_jobs_only_lists_open(self):
        res = self.client.get("/api/public/jobs/")
        self.assertEqual(res.status_code, 200)
        titles = [j["title"] for j in res.data["results"]]
        self.assertIn("Open Role", titles)
        self.assertNotIn("Draft Role", titles)

    def test_public_apply_creates_candidate_and_application(self):
        res = self.client.post(
            "/api/public/apply/",
            {
                "job": self.open_job.slug,
                "first_name": "Web",
                "last_name": "Applicant",
                "email": "web@applicant.com",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(Candidate.objects.filter(email="web@applicant.com").exists())
        self.assertEqual(Application.objects.count(), 1)

    def test_public_apply_rejects_duplicate(self):
        payload = {
            "job": self.open_job.slug,
            "first_name": "Web",
            "last_name": "Applicant",
            "email": "web@applicant.com",
        }
        self.client.post("/api/public/apply/", payload, format="json")
        res = self.client.post("/api/public/apply/", payload, format="json")
        self.assertEqual(res.status_code, 400)
