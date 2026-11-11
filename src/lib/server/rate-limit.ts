// In-memory sliding-window rate limiter for API endpoints
const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired buckets periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
	setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store.entries()) {
			if (now > entry.resetAt) {
				store.delete(key);
			}
		}
	}, 5 * 60 * 1000).unref?.();
}

/**
 * Checks whether a given key exceeds the maximum requests allowed within windowMs.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now > entry.resetAt) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (entry.count >= maxRequests) {
		return false;
	}

	entry.count += 1;
	return true;
}
