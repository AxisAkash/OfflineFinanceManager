jest.mock('expo-sqlite');

import { BaseRepository } from '../baseRepository';

describe('BaseRepository', () => {
  let repo: BaseRepository;

  beforeEach(() => {
    repo = new BaseRepository('test_table');
  });

  it('should construct with table name', () => {
    expect((repo as unknown as { tableName: string }).tableName).toBe('test_table');
  });

  it('should have all required methods', () => {
    expect(typeof repo.findAll).toBe('function');
    expect(typeof repo.findById).toBe('function');
    expect(typeof repo.insert).toBe('function');
    expect(typeof repo.update).toBe('function');
    expect(typeof repo.delete).toBe('function');
    expect(typeof repo.count).toBe('function');
    expect(typeof repo.exists).toBe('function');
    expect(typeof repo.executeSql).toBe('function');
    expect(typeof repo.executeSqlSingle).toBe('function');
  });
});
