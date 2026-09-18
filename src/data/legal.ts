/**
 * Terms and privacy copy.
 *
 * Written to describe what the app actually does rather than as generic
 * boilerplate — a privacy policy that claims to collect a home address would
 * be both wrong and worse than nothing here.
 *
 * NOT LEGAL ADVICE. This needs review by a lawyer familiar with Pakistani
 * consumer and data-protection law before launch. In particular: the
 * cost-sharing framing in "What GoSaath is not" is the clause that keeps this
 * outside commercial passenger-transport licensing, and it should be checked.
 */

export type LegalSection = {
  heading: string;
  body: string[];
  /** Rendered as ticked points rather than paragraphs. */
  points?: string[];
};

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const LAST_UPDATED = "September 2026";

export const TERMS: LegalDocument = {
  title: "Terms of service",
  updated: LAST_UPDATED,
  intro:
    "These terms cover your use of GoSaath. We have kept them short and in plain language, because terms nobody reads protect nobody.",
  sections: [
    {
      heading: "Who can use GoSaath",
      body: [
        "You need a valid email address from an institution we have onboarded, and you must be a student, faculty member or member of staff there.",
        "You must be old enough to hold a driving licence in Pakistan if you offer seats, and you must hold a valid licence for the vehicle you drive.",
        "One account per person. Accounts are not transferable.",
      ],
    },
    {
      heading: "What GoSaath is",
      body: [
        "GoSaath introduces people from the same institution whose regular commute overlaps. That is the whole service.",
        "We do not employ drivers, own vehicles, set prices, or take part in any arrangement you make. Whether to travel with someone is entirely your decision.",
      ],
    },
    {
      heading: "What GoSaath is not",
      body: [
        "GoSaath is not a taxi, ride-hailing or passenger transport service.",
        "Any money exchanged is a voluntary contribution towards the running cost of a journey the driver was already making. It is cost sharing, not a fare, and we take no commission from it.",
        "Using GoSaath to operate a commercial transport service is not allowed, and accounts doing so are removed.",
      ],
    },
    {
      heading: "Your responsibilities",
      body: [],
      points: [
        "Give accurate information about yourself, your vehicle and your commute",
        "Turn up when you have agreed to, or tell the other person as early as you can",
        "Hold valid insurance and a valid licence if you drive",
        "Treat other commuters with respect",
        "Follow the law, including seatbelt and helmet rules",
      ],
    },
    {
      heading: "Safety and your own judgement",
      body: [
        "We restrict matching to your own institution and campus, and we offer an optional verified badge. Those reduce risk. They do not remove it.",
        "You are responsible for deciding who you travel with. Trust your judgement, and use the report and block tools if something is wrong.",
        "In an emergency, contact the police or emergency services first. GoSaath is not an emergency service.",
      ],
    },
    {
      heading: "Content and conduct",
      body: [
        "Do not use GoSaath to harass, threaten or discriminate against anyone, to advertise anything, or to collect other people's information.",
        "We may suspend or remove an account that breaks these terms, and we may tell your institution if the behaviour warrants it.",
      ],
    },
    {
      heading: "Our liability",
      body: [
        "GoSaath provides an introduction service. We are not a party to any travel arrangement and we are not liable for what happens during one.",
        "We do not guarantee that you will be matched with anyone, or that the service will always be available.",
        "Nothing here limits liability that cannot be limited under Pakistani law.",
      ],
    },
    {
      heading: "Changes and ending your account",
      body: [
        "You can delete your account at any time from Settings. Your commute stops being matched immediately.",
        "If we change these terms in a way that materially affects you, we will tell you in the app before the change applies.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Questions about these terms go through Help and support in the app, and we reply by email.",
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: "Privacy policy",
  updated: LAST_UPDATED,
  intro:
    "GoSaath is built to need as little about you as possible. This policy describes exactly what we hold, who can see it, and what we deliberately do not collect.",
  sections: [
    {
      heading: "What we never collect",
      body: [
        "These are design decisions, not settings, and they apply to every account:",
      ],
      points: [
        "Your home address — we only ever store a general area",
        "Your live location — there is no tracking, at any time",
        "Latitude and longitude — no coordinates are stored for you",
        "Payment details — money is settled directly between people",
        "Ratings or reviews of you — these do not exist in GoSaath",
      ],
    },
    {
      heading: "What we hold about you",
      body: [],
      points: [
        "Your name, institution email, and mobile number",
        "Your institution, campus, and whether you are a student or faculty",
        "The general area you commute from",
        "Your commute: the days you travel and your campus times",
        "Your vehicle details, if you offer seats",
        "An optional profile photo, and an optional ID document if you apply for the verified badge",
      ],
    },
    {
      heading: "What other people can see",
      body: [
        "Other commuters see a deliberately small amount about you: your first name, your photo if you added one, whether you hold the verified badge, and the general area you travel from.",
        "They never see your full name, your email, your exact location, or anything about your other matches.",
        "Your mobile number becomes visible to someone only once you are matched with them, so you can arrange the practical details. Nobody outside your matches can see it.",
      ],
    },
    {
      heading: "Why we hold it",
      body: [
        "Your institution email confirms you belong to the community you are matched within. Your commute and area are what matching compares. Your number lets a match reach you.",
        "We do not sell your information, and we do not use it for advertising.",
      ],
    },
    {
      heading: "Your institution",
      body: [
        "Administrators at your own institution can see accounts belonging to that institution in order to run it there — for example to review verified badges or act on a report.",
        "They cannot see accounts at any other institution, and they cannot see your messages, because GoSaath has none.",
      ],
    },
    {
      heading: "Blocking and reporting",
      body: [
        "Blocking is silent. The other person is never told, and cannot tell whether you blocked them or simply stopped travelling.",
        "Reports are reviewed by our team, and shared with your institution where the matter warrants it.",
      ],
    },
    {
      heading: "Keeping it and deleting it",
      body: [
        "We keep your information while your account is open. Delete your account from Settings and we remove your profile, commute and vehicle details.",
        "We may keep a limited record of reports and safety decisions after deletion, because removing those would let a removed account return unnoticed.",
      ],
    },
    {
      heading: "Your choices",
      body: [],
      points: [
        "Change or pause your commute at any time",
        "Hide your area until a seat is confirmed, in Settings",
        "Limit matching to women only, in Commute preferences",
        "Block anyone, at any time, without telling them",
        "Delete your account and everything attached to it",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Ask us anything about your information through Help and support in the app.",
      ],
    },
  ],
};
