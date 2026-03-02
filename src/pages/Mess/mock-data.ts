export type SubscriptionPlan = "Monthly" | "Semester" | "Pay-Per-Meal"
export type SubscriptionStatus = "Active" | "Cancelled" | "Suspended"
export type MealType = "Breakfast" | "Lunch" | "Dinner"
export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"

export interface Subscription {
  id: string
  studentName: string
  studentId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  monthlyFee: number
  startDate: string
  endDate: string
  email: string
  room: string
}

export interface MenuItem {
  items: string[]
  time: string
}

export interface DayMenu {
  day: DayOfWeek
  breakfast: MenuItem
  lunch: MenuItem
  dinner: MenuItem
}

export interface AttendanceRecord {
  id: string
  studentName: string
  studentId: string
  meal: MealType
  date: string
  checkInTime: string
  room: string
}

export interface DailyAttendanceSummary {
  date: string
  breakfastCount: number
  lunchCount: number
  dinnerCount: number
}

export const subscriptions: Subscription[] = [
  { id: "SUB001", studentName: "Aarav Sharma", studentId: "STU2024001", plan: "Monthly", status: "Active", monthlyFee: 3500, startDate: "2026-01-01", endDate: "2026-06-30", email: "aarav@college.edu", room: "A-101" },
  { id: "SUB002", studentName: "Priya Patel", studentId: "STU2024002", plan: "Semester", status: "Active", monthlyFee: 3000, startDate: "2026-01-01", endDate: "2026-06-30", email: "priya@college.edu", room: "B-205" },
  { id: "SUB003", studentName: "Rohan Gupta", studentId: "STU2024003", plan: "Monthly", status: "Suspended", monthlyFee: 3500, startDate: "2026-01-01", endDate: "2026-03-31", email: "rohan@college.edu", room: "A-304" },
  { id: "SUB004", studentName: "Ananya Singh", studentId: "STU2024004", plan: "Pay-Per-Meal", status: "Active", monthlyFee: 0, startDate: "2026-02-01", endDate: "2026-06-30", email: "ananya@college.edu", room: "C-112" },
  { id: "SUB005", studentName: "Vikram Reddy", studentId: "STU2024005", plan: "Semester", status: "Cancelled", monthlyFee: 3000, startDate: "2025-07-01", endDate: "2025-12-31", email: "vikram@college.edu", room: "B-108" },
  { id: "SUB006", studentName: "Kavya Nair", studentId: "STU2024006", plan: "Monthly", status: "Active", monthlyFee: 3500, startDate: "2026-02-01", endDate: "2026-07-31", email: "kavya@college.edu", room: "D-201" },
  { id: "SUB007", studentName: "Arjun Mehta", studentId: "STU2024007", plan: "Semester", status: "Active", monthlyFee: 3000, startDate: "2026-01-01", endDate: "2026-06-30", email: "arjun@college.edu", room: "A-209" },
  { id: "SUB008", studentName: "Ishita Joshi", studentId: "STU2024008", plan: "Monthly", status: "Active", monthlyFee: 3500, startDate: "2026-01-15", endDate: "2026-07-15", email: "ishita@college.edu", room: "C-305" },
  { id: "SUB009", studentName: "Sai Krishna", studentId: "STU2024009", plan: "Pay-Per-Meal", status: "Active", monthlyFee: 0, startDate: "2026-01-01", endDate: "2026-06-30", email: "sai@college.edu", room: "B-402" },
  { id: "SUB010", studentName: "Meera Desai", studentId: "STU2024010", plan: "Monthly", status: "Suspended", monthlyFee: 3500, startDate: "2026-01-01", endDate: "2026-06-30", email: "meera@college.edu", room: "D-103" },
  { id: "SUB011", studentName: "Rahul Verma", studentId: "STU2024011", plan: "Semester", status: "Active", monthlyFee: 3000, startDate: "2026-01-01", endDate: "2026-06-30", email: "rahul@college.edu", room: "A-410" },
  { id: "SUB012", studentName: "Nisha Agarwal", studentId: "STU2024012", plan: "Monthly", status: "Active", monthlyFee: 3500, startDate: "2026-02-01", endDate: "2026-07-31", email: "nisha@college.edu", room: "C-208" },
]

