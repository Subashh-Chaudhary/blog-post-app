import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL;
    if (!graphqlUrl) {
      return NextResponse.json({ error: 'GraphQL API URL is not configured' }, { status: 500 });
    }

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation Refresh($token: String!) {
            refresh(refreshToken: $token) {
              accessToken
              refreshToken
              user {
                _id
                fullName
                email
              }
            }
          }
        `,
        variables: {
          token: refreshToken,
        },
      }),
    });

    const result = await response.json();

    if (result.errors || !result.data?.refresh) {
      // Clear invalid cookie
      cookieStore.delete('refreshToken');
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    const newAuth = result.data.refresh;

    cookieStore.set('refreshToken', newAuth.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json(newAuth);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
