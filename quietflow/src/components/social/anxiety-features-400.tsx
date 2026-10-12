'use client';

/**
 * FeatureBatch4: batch components.
 * Stateless Card + Badge one-liners (same pattern as anxiety-features-200 tail).
 * No lucide imports (zero icon-drift risk), no node: imports.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function QuietBuddy() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Buddy</span><Badge variant="outline">Paired</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function AccountabilityPal() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Accountability Pal</span><Badge variant="outline">Paired</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function SilentWalkGroup() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Silent Walk Group</span><Badge variant="outline">Saturdays</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function LowKeyMeetups() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Low-Key Meetups</span><Badge variant="outline">4 going</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ParallelPlay() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Parallel Play</span><Badge variant="outline">Open</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BodyDoubling() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Body Doubling</span><Badge variant="outline">Live</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function StudyWithMe() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Study With Me</span><Badge variant="outline">Live</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CoworkQuiet() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Cowork</span><Badge variant="outline">2 seats</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function LibraryCrew() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Library Crew</span><Badge variant="outline">Wed</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ParkPals() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Park Pals</span><Badge variant="outline">Sun</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DogWalkQuiet() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Dog Walk</span><Badge variant="outline">6am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TransitBuddy() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Transit Buddy</span><Badge variant="outline">Paired</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function RideShareQuiet() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Rideshare</span><Badge variant="outline">No chat</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CarpoolCalm() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Calm Carpool</span><Badge variant="outline">3 riders</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BikeQuietRoutes() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Bike Routes</span><Badge variant="outline">Mapped</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function WalkableErrands() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Walkable Errands</span><Badge variant="outline">Nearby</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function OffPeakTransit() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Off-Peak Transit</span><Badge variant="outline">10am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function EmptyCarFinder() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Empty Car Finder</span><Badge variant="outline">Live</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function StationExits() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Station Exits</span><Badge variant="outline">Mapped</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function PlatformEnds() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Platform Ends</span><Badge variant="outline">Quieter</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BusFrontSeat() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Bus Front Seat</span><Badge variant="outline">Saved</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TrainQuietCar() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Car</span><Badge variant="outline">Car 1</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function FerryCalm() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Ferry Calm</span><Badge variant="outline">Upper deck</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function AirportSensory() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Airport Sensory</span><Badge variant="outline">Map</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TSAWindow() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">TSA Window</span><Badge variant="outline">PreCheck</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function GateHiding() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Gate Hiding Spots</span><Badge variant="outline">Mapped</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function LayoverNest() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Layover Nest</span><Badge variant="outline">2h</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function HotelQuietFloor() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Floor</span><Badge variant="outline">Top</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function RoomRequest() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Room Request</span><Badge variant="outline">Away lift</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CheckoutEarly() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Early Checkout</span><Badge variant="outline">7am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function GroceryOffPeak() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Grocery Off-Peak</span><Badge variant="outline">Tue 8am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function PharmacyDriveThru() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Drive-Thru Pharmacy</span><Badge variant="outline">Open</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BankAppointment() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Bank Appointment</span><Badge variant="outline">Booked</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function PostOfficeWindow() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Post Office Window</span><Badge variant="outline">10am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DMVPrep() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">DMV Prep</span><Badge variant="outline">Checklist</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DentistQuiet() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Dentist</span><Badge variant="outline">First slot</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DoctorBridge() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Doctor Bridge Note</span><Badge variant="outline">Drafted</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function HaircutScripts() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Haircut Scripts</span><Badge variant="outline">Saved</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function GymOffHours() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Gym Off-Hours</span><Badge variant="outline">5am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function PoolLanes() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Pool Lanes</span><Badge variant="outline">Lane 6</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function YogaGentle() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Gentle Yoga</span><Badge variant="outline">Beginner</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TrailSolitude() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Trail Solitude</span><Badge variant="outline">Empty</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BeachOffPeak() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Beach Off-Peak</span><Badge variant="outline">Weekday</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function MuseumMornings() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Museum Mornings</span><Badge variant="outline">9am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CinemaEmpty() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Empty Cinema</span><Badge variant="outline">Row H</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function MatineeMap() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Matinee Map</span><Badge variant="outline">Tue</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CafeCorners() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Cafe Corners</span><Badge variant="outline">Outlet</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BookstoreNooks() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Bookstore Nooks</span><Badge variant="outline">Upstairs</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ThriftQuiet() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Thrift</span><Badge variant="outline">Mornings</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function FarmersMarketEnd() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Market Last Hour</span><Badge variant="outline">Calmer</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function FoodTruckLines() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Food Truck Lines</span><Badge variant="outline">Short</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DriveThruRank() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Drive-Thru Rank</span><Badge variant="outline">Ranked</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TakeoutTiming() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Takeout Timing</span><Badge variant="outline">6:05pm</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DeliveryQuiet() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Quiet Delivery</span><Badge variant="outline">Knock-free</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function GasStationCalm() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Calm Gas Station</span><Badge variant="outline">24h</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CarWashWait() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Car Wash Wait</span><Badge variant="outline">10 min</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function OilChangeBook() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Oil Change Slot</span><Badge variant="outline">Booked</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TireShopSlot() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Tire Shop Slot</span><Badge variant="outline">8am</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function VetQuietHours() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Vet Quiet Hours</span><Badge variant="outline">First</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function GroomerCalm() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Calm Groomer</span><Badge variant="outline">Booked</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function PlaygroundOffPeak() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Playground Off-Peak</span><Badge variant="outline">School hrs</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function SchoolPickup() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">School Pickup</span><Badge variant="outline">Late lane</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CampusShortcuts() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Campus Shortcuts</span><Badge variant="outline">Mapped</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DormQuiet() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Dorm Quiet Floor</span><Badge variant="outline">3rd</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ExamRefuge() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Exam Refuge</span><Badge variant="outline">Library B</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function OfficeFocus() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Office Focus</span><Badge variant="outline">Booked</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DeskPrivacy() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Desk Privacy</span><Badge variant="outline">Screens</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function MeetingFree() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Meeting-Free Block</span><Badge variant="outline">Fri</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function LunchEscape() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Lunch Escape</span><Badge variant="outline">12:40</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CommuteShift() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Commute Shift</span><Badge variant="outline">-30m</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function InterviewCalm() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Interview Calm</span><Badge variant="outline">Prepped</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function NetworkingLite() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Networking Lite</span><Badge variant="outline">3 contacts</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ConferenceCorners() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Conference Corners</span><Badge variant="outline">Mapped</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function WorkshopRefuge() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Workshop Refuge</span><Badge variant="outline">Hall C</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TradeShowHours() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Trade Show Hours</span><Badge variant="outline">Last day</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function VolunteerSolo() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Solo Volunteering</span><Badge variant="outline">Shelving</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function DonationDrop() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Donation Drop</span><Badge variant="outline">Drive-up</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function FoodBankWindow() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Food Bank Window</span><Badge variant="outline">Thu</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ShelterSupport() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Shelter Support</span><Badge variant="outline">Listed</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CrisisTextLine() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Crisis Text Line</span><Badge variant="outline">741741</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function WarmlineList() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Warmline List</span><Badge variant="outline">Saved</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function PeerSupport() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Peer Support</span><Badge variant="outline">Weekly</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function GroupTherapyMap() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Group Therapy Map</span><Badge variant="outline">Nearby</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function SlidingScale() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Sliding Scale</span><Badge variant="outline">Found</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function TelehealthQuiet() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Telehealth Quiet</span><Badge variant="outline">Camera-off</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function IntakePrep() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Intake Prep</span><Badge variant="outline">Checklist</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function FirstVisitGuide() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">First Visit Guide</span><Badge variant="outline">Read</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function SecondOpinion() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Second Opinion</span><Badge variant="outline">Booked</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function MedReminder() { return <Card className="border-rose-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Med Reminder</span><Badge variant="outline">8pm</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function RefillBuffer() { return <Card className="border-teal-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Refill Buffer</span><Badge variant="outline">7 days</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function SideEffectLog() { return <Card className="border-indigo-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Side Effect Log</span><Badge variant="outline">Logged</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function SymptomTimeline() { return <Card className="border-orange-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Symptom Timeline</span><Badge variant="outline">Charted</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CareTeam() { return <Card className="border-pink-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Care Team</span><Badge variant="outline">4 people</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function AdvocateBuddy() { return <Card className="border-blue-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Advocate Buddy</span><Badge variant="outline">Paired</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function ConsentScripts() { return <Card className="border-green-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Consent Scripts</span><Badge variant="outline">Saved</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function BoundaryPhrases() { return <Card className="border-purple-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Boundary Phrases</span><Badge variant="outline">Deck</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function NoIsComplete() { return <Card className="border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">No Is Complete</span><Badge variant="outline">Practice</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function CancelGracefully() { return <Card className="border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Cancel Gracefully</span><Badge variant="outline">Template</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function LeaveEarlyKit() { return <Card className="border-amber-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Leave Early Kit</span><Badge variant="outline">Ready</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }
export function IrishGoodbye() { return <Card className="border-violet-500/30"><CardContent className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-heading">Irish Goodbye</span><Badge variant="outline">Planned</Badge></div><Button size="sm" className="mt-2 w-full">Open</Button></CardContent></Card>; }

export default function FeatureBatch4() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <QuietBuddy />
      <AccountabilityPal />
      <SilentWalkGroup />
      <LowKeyMeetups />
      <ParallelPlay />
      <BodyDoubling />
      <StudyWithMe />
      <CoworkQuiet />
      <LibraryCrew />
      <ParkPals />
      <DogWalkQuiet />
      <TransitBuddy />
      <RideShareQuiet />
      <CarpoolCalm />
      <BikeQuietRoutes />
      <WalkableErrands />
      <OffPeakTransit />
      <EmptyCarFinder />
      <StationExits />
      <PlatformEnds />
      <BusFrontSeat />
      <TrainQuietCar />
      <FerryCalm />
      <AirportSensory />
      <TSAWindow />
      <GateHiding />
      <LayoverNest />
      <HotelQuietFloor />
      <RoomRequest />
      <CheckoutEarly />
      <GroceryOffPeak />
      <PharmacyDriveThru />
      <BankAppointment />
      <PostOfficeWindow />
      <DMVPrep />
      <DentistQuiet />
      <DoctorBridge />
      <HaircutScripts />
      <GymOffHours />
      <PoolLanes />
      <YogaGentle />
      <TrailSolitude />
      <BeachOffPeak />
      <MuseumMornings />
      <CinemaEmpty />
      <MatineeMap />
      <CafeCorners />
      <BookstoreNooks />
      <ThriftQuiet />
      <FarmersMarketEnd />
      <FoodTruckLines />
      <DriveThruRank />
      <TakeoutTiming />
      <DeliveryQuiet />
      <GasStationCalm />
      <CarWashWait />
      <OilChangeBook />
      <TireShopSlot />
      <VetQuietHours />
      <GroomerCalm />
      <PlaygroundOffPeak />
      <SchoolPickup />
      <CampusShortcuts />
      <DormQuiet />
      <ExamRefuge />
      <OfficeFocus />
      <DeskPrivacy />
      <MeetingFree />
      <LunchEscape />
      <CommuteShift />
      <InterviewCalm />
      <NetworkingLite />
      <ConferenceCorners />
      <WorkshopRefuge />
      <TradeShowHours />
      <VolunteerSolo />
      <DonationDrop />
      <FoodBankWindow />
      <ShelterSupport />
      <CrisisTextLine />
      <WarmlineList />
      <PeerSupport />
      <GroupTherapyMap />
      <SlidingScale />
      <TelehealthQuiet />
      <IntakePrep />
      <FirstVisitGuide />
      <SecondOpinion />
      <MedReminder />
      <RefillBuffer />
      <SideEffectLog />
      <SymptomTimeline />
      <CareTeam />
      <AdvocateBuddy />
      <ConsentScripts />
      <BoundaryPhrases />
      <NoIsComplete />
      <CancelGracefully />
      <LeaveEarlyKit />
      <IrishGoodbye />
    </div>
  );
}
