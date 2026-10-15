# Product decisions (for client confirmation)

1. **Job board gate vs SEO.** The client requires a complete profile before accessing the job board; the brief also asks for search-engine-visible job pages. Resolution: the searchable board (`/jobs`) requires a signed-in candidate with a complete profile; individual job adverts are public and indexable (applying still requires a complete profile). Admin › Settings › "Show job adverts publicly" turns adverts private too (they then leave the sitemap and are noindexed).
2. **Profile-completion policy.** Required: full name, email, phone, state, headline/career interest, highest qualification (any level — SSCE, OND, HND, degree, etc.), at least one skill, and a CV (toggleable). NYSC status is optional and never blocks registration or applying.
3. **One application per vacancy**, enforced by the database. A withdrawn application can't be resubmitted for the same vacancy. Change on request.
4. **Statuses**: Submitted, Under review, Shortlisted, Interview, Successful, Not progressed (stored as UNSUCCESSFUL), Withdrawn (candidate only). Candidates see status history, not internal notes.
5. **Deadlines** are dates; applications close at the end of that day, Lagos time. Jobs past their deadline disappear from the board automatically.
6. **Employer names** are stored privately and shown only when the "authorised for publication" box is ticked; otherwise structured data names The Advancement Place.
7. **Email verification** is sent on registration but only enforced when `REQUIRE_EMAIL_VERIFICATION=true` (needs working SMTP).
8. **Freelance/outsourcing** is an enquiry service only — no bidding, contracts or payments, and the site says so.
9. **No fabricated content**: no statistics, testimonials, partner logos, staff photos, fees or employment guarantees. The trust section uses only verified facts (office address, hours, data handling).
10. **Header logo**: supplied mark + business name in text (lockup lettering is illegible at 40 px). Full supplied lockup is used on auth pages, About, and Open Graph.
