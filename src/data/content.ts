import type {
  AppNotification,
  Commute,
  CommuteDay,
  CommuteMatch,
  CommuteMember,
  PublicUser,
  RideListing,
  SeatRequest,
  User,
} from "@/data/types";

/**
 * Sample content for the UI while the backend is being built.
 *
 * Other commuters are represented as PublicUser: first name, optional photo
 * and the optional verified badge. No ratings, ride counts or join dates,
 * because the product exposes none of those.
 */

export const currentUser: User = {
  id: "user-me",
  name: "Sarmad Hussain",
  email: "sarmad@szabist.pk",
  phone: "0301 2345678",
  photoUrl: null,
  userType: "student",
  institutionId: "inst-szabist",
  campusId: "camp-szabist-clifton",
  areaId: "area-dha-6",
  badgeStatus: "approved",
  additionalInstitutionIds: [],
};

const ahmed: PublicUser = { id: "u-ahmed", firstName: "Ahmed", verified: true };
const zainab: PublicUser = { id: "u-zainab", firstName: "Zainab", verified: true };
const bilal: PublicUser = { id: "u-bilal", firstName: "Bilal", verified: false };
const hina: PublicUser = { id: "u-hina", firstName: "Hina", verified: true };
const areeba: PublicUser = { id: "u-areeba", firstName: "Areeba", verified: false };
const danish: PublicUser = { id: "u-danish", firstName: "Danish", verified: true };

export const myCommute: Commute = {
  id: "commute-me",
  ownerId: currentUser.id,
  intent: "find",
  institutionId: "inst-szabist",
  campusId: "camp-szabist-clifton",
  originAreaId: "area-dha-6",
  // Deliberately not uniform: Wednesday is a late start and Friday has no
  // return leg, which is what a real timetable looks like.
  schedule: [
    { day: "Mon", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
    { day: "Tue", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
    { day: "Wed", arriveBy: "10:00 AM", leaveCampusAt: "6:00 PM" },
    { day: "Thu", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
    { day: "Fri", arriveBy: "7:30 AM" },
  ],
  direction: "both",
  womenOnly: false,
  status: "active",
};

export const commuteWeek: CommuteDay[] = [
  { day: "Mon", date: "15 Sep", status: "confirmed" },
  { day: "Tue", date: "16 Sep", status: "confirmed" },
  { day: "Wed", date: "17 Sep", status: "confirmed" },
  { day: "Thu", date: "18 Sep", status: "pending" },
  { day: "Fri", date: "19 Sep", status: "noDriver" },
];

export const commuteMembers: CommuteMember[] = [
  { user: ahmed, role: "driver", travellingNext: true },
  {
    user: { id: currentUser.id, firstName: "Sarmad", verified: true },
    role: "passenger",
    travellingNext: true,
  },
  { user: bilal, role: "passenger", travellingNext: true },
  { user: areeba, role: "passenger", travellingNext: false },
];

export const rideListings: RideListing[] = [
  {
    id: "ride-1",
    commuteId: "c-ahmed",
    driver: ahmed,
    vehicleType: "car",
    vehicleModel: "Toyota Corolla GLi",
    // Masked by default, as a browsing viewer sees it. See maskPlate.
    vehiclePlate: "BKT-•••",
    plateVisibility: "masked",
    originArea: "DHA Phase 5",
    destinationCampus: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Tue", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Wed", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Thu", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Fri", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
    ],
    direction: "both",
    seatsAvailable: 2,
    contribution: 250,
    womenOnly: false,
    sameCampus: true,
  },
  {
    id: "ride-2",
    commuteId: "c-hina",
    driver: hina,
    vehicleType: "car",
    vehicleModel: "Suzuki Cultus VXL",
    // Masked by default, as a browsing viewer sees it. See maskPlate.
    vehiclePlate: "AXB-•••",
    plateVisibility: "masked",
    originArea: "Clifton",
    destinationCampus: "SZABIST Clifton Campus",
    // Mixed timetable, so the ride card has to say "times vary" rather than
    // pick one day's time and mislead.
    schedule: [
      { day: "Mon", arriveBy: "7:15 AM", leaveCampusAt: "4:30 PM" },
      { day: "Wed", arriveBy: "9:00 AM", leaveCampusAt: "4:30 PM" },
      { day: "Fri", arriveBy: "7:15 AM", leaveCampusAt: "2:00 PM" },
    ],
    direction: "both",
    seatsAvailable: 3,
    contribution: 200,
    womenOnly: true,
    sameCampus: true,
  },
  {
    id: "ride-3",
    commuteId: "c-danish",
    driver: danish,
    vehicleType: "bike",
    vehicleModel: "Honda CG 125",
    // Masked by default, as a browsing viewer sees it. See maskPlate.
    vehiclePlate: "KHI-•••",
    plateVisibility: "masked",
    originArea: "DHA Phase 2",
    destinationCampus: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:45 AM" },
      { day: "Tue", arriveBy: "7:45 AM" },
      { day: "Wed", arriveBy: "7:45 AM" },
      { day: "Thu", arriveBy: "7:45 AM" },
      { day: "Fri", arriveBy: "7:45 AM" },
    ],
    direction: "going",
    seatsAvailable: 1,
    contribution: 200,
    womenOnly: false,
    sameCampus: true,
  },
];

export const commuteMatches: CommuteMatch[] = [
  {
    id: "match-1",
    user: zainab,
    area: "Clifton",
    campusName: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Tue", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Wed", arriveBy: "10:00 AM", leaveCampusAt: "6:00 PM" },
      { day: "Thu", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Fri", arriveBy: "7:30 AM" },
    ],
    // Every day lines up, including the late Wednesday.
    matchingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    intent: "find",
    areaMatch: "pending",
  },
  {
    id: "match-2",
    user: danish,
    area: "DHA Phase 2",
    campusName: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:45 AM" },
      { day: "Tue", arriveBy: "7:45 AM" },
      { day: "Wed", arriveBy: "7:45 AM" },
      { day: "Thu", arriveBy: "7:45 AM" },
      { day: "Fri", arriveBy: "7:45 AM" },
    ],
    // Wednesday misses: he leaves at 7:45 but you do not travel until 10:00.
    matchingDays: ["Mon", "Tue", "Thu", "Fri"],
    intent: "offer",
    vehicleType: "bike",
    seatsAvailable: 1,
    contribution: 200,
    areaMatch: "pending",
  },
  {
    id: "match-3",
    user: hina,
    area: "Clifton",
    campusName: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:15 AM", leaveCampusAt: "4:30 PM" },
      { day: "Wed", arriveBy: "9:00 AM", leaveCampusAt: "4:30 PM" },
      { day: "Fri", arriveBy: "7:15 AM", leaveCampusAt: "2:00 PM" },
    ],
    matchingDays: ["Mon", "Fri"],
    intent: "offer",
    vehicleType: "car",
    seatsAvailable: 3,
    contribution: 200,
    areaMatch: "accepted",
  },
  {
    id: "match-4",
    user: areeba,
    area: "PECHS",
    campusName: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:30 AM" },
      { day: "Tue", arriveBy: "7:30 AM" },
      { day: "Wed", arriveBy: "7:30 AM" },
      { day: "Thu", arriveBy: "7:30 AM" },
    ],
    matchingDays: ["Mon", "Tue", "Thu"],
    intent: "find",
    areaMatch: "pending",
  },
];

