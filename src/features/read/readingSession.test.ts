import { describe, expect, it, vi } from 'vitest';

import { createReadingSession } from './readingSession';

const createGateway = () => ({
  end: vi.fn().mockResolvedValue(undefined),
  fetchActive: vi.fn().mockResolvedValue(null),
  takeover: vi.fn().mockResolvedValue(undefined),
});

describe('Reading session', () => {
  it('normalizes an HTTP conflict through the session state boundary', () => {
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
    });

    session.reportConflict({
      current_device: {
        device_id: 'other-device',
        user_agent: 'Chrome',
        is_reading: true,
      },
      active_devices: [
        { device_id: 'this-device', user_agent: 'Safari' },
        { device_id: 'other-device', user_agent: 'Chrome', is_reading: true },
      ],
    });

    expect(session.getState()).toEqual({
      isConflict: true,
      conflictData: {
        current_device: expect.objectContaining({ device_id: 'other-device' }),
        active_devices: [
          expect.objectContaining({
            device_id: 'this-device',
            is_current_device: true,
            can_logout: false,
          }),
          expect.objectContaining({
            device_id: 'other-device',
            is_current_device: false,
            can_logout: true,
            is_reading: true,
          }),
        ],
      },
    });
  });

  it('ignores remote conflict events emitted by the current device', () => {
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
    });

    session.receiveRemoteConflict({
      source_device_id: 'this-device',
      active_devices: [{ device_id: 'other-device', is_reading: true }],
    });

    expect(session.getState().isConflict).toBe(false);
  });

  it('opens a conflict for events emitted by another device', () => {
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
    });

    session.receiveRemoteConflict({
      source_device_id: 'other-device',
      active_devices: [{ device_id: 'other-device', is_reading: true }],
    });

    expect(session.getState()).toEqual(expect.objectContaining({
      isConflict: true,
      conflictData: expect.objectContaining({
        current_device: expect.objectContaining({ device_id: 'other-device' }),
      }),
    }));
  });

  it('ignores malformed devices in remote payloads', () => {
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
    });

    session.receiveRemoteConflict({
      active_devices: [null, {}, { device_id: 'other-device' }],
    });

    expect(session.getState().conflictData?.active_devices).toEqual([
      expect.objectContaining({ device_id: 'other-device' }),
    ]);
  });

  it('coerces unsafe external device fields before exposing modal data', () => {
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
    });

    session.reportConflict({
      active_devices: [{
        device_id: 42,
        user_agent: { browser: 'Chrome' },
        started_at: 123,
        last_seen_at: false,
      }],
    });

    expect(session.getState().conflictData?.active_devices[0]).toEqual(
      expect.objectContaining({
        device_id: '42',
        user_agent: '',
        started_at: '',
        last_seen_at: '',
      }),
    );
  });

  it('clears the conflict only after takeover succeeds', async () => {
    const gateway = createGateway();
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });
    session.reportConflict({
      active_devices: [{ device_id: 'other-device', is_reading: true }],
    });

    await session.takeover();

    expect(gateway.takeover).toHaveBeenCalledWith('4007', '1574150');
    expect(session.getState()).toEqual({ isConflict: false, conflictData: null });
  });

  it('keeps the conflict visible when takeover fails', async () => {
    const gateway = createGateway();
    gateway.takeover.mockRejectedValue(new Error('takeover failed'));
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });
    session.reportConflict({ active_devices: [] });

    await expect(session.takeover()).resolves.toBeUndefined();
    expect(session.getState().isConflict).toBe(true);
  });

  it('does not let an older takeover clear a newer conflict', async () => {
    let finishTakeover: () => void = () => undefined;
    const gateway = createGateway();
    gateway.takeover.mockReturnValue(new Promise<void>((resolve) => {
      finishTakeover = resolve;
    }));
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });
    session.reportConflict({ active_devices: [{ device_id: 'first-device' }] });

    const takingOver = session.takeover();
    session.reportConflict({ active_devices: [{ device_id: 'newer-device' }] });
    finishTakeover();
    await takingOver;

    expect(session.getState()).toEqual(expect.objectContaining({
      isConflict: true,
      conflictData: expect.objectContaining({
        active_devices: [expect.objectContaining({ device_id: 'newer-device' })],
      }),
    }));
  });

  it('refreshes the active device list without changing conflict ownership', async () => {
    const gateway = createGateway();
    gateway.fetchActive.mockResolvedValue({
      current_device: null,
      active_devices: [{
        device_id: 'this-device',
        user_agent: 'Safari',
        started_at: '',
        last_seen_at: '',
        is_current_device: false,
        can_logout: true,
        is_reading: false,
      }],
    });
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });
    session.reportConflict({ active_devices: [] });

    await session.refresh();

    expect(session.getState()).toEqual({
      isConflict: true,
      conflictData: {
        current_device: null,
        active_devices: [expect.objectContaining({
          device_id: 'this-device',
          is_current_device: true,
          can_logout: false,
        })],
      },
    });
  });

  it('does not let an older refresh overwrite a newer socket conflict', async () => {
    let finishRefresh: (data: any) => void = () => undefined;
    const gateway = createGateway();
    gateway.fetchActive.mockReturnValue(new Promise((resolve) => {
      finishRefresh = resolve;
    }));
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });
    session.reportConflict({ active_devices: [{ device_id: 'first-device' }] });

    const refreshing = session.refresh();
    session.receiveRemoteConflict({ active_devices: [{ device_id: 'newer-device' }] });
    finishRefresh({ current_device: null, active_devices: [] });
    await refreshing;

    expect(session.getState().conflictData?.active_devices).toEqual([
      expect.objectContaining({ device_id: 'newer-device' }),
    ]);
  });

  it('ends a reading session at most once across competing lifecycle events', async () => {
    const gateway = createGateway();
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });

    await Promise.all([session.end(), session.end(), session.end()]);

    expect(gateway.end).toHaveBeenCalledOnce();
    expect(gateway.end).toHaveBeenCalledWith('4007', '1574150');
  });

  it('does not end a session while another device owns the reading session', async () => {
    const gateway = createGateway();
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway,
    });
    session.reportConflict({ active_devices: [] });

    await session.end();

    expect(gateway.end).not.toHaveBeenCalled();
  });

  it('publishes state transitions until a subscriber disconnects', async () => {
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
    });
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);

    session.reportConflict({ active_devices: [] });
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    await session.takeover();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('logs out only when the current device is targeted', async () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
      onLogout,
    });

    await session.receiveDeviceLogout({ target_device_id: 'other-device' });
    expect(onLogout).not.toHaveBeenCalled();

    await session.receiveDeviceLogout({ target_device_id: 'this-device' });
    expect(session.getState().isConflict).toBe(true);
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('logs out at most once when duplicate targeted events arrive', async () => {
    let finishLogout: () => void = () => undefined;
    const onLogout = vi.fn().mockReturnValue(new Promise<void>((resolve) => {
      finishLogout = resolve;
    }));
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
      onLogout,
    });

    const logoutEvents = [
      session.receiveDeviceLogout({ target_device_id: 'this-device' }),
      session.receiveDeviceLogout({ target_device_id: 'this-device' }),
    ];
    expect(onLogout).toHaveBeenCalledOnce();

    finishLogout();
    await Promise.all(logoutEvents);
  });

  it('contains logout failures and permits a later retry', async () => {
    const onLogout = vi.fn()
      .mockRejectedValueOnce(new Error('logout failed'))
      .mockResolvedValueOnce(undefined);
    const session = createReadingSession({
      bookId: '4007',
      episodeId: '1574150',
      currentDeviceId: 'this-device',
      gateway: createGateway(),
      onLogout,
    });

    await expect(session.receiveDeviceLogout({ target_device_id: 'this-device' }))
      .resolves.toBeUndefined();
    await expect(session.receiveDeviceLogout({ target_device_id: 'this-device' }))
      .resolves.toBeUndefined();

    expect(onLogout).toHaveBeenCalledTimes(2);
  });
});
