import { handleApiError, autoClearError, buildCommentHierarchy } from './helpers';

describe('helpers', () => {
  test('buildCommentHierarchy builds nested structure', () => {
    const map = {
      1: { id: 1, text: 'Root', parent_id: null },
      2: { id: 2, text: 'Child', parent_id: 1 },
      3: { id: 3, text: 'Another', parent_id: null },
    };
    const hierarchy = buildCommentHierarchy(map);
    expect(hierarchy.length).toBe(2);
    const root = hierarchy.find(c => c.id === 1);
    expect(root.replies[0].id).toBe(2);
  });

  test('autoClearError clears after timeout', () => {
    jest.useFakeTimers();
    let error = 'bad';
    const setError = jest.fn(val => { error = val; });
    const clear = autoClearError(error, setError, 1000);
    jest.advanceTimersByTime(1000);
    expect(setError).toHaveBeenCalledWith(null);
    if (typeof clear === 'function') clear();
    jest.useRealTimers();
  });

  test('handleApiError sets error message', () => {
    const setError = jest.fn();
    const err = { response: { data: { detail: 'oops' } } };
    handleApiError(err, setError, 'default');
    expect(setError).toHaveBeenCalledWith('oops');
  });
});
