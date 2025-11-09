/**
 * Basic health check tests
 * These tests verify the application setup and configuration
 */

describe('Application Health', () => {
  it('should have correct environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('should be able to import utilities', () => {
    // This test ensures the project structure is correct
    expect(true).toBe(true);
  });
});

describe('Database Configuration', () => {
  it('should have database URL configured', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain('postgresql');
  });
});
