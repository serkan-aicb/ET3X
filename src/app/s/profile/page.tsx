"use client";

// Week 5: the student's own Final Profile Studio (v1.6, capabilities-driven).
// Replaces the pre-v1.6 ProfilePage (which stays for the educator profile).
import { CapabilityProfile } from "@/components/profile/capability-profile";

export default function StudentProfile() {
  return <CapabilityProfile mode="owner" />;
}
