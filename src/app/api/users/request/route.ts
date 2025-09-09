// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { connect } from "@/dbConfig/dbConfig";
// import RequestModel from "@/models/Request";
// import Gym from "@/models/Gym";

// connect();

// export async function POST(req: NextRequest) {
//   try {
//     const { email, name, role, gymId, password, message } = await req.json();
//     if (!email || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

//     // optional validate gymId
//     if (gymId) {
//       const gym = await Gym.findById(gymId);
//       if (!gym) return NextResponse.json({ error: "Gym not found" }, { status: 404 });
//     }

//     // Check existing request or existing user
//     const existingRequest = await RequestModel.findOne({ email, role, gym: gymId, status: "pending" });
//     if (existingRequest) return NextResponse.json({ error: "Request pending" }, { status: 409 });

//     // If user already exists, block
//     const User = (await import('@/models/User')).default;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return NextResponse.json({ error: "User already registered" }, { status: 409 });

//     const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

// const reqDoc = await RequestModel.create({
//   email,
//   name,
//   role,
//   gym: gymId || undefined,
//   message,
//   password: hashedPassword,
//   requestedByIp: req.headers.get("x-forwarded-for") || undefined,
//   status: "pending" // 👈 ensure it’s set
// });


//     return NextResponse.json({ message: "Request submitted", requestId: reqDoc._id });
//   } catch (err:any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
