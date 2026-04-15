// TODO: Implement auth integration tests using Jest + Supertest
// Test cases to cover:
// - POST /api/auth/register — success, duplicate email
// - POST /api/auth/login — success, wrong password, non-existent user
// - POST /api/auth/refresh — success, invalid token, expired token
// - POST /api/auth/logout — success
// - Accessing protected route without token returns 401
// - Accessing protected route with expired token returns 401
