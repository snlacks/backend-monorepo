import { getExecutionContext } from '../_mock-data/execution-context-data';
import { DEVELOPMENT, ForDevOnlyGuard } from './for-dev-only.guard';

describe('ForDevOnlyGuard', () => {
  let temp;
  let guard;

  beforeEach(() => {
    temp = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = temp;
  });

  it('should return true when dev env', async () => {
    process.env.NODE_ENV = DEVELOPMENT;
    guard = new ForDevOnlyGuard({
      getAllAndOverride: jest.fn(() => true),
    } as any);
    expect(await guard.canActivate(getExecutionContext())).toBe(true);
  });
  it('should return true when not flagged', async () => {
    process.env.NODE_ENV = DEVELOPMENT;
    guard = new ForDevOnlyGuard({
      getAllAndOverride: jest.fn(() => false),
    } as any);
    expect(await guard.canActivate(getExecutionContext())).toBe(true);
  });
  it('should return true when not flagged and not dev', async () => {
    process.env.NODE_ENV = 'production';
    guard = new ForDevOnlyGuard({
      getAllAndOverride: jest.fn(() => false),
    } as any);
    expect(await guard.canActivate(getExecutionContext())).toBe(true);
  });
  it('should return false when flagged and not dev', async () => {
    process.env.NODE_ENV = 'production';
    guard = new ForDevOnlyGuard({
      getAllAndOverride: jest.fn(() => true),
    } as any);
    expect(await guard.canActivate(getExecutionContext())).toBe(false);
  });
});
