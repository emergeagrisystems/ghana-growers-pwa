export const adminDestinations = [
  {
    group: "Today",
    items: [
      { key: "today-operations", id: "analytics", label: "Operations Center", analyticsView: "operations" },
      { key: "today-notifications", id: "whatsapp-leads", label: "Notifications" }
    ]
  },
  {
    group: "Buyer Requests",
    items: [
      { key: "buyer-review", id: "buyer-requests", label: "Review Requests", produceRequestStatusFilter: "Pending Review" },
      { key: "buyer-matches", id: "match-opportunities", label: "Matches", sourcingQueueFilter: "All" },
      { key: "buyer-follow-ups", id: "lead-queue", label: "Follow-ups" },
      { key: "buyer-completed", id: "lead-queue", label: "Completed Requests" }
    ]
  },
  {
    group: "Network",
    items: [
      { key: "network-farmer-applications", id: "applications", label: "Farmer Applications", applicationTab: "farmer" },
      { key: "network-imported-farmers", id: "applications", label: "Imported Farmers Pending Review", applicationTab: "farmer" },
      { key: "network-supplier-applications", id: "applications", label: "Supplier Applications", applicationTab: "supplier" },
      { key: "network-contact-enquiries", id: "contact-enquiries", label: "Contact & Partnership Enquiries" },
      { key: "network-members", id: "farmers", label: "Members" },
      { key: "network-directories", id: "suppliers", label: "Directories" }
    ]
  },
  {
    group: "Marketplace",
    items: [
      { key: "marketplace-listings", id: "marketplace", label: "Listings" },
      { key: "marketplace-categories", id: "marketplace", label: "Categories" },
      { key: "marketplace-featured-listings", id: "featured-enquiries", label: "Featured Listings" }
    ]
  },
  {
    group: "Trust & Content",
    items: [
      { key: "trust-verification", id: "verifications", label: "Verification" },
      { key: "trust-gg-standard", id: "verifications", label: "GG Standard" },
      { key: "trust-featured-members", id: "featured-enquiries", label: "Featured Members" },
      { key: "trust-stories", id: "success-stories", label: "Stories" },
      { key: "trust-homepage", id: "learn", label: "Homepage" },
      { key: "trust-photography", id: "submissions", label: "Photography" },
      { key: "trust-learning", id: "learn", label: "Learning" }
    ]
  },
  {
    group: "Reports",
    items: [
      { key: "reports-reports", id: "analytics", label: "Reports", analyticsView: "analytics" },
      { key: "reports-analytics", id: "analytics", label: "Analytics", analyticsView: "analytics" },
      { key: "reports-launch-readiness", id: "launch-checklist", label: "Launch Readiness" }
    ]
  },
  {
    group: "Settings",
    items: [
      { key: "settings-users", id: "launch-checklist", label: "Users" },
      { key: "settings-roles", id: "launch-checklist", label: "Roles" },
      { key: "settings-permissions", id: "launch-checklist", label: "Permissions" },
      { key: "settings-integrations", id: "launch-checklist", label: "Integrations" }
    ]
  }
 ] as const;
