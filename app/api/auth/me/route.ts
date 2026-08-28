import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 1. Verify and decode the JWT token using your helper
    const payload = verifyToken(token);

    if (!payload || !payload.userId || !mongoose.Types.ObjectId.isValid(payload.userId)) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 2. Connect to Database and fetch current user details
    await connectToDatabase();

    const user = await UserModel.findById(payload.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}