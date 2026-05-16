---
when: 2026-05-16
who: CC
purpose: Plain-language question sheet for Samantha, derived from the Sam Scheduling OS PRD §5 Group A. Russell sends/asks these; answers unblock the v2 build.
venture: tidy-tails
audience: Samantha (via Russell — text message or a quick call)
source: _reports/2026-05-16-sam-scheduling-os-prd.md §5 Group A
---

# A few questions for Samantha — new Tidy Tails app

Hi Sam — Russell is building the new version of the Tidy Tails app. To make sure
it fits the way you *actually* work, he needs your answers to a handful of
questions.

There are six. There are no wrong answers — short replies by text are perfect,
or tell Russell a good time for a quick call. A sentence each is plenty.

---

## ⭐ Most important question — please answer this one first

**1. Where does your real, up-to-date schedule live?**

The new app has a list of your appointments. We need to know: do you keep that
list current yourself, or is your real, day-to-day schedule somewhere else — like
Pawfinity?

Put simply: **if you want to know what you're doing next Tuesday, where do you
look?**

*Why it matters:* The app's "today" screen is only useful if it shows your real
schedule. If your live schedule lives in Pawfinity, the app needs a different
plan for how it gets your appointments. This one answer shapes the biggest part
of what gets built — so it's the most important of the six.

---

## The other five

**2. Which days do you NOT do Tidy Tails grooming?**

For example — days you work for someone else, or your regular days off. Is it the
same days every week, or does it change week to week?

*Why it matters:* The app needs to know which days to leave out of your schedule
and your reminders, so it never suggests a day you're not grooming.

---

**3. Your records show four kinds of appointments — is that still right?**

They are: full groom, bath only, nail trim, and "other." Is that still your real
list of services? And what usually counts as "other"?

*Why it matters:* The app shows the service on every appointment and uses it to
suggest when a dog is due back.

---

**4. What are your two locations — "annette" and "gina"?**

Your records use two location names, "annette" and "gina." What are those two
places? And do clients drop their dogs off at fixed spots, or do you ever travel
to the dog?

*Why it matters:* This tells the app how to show each appointment, and whether it
needs to think about travel time.

---

**5. What are your normal grooming hours?**

On a typical grooming day, what hours do you work — and how many days a week do
you usually groom?

*Why it matters:* The app uses this to put your day in order and to suggest
sensible times when a dog is due to come back.

---

**6. Do you want the app to remind you about dogs that are due?**

Would it help if the app reminded you about dogs coming up soon or overdue for a
groom — or does your current setup already handle reminders fine?

*Why it matters:* Tells Russell whether to build reminders into the app or leave
that alone.

---

That's all six. Thanks, Sam — your answers go straight into how the app is built.

---

*For Russell — these map to `_reports/2026-05-16-sam-scheduling-os-prd.md` §5
Group A: Q1 = Q-A4 (load-bearing), Q2 = Q-A1, Q3 = Q-A2, Q4 = Q-A3, Q5 = Q-A5,
Q6 = Q-A6. Capture Sam's answers back into the PRD (§5 / §11) when they land; the
build should not proceed past Ship 2.2a auth + read-only polish until Q1 (the
schedule source-of-truth question) is answered or you explicitly choose a default
in Sam's place.*
