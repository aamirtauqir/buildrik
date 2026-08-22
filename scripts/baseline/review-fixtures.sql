-- Rows behind the review dead-link baselines. The state IS the row: /review
-- resolves the token and throws EXPIRED or REVOKED from it, so these two
-- screens cannot be reached by a URL alone.
--
-- Non-PENDING on purpose — review_requests_pending_unique permits exactly one
-- PENDING row per site and the demo site already has one.
--
-- requireLiveReview checks revokedAt BEFORE expiresAt, so a row that is both
-- renders as superseded, not expired. Keep them separate.
INSERT INTO review_requests
  (id, "siteId", "requestedById", status, "createdAt", "updatedAt", "expiresAt", "revokedAt", token, "invitedEmail")
VALUES
  ('bl_fixture_expired_0001', 'cmrtebwic000v718lctk4ox0y', 'cmrteaunh0000u80mnizm0rlx', 'CHANGES_REQUESTED',
   now() - interval '120 days', now() - interval '120 days', now() - interval '30 days', NULL,
   'blfixtureexpiredtoken0000000001', 'client@riverstone.example'),
  ('bl_fixture_revoked_0001', 'cmrtebwic000v718lctk4ox0y', 'cmrteaunh0000u80mnizm0rlx', 'CHANGES_REQUESTED',
   now() - interval '10 days', now() - interval '10 days', now() + interval '80 days', now() - interval '2 days',
   'blfixturerevokedtoken0000000001', 'client@riverstone.example')
ON CONFLICT (id) DO UPDATE
  SET "expiresAt" = EXCLUDED."expiresAt", "revokedAt" = EXCLUDED."revokedAt", token = EXCLUDED.token;
