"use client";

/**
 * Public profile projection (v1.6, Week 5). Read-only capability profile.
 *
 * Frozen build: reads browser-local data (works when the owner previews their
 * own public page). Real cross-viewer capabilities come from Cyprian's
 * profile_capability_scores endpoint keyed by the [slug] param.
 * TODO(cyprian): fetch public profile + scores by slug for real cross-viewer.
 */
import { CapabilityProfile } from "@/components/profile/capability-profile";

export default function PublicProfilePage() {
  return <CapabilityProfile mode="public" />;
}
