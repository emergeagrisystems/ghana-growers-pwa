# Profile Application Media Remediation Plan

This plan is intentionally inactive. It does not move, delete, or rewrite any production object or database reference.

## Scope

- Candidate application uploads currently stored in public `farmers` or `suppliers` buckets.
- Private destination buckets created by `20260723035406_profile_applications_and_private_media.sql`.
- Database references that can be linked to an application or profile only after an administrator confirms ownership.

The production-specific object inventory is kept outside version control under `supabase/.temp/profile_application_media_remediation.md`. It contains object paths and aggregate metadata, but no signed URLs or file contents.

## Controlled Sequence

For each manually approved object:

1. Confirm the owning application or profile and the intended media role.
2. Copy the object to a deterministic path in the appropriate private application bucket.
3. Verify destination size, MIME type, checksum, and private bucket state.
4. Update only the confirmed application reference to the private object path.
5. Verify the Admin preview through a signed, authenticated server response.
6. Confirm no public DTO or page contains the private path.
7. Remove the old public object only after a separate, explicit approval and a successful backup check.

Retries must reuse the same destination path. A copy is complete only when source and destination checksums match. A database update must not occur before copy verification, and a source object must not be removed before both the reference and private preview are verified.

## Safety Rules

- Never infer ownership from a filename alone.
- Never copy certificates or documents to a public profile bucket.
- Never store signed URLs; store private bucket object paths.
- Do not automatically publish, activate, verify, feature, or convert a profile.
- Keep an audit record of the administrator, source path, destination path, checksum, and verification time when remediation is eventually approved.