export const weeklyMenu: DayMenu[] = [
  {
    day: "Monday",
    breakfast: { items: ["Aloo Paratha", "Curd", "Pickle", "Tea/Coffee"], time: "7:30 AM - 9:30 AM" },
    lunch: { items: ["Dal Fry", "Rice", "Roti", "Mixed Veg", "Salad"], time: "12:00 PM - 2:00 PM" },
    dinner: { items: ["Paneer Butter Masala", "Rice", "Roti", "Raita"], time: "7:00 PM - 9:00 PM" },
  },
  {
    day: "Tuesday",
    breakfast: { items: ["Poha", "Boiled Eggs", "Bread & Butter", "Tea/Coffee"], time: "7:30 AM - 9:30 AM" },
    lunch: { items: ["Rajma", "Rice", "Roti", "Aloo Gobi", "Salad"], time: "12:00 PM - 2:00 PM" },
    dinner: { items: ["Chicken Curry", "Rice", "Roti", "Dal"], time: "7:00 PM - 9:00 PM" },
  },
  {
    day: "Wednesday",
    breakfast: { items: ["Idli", "Sambar", "Coconut Chutney", "Tea/Coffee"], time: "7:30 AM - 9:30 AM" },
    lunch: { items: ["Chole", "Bhature", "Rice", "Salad", "Pickle"], time: "12:00 PM - 2:00 PM" },
    dinner: { items: ["Egg Curry", "Rice", "Roti", "Mixed Veg"], time: "7:00 PM - 9:00 PM" },
  },
  {
    day: "Thursday",
    breakfast: { items: ["Upma", "Vada", "Chutney", "Tea/Coffee"], time: "7:30 AM - 9:30 AM" },
    lunch: { items: ["Dal Tadka", "Rice", "Roti", "Bhindi Fry", "Salad"], time: "12:00 PM - 2:00 PM" },
    dinner: { items: ["Fish Curry", "Rice", "Roti", "Dal Fry"], time: "7:00 PM - 9:00 PM" },
  },
  {
    day: "Friday",
    breakfast: { items: ["Puri Bhaji", "Sprouts", "Fruit", "Tea/Coffee"], time: "7:30 AM - 9:30 AM" },
    lunch: { items: ["Kadhi Pakora", "Rice", "Roti", "Aloo Matar", "Salad"], time: "12:00 PM - 2:00 PM" },
    dinner: { items: ["Biryani", "Raita", "Salad", "Gulab Jamun"], time: "7:00 PM - 9:00 PM" },
  },
  {
    day: "Saturday",
    breakfast: { items: ["Dosa", "Sambar", "Chutney", "Tea/Coffee"], time: "7:30 AM - 9:30 AM" },
    lunch: { items: ["Pav Bhaji", "Rice", "Dal", "Salad"], time: "12:00 PM - 2:00 PM" },
    dinner: { items: ["Mutton Curry", "Rice", "Roti", "Raita"], time: "7:00 PM - 9:00 PM" },
  },
  {
    day: "Sunday",
    breakfast: { items: ["Chole Bhature", "Lassi", "Fruit Salad", "Tea/Coffee"], time: "8:00 AM - 10:00 AM" },
    lunch: { items: ["Special Thali", "Rice", "Roti", "Sweet"], time: "12:30 PM - 2:30 PM" },
    dinner: { items: ["Butter Chicken", "Naan", "Rice", "Ice Cream"], time: "7:00 PM - 9:30 PM" },
  },
]

