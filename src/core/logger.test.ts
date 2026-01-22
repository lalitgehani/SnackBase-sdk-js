import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, LogLevel } from './logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    // Reset mocks and create new logger instance
    vi.clearAllMocks();
  });

  it('should initialize with default level NONE', () => {
    logger = new Logger();
    // @ts-ignore - accessing private property for testing
    expect(logger.level).toBe(LogLevel.NONE);
  });

  it('should initialize with provided level', () => {
    logger = new Logger(LogLevel.DEBUG);
    // @ts-ignore
    expect(logger.level).toBe(LogLevel.DEBUG);
  });

  it('should not log when level is lower than message level', () => {
    logger = new Logger(LogLevel.ERROR);
    const consoleSpy = vi.spyOn(console, 'info');
    
    logger.info('test message');
    
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(logger.getLogs()).toHaveLength(0);
  });

  it('should log when level is equal or higher than message level', () => {
    logger = new Logger(LogLevel.INFO);
    const consoleSpy = vi.spyOn(console, 'info');
    
    logger.info('test message');
    
    expect(consoleSpy).toHaveBeenCalledWith('[SnackBase]', 'test message');
    expect(logger.getLogs()).toHaveLength(1);
    expect(logger.getLogs()[0].message).toBe('test message');
    expect(logger.getLogs()[0].level).toBe(LogLevel.INFO);
  });

  it('should support updating log level', () => {
    logger = new Logger(LogLevel.NONE);
    const consoleSpy = vi.spyOn(console, 'info');
    
    logger.info('message 1');
    expect(consoleSpy).not.toHaveBeenCalled();
    
    logger.setLevel(LogLevel.INFO);
    logger.info('message 2');
    expect(consoleSpy).toHaveBeenCalledWith('[SnackBase]', 'message 2');
  });

  it('should log extra data', () => {
    logger = new Logger(LogLevel.DEBUG);
    const consoleSpy = vi.spyOn(console, 'debug');
    const data = { foo: 'bar' };
    
    logger.debug('test message', data);
    
    expect(consoleSpy).toHaveBeenCalledWith('[SnackBase]', 'test message', data);
    expect(logger.getLogs()[0].data).toEqual(data);
  });

  it('should maintain a buffer of recent logs', () => {
    logger = new Logger(LogLevel.INFO);
    
    for (let i = 0; i < 1100; i++) {
      logger.info(`message ${i}`);
    }
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1000); // Default max logs
    expect(logs[0].message).toBe('message 100');
    expect(logs[999].message).toBe('message 1099');
  });

  it('should clear logs', () => {
    logger = new Logger(LogLevel.INFO);
    logger.info('test');
    expect(logger.getLogs()).toHaveLength(1);
    
    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });
});
