import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { signToken } from '@/lib/jwt';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Server-side validation
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce<Record<string, string>>((acc, issue) => {
        const path = issue.path[0];
        if (path) {
          acc[path.toString()] = issue.message;
        }
        return acc;
      }, {});

      return NextResponse.json({ errors: fieldErrors }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    await connectToDatabase();

    // 2. Check for duplicate email
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // 3. Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
    });

    // 4. Issue JWT and set cookie
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        user: { id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role },
        message: 'Registration successful',
      },
      { status: 201 }
    );

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}