export const seatRequests: SeatRequest[] = [
  {
    id: "req-1",
    user: zainab,
    originArea: "Clifton",
    destinationCampus: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Tue", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Wed", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Thu", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
      { day: "Fri", arriveBy: "7:30 AM", leaveCampusAt: "5:30 PM" },
    ],
    direction: "both",
    seats: 1,
    contribution: 250,
    status: "pending",
  },
  {
    id: "req-2",
    user: areeba,
    originArea: "PECHS",
    destinationCampus: "SZABIST Clifton Campus",
    schedule: [
      { day: "Mon", arriveBy: "7:30 AM" },
      { day: "Tue", arriveBy: "7:30 AM" },
      { day: "Wed", arriveBy: "7:30 AM" },
      { day: "Thu", arriveBy: "7:30 AM" },
    ],
    direction: "going",
    seats: 1,
    contribution: 250,
    status: "pending",
  },
];

export const notifications: AppNotification[] = [
  {
    id: "n-1",
    kind: "driverUnavailable",
    title: "Ahmed cannot drive on Friday",
    body: "Your Friday commute needs cover. We found people from your campus on a similar route.",
    time: "18 min ago",
    unread: true,
  },
  {
    id: "n-2",
    kind: "requestAccepted",
    title: "Seat confirmed",
    body: "Ahmed accepted your request for tomorrow at 7:30 AM.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: "n-3",
    kind: "seatRequest",
    title: "Zainab asked to join your commute",
    body: "Clifton to SZABIST Clifton Campus, Monday to Friday.",
    time: "5 hours ago",
    unread: false,
  },
  {
    id: "n-4",
    kind: "tomorrowCommute",
    title: "Tomorrow at 7:30 AM",
    body: "DHA Phase 6 to SZABIST Clifton Campus with Ahmed.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "n-5",
    kind: "badgeUpdate",
    title: "You are verified",
    body: "Your student card was approved. The badge now shows on your listings.",
    time: "2 days ago",
    unread: false,
  },
];
