import type { APIRoute } from 'astro';
import { app } from '../../server/app.ts';

export const prerender = false;

const handler: APIRoute = ({ request }) => app.fetch(request);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
