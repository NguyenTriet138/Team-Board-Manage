import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { ConvexError } from 'convex/values';

// Helper function to hash password (in a real app, use a proper crypto library)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first();

    if (existingUser) {
      throw new ConvexError('User already exists');
    }

    // Generate salt and hash password
    const salt = crypto.randomUUID();
    const hashedPassword = await hashPassword(args.password, salt);

    // Create new user
    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      hashedPassword,
      salt,
      createdAt: Date.now(),
    });

    return {
      userId,
      email: args.email,
      name: args.name,
    };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first();

    if (!user) {
      throw new ConvexError('Invalid email or password');
    }

    // Verify password
    const hashedPassword = await hashPassword(args.password, user.salt);
    if (hashedPassword !== user.hashedPassword) {
      throw new ConvexError('Invalid email or password');
    }

    // Return user data (excluding sensitive information)
    return {
      userId: user._id,
      email: user.email,
      name: user.name,
    };
  },
});
