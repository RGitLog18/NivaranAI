export const mockUser = {
  id: "1",
  name: "Rajesh Kumar",
  role: "Sarpanch",
  email: "rajesh.kumar@gov.in",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
};

export const mockComplaints = [
  {
    id: "C001",
    title: "Road Damage - Main Street",
    description: "Large pothole on Main Street causing accidents. Multiple citizens have reported injuries. The road condition has deteriorated significantly over the past month and requires immediate attention.",
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: "Main Street, Sector 12, Delhi"
    },
    type: "Infrastructure",
    category: "Road Damage",
    severity: "High",
    status: "Pending",
    submittedBy: "Amit Sharma",
    submittedDate: "2026-03-28",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400",
    numberOfComplaints: 15
  },
  {
    id: "C002",
    title: "Water Supply Issue",
    description: "No water supply for the past 3 days in the residential area. Affecting approximately 200 families. Residents are facing severe hardship.",
    location: {
      lat: 28.6229,
      lng: 77.2165,
      address: "Gandhi Nagar, Block A, Delhi"
    },
    type: "Utilities",
    category: "Water Supply",
    severity: "Critical",
    status: "In Progress",
    submittedBy: "Priya Patel",
    submittedDate: "2026-03-25",
    imageUrl: "https://images.unsplash.com/photo-1583551490774-7c21c2b7ab5c?w=400",
    numberOfComplaints: 32
  },
  {
    id: "C003",
    title: "Street Light Not Working",
    description: "Street lights in the park area have been non-functional for 2 weeks. Creating safety concerns for evening walkers and causing increased crime incidents.",
    location: {
      lat: 28.6289,
      lng: 77.2195,
      address: "Central Park Road, Delhi"
    },
    type: "Public Safety",
    category: "Street Lights",
    severity: "Medium",
    status: "Pending",
    submittedBy: "Mohammed Ali",
    submittedDate: "2026-03-27",
    imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42e7?w=400",
    numberOfComplaints: 8
  },
  {
    id: "C004",
    title: "Garbage Accumulation",
    description: "Garbage has not been collected for over a week. Strong odor and health hazard in the neighborhood. Attracting stray animals and insects.",
    location: {
      lat: 28.6109,
      lng: 77.2245,
      address: "Nehru Colony, Delhi"
    },
    type: "Sanitation",
    category: "Waste Management",
    severity: "High",
    status: "Pending",
    submittedBy: "Sunita Devi",
    submittedDate: "2026-03-29",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400",
    numberOfComplaints: 23
  },
  {
    id: "C005",
    title: "Illegal Construction",
    description: "Unauthorized construction blocking public pathway. Violating building regulations and causing inconvenience to pedestrians.",
    location: {
      lat: 28.6195,
      lng: 77.2088,
      address: "Market Area, Sector 15, Delhi"
    },
    type: "Legal",
    category: "Building Violation",
    severity: "Medium",
    status: "Resolved",
    submittedBy: "Ravi Verma",
    submittedDate: "2026-03-20",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400",
    numberOfComplaints: 5
  }
];

export const mockOfficers = [
  {
    id: "O001",
    name: "Vikram Singh",
    role: "Desk 1 Officer",
    designation: "Senior Infrastructure Officer",
    email: "vikram.singh@gov.in",
    phone: "+91 98765 43210",
    assignedComplaints: 12,
    resolvedComplaints: 45,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram"
  },
  {
    id: "O002",
    name: "Anjali Mehta",
    role: "Desk 2 Officer",
    designation: "Utilities Management Officer",
    email: "anjali.mehta@gov.in",
    phone: "+91 98765 43211",
    assignedComplaints: 8,
    resolvedComplaints: 67,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"
  },
  {
    id: "O003",
    name: "Suresh Reddy",
    role: "Desk 1 Officer",
    designation: "Public Safety Officer",
    email: "suresh.reddy@gov.in",
    phone: "+91 98765 43212",
    assignedComplaints: 15,
    resolvedComplaints: 52,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh"
  },
  {
    id: "O004",
    name: "Kavita Sharma",
    role: "Desk 2 Officer",
    designation: "Sanitation Officer",
    email: "kavita.sharma@gov.in",
    phone: "+91 98765 43213",
    assignedComplaints: 10,
    resolvedComplaints: 38,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kavita"
  }
];

export const mockStatistics = {
  daily: {
    total: 12,
    pending: 7,
    resolved: 4,
    rejected: 1
  },
  weekly: {
    total: 68,
    pending: 32,
    resolved: 28,
    rejected: 8
  },
  yearly: {
    total: 1847,
    pending: 456,
    resolved: 1245,
    rejected: 146
  }
};
