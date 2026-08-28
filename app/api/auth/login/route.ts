import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { loginSchema } from '@/lib/validations/auth';
import { signToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Server-side validation
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
        const path = issue.path[0];
        if (path) {
          acc[path.toString()] = issue.message;
        }
        return acc;
      }, {});

      return NextResponse.json(
        { errors: fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    await connectToDatabase();

    // 2. Fetch user with password hash
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 4. Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // 5. Set HttpOnly JWT Cookie
    const response = NextResponse.json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      message: 'Login successful',
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}