export const todayAttendance: AttendanceRecord[] = [
  { id: "ATT001", studentName: "Aarav Sharma", studentId: "STU2024001", meal: "Breakfast", date: "2026-03-02", checkInTime: "8:15 AM", room: "A-101" },
  { id: "ATT002", studentName: "Priya Patel", studentId: "STU2024002", meal: "Breakfast", date: "2026-03-02", checkInTime: "8:30 AM", room: "B-205" },
  { id: "ATT003", studentName: "Kavya Nair", studentId: "STU2024006", meal: "Breakfast", date: "2026-03-02", checkInTime: "7:45 AM", room: "D-201" },
  { id: "ATT004", studentName: "Arjun Mehta", studentId: "STU2024007", meal: "Breakfast", date: "2026-03-02", checkInTime: "8:50 AM", room: "A-209" },
  { id: "ATT005", studentName: "Ishita Joshi", studentId: "STU2024008", meal: "Breakfast", date: "2026-03-02", checkInTime: "9:00 AM", room: "C-305" },
  { id: "ATT006", studentName: "Rahul Verma", studentId: "STU2024011", meal: "Breakfast", date: "2026-03-02", checkInTime: "8:10 AM", room: "A-410" },
  { id: "ATT007", studentName: "Nisha Agarwal", studentId: "STU2024012", meal: "Breakfast", date: "2026-03-02", checkInTime: "9:15 AM", room: "C-208" },
  { id: "ATT008", studentName: "Aarav Sharma", studentId: "STU2024001", meal: "Lunch", date: "2026-03-02", checkInTime: "12:30 PM", room: "A-101" },
  { id: "ATT009", studentName: "Priya Patel", studentId: "STU2024002", meal: "Lunch", date: "2026-03-02", checkInTime: "12:45 PM", room: "B-205" },
  { id: "ATT010", studentName: "Ananya Singh", studentId: "STU2024004", meal: "Lunch", date: "2026-03-02", checkInTime: "1:00 PM", room: "C-112" },
  { id: "ATT011", studentName: "Kavya Nair", studentId: "STU2024006", meal: "Lunch", date: "2026-03-02", checkInTime: "12:15 PM", room: "D-201" },
  { id: "ATT012", studentName: "Arjun Mehta", studentId: "STU2024007", meal: "Lunch", date: "2026-03-02", checkInTime: "1:15 PM", room: "A-209" },
  { id: "ATT013", studentName: "Sai Krishna", studentId: "STU2024009", meal: "Lunch", date: "2026-03-02", checkInTime: "12:50 PM", room: "B-402" },
  { id: "ATT014", studentName: "Rahul Verma", studentId: "STU2024011", meal: "Lunch", date: "2026-03-02", checkInTime: "1:30 PM", room: "A-410" },
  { id: "ATT015", studentName: "Nisha Agarwal", studentId: "STU2024012", meal: "Lunch", date: "2026-03-02", checkInTime: "12:40 PM", room: "C-208" },
  { id: "ATT016", studentName: "Aarav Sharma", studentId: "STU2024001", meal: "Dinner", date: "2026-03-02", checkInTime: "7:30 PM", room: "A-101" },
  { id: "ATT017", studentName: "Priya Patel", studentId: "STU2024002", meal: "Dinner", date: "2026-03-02", checkInTime: "7:45 PM", room: "B-205" },
  { id: "ATT018", studentName: "Kavya Nair", studentId: "STU2024006", meal: "Dinner", date: "2026-03-02", checkInTime: "8:00 PM", room: "D-201" },
  { id: "ATT019", studentName: "Ishita Joshi", studentId: "STU2024008", meal: "Dinner", date: "2026-03-02", checkInTime: "7:15 PM", room: "C-305" },
  { id: "ATT020", studentName: "Rahul Verma", studentId: "STU2024011", meal: "Dinner", date: "2026-03-02", checkInTime: "8:15 PM", room: "A-410" },
]

export const weeklyAttendanceSummary: DailyAttendanceSummary[] = [
  { date: "2026-02-23", breakfastCount: 85, lunchCount: 112, dinnerCount: 95 },
  { date: "2026-02-24", breakfastCount: 78, lunchCount: 105, dinnerCount: 88 },
  { date: "2026-02-25", breakfastCount: 92, lunchCount: 118, dinnerCount: 101 },
  { date: "2026-02-26", breakfastCount: 80, lunchCount: 108, dinnerCount: 90 },
  { date: "2026-02-27", breakfastCount: 95, lunchCount: 125, dinnerCount: 110 },
  { date: "2026-02-28", breakfastCount: 70, lunchCount: 95, dinnerCount: 82 },
  { date: "2026-03-01", breakfastCount: 65, lunchCount: 88, dinnerCount: 75 },
]

export const stats = {
  totalActiveSubscriptions: 9,
  todayBreakfast: 7,
  todayLunch: 8,
  todayDinner: 5,
  monthlyRevenue: 28500,
  totalStudents: 12,
  suspendedCount: 2,
  cancelledCount: 1,
}
